#!/usr/bin/env node
// Headless Chrome (CDP) motion/reveal/overflow test for index.html and contact.html.
// Usage: node tools/motion-browser-test.js [reveal|nojs|reduced|overflow|header|contact ...]
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
const PAGE = url.pathToFileURL(path.join(ROOT, "contact.html")).href;
const HOME = url.pathToFileURL(path.join(ROOT, "index.html")).href;
const ALL = ["reveal", "nojs", "reduced", "overflow", "header", "contact"];
const INDEX = HOME;

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

// Run one scenario. opts: { noJs, reducedMotion, page }.
async function scenario(width, height, opts, expression) {
  opts = opts || {};
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  try {
    await send("Page.enable", {}, sessionId);
    await send(
      "Emulation.setDeviceMetricsOverride",
      { width, height, deviceScaleFactor: 1, mobile: width < 640 },
      sessionId
    );
    if (opts.reducedMotion) {
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
    }
    if (opts.noJs) await send("Emulation.setScriptExecutionDisabled", { value: true }, sessionId);
    const loaded = once("Page.loadEventFired", sessionId);
    await send("Page.navigate", { url: opts.page || INDEX }, sessionId);
    await loaded;
    const res = await send(
      "Runtime.evaluate",
      {
        expression:
          "(async()=>{const W=" + width + ";" +
          "if(window.innerWidth!==W)return{fatal:'innerWidth '+window.innerWidth+' != '+W};" +
          "if(window.document.fonts&&!" + (opts.noJs ? "true" : "false") + ")await document.fonts.ready;" +
          "const sleep=ms=>new Promise(r=>setTimeout(r,ms));" +
          "const raf=()=>new Promise(r=>requestAnimationFrame(()=>r()));" +
          HELPERS +
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
// In-page helpers and scenarios
// ---------------------------------------------------------------------------
// Keep TARGETS in sync with the reveal selector list in js/main.js.
const HELPERS = `
const TARGETS=['.section-head','.service-card','.about__media','.about__text','.testimonial','.logo-strip li','.step','.cta-band__inner','.hero__media','.divider-squiggle','.steps__connector','.contact__form-wrap','.contact__details','.page-contact .contact__intro'];
const all=()=>TARGETS.flatMap(s=>[...document.querySelectorAll(s)]);
const shown=el=>getComputedStyle(el).display!=='none';
const settled=el=>{const cs=getComputedStyle(el);if(cs.opacity!=='1'||cs.visibility==='hidden')return false;
  const t=cs.transform;if(t==='none')return true;
  const n=t.match(/-?[\\d.e-]+/g).map(Number);
  if(t.startsWith('matrix3d')){return Math.abs(n[12])<0.5&&Math.abs(n[13])<0.5&&Math.abs(n[0]-1)<0.01&&Math.abs(n[5]-1)<0.01;}
  return Math.abs(n[4])<0.5&&Math.abs(n[5])<0.5&&Math.abs(n[0]-1)<0.01&&Math.abs(n[3]-1)<0.01;};
const drawPaths=()=>[...document.querySelectorAll('.service-card__icon svg *, .accent-underline__svg path, .steps__connector path')].filter(e=>/^(path|circle)$/i.test(e.tagName));
const drawn=el=>{const cs=getComputedStyle(el);return cs.strokeDasharray==='none'||parseFloat(cs.strokeDashoffset)===0;};
const settleWait=async(el)=>{for(let i=0;i<40;i++){if(settled(el))return true;await sleep(100);}return settled(el);};
const cls=(el)=>el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className;
`;

const results = {};

results.reveal = async () => {
  const out = [];
  for (const [w, h] of [[1280, 900], [375, 740]]) {
    const r = await scenario(w, h, {}, `async()=>{
      const bad=[];
      if(!document.documentElement.classList.contains('js-reveal'))return{bad:['html lacks js-reveal'],n:0};
      const pre=all().filter(el=>el.classList.contains('reveal')&&!el.classList.contains('is-revealed')&&shown(el)&&getComputedStyle(el).opacity<1);
      if(!pre.length)bad.push('no pre-reveal hidden target at load (enhancement inactive)');
      // hero underline: starts undrawn (fresh clone has no transition history), ends drawn
      const hw=document.querySelector('.hero-word');
      const clone=hw.cloneNode(true);clone.classList.remove('is-revealed');
      const holder=document.createElement('div');holder.style.cssText='position:absolute;left:0;top:0;opacity:0.01;pointer-events:none';
      holder.appendChild(clone);document.body.appendChild(holder);
      const cp=clone.querySelector('.accent-underline__svg path');
      await raf();
      const startOff=parseFloat(getComputedStyle(cp).strokeDashoffset);
      if(!(startOff>0))bad.push('underline starts drawn (dashoffset '+startOff+'), gate not active');
      clone.classList.add('is-revealed');await sleep(1600);
      const endOff=parseFloat(getComputedStyle(cp).strokeDashoffset);
      const endDash=getComputedStyle(cp).strokeDasharray;
      if(!(endOff===0||endDash==='none'))bad.push('underline did not end drawn: '+endOff);
      holder.remove();
      let n=0;
      for(const el of all()){
        if(!shown(el))continue;
        el.scrollIntoView({block:'center'});
        await raf();await raf();await sleep(60);
        if(!el.classList.contains('is-revealed')){await sleep(400);}
        if(!el.classList.contains('is-revealed'))bad.push('not revealed: '+el.className);
        else if(!(await settleWait(el)))bad.push('not settled: '+el.className);
        n++;
      }
      await sleep(1600);
      for(const p of drawPaths()){if(!shown(p.closest('svg')))continue;if(!drawn(p))bad.push('path not drawn: '+p.tagName+' in '+cls(p.closest('svg')));}
      return{bad,n};}`);
    if (r.bad.length) throw new Error(w + "px: " + r.bad.slice(0, 6).join("; "));
    out.push(w + "px " + r.n + " targets");
  }
  return "reveal gate active, hidden before, revealed and settled after scroll, strokes drawn (" + out.join(", ") + ")";
};

results.nojs = async () => {
  for (const page of [INDEX, PAGE]) {
    for (const w of [375, 1280]) {
      const r = await scenario(w, 800, { noJs: true, page }, `async()=>{
        const bad=[];
        if(document.documentElement.classList.contains('js-reveal'))bad.push('js-reveal present without JS');
        for(const el of all()){if(!settled(el))bad.push('not settled: '+el.className);}
        for(const p of drawPaths()){if(!drawn(p))bad.push('undrawn: '+p.tagName);}
        return{bad};}`);
      if (r.bad.length) throw new Error(path.basename(page) + " " + w + "px: " + r.bad.slice(0, 5).join("; "));
    }
  }
  return "with JS disabled every target is fully visible and strokes drawn (both pages, 375 and 1280)";
};

results.reduced = async () => {
  for (const page of [INDEX, PAGE]) {
    for (const w of [375, 1280]) {
      const r = await scenario(w, 800, { reducedMotion: true, page }, `async()=>{
        await sleep(400);
        const bad=[];
        for(const el of all()){if(!settled(el))bad.push('not settled: '+el.className);}
        for(const p of drawPaths()){if(!drawn(p))bad.push('undrawn: '+p.tagName);}
        for(const el of document.querySelectorAll('.hero__media .media, .about__media .media')){
          const cs=getComputedStyle(el);
          if(!(cs.animationName==='none'||cs.transform==='none'))bad.push('float still running: '+el.className);}
        return{bad};}`);
      if (r.bad.length) throw new Error(path.basename(page) + " " + w + "px: " + r.bad.slice(0, 5).join("; "));
    }
  }
  return "prefers-reduced-motion shows everything final at load, no float (both pages, 375 and 1280)";
};

results.overflow = async () => {
  const STEP = `async()=>{
    const H=document.documentElement.scrollHeight;let worst=0;
    for(let y=0;y<=H;y+=Math.max(200,innerHeight*0.5)){scrollTo(0,y);await sleep(80);
      worst=Math.max(worst,document.documentElement.scrollWidth-window.innerWidth);}
    return{worst};}`;
  for (const page of [INDEX, PAGE]) {
    for (const [w, h] of [[320, 700], [375, 740], [1280, 900]]) {
      for (const noJs of [false, true]) {
        if (noJs && w !== 320) continue;
        const r = await scenario(w, h, { page, noJs }, STEP);
        if (r.worst > 0) throw new Error(path.basename(page) + " " + w + "px" + (noJs ? " no-JS" : "") + ": horizontal overflow " + r.worst + "px");
      }
    }
  }
  return "no horizontal overflow at 320, 375, 1280 while scrolling (both pages, plus no-JS at 320)";
};

results.header = async () => {
  const r = await scenario(1280, 900, {}, `async()=>{
    const h=document.querySelector('.site-header');const wm=h.querySelector('.wordmark');
    const top={scrolled:h.classList.contains('is-scrolled'),pos:getComputedStyle(h).position,color:getComputedStyle(wm).color};
    scrollTo(0,600);await sleep(400);
    return{top,after:{scrolled:h.classList.contains('is-scrolled'),color:getComputedStyle(wm).color,y:h.getBoundingClientRect().top}};}`);
  if (r.top.scrolled) throw new Error("header is-scrolled at scrollY 0");
  if (r.top.pos !== "sticky") throw new Error("header position is " + r.top.pos + ", expected sticky");
  if (!r.after.scrolled) throw new Error("header lacks is-scrolled after scrolling 600px");
  if (r.after.color !== r.top.color) throw new Error("wordmark colour changed on scroll");
  if (Math.abs(r.after.y) > 1) throw new Error("sticky header not pinned to top (" + r.after.y + ")");
  return "header sticky, gains is-scrolled after scrolling, text colour unchanged";
};

results.contact = async () => {
  const r = await scenario(1280, 900, { page: PAGE }, `async()=>{
    const bad=[];
    if(!document.documentElement.classList.contains('js-reveal'))bad.push('html lacks js-reveal');
    for(const s of ['.contact__form-wrap','.contact__details']){
      const el=document.querySelector(s);el.scrollIntoView({block:'center'});
      await raf();await raf();
      if(!(await settleWait(el)))bad.push('not settled: '+s);
      if(!el.classList.contains('is-revealed'))bad.push('not revealed: '+s);}
    return{bad};}`);
  if (r.bad.length) throw new Error(r.bad.join("; "));
  return "contact form card and details card reveal and settle";
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "motion-browser-"));
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
  if (!failed) console.log("MOTION OK");
  process.exit(failed ? 1 : 0);
})();
