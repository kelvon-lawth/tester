#!/usr/bin/env node
// Dev-only QA guard (Phase 5): overflow, tap targets, keyboard focus, shell parity, first-view weight + CLS, subfolder/file:// hosting, style guide CSS split.
// Usage: node tools/qa-browser-test.js [overflow|tap|keyboard|shell|weight|hosting|styleguide ...]
// Zero dependencies. Raw Chrome DevTools Protocol over Node's global WebSocket.
"use strict";

const fs = require("fs");
const os = require("os");
const http = require("http");
const path = require("path");
const url = require("url");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PAGES = ["index.html", "contact.html"];
const fileUrl = (p) => url.pathToFileURL(path.join(ROOT, p)).href;
const ALL = ["overflow", "tap", "keyboard", "shell", "weight", "hosting", "styleguide"];

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
const persistent = new Map();

function send(method, params, sessionId) {
  const id = nextId++;
  if (process.env.QA_DEBUG) console.log("send", method);
  const msg = { id, method, params: params || {} };
  if (sessionId) msg.sessionId = sessionId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
    ws.send(JSON.stringify(msg));
  });
}

function on(method, sessionId, fn) {
  const key = method + "|" + (sessionId || "");
  const arr = persistent.get(key) || [];
  arr.push(fn);
  persistent.set(key, arr);
}

function once(method, sessionId) {
  return new Promise((resolve) => {
    const key = method + "|" + (sessionId || "");
    const arr = persistent.get(key) || [];
    const fn = (p) => {
      const cur = persistent.get(key) || [];
      persistent.set(key, cur.filter((f) => f !== fn));
      resolve(p);
    };
    arr.push(fn);
    persistent.set(key, arr);
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
    const arr = persistent.get(data.method + "|" + (data.sessionId || ""));
    if (arr) arr.slice().forEach((fn) => fn(data.params));
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

// Multi-step page flow. fn(sessionId, evaluate, log). evaluate takes a function-expression string.
async function withPage(width, height, opts, fn) {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const log = { requests: new Map(), failed: [], bad: [], exceptions: [], errors: [], finished: [], loaded: null };
  try {
    if (process.env.QA_DEBUG) console.log("step attach");
    await send("Page.enable", {}, sessionId);
    await send("Runtime.enable", {}, sessionId);
    await send("Network.enable", {}, sessionId);
    await send("Network.setCacheDisabled", { cacheDisabled: true }, sessionId);
    await send("Emulation.setFocusEmulationEnabled", { enabled: true }, sessionId);
    on("Network.requestWillBeSent", sessionId, (p) => log.requests.set(p.requestId, p.request.url));
    on("Network.responseReceived", sessionId, (p) => {
      if (p.response.status >= 400) log.bad.push(p.response.status + " " + p.response.url);
    });
    on("Network.loadingFinished", sessionId, (p) => log.finished.push({ id: p.requestId, bytes: p.encodedDataLength }));
    on("Network.loadingFailed", sessionId, (p) =>
      log.failed.push((log.requests.get(p.requestId) || p.requestId) + " (" + p.errorText + ")"));
    on("Runtime.exceptionThrown", sessionId, (p) =>
      log.exceptions.push((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text));
    on("Runtime.consoleAPICalled", sessionId, (p) => {
      if (p.type === "error") log.errors.push(p.args.map((a) => a.value || a.description).join(" "));
    });
    await send(
      "Emulation.setDeviceMetricsOverride",
      { width, height, deviceScaleFactor: 1, mobile: width < 640 },
      sessionId
    );
    if (opts.noJs) await send("Emulation.setScriptExecutionDisabled", { value: true }, sessionId);
    if (opts.initScript) await send("Page.addScriptToEvaluateOnNewDocument", { source: opts.initScript }, sessionId);
    const loaded = once("Page.loadEventFired", sessionId);
    await send("Page.navigate", { url: opts.url }, sessionId);
    await loaded;
    const evaluate = async (expression) => {
      const res = await send(
        "Runtime.evaluate",
        {
          expression:
            "(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));" +
            "const raf=()=>new Promise(r=>requestAnimationFrame(()=>r()));" +
            (opts.noJs ? "" : "if(document.fonts)await document.fonts.ready;") +
            "return await (" + expression + ")();})()",
          awaitPromise: true,
          returnByValue: true,
        },
        sessionId
      );
      if (res.exceptionDetails) {
        throw new Error("page exception: " + ((res.exceptionDetails.exception && res.exceptionDetails.exception.description) || res.exceptionDetails.text));
      }
      return res.result.value;
    };
    return await fn(sessionId, evaluate, log);
  } finally {
    try { await send("Target.closeTarget", { targetId }); } catch (e) { /* ignore */ }
  }
}

async function pressKey(sessionId, key, code, keyCode, text) {
  const base = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
  const down = Object.assign({ type: text ? "keyDown" : "rawKeyDown" }, base);
  if (text) down.text = text;
  await send("Input.dispatchKeyEvent", down, sessionId);
  await send("Input.dispatchKeyEvent", Object.assign({ type: "keyUp" }, base), sessionId);
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".svg": "image/svg+xml", ".md": "text/plain", ".json": "application/json",
};

function startServer(rootDir) {
  const root = path.resolve(rootDir);
  const server = http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch (e) { res.writeHead(400); return res.end(); }
    let file = path.resolve(path.join(root, p));
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end("forbidden"); }
    try {
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      const body = fs.readFileSync(file);
      res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
      res.end(body);
    } catch (e) { res.writeHead(404); res.end("not found"); }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ port: server.address().port, close: () => server.close() }));
  });
}

// ---------------------------------------------------------------------------
// In-page helpers (string-injected)
// ---------------------------------------------------------------------------
const COLLECT = `
const SEL='a[href],button,input:not([type=hidden]),textarea,select,summary,[role=button],[tabindex]:not([tabindex="-1"])';
const hiddenAnc=el=>{for(let n=el;n&&n.nodeType===1;n=n.parentElement){if(n.hidden||n.inert||n.getAttribute('aria-hidden')==='true')return true;}return false;};
const label=el=>el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.classList[0]?'.'+el.classList[0]:'')+' "'+(el.textContent||el.getAttribute('aria-label')||el.getAttribute('href')||'').trim().replace(/\\s+/g,' ').slice(0,30)+'"';
const isSkip=el=>/skip/.test(el.className+' '+(el.getAttribute('href')||''));
const collect=(includeSkip)=>[...document.querySelectorAll(SEL)].filter(el=>{
  if(el.disabled)return false;
  if(isSkip(el))return !!includeSkip;
  if(hiddenAnc(el))return false;
  if(!el.checkVisibility({visibilityProperty:true}))return false;
  const r=el.getBoundingClientRect();
  if(r.width<=0||r.height<=0)return false;
  if(r.width<=1||r.height<=1)return false;
  return true;});
`;

const results = {};

// ---------------------------------------------------------------------------
// overflow
// ---------------------------------------------------------------------------
const OVERFLOW = `async()=>{
  const o=()=>document.documentElement.scrollWidth-window.innerWidth;
  const first=o();
  window.scrollTo(0,document.documentElement.scrollHeight);
  if(!window.__noJs)await sleep(600);
  const bottom=o();
  return{first,bottom,max:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)};}`;

results.overflow = async () => {
  const done = [];
  for (const page of PAGES) {
    for (const w of [320, 375, 768, 1280]) {
      const v = await withPage(w, 800, { url: fileUrl(page) }, (s, ev) => ev(OVERFLOW));
      if (v.first > 0 || v.bottom > 0) throw new Error(page + " @" + w + " scrolls sideways (load " + v.first + "px, bottom " + v.bottom + "px)");
      done.push(page.replace(".html", "") + "@" + w);
    }
    const v = await withPage(320, 800, { url: fileUrl(page), noJs: true }, (s, ev) => ev("async()=>{window.__noJs=true;return await (" + OVERFLOW + ")();}"));
    if (v.first > 0 || v.bottom > 0) throw new Error(page + " @320 no-JS scrolls sideways (" + v.first + "px)");
    done.push(page.replace(".html", "") + "@320 no-JS");
  }
  return "no horizontal scroll: " + done.join(", ");
};

// ---------------------------------------------------------------------------
// tap
// ---------------------------------------------------------------------------
const TAP = `async()=>{
  ${COLLECT}
  const H=document.documentElement.scrollHeight;
  for(let y=0;y<=H;y+=300){window.scrollTo(0,y);await sleep(80);}
  await sleep(1200);
  const fails=[];let n=0;
  for(const el of collect(false)){
    n++;
    const r=el.getBoundingClientRect();
    if(r.width>=43.99&&r.height>=43.99)continue;
    if(el.tagName==='A'&&getComputedStyle(el).display==='inline'){
      const host=el.closest('p,li');
      if(host&&host.textContent.trim().length>el.textContent.trim().length)continue;
    }
    fails.push(label(el)+' '+Math.round(r.width*10)/10+'x'+Math.round(r.height*10)/10);
  }
  return{n,fails};}`;

results.tap = async () => {
  const bad = [];
  let total = 0;
  for (const page of PAGES) {
    const v = await withPage(375, 812, { url: fileUrl(page) }, (s, ev) => ev(TAP));
    total += v.n;
    v.fails.forEach((f) => bad.push(page + ": " + f));
  }
  if (bad.length) throw new Error(bad.length + " target(s) under 44x44 at 375:\n    " + bad.join("\n    "));
  return total + " interactive targets all >= 44x44 at 375 (inline paragraph links exempt)";
};

// ---------------------------------------------------------------------------
// keyboard
// ---------------------------------------------------------------------------
const KB_SETUP = `async()=>{
  ${COLLECT}
  await sleep(1500);
  const list=collect(true);
  list.forEach((el,i)=>el.setAttribute('data-qa-i',String(i)));
  window.scrollTo(0,0);
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  return list.map(label);}`;

const KB_READ = `async()=>{
  ${COLLECT}
  const el=document.activeElement;
  if(!el||el===document.body||el===document.documentElement)return{body:true};
  const fv=el.matches(':focus-visible');
  const cs=getComputedStyle(el);
  const ow=parseFloat(cs.outlineWidth)||0;
  const outline=cs.outlineStyle!=='none'&&ow>=2;
  const shadowOn=cs.boxShadow;
  el.blur();
  const shadowOff=getComputedStyle(el).boxShadow;
  el.focus({focusVisible:true});
  const shadow=shadowOn!==shadowOff&&shadowOn!=='none';
  return{i:el.getAttribute('data-qa-i'),label:label(el),fv,visible:outline||shadow,outline:cs.outlineStyle+' '+cs.outlineWidth,shadowOn};}`;

results.keyboard = async () => {
  const notes = [];
  for (const [w, h] of [[1280, 800], [375, 812]]) {
    for (const page of PAGES) {
      const tag = page + "@" + w;
      await withPage(w, h, { url: fileUrl(page) }, async (s, ev) => {
        const expected = await ev(KB_SETUP);
        const reached = new Set();
        const problems = [];
        let first = null;
        for (let n = 0; n < expected.length + 10; n++) {
          await pressKey(s, "Tab", "Tab", 9);
          await sleep(60);
          const r = await ev(KB_READ);
          if (r.body) break;
          if (first === null) first = r.label;
          else if (r.label === first && n > 1) break;
          if (r.i !== null) reached.add(Number(r.i));
          if (!r.fv) problems.push(r.label + " not :focus-visible");
          else if (!r.visible) problems.push(r.label + " has no visible focus style (outline " + r.outline + ")");
        }
        const missed = expected.filter((_, i) => !reached.has(i));
        if (missed.length) throw new Error(tag + ": Tab never reached " + missed.join(", "));
        if (problems.length) throw new Error(tag + ": " + problems.join("; "));
        if (process.env.QA_DEBUG) console.log("EXP", tag, expected.join(" | "), "REACHED", [...reached].join(","));
        notes.push(tag + " " + expected.length);
      });
    }
  }
  // Operate: hero pause toggle with Space, contact submit with Enter.
  await withPage(1280, 800, { url: fileUrl("index.html") }, async (s, ev) => {
    const before = await ev(`async()=>{const b=document.querySelector('.hero-toggle');for(let i=0;i<60&&b&&(b.hidden||!b.checkVisibility());i++)await sleep(100);if(!b||b.hidden||!b.checkVisibility())return null;b.focus();return b.getAttribute('aria-pressed');}`);
    if (before === null) throw new Error("hero toggle missing or hidden on Home at 1280");
    await pressKey(s, " ", "Space", 32, " ");
    await sleep(200);
    const after = await ev(`async()=>document.querySelector('.hero-toggle').getAttribute('aria-pressed')`);
    if (after === before || after !== "true") throw new Error("Space on hero toggle: aria-pressed " + before + " -> " + after);
  });
  await withPage(1280, 800, { url: fileUrl("contact.html") }, async (s, ev) => {
    await ev(`async()=>{document.querySelector('#contact-form button[type=submit]').focus();}`);
    await pressKey(s, "Enter", "Enter", 13, "\r");
    await sleep(300);
    const v = await ev(`async()=>{const f=document.querySelector('#contact-form [required]');return{inv:f.getAttribute('aria-invalid'),active:document.activeElement===f};}`);
    if (v.inv !== "true" || !v.active) throw new Error("Enter on submit: first required field invalid=" + v.inv + " focused=" + v.active);
  });
  return "Tab reaches every control with a visible focus style (" + notes.join(", ") + "); Space toggle and Enter submit work";
};

// ---------------------------------------------------------------------------
// shell
// ---------------------------------------------------------------------------
results.shell = async () => {
  const grab = (page) =>
    withPage(1280, 800, { url: fileUrl(page), noJs: true }, (s, ev) =>
      ev(`async()=>{const h=document.querySelector('header.site-header'),f=document.querySelector('footer.site-footer');
        const cur=[...document.querySelectorAll('[aria-current]')].map(a=>a.getAttribute('href'));
        return{h:h&&h.outerHTML,f:f&&f.outerHTML,cur};}`));
  const a = await grab("index.html");
  const b = await grab("contact.html");
  if (!a.h || !b.h) throw new Error("header.site-header missing");
  if (!a.f || !b.f) throw new Error("footer.site-footer missing");
  const strip = (x) => x.replace(/ aria-current="page"/g, "");
  if (strip(a.h) !== strip(b.h)) throw new Error("rendered header differs between pages");
  if (strip(a.f) !== strip(b.f)) throw new Error("rendered footer differs between pages");
  const ok = (cur, want) => cur.filter((h) => h.indexOf("#") !== 0).length === 1 && cur.some((h) => h.replace(/^\.\//, "") === want);
  if (!ok(a.cur, "index.html")) throw new Error("index aria-current links: " + JSON.stringify(a.cur));
  if (!ok(b.cur, "contact.html")) throw new Error("contact aria-current links: " + JSON.stringify(b.cur));
  return "header and footer identical (ignoring aria-current); one aria-current per page";
};

// ---------------------------------------------------------------------------
// weight
// ---------------------------------------------------------------------------
const CLS_INIT = `window.__cls=0;try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value;}).observe({type:'layout-shift',buffered:true});}catch(e){}`;

results.weight = async () => {
  const server = await startServer(ROOT);
  const origin = "http://127.0.0.1:" + server.port;
  const notes = [];
  try {
    for (const [w, h] of [[1280, 800], [375, 812]]) {
      await withPage(w, h, { url: origin + "/index.html", initScript: CLS_INIT }, async (s, ev, log) => {
        await ev(`async()=>{await sleep(3000);}`);
        const cls = await ev(`async()=>window.__cls`);
        const per = new Map();
        let total = 0;
        for (const f of log.finished) {
          const u = log.requests.get(f.id);
          if (!u || /^(data|about):/.test(u)) continue;
          per.set(u, (per.get(u) || 0) + f.bytes);
          total += f.bytes;
        }
        const lines = [...per].sort((x, y) => y[1] - x[1]).map(([u, b]) => "      " + b + "  " + u.replace(origin, ""));
        console.log("  weight @" + w + ": " + total + " bytes (" + Math.round(total / 1024) + "KB), CLS " + cls.toFixed(4) + "\n" + lines.join("\n"));
        const foreign = [...log.requests.values()].filter((u) => !/^(data|about):/.test(u) && u.indexOf(origin) !== 0);
        if (foreign.length) throw new Error("@" + w + " off-origin requests: " + foreign.join(", "));
        if (log.bad.length) throw new Error("@" + w + " bad responses: " + log.bad.join(", "));
        if (log.failed.length) throw new Error("@" + w + " failed requests: " + log.failed.join(", "));
        if (total > 500 * 1024) throw new Error("@" + w + " transfers " + total + " bytes, over 500KB");
        if (cls > 0.02) throw new Error("@" + w + " CLS " + cls + " over 0.02");
        notes.push(w + ": " + Math.round(total / 1024) + "KB CLS " + cls.toFixed(3));
      });
    }
  } finally {
    server.close();
  }
  return "first view <= 500KB, same-origin only, CLS <= 0.02 (" + notes.join("; ") + ")";
};

// ---------------------------------------------------------------------------
// hosting
// ---------------------------------------------------------------------------
async function hostingCheck(startUrl, label, isHttp) {
  const onIndex = /index\.html$|\/$/.test(startUrl);
  await withPage(1280, 800, { url: startUrl }, async (s, ev, log) => {
    const v = await ev(`async()=>{
      const h=${onIndex ? "true" : "false"};
      const H=document.documentElement.scrollHeight;
      for(let y=0;y<=H;y+=400){window.scrollTo(0,y);await sleep(60);}
      window.scrollTo(0,H);await sleep(800);
      const imgs=[...document.querySelectorAll('img')].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src'));
      return{ff:getComputedStyle(document.body).fontFamily,font:document.fonts.check('16px Figtree'),
        fst:[...document.fonts].map(f=>f.family+f.weight+':'+f.status).join(','),gsap:typeof gsap!=='undefined',imgs,n:document.images.length,path:location.pathname};}`);
    const tag = label + " " + startUrl.split("/").pop();
    // Chrome treats file:// as cross-origin, so the crossorigin font *preloads* fail there; the @font-face
    // loads still succeed. Tolerate only failed .woff2 requests on file://, and require every real font loaded.
    const failed = isHttp ? log.failed : log.failed.filter((f) => !/\.woff2 \(/.test(f));
    if (!isHttp && /(Fraunces|Figtree)\d+:(error|unloaded)/.test(v.fst.replace(/Fallback[^,]*/g, ""))) throw new Error(tag + " font status " + v.fst);
    if (failed.length) throw new Error(tag + " failed requests: " + failed.join(", "));
    if (log.bad.length) throw new Error(tag + " bad responses: " + log.bad.join(", "));
    if (log.exceptions.length) throw new Error(tag + " exceptions: " + log.exceptions.join(" | "));
    if (log.errors.length) throw new Error(tag + " console errors: " + log.errors.join(" | "));
    if (!/Figtree/.test(v.ff)) throw new Error(tag + " body font-family " + v.ff);
    if (!v.font) throw new Error(tag + " Figtree not loaded");
    if (onIndex && !v.gsap) throw new Error(tag + " gsap undefined");
    if (v.imgs.length) throw new Error(tag + " images not loaded: " + v.imgs.join(", "));
  });
  // Navigate via the header link.
  const navUrl = startUrl.replace(/[^/]*$/, "");
  await withPage(1280, 800, { url: navUrl + "index.html" }, async (s, ev, log) => {
    const loaded = once("Page.loadEventFired", s);
    await ev(`async()=>{const a=document.querySelector('header a[href="contact.html"]');setTimeout(()=>a.click(),0);}`);
    await loaded;
    const v = await ev(`async()=>({p:location.pathname,ff:getComputedStyle(document.body).fontFamily,font:document.fonts.check('16px Figtree')})`);
    if (!/\/sub%20dir\/site\/contact\.html$/.test(v.p)) throw new Error(label + " nav landed on " + v.p);
    if (!/Figtree/.test(v.ff) || !v.font) throw new Error(label + " styles/fonts missing after navigation");
    const nf = (isHttp ? log.failed : log.failed.filter((f) => !/\.woff2 \(/.test(f))).concat(log.bad);
    if (nf.length) throw new Error(label + " nav failures: " + nf.join(", "));
  });
}

results.hosting = async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "qa-hosting-"));
  let server;
  try {
    const dest = path.join(tmp, "sub dir", "site");
    fs.mkdirSync(dest, { recursive: true });
    for (const f of ["index.html", "contact.html", "styleguide.html", "css", "js", "assets"]) {
      if (fs.existsSync(path.join(ROOT, f))) fs.cpSync(path.join(ROOT, f), path.join(dest, f), { recursive: true });
    }
    const fileBase = url.pathToFileURL(dest).href.replace(/\/?$/, "/");
    for (const p of PAGES) await hostingCheck(fileBase + p, "file://", false);
    server = await startServer(tmp);
    const httpBase = "http://127.0.0.1:" + server.port + "/sub%20dir/site/";
    await hostingCheck(httpBase, "http", true);
    await hostingCheck(httpBase + "contact.html", "http", true);
  } finally {
    if (server) server.close();
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* best effort */ }
  }
  return "copy in 'sub dir/site' works over file:// and http subpath: assets load, no errors, nav links work";
};

// ---------------------------------------------------------------------------
// styleguide: .sg- rules live in css/styleguide.css, linked only by styleguide.html
// ---------------------------------------------------------------------------
results.styleguide = async () => {
  await withPage(1280, 800, { url: fileUrl("styleguide.html") }, async (sid, evaluate, log) => {
    const r = await evaluate(`async()=>{
      await sleep(500);
      const sheets=[...document.styleSheets].map(s=>s.href||'');
      const sw=document.querySelector('.sg-swatch');
      const grid=document.querySelector('.sg-swatches');
      const ratio=document.querySelector('.sg-ratio');
      return{sheets,swatch:sw?getComputedStyle(sw).blockSize:null,grid:grid?getComputedStyle(grid).display:null,ratio:ratio?ratio.textContent.trim():null};}`);
    if (!r.sheets.some((h) => /css\/styleguide\.css$/.test(h))) throw new Error("css/styleguide.css not loaded: " + r.sheets.join(", "));
    if (r.swatch !== "64px") throw new Error(".sg-swatch block-size is " + r.swatch + ", expected 64px");
    if (r.grid !== "grid") throw new Error(".sg-swatches display is " + r.grid + ", expected grid");
    if (!r.ratio || !/:1$/.test(r.ratio)) throw new Error(".sg-ratio text is " + JSON.stringify(r.ratio) + ", expected to end with :1");
    const failed = log.failed.filter((f) => !/\.woff2 \(/.test(f));
    if (log.exceptions.length || log.errors.length || failed.length || log.bad.length)
      throw new Error("page problems: " + JSON.stringify({ ex: log.exceptions, err: log.errors, failed, bad: log.bad }));
  });
  await withPage(1280, 800, { url: fileUrl("index.html") }, async (sid, evaluate) => {
    const sheets = await evaluate("async()=>[...document.styleSheets].map(s=>s.href||'')");
    if (sheets.some((h) => /styleguide/.test(h))) throw new Error("index.html loads a style guide stylesheet");
  });
  return "styleguide.html styled via css/styleguide.css over file://; index.html does not load it";
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "qa-browser-"));
  const child = spawn(
    CHROME,
    [
      "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
      "--user-data-dir=" + profile, "--remote-debugging-port=0", "about:blank",
    ],
    { stdio: "ignore" }
  );
  const overall = setTimeout(() => {
    console.log("FAIL timed out after 280s");
    try { child.kill("SIGKILL"); } catch (e) { /* ignore */ }
    process.exit(1);
  }, 280000);
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
  if (!failed) console.log("QA BROWSER OK");
  process.exit(failed ? 1 : 0);
})();
