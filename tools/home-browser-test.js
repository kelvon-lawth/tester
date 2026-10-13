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
const ALL = ["hero", "nojs", "sticky", "layout", "cycle"];

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

// Run one scenario: viewport, options, then evaluate an async expression (or an array of
// expressions with an optional node-side opts.between(i, prevResult, cdp) hook run between them).
// opts: boolean (noJs) or { noJs, reducedMotion, blockGsap, touch, initScript, between }.
async function scenario(width, height, optsIn, expression) {
  const opts = typeof optsIn === "object" && optsIn ? optsIn : { noJs: !!optsIn };
  const noJs = !!opts.noJs;
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const cdp = (m, p) => send(m, p, sessionId);
  try {
    await send("Page.enable", {}, sessionId);
    await send(
      "Emulation.setDeviceMetricsOverride",
      { width, height, deviceScaleFactor: 1, mobile: width < 640 },
      sessionId
    );
    if (opts.touch) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 }, sessionId);
    try { await send("Emulation.setFocusEmulationEnabled", { enabled: true }, sessionId); } catch (e) { /* optional */ }
    if (opts.reducedMotion) {
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
    }
    if (opts.blockGsap) {
      await send("Page.addScriptToEvaluateOnNewDocument", { source: "Object.defineProperty(window,'gsap',{configurable:false,get:function(){return undefined},set:function(){}})" }, sessionId);
    }
    if (opts.initScript) await send("Page.addScriptToEvaluateOnNewDocument", { source: opts.initScript }, sessionId);
    if (noJs) await send("Emulation.setScriptExecutionDisabled", { value: true }, sessionId);
    const loaded = once("Page.loadEventFired", sessionId);
    await send("Page.navigate", { url: PAGE }, sessionId);
    await loaded;
    const run = async (expr) => {
      const res = await send(
        "Runtime.evaluate",
        {
          expression:
            "(async()=>{const W=" + width + ";" +
            "if(window.innerWidth!==W)return{fatal:'innerWidth '+window.innerWidth+' != '+W};" +
            "if(window.document.fonts&&!" + (noJs ? "true" : "false") + ")await document.fonts.ready;" +
            "const sleep=ms=>new Promise(r=>setTimeout(r,ms));" +
            "const raf=()=>new Promise(r=>requestAnimationFrame(()=>r()));" +
            "return await (" + expr + ")();})()",
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
    };
    if (Array.isArray(expression)) {
      let prev;
      for (let i = 0; i < expression.length; i++) {
        if (i > 0 && opts.between) await opts.between(i, prev, cdp);
        prev = await run(expression[i]);
      }
      return prev;
    }
    return await run(expression);
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
  const t=q('.hero-title__visual'), sr=q('.hero-title .visually-hidden'), tg=q('.hero-toggle');
  const n=e=>e?e.textContent.replace(/\\s+/g,' ').trim():null;
  return{title:n(t),sr:n(sr),toggleHidden:!!(tg&&tg.hidden),lede:vis(q('.hero__lede')),btn:vis(q('#hero-cta a.btn'))};}`;

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

// quick 261013-ffc: the hero group measures the STATIC layout (reduced motion), because the cycling word and the
// entrance transforms would otherwise be measured mid-animation. The cycling layout is covered by the cycle group.
const STATIC = { reducedMotion: true };
results.hero = async () => {
  for (const [w, h] of [[320, 700], [768, 900], [1280, 900]]) {
    if (!(await scenario(w, h, STATIC, OVERFLOW))) throw new Error("horizontal overflow at " + w);
  }
  const m = await scenario(320, 700, STATIC, HERO_ORDER);
  for (const s of ["h1", ".hero__lede", "#hero-cta", ".trust-cue", ".hero__media"]) {
    if (!m[s]) throw new Error("missing " + s);
  }
  if (!growing([m.h1.top, m[".hero__lede"].top, m["#hero-cta"].top, m[".trust-cue"].top])) {
    throw new Error("320px: h1, lede, CTA, trust cue not stacked in order");
  }
  if (!(m[".hero__media"].top > m[".trust-cue"].bottom)) throw new Error("320px: photo must come after the text column");
  for (const [w, h] of [[1024, 800], [1280, 900]]) {
    const r = await scenario(w, h, STATIC, HERO_WIDE);
    if (r.missing) throw new Error("hero markup missing at " + w);
    if (!(r.mediaLeft >= r.textRight)) throw new Error(w + "px: photo not beside text (mediaLeft " + r.mediaLeft + " < textRight " + r.textRight + ")");
    if (r.rects !== 1) throw new Error(w + "px: 'restaurant' wraps (" + r.rects + " rects)");
    if (!(r.wordRight <= r.textRight + 0.5)) throw new Error(w + "px: 'restaurant' overflows text column by " + (r.wordRight - r.textRight).toFixed(1) + "px");
  }
  for (const [w, h] of [[320, 700], [1280, 900]]) {
    const u = await scenario(w, h, STATIC, UNDERLINE);
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
  // Visible line = .hero-title__visual; screen readers hear the visually-hidden sentence (HERO-05).
  if (r.title !== "Marketing for your bakery") throw new Error("visible headline is '" + r.title + "'");
  if (r.sr !== "Marketing for your bakery, café, salon, gym, florist, shop or restaurant") throw new Error("SR sentence is '" + r.sr + "'");
  if (!r.toggleHidden) throw new Error(".hero-toggle must stay hidden without JS");
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
// cycle group (quick 261013-ffc, HERO-01..HERO-06)
// ---------------------------------------------------------------------------
// Installed at document start: layout-shift accumulator and an underline watcher that polls every frame
// for the first second after the cycle's alt words exist (the underline must never flash at "restaurant" width).
const CYCLE_INIT = `(()=>{
  window.__ls=0;
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__ls+=e.value;}).observe({type:'layout-shift',buffered:true});}catch(e){}
  window.__ul={samples:0,worst:-999,t0:0};
  const tick=()=>{
    const w=document.querySelector('.hero-word[data-words]');
    const alt=w&&w.querySelector('.hero-word__alt');
    if(alt){
      if(!window.__ul.t0)window.__ul.t0=performance.now();
      const svg=w.querySelector('.accent-underline__svg'),txt=w.querySelector('.hero-word__text');
      if(svg&&txt&&performance.now()-window.__ul.t0<1000){
        const words=[txt,...w.querySelectorAll('.hero-word__alt')];
        const cur=Number(w.dataset.current||0);
        const aw=words[cur].getBoundingClientRect().width;
        const sw=svg.getBoundingClientRect().width;
        window.__ul.samples++;window.__ul.worst=Math.max(window.__ul.worst,sw-aw);
      }
    }
    if(!window.__ul.t0||performance.now()-window.__ul.t0<1000)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();`;

// Shared in-page helpers for the cycle scenarios (prepended to each expression body).
const CYC_HELPERS = `
const q=s=>document.querySelector(s);
const html=document.documentElement;
const word=()=>q('.hero-word[data-words]');
const waitToggle=async()=>{for(let i=0;i<120&&(!q('.hero-toggle')||q('.hero-toggle').hidden);i++)await sleep(100);return !!q('.hero-toggle')&&!q('.hero-toggle').hidden;};
const identity=cs=>{
  const t=cs.transform; let ok=true;
  if(t!=='none'){const n=t.match(/-?[\\d.e-]+/g).map(Number);ok=Math.abs(n[4])<1&&Math.abs(n[5])<1&&Math.abs(n[0]-1)<0.01&&Math.abs(n[3]-1)<0.01&&Math.abs(n[1])<0.01;}
  const tr=cs.translate; if(tr&&tr!=='none'){const p=tr.split(' ').map(parseFloat);if(Math.abs(p[0]||0)>=1||Math.abs(p[1]||0)>=1)ok=false;}
  const ro=cs.rotate; if(ro&&ro!=='none'&&Math.abs(parseFloat(ro))>0.1)ok=false;
  return ok;};
const leaves=el=>[...el.querySelectorAll('*')].filter(e=>!e.children.length);
const wordEls=()=>{const w=word();return [w.querySelector('.hero-word__text'),...w.querySelectorAll('.hero-word__alt')];};
const holdCheck=(idx)=>{
  const w=word(), list=w.dataset.words.split(','), els=wordEls(), bad=[];
  const el=els[idx];
  if(!el)return ['no element for index '+idx];
  const txt=el.textContent.replace(/\\s+/g,'');
  if(txt!==list[idx])bad.push('word '+idx+' shows "'+txt+'" expected "'+list[idx]+'"');
  const r=el.getBoundingClientRect(); if(!(r.width>0&&r.height>0))bad.push('word '+list[idx]+' has zero rect');
  const chars=leaves(el);
  if(!chars.length)bad.push('word '+list[idx]+' has no chars');
  for(const c of chars){const cs=getComputedStyle(c);
    if(parseFloat(cs.opacity)<0.99)bad.push(list[idx]+' char opacity '+cs.opacity);
    if(!identity(cs))bad.push(list[idx]+' char not at rest ('+cs.transform+' '+cs.translate+')');}
  if(getComputedStyle(el).opacity<0.99)bad.push(list[idx]+' word opacity '+getComputedStyle(el).opacity);
  els.forEach((o,i)=>{ if(i===idx)return;
    const ocs=getComputedStyle(o); if(parseFloat(ocs.opacity)===0||ocs.visibility==='hidden')return;
    const ok=leaves(o).every(c=>{const cs=getComputedStyle(c); if(parseFloat(cs.opacity)===0||cs.visibility==='hidden')return true;
      const m=c.parentElement.getBoundingClientRect(),cr=c.getBoundingClientRect(); return cr.bottom<=m.top+0.5||cr.top>=m.bottom-0.5;});
    if(!ok)bad.push('inactive word '+list[i]+' is visible while '+list[idx]+' is active');});
  return bad;};
const inkCheck=(idx)=>{
  const w=word(), list=w.dataset.words.split(','), el=wordEls()[idx], bad=[];
  const first=leaves(el)[0]; if(!first)return ['no chars'];
  const cs=getComputedStyle(first);
  const ctx=document.createElement('canvas').getContext('2d');
  ctx.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
  for(const c of leaves(el)){
    const ch=c.textContent; if(!ch.trim())continue;
    const range=document.createRange(); range.selectNodeContents(c); const rr=range.getBoundingClientRect();
    const m=ctx.measureText(ch);
    const baseline=rr.bottom-m.fontBoundingBoxDescent;
    const inkBottom=baseline+m.actualBoundingBoxDescent, inkTop=baseline-m.actualBoundingBoxAscent;
    const mask=c.parentElement, mr=mask.getBoundingClientRect(), mcs=getComputedStyle(mask);
    if(mcs.overflow!=='clip'&&mcs.overflow!=='hidden'){bad.push(list[idx]+' "'+ch+'": parent is not a clipping mask');continue;}
    if(mr.bottom<inkBottom-0.5)bad.push(list[idx]+' "'+ch+'" descender clipped by '+(inkBottom-mr.bottom).toFixed(1)+'px');
    if(mr.top>inkTop+0.5)bad.push(list[idx]+' "'+ch+'" top clipped by '+(mr.top-inkTop).toFixed(1)+'px');}
  return bad;};
`;

// Main cycling scenario. args: min distinct words, max ms, whether to walk every word (ink + style audit).
const cycleExpr = (minDistinct, maxMs, full, frames) => `async()=>{
  ${CYC_HELPERS}
  const out={bad:[],distinct:0};
  if(!html.classList.contains('has-motion'))return{bad:['html lacks has-motion']};
  if(html.classList.contains('js-reveal'))out.bad.push('js-reveal and has-motion both set');
  if(!(await waitToggle()))return{bad:['.hero-toggle never became visible']};
  const w=word();
  const sel=['h1','.hero__lede','#hero-cta','.trust-cue'];
  const R=()=>sel.map(s=>{const r=q(s).getBoundingClientRect();return [r.top,r.bottom,r.left,r.right];});
  const base=R(); let maxDelta=0, maxOver=0, maxOverflow=0;
  const slotW=w.getBoundingClientRect().width; let slotDrift=0;
  const textRight=q('.hero__text').getBoundingClientRect().right;
  const ls0=window.__ls||0;
  // style audit: only these inline properties may ever be written inside .hero-word
  const ALLOWED=/^(transform|translate|rotate|scale|opacity|visibility|will-change|transform-origin|--.*)$/;
  const written=new Set();
  const mo=new MutationObserver(ms=>{for(const m of ms){const st=m.target.style;for(let i=0;i<st.length;i++)written.add(st[i]);}});
  mo.observe(w,{attributes:true,attributeFilter:['style'],subtree:true});
  let fr=null; if(${frames}){fr=[];let last=performance.now();const loop=()=>{const n=performance.now();fr.push(n-last);last=n;if(!fr.done)requestAnimationFrame(loop);};requestAnimationFrame(loop);}
  const seen=new Set(), held=new Set(); let cur=w.dataset.current, tChange=performance.now();
  const t0=performance.now();
  while(performance.now()-t0<${maxMs}){
    await sleep(100);
    const now=performance.now();
    const c=w.dataset.current; if(c!==cur){cur=c;tChange=now;}
    seen.add(cur);
    const rs=R(); rs.forEach((r,i)=>r.forEach((v,j)=>{maxDelta=Math.max(maxDelta,Math.abs(v-base[i][j]));}));
    maxOver=Math.max(maxOver,w.getBoundingClientRect().right-textRight);
    slotDrift=Math.max(slotDrift,Math.abs(w.getBoundingClientRect().width-slotW));
    maxOverflow=Math.max(maxOverflow,html.scrollWidth-innerWidth);
    if(now-tChange>=1100&&!held.has(cur)){held.add(cur);const idx=Number(cur);
      out.bad.push(...holdCheck(idx));
      if(${full}&&['café','gym','shop'].includes(w.dataset.words.split(',')[idx]))out.bad.push(...inkCheck(idx));}
    if(!${full}&&held.size>=${minDistinct})break;
    if(${full}&&held.size>=w.dataset.words.split(',').length)break;
  }
  if(fr){fr.done=true;}
  mo.disconnect();
  out.distinct=seen.size; out.held=held.size; out.maxDelta=maxDelta; out.maxOver=maxOver; out.slotDrift=slotDrift; out.overflow=maxOverflow;
  out.ls=(window.__ls||0)-ls0;
  for(const p of written)if(!ALLOWED.test(p))out.bad.push('disallowed inline style property written in .hero-word: '+p);
  out.written=[...written];
  if(fr){const f=fr.slice(2).sort((a,b)=>a-b);out.p95=f[Math.floor(f.length*0.95)]||0;out.frames=f.length;}
  out.ul=window.__ul;
  return out;}`;

results.cycle = async () => {
  const notes = [];
  const check = (w, r, minWords, label) => {
    if (r.bad.length) throw new Error(label + w + "px: " + r.bad.slice(0, 5).join("; "));
    if (r.held < minWords) throw new Error(label + w + "px: only " + r.held + " words reached a hold point (need " + minWords + ")");
    if (r.maxDelta > 1) throw new Error(w + "px: h1/lede/CTA/trust cue moved " + r.maxDelta.toFixed(2) + "px while cycling (HERO-02)");
    if (r.ls >= 0.001) throw new Error(w + "px: layout shift " + r.ls.toFixed(4) + " while cycling");
    if (r.maxOver > 0.5) throw new Error(w + "px: word overflows the text column by " + r.maxOver.toFixed(1) + "px");
    if (r.slotDrift > 0.5) throw new Error(w + "px: word slot width changed by " + r.slotDrift.toFixed(1) + "px");
    if (r.overflow > 0) throw new Error(w + "px: horizontal overflow " + r.overflow + "px while cycling");
  };
  // (a) cycling at four widths. 1280 walks every word (ink + inline-style audit); 375 also records frame times.
  const r1280 = await scenario(1280, 900, { initScript: CYCLE_INIT }, cycleExpr(3, 40000, true, false));
  check(1280, r1280, 7, "");
  if (r1280.ul && r1280.ul.samples < 3) throw new Error("underline watcher saw only " + r1280.ul.samples + " frames");
  if (r1280.ul && r1280.ul.worst > 2) throw new Error("underline flashed wide: " + r1280.ul.worst.toFixed(1) + "px wider than the active word");
  notes.push("1280 7 words, edges <=" + r1280.maxDelta.toFixed(2) + "px, ls " + r1280.ls.toFixed(4) + ", inline props " + r1280.written.join("/"));
  const r375 = await scenario(375, 740, { initScript: CYCLE_INIT }, cycleExpr(3, 16000, false, true));
  check(375, r375, 3, "");
  if (r375.ul && r375.ul.worst > 2) throw new Error("375px: underline flashed wide: " + r375.ul.worst.toFixed(1) + "px");
  // Threshold is deliberately lenient: headless Chrome without a GPU is noisy. It catches gross jank
  // (layout thrash, blur repaint), not a 60fps guarantee. The measured value is reported.
  if (!(r375.p95 <= 50)) throw new Error("375px: p95 frame time " + (r375.p95 || 0).toFixed(1) + "ms > 50ms");
  notes.push("375 p95 " + r375.p95.toFixed(1) + "ms over " + r375.frames + " frames");
  const r320 = await scenario(320, 700, { initScript: CYCLE_INIT }, cycleExpr(3, 16000, false, false));
  check(320, r320, 3, "");
  const r768 = await scenario(768, 900, { initScript: CYCLE_INIT }, cycleExpr(2, 12000, false, false));
  check(768, r768, 2, "");

  // (c) pause model at 1280
  const P = await scenario(1280, 900, {}, `async()=>{
    ${CYC_HELPERS}
    const bad=[];
    if(!(await waitToggle()))return{bad:['toggle never visible']};
    const w=word(), tg=q('.hero-toggle'), lab=tg.querySelector('.hero-toggle__label');
    const st=()=>({s:w.dataset.state,by:(w.dataset.pausedBy||'').split(/\\s+/).filter(Boolean),pressed:tg.getAttribute('aria-pressed'),label:lab.textContent.trim()});
    const expect=(name,cond,info)=>{if(!cond)bad.push(name+' ('+JSON.stringify(info||st())+')');};
    expect('starts playing',st().s==='playing'&&st().pressed==='false');
    tg.click(); await sleep(150);
    expect('toggle pauses',st().s==='paused'&&st().by.includes('user')&&st().pressed==='true');
    expect('label stays fixed',st().label==='Pause animation');
    const c0=w.dataset.current; await sleep(3000);
    expect('current unchanged while paused',w.dataset.current===c0,{c0,now:w.dataset.current});
    expect('hero.is-paused class',q('.hero').classList.contains('is-paused'));
    tg.click(); await sleep(150);
    expect('toggle resumes',st().s==='playing'&&st().pressed==='false'&&st().label==='Pause animation');
    let moved=false; for(let i=0;i<45&&!moved;i++){await sleep(100);moved=w.dataset.current!==c0;}
    expect('cycle advances after resume',moved);
    const title=q('.hero-title');
    title.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'})); await sleep(150);
    expect('mouse hover pauses',st().s==='paused'&&st().by.includes('hover'));
    title.dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'})); await sleep(150);
    expect('mouse leave resumes',st().s==='playing');
    title.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'touch'})); await sleep(150);
    expect('touch pointerenter never pauses',st().s==='playing'&&!st().by.includes('hover'));
    const cta=q('#hero-cta a.btn'); cta.focus(); await sleep(150);
    expect('focus in hero pauses',st().s==='paused'&&st().by.includes('focus'));
    cta.blur(); await sleep(150);
    expect('blur resumes',st().s==='playing');
    tg.focus(); await sleep(150);
    expect('focusing the toggle itself does not pause',st().s==='playing'&&!st().by.includes('focus'));
    tg.blur();
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    document.dispatchEvent(new Event('visibilitychange')); await sleep(150);
    expect('hidden tab pauses',st().s==='paused'&&st().by.includes('hidden'));
    delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); await sleep(150);
    expect('visible tab resumes',st().s==='playing');
    const hb=q('.hero').getBoundingClientRect().bottom+scrollY;
    scrollTo({top:hb+200,behavior:'instant'}); await sleep(500);
    expect('off-screen pauses',st().s==='paused'&&st().by.includes('offscreen'));
    scrollTo({top:0,behavior:'instant'}); await sleep(500);
    expect('back on screen resumes',st().s==='playing');
    // aria (d)
    const vis=q('.hero-title__visual');
    expect('visual line aria-hidden',vis&&vis.getAttribute('aria-hidden')==='true');
    expect('every alt inside the visual line',[...document.querySelectorAll('.hero-word__alt')].every(a=>vis.contains(a))&&document.querySelectorAll('.hero-word__alt').length===6);
    expect('h1 has exactly one visually-hidden child',q('h1').querySelectorAll(':scope > .visually-hidden').length===1);
    expect('h1 SR sentence',q('h1 > .visually-hidden').textContent==='Marketing for your bakery, café, salon, gym, florist, shop or restaurant');
    return{bad};}`);
  if (P.bad.length) throw new Error("pause/aria: " + P.bad.slice(0, 6).join("; "));

  // (c) touch tap must not stick the cycle paused
  const T = await scenario(
    375, 740, { touch: true, between: async (i, prev, cdp) => {
      const pt = { x: Math.round(prev.x), y: Math.round(prev.y) };
      await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [pt] });
      await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(800);
    } },
    [
      `async()=>{ ${CYC_HELPERS} if(!(await waitToggle()))return{x:0,y:0,bad:'toggle never visible'}; const r=q('.hero-title').getBoundingClientRect(); return{x:r.left+r.width/2,y:Math.min(r.top+r.height/2,innerHeight-10)}; }`,
      `async()=>{ ${CYC_HELPERS} const w=word(),tg=q('.hero-toggle'); return{state:w.dataset.state,by:w.dataset.pausedBy||'',pressed:tg.getAttribute('aria-pressed'),label:tg.querySelector('.hero-toggle__label').textContent.trim()}; }`,
    ]
  );
  if (T.state !== "playing" || /hover/.test(T.by) || T.pressed !== "false" || T.label !== "Pause animation") {
    throw new Error("touch tap left the hero stuck: " + JSON.stringify(T));
  }

  // (e) reduced motion is fully static
  for (const [w, h] of [[375, 740], [1280, 900]]) {
    const r = await scenario(w, h, { reducedMotion: true }, `async()=>{
      ${CYC_HELPERS}
      const bad=[];
      if(html.classList.contains('has-motion'))bad.push('has-motion present');
      if(html.classList.contains('motion-pending'))bad.push('motion-pending present');
      if(!q('.hero-toggle').hidden)bad.push('toggle visible');
      if(document.querySelectorAll('.hero-word__alt').length)bad.push('alt words exist');
      const t=q('.hero-word__text').textContent;
      await sleep(4000);
      if(q('.hero-word__text').textContent!==t||t!=='bakery')bad.push('word changed or is not bakery: '+t);
      if(word().dataset.current)bad.push('data-current set');
      return{bad};}`);
    if (r.bad.length) throw new Error("reduced motion " + w + "px: " + r.bad.join("; "));
  }

  // (f) motion-pending lifecycle
  const L1 = await scenario(1280, 900, {}, `async()=>{
    ${CYC_HELPERS}
    for(let i=0;i<40&&!html.classList.contains('has-motion');i++)await sleep(100);
    return{motion:html.classList.contains('has-motion'),pending:html.classList.contains('motion-pending')};}`);
  if (!L1.motion || L1.pending) throw new Error("motion-pending lifecycle: has-motion " + L1.motion + ", motion-pending still " + L1.pending);
  const L2 = await scenario(1280, 900, { blockGsap: true }, `async()=>{
    ${CYC_HELPERS}
    await sleep(3000);
    return{motion:html.classList.contains('has-motion'),pending:html.classList.contains('motion-pending'),title:q('.hero-title__visual').textContent.replace(/\\s+/g,' ').trim()};}`);
  if (L2.pending || L2.motion) throw new Error("GSAP blocked: motion-pending " + L2.pending + ", has-motion " + L2.motion);
  if (L2.title !== "Marketing for your bakery") throw new Error("GSAP blocked: headline is '" + L2.title + "'");
  const L3 = await scenario(1280, 900, { noJs: true }, `async()=>{
    const h=document.documentElement;return{pending:h.classList.contains('motion-pending'),motion:h.classList.contains('has-motion'),nojs:h.classList.contains('no-js')};}`);
  if (L3.pending || L3.motion || !L3.nojs) throw new Error("no-JS: expected no motion classes and no-js kept: " + JSON.stringify(L3));

  return "cycles at 320/375/768/1280, hold points true, no clipped descenders, edges stable, pause model + touch + aria + reduced + lifecycle; " + notes.join("; ");
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
    console.log("FAIL timed out after 300s");
    try { child.kill("SIGKILL"); } catch (e) { /* ignore */ }
    process.exit(1);
  }, 300000);
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
