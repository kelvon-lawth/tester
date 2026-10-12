#!/usr/bin/env node
// Headless Chrome (Chrome DevTools Protocol) layout and behaviour test for index.html.
// Usage: node tools/home-browser-test.js [hero|nojs|sticky|layout ...]
// Zero dependencies. Uses Node's global WebSocket. Dev-only (removed in Phase 5).
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const url = require("url");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PAGE = url.pathToFileURL(path.join(ROOT, "index.html")).href;
const ALL = ["hero", "nojs", "sticky", "layout"];

const requested = process.argv.slice(2);
for (const g of requested) {
  if (!ALL.includes(g)) {
    console.log("FAIL unknown group: " + g + " (use " + ALL.join(", ") + ")");
    process.exit(1);
  }
}
const groups = requested.length ? requested : ALL;

if (!fs.existsSync(CHROME)) {
  console.log("FAIL chrome not found at " + CHROME);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// CDP plumbing
// ---------------------------------------------------------------------------
let ws;
let nextId = 1;
const pending = new Map();
const listeners = new Map();

function send(method, params, sessionId) {
  const id = nextId++;
  const msg = { id, method, params: params || {} };
  if (sessionId) msg.sessionId = sessionId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
    ws.send(JSON.stringify(msg));
  });
}

function once(method, sessionId) {
  return new Promise((resolve) => {
    const key = method + "|" + (sessionId || "");
    const arr = listeners.get(key) || [];
    arr.push(resolve);
    listeners.set(key, arr);
  });
}

function onMessage(ev) {
  const data = JSON.parse(typeof ev.data === "string" ? ev.data : ev.data.toString());
  if (data.id && pending.has(data.id)) {
    const p = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) p.reject(new Error(p.method + ": " + data.error.message));
    else p.resolve(data.result);
    return;
  }
  if (data.method) {
    const key = data.method + "|" + (data.sessionId || "");
    const arr = listeners.get(key);
    if (arr && arr.length) {
      listeners.delete(key);
      arr.forEach((fn) => fn(data.params));
    }
  }
}

async function waitForPort(profile) {
  const file = path.join(profile, "DevToolsActivePort");
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    if (fs.existsSync(file)) {
      const lines = fs.readFileSync(file, "utf8").split("\n");
      if (lines[0] && lines[1]) return { port: lines[0].trim(), wsPath: lines[1].trim() };
    }
    await sleep(100);
  }
  throw new Error("DevToolsActivePort not found within 15s");
}

// Run one scenario: viewport, optional no-JS, then evaluate an async expression.
async function scenario(width, height, noJs, expression) {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  try {
    await send("Page.enable", {}, sessionId);
    await send(
      "Emulation.setDeviceMetricsOverride",
      { width, height, deviceScaleFactor: 1, mobile: width < 640 },
      sessionId
    );
    if (noJs) await send("Emulation.setScriptExecutionDisabled", { value: true }, sessionId);
    const loaded = once("Page.loadEventFired", sessionId);
    await send("Page.navigate", { url: PAGE }, sessionId);
    await loaded;
    const res = await send(
      "Runtime.evaluate",
      {
        expression:
          "(async()=>{const W=" + width + ";" +
          "if(window.innerWidth!==W)return{fatal:'innerWidth '+window.innerWidth+' != '+W};" +
          "if(window.document.fonts&&!" + (noJs ? "true" : "false") + ")await document.fonts.ready;" +
          "const sleep=ms=>new Promise(r=>setTimeout(r,ms));" +
          "const raf=()=>new Promise(r=>requestAnimationFrame(()=>r()));" +
          "return await (" + expression + ")();})()",
        awaitPromise: true,
        returnByValue: true,
      },
      sessionId
    );
    if (res.exceptionDetails) {
      throw new Error("page exception: " + (res.exceptionDetails.exception && res.exceptionDetails.exception.description || res.exceptionDetails.text));
    }
    const v = res.result.value;
    if (v && v.fatal) throw new Error(v.fatal);
    return v;
  } finally {
    try { await send("Target.closeTarget", { targetId }); } catch (e) { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// In-page measurement snippets (strings, run inside the page)
// ---------------------------------------------------------------------------
const OVERFLOW = "()=>document.documentElement.scrollWidth<=window.innerWidth";

const HERO_ORDER = `async()=>{
  const q=s=>document.querySelector(s);
  const r=s=>{const e=q(s);return e?e.getBoundingClientRect():null;};
  const out={overflow:document.documentElement.scrollWidth-window.innerWidth};
  for(const s of ['h1','.hero__lede','#hero-cta','.trust-cue','.hero__media','.hero__text'])out[s]=r(s)&&{top:r(s).top,bottom:r(s).bottom,left:r(s).left,right:r(s).right};
  return out;}`;

const HERO_WIDE = `async()=>{
  const q=s=>document.querySelector(s);
  const text=q('.hero-word__text');
  const hw=q('.hero__text'), media=q('.hero__media');
  if(!hw||!media||!text)return{missing:true};
  text.textContent='restaurant';
  const word=q('.hero-word');
  const wr=word.getBoundingClientRect();
  const out={rects:word.getClientRects().length,wordRight:wr.right,textRight:hw.getBoundingClientRect().right,mediaLeft:media.getBoundingClientRect().left};
  text.textContent='bakery';
  return out;}`;

const UNDERLINE = `async()=>{
  const q=s=>document.querySelector(s);
  const text=q('.hero-word__text'), svg=q('.accent-underline__svg'), h1=q('h1'), path=svg&&svg.querySelector('path');
  if(!text||!svg||!h1||!path)return{missing:true};
  if(!document.fonts.check('600 40px Fraunces'))return{font:false};
  const cs=getComputedStyle(text);
  const ctx=document.createElement('canvas').getContext('2d');
  ctx.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
  const res=[];
  for(const w of ['bakery','gym','shop']){
    text.textContent=w;
    await new Promise(r=>requestAnimationFrame(()=>r()));
    const tr=text.getBoundingClientRect(), sr=svg.getBoundingClientRect(), hr=h1.getBoundingClientRect();
    const m=ctx.measureText(w);
    const baseline=tr.bottom-m.fontBoundingBoxDescent;
    const desc=baseline+m.actualBoundingBoxDescent;
    res.push({w,svgTop:sr.top,desc,svgBottom:sr.bottom,h1Bottom:hr.bottom,fs:cs.fontSize,sw:parseFloat(getComputedStyle(path).strokeWidth)});
  }
  text.textContent='bakery';
  return {res,vector:getComputedStyle(path).vectorEffect};}`;

const NOJS = `async()=>{
  const q=s=>document.querySelector(s);
  const vis=e=>{if(!e)return false;const r=e.getBoundingClientRect(),c=getComputedStyle(e);return r.width>0&&r.height>0&&c.visibility==='visible'&&c.display!=='none';};
  const t=q('.hero-title');
  return{title:t?t.textContent.replace(/\\s+/g,' ').trim():null,lede:vis(q('.hero__lede')),btn:vis(q('#hero-cta a.btn'))};}`;

const STICKY = `async()=>{
  const q=s=>document.querySelector(s);
  const s=q('.sticky-cta'), svc=q('#services'), band=q('.cta-band');
  if(!s||!svc||!band)return{missing:[!s&&'.sticky-cta',!svc&&'#services',!band&&'.cta-band'].filter(Boolean)};
  const st=()=>({v:s.classList.contains('is-visible'),vis:getComputedStyle(s).visibility});
  const settle=async()=>{await raf();await raf();await sleep(400);};
  await sleep(400);
  const out={};
  out.initial=st();
  window.scrollTo({top:svc.offsetTop,behavior:'instant'});await settle();
  out.afterHero=st();
  window.scrollTo({top:band.getBoundingClientRect().top+window.scrollY-100,behavior:'instant'});await settle();
  out.atBand=st();
  window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});await settle();
  out.atEnd=st();
  return out;}`;

const STICKY_STYLE = `async()=>{
  const s=document.querySelector('.sticky-cta');
  if(!s)return{missing:true};
  const c=getComputedStyle(s);return{display:c.display,visibility:c.visibility};}`;

const LAYOUT = `async()=>{
  const all=s=>[...document.querySelectorAll(s)];
  const out={overflow:document.documentElement.scrollWidth-window.innerWidth};
  const lefts=new Set(all('.service-card').map(e=>Math.round(e.getBoundingClientRect().left)));
  out.cards=all('.service-card').length;out.cardCols=lefts.size;
  const tops=s=>all(s).map(e=>e.getBoundingClientRect().top);
  out.testimonialTops=tops('.testimonial');out.stepTops=tops('.step');
  const c=document.querySelector('.steps__connector');out.connector=c?getComputedStyle(c).display:null;
  out.logos=all('.logo-strip svg').map(svg=>{
    const texts=[...svg.querySelectorAll('text')];
    const fs=texts.map(t=>parseFloat(t.getAttribute('font-size'))).filter(n=>!isNaN(n));
    const minFs=fs.length?Math.min(...fs):NaN;
    const fit=texts.every(t=>{const b=t.getBBox();return b.x>=0&&b.x+b.width<=180;});
    return{w:svg.clientWidth,eff:svg.clientWidth/180*minFs,fit,texts:texts.length};});
  return out;}`;

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------
const results = {};
const growing = (a) => a.every((v, i) => i === 0 || v > a[i - 1]);

results.hero = async () => {
  for (const [w, h] of [[320, 700], [768, 900], [1280, 900]]) {
    if (!(await scenario(w, h, false, OVERFLOW))) throw new Error("horizontal overflow at " + w);
  }
  const m = await scenario(320, 700, false, HERO_ORDER);
  for (const s of ["h1", ".hero__lede", "#hero-cta", ".trust-cue", ".hero__media"]) {
    if (!m[s]) throw new Error("missing " + s);
  }
  if (!growing([m.h1.top, m[".hero__lede"].top, m["#hero-cta"].top, m[".trust-cue"].top])) {
    throw new Error("320px: h1, lede, CTA, trust cue not stacked in order");
  }
  if (!(m[".hero__media"].top > m[".trust-cue"].bottom)) throw new Error("320px: photo must come after the text column");
  for (const [w, h] of [[1024, 800], [1280, 900]]) {
    const r = await scenario(w, h, false, HERO_WIDE);
    if (r.missing) throw new Error("hero markup missing at " + w);
    if (!(r.mediaLeft >= r.textRight)) throw new Error(w + "px: photo not beside text (mediaLeft " + r.mediaLeft + " < textRight " + r.textRight + ")");
    if (r.rects !== 1) throw new Error(w + "px: 'restaurant' wraps (" + r.rects + " rects)");
    if (!(r.wordRight <= r.textRight + 0.5)) throw new Error(w + "px: 'restaurant' overflows text column by " + (r.wordRight - r.textRight).toFixed(1) + "px");
  }
  for (const [w, h] of [[320, 700], [1280, 900]]) {
    const u = await scenario(w, h, false, UNDERLINE);
    if (u.missing) throw new Error("underline markup missing");
    if (u.font === false) throw new Error("Fraunces 600 not loaded");
    if (u.vector !== "non-scaling-stroke") throw new Error("path vector-effect is '" + u.vector + "'");
    for (const x of u.res) {
      if (!(x.svgTop >= x.desc - 1)) throw new Error(w + "px " + x.w + " (" + x.fs + "): underline top " + x.svgTop.toFixed(1) + " is above descender bottom " + x.desc.toFixed(1));
      if (!(x.svgBottom <= x.h1Bottom + 1)) throw new Error(w + "px " + x.w + ": underline bottom " + x.svgBottom.toFixed(1) + " outside h1 bottom " + x.h1Bottom.toFixed(1));
      if (x.sw !== 4) throw new Error(w + "px " + x.w + ": stroke width " + x.sw + " not 4");
    }
  }
  return "no overflow 320/768/1280, stacked order, side-by-side, restaurant fits, underline clears descenders";
};

results.nojs = async () => {
  const r = await scenario(375, 740, true, NOJS);
  if (r.title !== "Marketing for your bakery") throw new Error("h1 text is '" + r.title + "'");
  if (!r.lede) throw new Error(".hero__lede not visible without JS");
  if (!r.btn) throw new Error("#hero-cta a.btn not visible without JS");
  return "hero complete with JavaScript disabled";
};

results.sticky = async () => {
  const s = await scenario(375, 740, false, STICKY);
  if (s.missing) throw new Error("missing " + s.missing.join(", "));
  if (s.initial.v || s.initial.vis !== "hidden") throw new Error("sticky visible at top of page");
  if (!s.afterHero.v || s.afterHero.vis !== "visible") throw new Error("sticky not visible after scrolling past hero");
  if (s.atBand.v) throw new Error("sticky still visible over the closing band");
  if (s.atEnd.v) throw new Error("sticky still visible at page end");
  const d = await scenario(1280, 900, false, STICKY_STYLE);
  if (d.missing || d.display !== "none") throw new Error("sticky not display:none at 1280");
  const n = await scenario(375, 740, true, STICKY_STYLE);
  if (n.missing || n.display === "none" || n.visibility !== "visible") throw new Error("sticky not shown without JS on phone");
  const nd = await scenario(1280, 900, true, STICKY_STYLE);
  if (nd.missing || nd.display !== "none") throw new Error("sticky not display:none at 1280 without JS");
  return "sticky CTA shows past the hero, hides near the band and footer, phone only";
};

results.layout = async () => {
  const l320 = await scenario(320, 700, false, LAYOUT);
  const l768 = await scenario(768, 900, false, LAYOUT);
  const l1280 = await scenario(1280, 900, false, LAYOUT);
  for (const [w, l] of [[320, l320], [768, l768], [1280, l1280]]) {
    if (l.overflow > 0) throw new Error("horizontal overflow at " + w);
  }
  if (l768.cards !== 4 || l768.cardCols !== 2) throw new Error("768px: service cards should form 2 columns (cards " + l768.cards + ", cols " + l768.cardCols + ")");
  const eq = (a, n) => a.length === n && Math.max(...a) - Math.min(...a) <= 2;
  if (!eq(l1280.testimonialTops, 3)) throw new Error("1280px: 3 testimonials should share a top");
  if (!eq(l1280.stepTops, 3)) throw new Error("1280px: 3 steps should share a top");
  if (l1280.connector === null || l1280.connector === "none") throw new Error("1280px: steps connector should show");
  for (const [w, l] of [[768, l768], [320, l320]]) {
    if (l.connector !== "none") throw new Error(w + "px: steps connector should be hidden");
    if (l.stepTops.length !== 3 || !growing(l.stepTops)) throw new Error(w + "px: steps should stack");
  }
  if (l320.logos.length < 1) throw new Error("no logo svgs");
  for (const g of l320.logos) {
    if (g.w < 120) throw new Error("320px: logo svg only " + g.w + "px wide");
    if (!(g.eff >= 12)) throw new Error("320px: logo text renders at " + g.eff.toFixed(1) + "px, under 12px");
    if (!g.texts || !g.fit) throw new Error("320px: logo name does not fit inside its viewBox");
  }
  return "no overflow, card/testimonial/step columns, connector, logo legibility";
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "home-browser-"));
  const child = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--user-data-dir=" + profile,
      "--remote-debugging-port=0",
      "about:blank",
    ],
    { stdio: "ignore" }
  );
  const overall = setTimeout(() => {
    console.log("FAIL timed out after 90s");
    try { child.kill("SIGKILL"); } catch (e) { /* ignore */ }
    process.exit(1);
  }, 90000);
  let failed = false;
  try {
    const { port, wsPath } = await waitForPort(profile);
    ws = new WebSocket("ws://127.0.0.1:" + port + wsPath);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve);
      ws.addEventListener("error", () => reject(new Error("websocket error")));
    });
    ws.addEventListener("message", onMessage);
    for (const g of groups) {
      try {
        const detail = await results[g]();
        console.log("PASS " + g + ": " + detail);
      } catch (e) {
        failed = true;
        console.log("FAIL " + g + ": " + e.message);
      }
    }
  } catch (e) {
    failed = true;
    console.log("FAIL runner: " + e.message);
  } finally {
    clearTimeout(overall);
    try { ws && ws.close(); } catch (e) { /* ignore */ }
    try { child.kill("SIGKILL"); } catch (e) { /* ignore */ }
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) { /* best effort */ }
  }
  if (!failed) console.log("BROWSER OK");
  process.exit(failed ? 1 : 0);
})();
