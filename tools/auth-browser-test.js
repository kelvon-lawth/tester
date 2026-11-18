#!/usr/bin/env node
// Browser test for the client login feature (Phase 7). Raw Chrome DevTools Protocol, zero dependencies.
//
// Usage: node tools/auth-browser-test.js [group ...]
//   No arguments runs every offline group (not live, deployed or rollback).
//   Offline groups: harness sdk public file-login file-dashboard file-setpass
//                   stub-login stub-dashboard stub-reset stub-setpass stub-change csp
//   Extra groups:   live (real project, needs credentials), deployed (needs BASE_URL),
//                   rollback (needs BASE_URL and EXPECT_SHA)
// Env: BASE_URL (test a hosted address instead of the local build), EXPECT_SHA, CHROME_PATH.
// Exit codes: 0 all passed, 1 a check failed, 2 could not run (missing credentials, protected address).
//
// HTTP groups build _site with tools/build-site.sh and serve it from a local server that applies the
// `headers` array of vercel.json to every response, so the browser sees what Vercel would send.
// Page.setBypassCSP is never used. Any CSP violation, uncaught exception or console error fails a page.
//
// Selector contract the pages must follow (UI spec and 07-05 plan):
//   #login-form, #reset-form, #password-form, #auth-status, #reset-view, .dash, .dash__sample,
//   .dash__grid, window.AuthApp (sb, flash.set/take), buttons and links found by their visible text.
"use strict";

const fs = require("fs");
const os = require("os");
const http = require("http");
const path = require("path");
const url = require("url");
const crypto = require("crypto");
const { spawn, spawnSync } = require("child_process");
const authEnv = require("./auth-env");

const ROOT = path.resolve(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OFFLINE = ["harness", "sdk", "public", "file-login", "file-dashboard", "file-setpass",
  "stub-login", "stub-dashboard", "stub-reset", "stub-setpass", "stub-change", "csp"];
const EXTRA = ["live", "deployed", "rollback"];
const ALL = OFFLINE.concat(EXTRA);

// ---------------------------------------------------------------------------
// Output. One print function, and it refuses to print a secret value.
// ---------------------------------------------------------------------------
authEnv.load();
function out(line) {
  const s = String(line);
  for (const v of authEnv.secretValues()) {
    if (s.includes(v)) throw new Error("refusing to print output containing a secret value");
  }
  console.log(s);
}
function safeOut(line) {
  try { out(line); } catch (e) { console.log("output suppressed (it contained a secret value)"); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fileUrl = (p) => url.pathToFileURL(path.join(ROOT, p)).href;
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const fixedUrl = "https://probe.supabase.co";

const requested = process.argv.slice(2);
for (const g of requested) {
  if (!ALL.includes(g)) { out("FAIL unknown group: " + g + " (use " + ALL.join(", ") + ")"); process.exit(1); }
}
const groups = requested.length ? requested : OFFLINE;
const BASE_URL = (process.env.BASE_URL || "").replace(/\/+$/, "");
const EXPECT_SHA = (process.env.EXPECT_SHA || "").trim();

if (groups.includes("deployed") && !BASE_URL) { out("NOT RUN: deployed needs BASE_URL"); process.exit(2); }
if (groups.includes("rollback") && (!BASE_URL || !EXPECT_SHA)) { out("NOT RUN: rollback needs BASE_URL and EXPECT_SHA"); process.exit(2); }
if (groups.includes("live")) {
  const need = authEnv.NAMES.filter((n) => !process.env[n]);
  if (need.length) { out("LIVE TESTS NOT RUN: missing " + need.join(", ")); process.exit(2); }
}
if (!fs.existsSync(CHROME)) { out("FAIL chrome not found at " + CHROME); process.exit(1); }

// ---------------------------------------------------------------------------
// Config read from the repo (no secrets live there)
// ---------------------------------------------------------------------------
function readConfig() {
  let t = "";
  try { t = fs.readFileSync(path.join(ROOT, "js/auth-config.js"), "utf8"); } catch (e) { /* not written yet */ }
  const u = t.match(/url\s*:\s*["'](https:\/\/([a-z0-9]+)\.supabase\.co)["']/);
  const m = t.match(/PASSWORD_MIN\s*[:=]\s*(\d+)/);
  return { ref: u ? u[2] : "stubref", min: m ? Number(m[1]) : 10 };
}
const CFG = readConfig();
const STORAGE_KEY = "sb-" + CFG.ref + "-auth-token";

// ---------------------------------------------------------------------------
// vercel.json headers, served locally
// ---------------------------------------------------------------------------
function loadHeaderRules() {
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")); } catch (e) { return []; }
  return Array.isArray(j.headers) ? j.headers : [];
}
function headersFor(rules, pathname) {
  const h = {};
  for (const r of rules) {
    let re;
    try { re = new RegExp("^" + String(r.source).replace(/\(\.\*\)/g, ".*") + "$"); } catch (e) { continue; }
    if (!re.test(pathname)) continue;
    for (const e of r.headers || []) h[e.key] = e.value;
  }
  return h;
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain", ".md": "text/plain", ".json": "application/json",
};

// memory: { "/path": { type, body } } pages served from the test process, never from disk
function startServer(root, rules, memory) {
  const server = http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch (e) { res.writeHead(400); return res.end(); }
    const extra = headersFor(rules, p);
    if (memory[p]) {
      res.writeHead(200, Object.assign({ "Content-Type": memory[p].type }, extra));
      return res.end(memory[p].body);
    }
    let file = path.resolve(path.join(root, p));
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403, extra); return res.end("forbidden"); }
    try {
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      const body = fs.readFileSync(file);
      res.writeHead(200, Object.assign({ "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" }, extra));
      res.end(body);
    } catch (e) { res.writeHead(404, extra); res.end("not found"); }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ port: server.address().port, close: () => server.close() }));
  });
}

const local = { started: false, origin: null, server: null, built: false, memory: {} };
async function ensureLocal() {
  if (local.started) return local;
  const b = spawnSync("sh", [path.join(ROOT, "tools", "build-site.sh")], { cwd: ROOT, encoding: "utf8" });
  if (b.status !== 0) throw new Error("tools/build-site.sh failed: " + String(b.stderr || "").trim().split("\n").pop());
  local.built = true;
  local.rules = loadHeaderRules();
  local.server = await startServer(SITE, local.rules, local.memory);
  local.origin = "http://127.0.0.1:" + local.server.port;
  local.started = true;
  return local;
}
async function originFor(g) {
  if (BASE_URL && g !== "harness" && g !== "sdk") return BASE_URL;
  return (await ensureLocal()).origin;
}

// ---------------------------------------------------------------------------
// CDP plumbing
// ---------------------------------------------------------------------------
let ws;
let nextId = 1;
const pending = new Map();
const persistent = new Map();

function send(method, params, sessionId) {
  const id = nextId++;
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
    const fn = (p) => {
      persistent.set(key, (persistent.get(key) || []).filter((f) => f !== fn));
      resolve(p);
    };
    on(method, sessionId, fn);
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

// ---------------------------------------------------------------------------
// In-page helpers, available inside every evaluated function
// ---------------------------------------------------------------------------
const HELPERS = `
const vis=el=>!!el&&el.checkVisibility({visibilityProperty:true});
const txt=()=>document.body.innerText;
const waitFor=async(f,ms)=>{const e=Date.now()+(ms||5000);while(Date.now()<e){let v;try{v=f();}catch(x){v=null;}if(v)return v;await sleep(40);}return null;};
const byText=(t,sel)=>[...document.querySelectorAll(sel||'button,a,[role=button]')].find(e=>vis(e)&&e.textContent.trim().replace(/\\s+/g,' ')===t)||null;
const setVal=(el,v)=>{el.focus();el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
const clickLater=el=>setTimeout(()=>el.click(),0);
const submitLater=f=>setTimeout(()=>f.requestSubmit(),0);
`;

// Runs before every document: records CSP violations.
const BASE_INIT = `
window.__csp=[];
document.addEventListener('securitypolicyviolation',function(e){window.__csp.push(e.violatedDirective+' '+e.blockedURI);});
`;

// Fake tokens are built at run time so no token-shaped literal sits in this file.
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
function fakeToken(sub) {
  return b64u({ alg: "HS256", typ: "JWT" }) + "." +
    b64u({ sub, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 }) + ".stubsignature";
}
function fakeUser(email) {
  return { id: "00000000-0000-4000-8000-00000000000a", aud: "authenticated", role: "authenticated", email: email || "alex@example.com",
    app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
}
function sessionBody(email) {
  const u = fakeUser(email);
  return { access_token: fakeToken(u.id), token_type: "bearer", expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "refresh-stub", user: u };
}
const seedScript = () =>
  "try{if(!sessionStorage.getItem('__seeded')){sessionStorage.setItem('__seeded','1');localStorage.setItem(" +
  JSON.stringify(STORAGE_KEY) + "," + JSON.stringify(JSON.stringify(sessionBody())) + ");}}catch(e){}";

// ---------------------------------------------------------------------------
// Stub service
// ---------------------------------------------------------------------------
const SAMPLE_ROW = {
  user_id: "00000000-0000-4000-8000-00000000000a", first_name: "Alex", plan_name: "Sample Starter Plan",
  plan_items: ["Sample: monthly social posts", "Sample: Google profile tune-up", "Sample: one small local ad"],
  check_in: "Sample: every second Friday",
  steps: [
    { title: "Sample step: pick your favourite shop photos", detail: "Choose five photos you like.", due: "Sample date: this week" },
    { title: "Sample step: approve the first week of posts", detail: "Read them over and say yes.", due: "Sample date: next week" },
    { title: "Sample step: chat about next month\u2019s offer", detail: "A short call.", due: "Sample date: later" },
  ],
  is_sample: true, updated_at: "2026-01-01T00:00:00Z",
};

const ERRBODY = {
  400: { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" },
  403: { code: 403, error_code: "otp_expired", msg: "Email link is invalid or has expired" },
  422: { code: 422, error_code: "weak_password", msg: "SERVICE-RAW-TEXT weak password", weak_password: { reasons: ["length"] } },
  429: { code: 429, error_code: "over_request_rate_limit", msg: "Request rate limit reached" },
};
const errBody = (status) => ERRBODY[status] || { code: status, msg: "service error" };

// cfg: { status, fail, delay }. A `fail` is a dropped connection.
function mkStub(over) {
  const st = Object.assign({
    token: { status: 200 }, recover: { status: 200 }, verify: { status: 200 }, update: { status: 200 },
    user: { status: 200 }, logout: { status: 204 }, rowMode: "row", rowDelay: 0, rowData: SAMPLE_ROW, rowCount: 0,
  }, over || {});
  st.handler = (req) => {
    const p = req.path;
    const reply = (cfg, okBody) => {
      if (cfg.fail) return { fail: true };
      const r = cfg.status >= 200 && cfg.status < 300
        ? { status: cfg.status, body: cfg.status === 204 ? null : okBody }
        : { status: cfg.status, body: errBody(cfg.status) };
      if (cfg.delay) r.delay = cfg.delay;
      return r;
    };
    if (p === "/auth/v1/token") {
      if (/grant_type=refresh_token/.test(req.query)) return { status: 200, body: sessionBody() };
      return reply(st.token, sessionBody(req.json && req.json.email));
    }
    if (p === "/auth/v1/recover") return reply(st.recover, {});
    if (p === "/auth/v1/verify") return reply(st.verify, sessionBody());
    if (p === "/auth/v1/user") return req.method === "PUT" ? reply(st.update, fakeUser()) : reply(st.user, fakeUser());
    if (p === "/auth/v1/logout") return reply(st.logout, {});
    if (p === "/rest/v1/client_dashboards") {
      st.rowCount++;
      const wantObj = /vnd\.pgrst\.object/.test(req.headers.accept || req.headers.Accept || "");
      const d = st.rowDelay ? { delay: st.rowDelay } : {};
      if (st.rowMode === "500") return Object.assign({ status: 500, body: { message: "boom" } }, d);
      if (st.rowMode === "401") return Object.assign({ status: 401, body: { code: "PGRST301", message: "JWT expired" } }, d);
      if (st.rowMode === "null") {
        return wantObj ? Object.assign({ status: 406, body: { code: "PGRST116", message: "The result contains 0 rows", details: "", hint: null } }, d)
          : Object.assign({ status: 200, body: [] }, d);
      }
      return Object.assign({ status: 200, body: wantObj ? st.rowData : [st.rowData] }, d);
    }
    return { status: 404, body: { message: "not stubbed" } };
  };
  return st;
}
const stubCount = (st, pathPart, method) =>
  st.reqs.filter((r) => r.path.includes(pathPart) && (!method || r.method === method)).length;

// ---------------------------------------------------------------------------
// Page flow
// ---------------------------------------------------------------------------
const CSP_TEXT = /Content Security Policy|Refused to (load|apply|execute|connect|frame|create)/i;

// o: { url, width, height, stub (mkStub result), session (bool), init (string) }
async function withPage(o, fn) {
  // Each page gets its own browser context, so a session stored by one scenario cannot leak into the next.
  const { browserContextId } = await send("Target.createBrowserContext", {});
  const { targetId } = await send("Target.createTarget", { url: "about:blank", browserContextId });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const log = { requests: [], failed: [], bad: [], exceptions: [], errors: [], console: [], violations: [],
    finished: [], ws: [], status: new Map(), docHeaders: {} };
  const st = o.stub || null;
  if (st) st.reqs = st.reqs || [];
  try {
    await send("Page.enable", {}, sessionId);
    await send("Runtime.enable", {}, sessionId);
    await send("Network.enable", {}, sessionId);
    await send("Log.enable", {}, sessionId);
    await send("Network.setCacheDisabled", { cacheDisabled: true }, sessionId);
    await send("Emulation.setFocusEmulationEnabled", { enabled: true }, sessionId);
    const idUrl = new Map();
    on("Network.requestWillBeSent", sessionId, (p) => {
      idUrl.set(p.requestId, p.request.url);
      log.requests.push({ url: p.request.url, method: p.request.method });
    });
    on("Network.responseReceived", sessionId, (p) => {
      log.status.set(p.response.url, p.response.status);
      if (p.type === "Document") {
        const h = {};
        for (const k of Object.keys(p.response.headers || {})) h[k.toLowerCase()] = p.response.headers[k];
        log.docHeaders[p.response.url] = h;
      }
      if (p.response.status >= 400 && !/supabase\.co|\/favicon\.ico$/.test(p.response.url)) log.bad.push(p.response.status + " " + p.response.url);
    });
    on("Network.loadingFinished", sessionId, (p) => log.finished.push({ url: idUrl.get(p.requestId), bytes: p.encodedDataLength }));
    on("Network.loadingFailed", sessionId, (p) => log.failed.push((idUrl.get(p.requestId) || p.requestId) + " (" + p.errorText + ")"));
    on("Network.webSocketCreated", sessionId, (p) => log.ws.push(p.url));
    on("Runtime.exceptionThrown", sessionId, (p) =>
      log.exceptions.push((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text));
    on("Runtime.consoleAPICalled", sessionId, (p) => {
      const line = p.args.map((a) => (a.value !== undefined ? String(a.value) : a.description || "")).join(" ");
      log.console.push(line);
      if (p.type === "error") log.errors.push(line);
    });
    on("Log.entryAdded", sessionId, (p) => {
      const e = p.entry;
      if (e.source === "security" || CSP_TEXT.test(e.text || "")) log.violations.push((e.text || "").slice(0, 160));
    });
    if (st) {
      await send("Fetch.enable", { patterns: [{ urlPattern: "*://*.supabase.co/*" }] }, sessionId);
      on("Fetch.requestPaused", sessionId, (p) => { handlePaused(p, st, sessionId).catch(() => { /* page may be gone */ }); });
    }
    await send("Emulation.setDeviceMetricsOverride",
      { width: o.width || 1280, height: o.height || 800, deviceScaleFactor: 1, mobile: (o.width || 1280) < 640 }, sessionId);
    const init = BASE_INIT + (o.session ? seedScript() : "") + (o.init || "");
    await send("Page.addScriptToEvaluateOnNewDocument", { source: init }, sessionId);

    const ev = async (expression) => {
      const res = await send("Runtime.evaluate", {
        expression: "(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));" + HELPERS +
          "return await (" + expression + ")();})()",
        awaitPromise: true, returnByValue: true,
      }, sessionId);
      if (res.exceptionDetails) {
        throw new Error("page exception: " + ((res.exceptionDetails.exception && res.exceptionDetails.exception.description) || res.exceptionDetails.text));
      }
      return res.result.value;
    };
    const pg = {
      sid: sessionId, ev, log, stub: st,
      async goto(u) {
        const loaded = once("Page.loadEventFired", sessionId);
        const nav = await send("Page.navigate", { url: u }, sessionId);
        if (nav.errorText) throw new Error("navigation failed: " + nav.errorText);
        await Promise.race([loaded, sleep(20000).then(() => { throw new Error("page did not finish loading in 20s"); })]);
      },
      async resize(w, h) {
        await send("Emulation.setDeviceMetricsOverride", { width: w, height: h || o.height || 800, deviceScaleFactor: 1, mobile: w < 640 }, sessionId);
        await sleep(900);
      },
      async url() { try { return await ev("()=>location.href"); } catch (e) { return ""; } },
      async waitUrl(re, ms) {
        const end = Date.now() + (ms || 8000);
        while (Date.now() < end) { const u = await pg.url(); if (re.test(u)) return u; await sleep(100); }
        return null;
      },
      async hasText(s, ms) {
        const end = Date.now() + (ms || 5000);
        while (Date.now() < end) {
          try { if (await ev("()=>document.body.innerText.includes(" + JSON.stringify(s) + ")")) return true; } catch (e) { /* navigating */ }
          await sleep(80);
        }
        return false;
      },
      async needText(s, ms) { must(await pg.hasText(s, ms), "expected visible text: " + s); },
      async lacksText(s) { must(!(await ev("()=>document.body.innerText.includes(" + JSON.stringify(s) + ")")), "unexpected visible text: " + s); },
      async typeInto(selector, text) {
        const ok = await ev("()=>{const e=document.querySelector(" + JSON.stringify(selector) + ");if(!e)return false;e.focus();if(e.select)e.select();return true;}");
        must(ok, "no element " + selector);
        await send("Input.insertText", { text }, sessionId);
      },
      async clickText(t, sel) {
        const ok = await ev("()=>{const e=byText(" + JSON.stringify(t) + "," + (sel ? JSON.stringify(sel) : "null") + ");if(!e)return false;clickLater(e);return true;}");
        must(ok, "no visible control with text: " + t);
      },
      async clean(tag, opts) {
        const o2 = opts || {};
        const bad = [];
        if (log.exceptions.length) bad.push("exceptions: " + log.exceptions.join(" | "));
        if (log.errors.length) bad.push("console errors: " + log.errors.join(" | "));
        let csp = [];
        try { csp = await ev("()=>window.__csp||[]"); } catch (e) { /* navigated */ }
        const all = csp.concat(log.violations);
        if (all.length) bad.push("CSP violations: " + all.join(" | "));
        const failed = log.failed.filter((f) => !(o2.file && /\.woff2 \(/.test(f)) && !(o2.allowFailed && o2.allowFailed.test(f)));
        if (failed.length) bad.push("failed requests: " + failed.join(", "));
        if (log.bad.length && !o2.allowBad) bad.push("bad responses: " + log.bad.join(", "));
        if (bad.length) throw new Error(tag + ": " + bad.join("; "));
      },
    };
    if (o.url) {
      await pg.goto(o.url);
      const code = log.status.get(o.url);
      if (code && code >= 400 && /^https?:/.test(o.url)) throw new Error(o.url.replace(/^https?:\/\/[^/]+/, "") + " answered " + code);
    }
    return await fn(pg);
  } finally {
    try { await send("Target.closeTarget", { targetId }); } catch (e) { /* ignore */ }
    try { await send("Target.disposeBrowserContext", { browserContextId }); } catch (e) { /* ignore */ }
  }
}

async function handlePaused(p, st, sid) {
  const u = new URL(p.request.url);
  const h = p.request.headers || {};
  const origin = h.Origin || h.origin || "*";
  const cors = [
    { name: "Access-Control-Allow-Origin", value: origin },
    { name: "Access-Control-Allow-Headers", value: h["Access-Control-Request-Headers"] ||
      "authorization, apikey, content-type, x-client-info, x-supabase-api-version, prefer, accept-profile, content-profile, range, accept" },
    { name: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
    { name: "Access-Control-Expose-Headers", value: "*" },
    { name: "Vary", value: "Origin" },
  ];
  if (p.request.method === "OPTIONS") {
    await send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 204, responseHeaders: cors }, sid);
    return;
  }
  let json = null;
  if (p.request.postData) { try { json = JSON.parse(p.request.postData); } catch (e) { json = null; } }
  const req = { path: u.pathname, query: u.search, method: p.request.method, hasBody: !!(p.request.postData || p.request.hasPostData),
    json, headers: h, url: p.request.url };
  st.reqs.push(req);
  const res = st.handler(req) || { status: 404, body: {} };
  if (res.fail) { await send("Fetch.failRequest", { requestId: p.requestId, errorReason: "Failed" }, sid); return; }
  if (res.delay) await sleep(res.delay);
  const body = res.body === null || res.body === undefined ? "" : JSON.stringify(res.body);
  await send("Fetch.fulfillRequest", {
    requestId: p.requestId, responseCode: res.status,
    responseHeaders: cors.concat([{ name: "Content-Type", value: "application/json" }]),
    body: Buffer.from(body).toString("base64"),
  }, sid);
}

const openHttp = (origin, rel, o, fn) => withPage(Object.assign({ url: origin + "/" + rel }, o), fn);

// ---------------------------------------------------------------------------
// Shared checks
// ---------------------------------------------------------------------------
const FULL_SCROLL = `async()=>{const H=document.documentElement.scrollHeight;
  for(let y=0;y<=H;y+=300){scrollTo(0,y);await sleep(50);}
  scrollTo(0,H);await sleep(300);
  for(let y=H;y>=0;y-=300){scrollTo(0,y);await sleep(50);}
  scrollTo(0,0);await sleep(300);return H;}`;

async function scrollAndResize(pg, width, alt) {
  await pg.ev(FULL_SCROLL);
  await pg.resize(alt);
  await pg.ev(FULL_SCROLL);
  await pg.resize(width);
  await sleep(500);
}

async function checkResponseHeaders(pg, pageUrl, tag) {
  const rules = loadHeaderRules();
  must(rules.length > 0, "vercel.json has no headers array");
  const want = headersFor(rules, "/x");
  const got = pg.log.docHeaders[pageUrl];
  must(got, tag + ": no document response recorded for " + pageUrl);
  for (const k of Object.keys(want)) {
    must(got[k.toLowerCase()] === want[k], tag + ": response header " + k + " does not match vercel.json");
  }
}

const HERO_WATCH = `async()=>{
  const w=document.querySelector('.hero-word[data-words]');
  const t=document.querySelector('.hero-word__text');
  if(!w||!t)return{missing:true};
  const els=[t,...w.querySelectorAll('.hero-word__alt')];
  const leaves=el=>[...el.querySelectorAll('*')].filter(e=>!e.children.length);
  const shown=el=>{if(parseFloat(getComputedStyle(el).opacity)<0.5)return false;
    return leaves(el).some(c=>{if(parseFloat(getComputedStyle(c).opacity)<0.5)return false;
      const m=c.parentElement.getBoundingClientRect(),r=c.getBoundingClientRect();return r.bottom>m.top+1&&r.top<m.bottom-1;});};
  const cur=()=>els.filter(shown).map(e=>e.textContent.replace(/\\s+/g,'')).join('|');
  const seen=new Set([cur()]);let state=w.getAttribute('data-state');
  const end=Date.now()+8000;
  while(Date.now()<end){seen.add(cur());state=state||w.getAttribute('data-state');await sleep(60);}
  return{words:[...seen],state,mp:window.__mp===true};}`;

const MP_INIT = `window.__mp=false;try{new MutationObserver(function(){var h=document.documentElement;if(h&&h.classList.contains('motion-pending'))window.__mp=true;}).observe(document,{subtree:true,attributes:true,attributeFilter:['class']});}catch(e){}
document.addEventListener('DOMContentLoaded',function(){if(document.documentElement.classList.contains('motion-pending'))window.__mp=true;});`;

const FONTS_AND_IMAGES = `async()=>{
  await document.fonts.ready;
  const f=[...document.fonts].map(x=>({fam:x.family.replace(/["']/g,''),w:String(x.weight),s:x.status}));
  const ok=(fam,w)=>f.some(x=>x.fam===fam&&(w===null||x.w===w)&&x.s==='loaded');
  const imgs=[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src'));
  return{fraunces:ok('Fraunces',null),f400:ok('Figtree','400'),f600:ok('Figtree','600'),imgs,n:document.images.length};}`;

async function checkHomeLive(pg, tag, recordMp) {
  const r = await pg.ev(HERO_WATCH);
  must(!r.missing, tag + ": hero word missing");
  must(r.words.length > 1, tag + ": hero word text never changed in 8s (" + r.words.join(",") + ")");
  must(r.state, tag + ": hero word has no data-state");
  if (recordMp) must(r.mp, tag + ": motion-pending was never applied by the inline script");
  await pg.ev(FULL_SCROLL); // below-the-fold images are lazy
  await sleep(800);
  const f = await pg.ev(FONTS_AND_IMAGES);
  must(f.fraunces, tag + ": Fraunces not loaded");
  must(f.f400 && f.f600, tag + ": Figtree 400 or 600 not loaded");
  must(f.n > 0 && f.imgs.length === 0, tag + ": images not loaded: " + f.imgs.join(", "));
}

async function submitContactOk(pg, tag) {
  const r = await pg.ev(`async()=>{
    const q=s=>document.querySelector(s);
    const set=(id,v)=>{q('#'+id).value=v;};
    set('name','Jo Baker');set('phone','(555) 555-0100');set('email','jo@example.com');
    const m=q('#message');if(m)m.value='Hello there, this is a test message.';
    q('#contact-form').requestSubmit();await sleep(600);
    return{ok:!q('#contact-success').hidden};}`);
  must(r.ok, tag + ": valid submit did not show the success view");
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------
const results = {};

results.harness = async () => {
  const L = await ensureLocal();
  L.memory["/__t/h.html"] = { type: "text/html; charset=utf-8", body: '<!doctype html><html><head><title>h</title></head><body><script src="/__t/h.js"></script></body></html>' };
  L.memory["/__t/h.js"] = { type: "text/javascript", body:
    "(async function(){var r={};try{var a=await fetch('" + fixedUrl + "/auth/v1/user',{headers:{apikey:'k',authorization:'Bearer t'}});r.s1=a.status;var j=await a.json();r.id=j.id;}catch(e){r.e1=String(e);}" +
    "try{var b=await fetch('" + fixedUrl + "/auth/v1/recover',{method:'POST',headers:{'content-type':'application/json',apikey:'k'},body:JSON.stringify({email:'x@example.com'})});r.s2=b.status;}catch(e){r.e2=String(e);}" +
    "try{await fetch('" + fixedUrl + "/auth/v1/logout',{method:'POST',headers:{apikey:'k'}});r.dropped=false;}catch(e){r.dropped=true;}" +
    "window.__r=r;})();" };
  const st = mkStub({ recover: { status: 429 }, logout: { fail: true } });
  return await withPage({ url: L.origin + "/__t/h.html", stub: st }, async (pg) => {
    await sleep(800);
    const r = await pg.ev("()=>window.__r||null");
    must(r, "probe script produced no result");
    must(r.s1 === 200 && r.id, "stubbed GET did not return 200 with a body: " + JSON.stringify(r));
    must(r.s2 === 429, "stubbed 429 not delivered: " + JSON.stringify(r));
    must(r.dropped === true, "failed stub did not drop the connection");
    must(stubCount(st, "/auth/v1/recover", "POST") === 1, "recover POST not recorded once");
    const rec = st.reqs.find((x) => x.path === "/auth/v1/recover");
    must(rec && rec.hasBody && rec.json && rec.json.email === "x@example.com", "request body not recorded");
    const user = st.reqs.find((x) => x.path === "/auth/v1/user");
    must(user && /Bearer t/.test(user.headers.authorization || user.headers.Authorization || ""), "request headers not recorded");
    await pg.clean("harness", { allowFailed: /supabase/ });
    const rules = loadHeaderRules();
    if (rules.length) await checkResponseHeaders(pg, L.origin + "/__t/h.html", "harness");
    return "request stubbing, bodies, status codes and dropped connections work" + (rules.length ? "; vercel.json headers served" : "; vercel.json has no headers yet");
  });
};

results.sdk = async () => {
  const L = await ensureLocal();
  L.memory["/__t/sdk.html"] = { type: "text/html; charset=utf-8", body:
    '<!doctype html><html><head><title>sdk</title></head><body><script src="/assets/js/vendor/supabase.min.js"></script><script src="/__t/sdk-probe.js"></script></body></html>' };
  L.memory["/__t/sdk-probe.js"] = { type: "text/javascript", body:
    "(function(){var r={t:typeof (window.supabase&&window.supabase.createClient)};try{var c=window.supabase.createClient('" + fixedUrl +
    "','sb_publishable_probe',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});r.client=!!(c&&c.auth);}catch(e){r.err=String(e);}window.__r=r;})();" };
  return await withPage({ url: L.origin + "/__t/sdk.html" }, async (pg) => {
    await sleep(1500);
    const r = await pg.ev("()=>window.__r||null");
    must(r, "probe script did not run (is assets/js/vendor/supabase.min.js present?)");
    must(r.t === "function", "supabase.createClient is " + r.t + (r.err ? " (" + r.err + ")" : ""));
    must(r.client === true, "createClient did not return a client" + (r.err ? " (" + r.err + ")" : ""));
    const net = pg.log.requests.filter((q) => /supabase\.co/.test(q.url));
    must(net.length === 0, "creating a client opened " + net.length + " network request(s)");
    must(pg.log.ws.length === 0, "creating a client opened a WebSocket: " + pg.log.ws.join(", "));
    await pg.clean("sdk");
    return "supabase.createClient exists as a global; creating a client opens no request or WebSocket; no CSP violation";
  });
};

const PUBLIC_BAD = /supabase|auth-|login\.js|dashboard\.js|set-password/i;
results.public = async () => {
  const origin = await originFor("public");
  const notes = [];
  for (const [w, h] of [[1280, 800], [375, 812]]) {
    for (const rel of ["index.html", "contact.html"]) {
      const tag = rel + "@" + w;
      await openHttp(origin, rel, { width: w, height: h, stub: mkStub() }, async (pg) => {
        await sleep(3000);
        const urls = pg.log.requests.map((q) => q.url).filter((u) => !/^(data|about):/.test(u));
        const bad = urls.filter((u) => PUBLIC_BAD.test(u));
        must(bad.length === 0, tag + " requested auth code: " + bad.join(", "));
        const foreign = urls.filter((u) => u.indexOf(origin) !== 0);
        must(foreign.length === 0, tag + " off-origin requests: " + foreign.join(", "));
        let total = 0;
        for (const f of pg.log.finished) if (f.url && !/^(data|about):/.test(f.url)) total += f.bytes;
        must(total <= 500 * 1024, tag + " transferred " + total + " bytes, over 500KB");
        const store = await pg.ev("()=>({l:localStorage.length,s:sessionStorage.length})");
        must(store.l === 0, tag + " touched localStorage (" + store.l + " keys)");
        await pg.clean(tag);
        notes.push(tag + " " + Math.round(total / 1024) + "KB");
        const link = await pg.ev("()=>{const a=document.querySelector('header a[href=\"login.html\"]');if(!a||!vis(a))return false;clickLater(a);return true;}");
        must(link, tag + ": no visible Client login link in the header");
        const to = await pg.waitUrl(/\/login\.html$/, 8000);
        must(to, tag + ": Client login did not reach login.html");
        must(pg.log.status.get(origin + "/login.html") === 200, tag + ": login.html did not answer 200");
      });
    }
  }
  return "Home and Contact request no auth code, stay same-origin and under 500KB, leave storage empty, and link to login.html (" + notes.join(", ") + ")";
};

async function fileCard(rel, extra) {
  const pageFile = path.join(ROOT, rel);
  must(fs.existsSync(pageFile), rel + " is missing");
  return await withPage({ url: fileUrl(rel), width: 1280, height: 800 }, async (pg) => {
    await sleep(900);
    await pg.needText("Sign-in only works on the live site", 3000);
    const v = await pg.ev(`()=>{
      const link=[...document.querySelectorAll('main a[href^="http"]')].filter(vis).map(a=>a.href);
      const forms=[...document.querySelectorAll('form')].filter(vis).length;
      const dash=[...document.querySelectorAll('.dash')].filter(vis).length;
      return{link,forms,dash};}`);
    must(v.link.length > 0, rel + ": the card has no visible link to the hosted site");
    must(v.forms === 0, rel + ": a form is visible over file://");
    must(v.dash === 0, rel + ": the dashboard region is visible over file://");
    const net = pg.log.requests.filter((q) => /supabase\.co/.test(q.url));
    must(net.length === 0, rel + ": a request reached supabase.co over file://");
    await pg.clean(rel + " (file)", { file: true });
    if (extra) await extra(pg);
    return v.link[0];
  });
}

results["file-login"] = async () => {
  await fileCard("login.html");
  for (const rel of ["index.html", "contact.html"]) {
    await withPage({ url: fileUrl(rel) }, async (pg) => {
      await sleep(600);
      await pg.clean(rel + " (file)", { file: true });
      const ok = await pg.ev("()=>{const a=document.querySelector('header a[href=\"login.html\"]');if(!a)return false;clickLater(a);return true;}");
      must(ok, rel + ": no Client login link over file://");
      must(await pg.waitUrl(/login\.html$/, 6000), rel + ": Client login did not open login.html over file://");
    });
  }
  return "login.html shows the live-site card, hides the form, makes no request; Home and Contact still work and link to it";
};
results["file-dashboard"] = async () => {
  await fileCard("dashboard.html");
  return "dashboard.html shows the live-site card, no dashboard region, no request";
};
results["file-setpass"] = async () => {
  await fileCard("set-password.html");
  return "set-password.html shows the live-site card, no form, no request";
};

// ----- stub-login
const LOGIN_FORM = "#login-form";
const fillLogin = (email, pw) => `()=>{const f=document.querySelector('#login-form');
  setVal(f.querySelector('input[type=email]'),${JSON.stringify(email)});
  setVal(f.querySelector('input[type=password]'),${JSON.stringify(pw)});return true;}`;
const submitLogin = "()=>{submitLater(document.querySelector('#login-form'));return true;}";

async function loginReady(pg) {
  const shown = await pg.ev("async()=>!!(await waitFor(()=>vis(document.querySelector('#login-form')),6000))");
  must(shown, "the sign-in form never became visible");
}

results["stub-login"] = async () => {
  const origin = await originFor("stub-login");
  const done = [];
  const EARLY = `window.__early=false;setInterval(function(){var b=document.querySelector('#login-form button[type=submit]');
    if(b&&!b.disabled&&!(window.AuthApp&&window.AuthApp.sb))window.__early=true;},5);
    setInterval(function(){var f=document.querySelector('#login-form');if(f&&f.checkVisibility&&f.checkVisibility()){try{sessionStorage.setItem('__formShown','1');}catch(e){}}},5);`;

  // readiness, validation, no request
  {
    const st = mkStub();
    await openHttp(origin, "login.html", { stub: st, init: EARLY }, async (pg) => {
      await loginReady(pg);
      must(await pg.ev("()=>window.__early===false"), "submit was enabled before the sign-in client was ready");
      must(await pg.ev("()=>!document.querySelector('#login-form button[type=submit]').disabled"), "submit still disabled once ready");
      await pg.ev(submitLogin);
      await pg.needText("Please add your email address.");
      await pg.needText("Please enter your password.");
      const v = await pg.ev(`()=>{const f=document.querySelector('#login-form');const e=f.querySelector('input[type=email]');
        return{inv:e.getAttribute('aria-invalid'),focus:document.activeElement===e,pinv:f.querySelector('input[type=password]').getAttribute('aria-invalid')};}`);
      must(v.inv === "true" && v.pinv === "true" && v.focus, "empty submit: aria-invalid or focus wrong " + JSON.stringify(v));
      await pg.ev(fillLogin("not-an-email", ""));
      await pg.ev(submitLogin);
      await pg.needText("That email doesn\u2019t look quite right. Check for a typo and try again.");
      await pg.ev(fillLogin("alex@example.com", ""));
      await pg.ev(submitLogin);
      await pg.needText("Please enter your password.");
      must(await pg.ev("()=>document.activeElement===document.querySelector('#login-form input[type=password]')"), "focus did not move to the password field");
      must(stubCount(st, "/auth/v1/token") === 0, "a request was sent with invalid input");
      await pg.clean("validation");
      done.push("validation");
    });
  }
  // success lands on the dashboard via replace
  {
    const st = mkStub();
    await openHttp(origin, "login.html", { stub: st }, async (pg) => {
      await loginReady(pg);
      const before = await pg.ev("()=>history.length");
      await pg.ev(fillLogin("alex@example.com", "correct-horse-1"));
      await pg.ev(submitLogin);
      must(await pg.waitUrl(/\/dashboard\.html$/, 8000), "valid sign-in did not land on dashboard.html");
      const tok = st.reqs.filter((r) => r.path === "/auth/v1/token" && /grant_type=password/.test(r.query));
      must(tok.length === 1, "expected one password sign-in request, saw " + tok.length);
      must(tok[0].json && tok[0].json.email === "alex@example.com" && tok[0].json.password === "correct-horse-1", "sign-in body wrong");
      must((await pg.ev("()=>history.length")) === before, "dashboard was reached by push, not replace");
      await pg.needText("Hello, Alex", 6000);
      done.push("success");
    });
  }
  // double submit sends one request
  {
    const st = mkStub({ token: { status: 200, delay: 700 } });
    await openHttp(origin, "login.html", { stub: st }, async (pg) => {
      await loginReady(pg);
      await pg.ev(fillLogin("alex@example.com", "correct-horse-1"));
      await pg.ev("()=>{const f=document.querySelector('#login-form');setTimeout(()=>f.requestSubmit(),0);setTimeout(()=>f.requestSubmit(),20);setTimeout(()=>f.requestSubmit(),40);return true;}");
      await sleep(1500);
      must(stubCount(st, "/auth/v1/token") === 1, "double submit sent " + stubCount(st, "/auth/v1/token") + " requests");
      done.push("double submit");
    });
  }
  // 400, 429, network failure
  {
    const st = mkStub({ token: { status: 400 } });
    await openHttp(origin, "login.html", { stub: st }, async (pg) => {
      await loginReady(pg);
      await pg.ev(fillLogin("alex@example.com", "wrong-password-1"));
      await pg.ev(submitLogin);
      await pg.needText("That didn\u2019t work");
      await pg.needText("That email and password don\u2019t match.");
      const v = await pg.ev(`()=>{const f=document.querySelector('#login-form');const e=f.querySelector('input[type=email]');
        return{pw:f.querySelector('input[type=password]').value,em:e.value,focus:document.activeElement===e};}`);
      must(v.pw === "", "the password was not cleared after a wrong sign-in");
      must(v.em === "alex@example.com", "the email was not kept");
      must(v.focus, "focus did not move to the email field");
      await pg.clean("wrong credentials", { allowFailed: /supabase/ });
      done.push("400");
    });
  }
  {
    const st = mkStub({ token: { status: 429 } });
    await openHttp(origin, "login.html", { stub: st }, async (pg) => {
      await loginReady(pg);
      await pg.ev(fillLogin("alex@example.com", "some-password-1"));
      await pg.ev(submitLogin);
      await pg.needText("Let\u2019s slow down a moment");
      await pg.lacksText("That didn\u2019t work");
      done.push("429");
    });
  }
  {
    const st = mkStub({ token: { fail: true } });
    await openHttp(origin, "login.html", { stub: st }, async (pg) => {
      await loginReady(pg);
      await pg.ev(fillLogin("alex@example.com", "some-password-1"));
      await pg.ev(submitLogin);
      await pg.needText("I couldn\u2019t reach the sign-in service");
      await pg.lacksText("That didn\u2019t work");
      const v = await pg.ev(`()=>{const f=document.querySelector('#login-form');return{em:f.querySelector('input[type=email]').value,pw:f.querySelector('input[type=password]').value};}`);
      must(v.em === "alex@example.com" && v.pw === "some-password-1", "form data was not kept after a service failure");
      st.token = { status: 200 };
      await pg.clickText("Try again");
      must(await pg.waitUrl(/dashboard\.html$/, 8000), "Try again did not repeat the sign-in");
      must(stubCount(st, "/auth/v1/token") >= 2, "Try again sent no second request");
      done.push("network failure");
    });
  }
  // storage blocked
  {
    const st = mkStub();
    const BLOCK = "Storage.prototype.setItem=function(){throw new DOMException('blocked','SecurityError');};";
    await openHttp(origin, "login.html", { stub: st, init: BLOCK }, async (pg) => {
      await loginReady(pg);
      await pg.ev(fillLogin("alex@example.com", "some-password-1"));
      await pg.ev(submitLogin);
      await pg.needText("Your browser is blocking what I need to keep you signed in");
      done.push("storage blocked");
    });
  }
  // existing session redirects before the form is ever shown
  {
    const st = mkStub();
    await openHttp(origin, "login.html", { stub: st, session: true, init: EARLY }, async (pg) => {
      must(await pg.waitUrl(/dashboard\.html$/, 8000), "an existing session did not redirect to the dashboard");
      must(await pg.ev("()=>sessionStorage.getItem('__formShown')===null"), "the sign-in form was shown before the redirect");
      done.push("existing session");
    });
  }
  // flash message appears once
  {
    const st = mkStub();
    await openHttp(origin, "login.html", { stub: st }, async (pg) => {
      await loginReady(pg);
      const ok = await pg.ev("()=>{if(!window.AuthApp||!window.AuthApp.flash)return false;window.AuthApp.flash.set('You\\u2019ve been signed out. See you soon.');return true;}");
      must(ok, "window.AuthApp.flash is missing");
      await pg.goto(origin + "/login.html");
      await pg.needText("You\u2019ve been signed out. See you soon.");
      await pg.goto(origin + "/login.html");
      await sleep(600);
      await pg.lacksText("You\u2019ve been signed out. See you soon.");
      done.push("flash once");
    });
  }
  return done.join(", ");
};

// ----- stub-dashboard
async function dashReady(pg, hello) {
  await pg.needText(hello || "Hello, Alex", 8000);
}

results["stub-dashboard"] = async () => {
  const origin = await originFor("stub-dashboard");
  const done = [];
  // loading state shows only "One moment" while the row is in flight
  {
    const st = mkStub({ rowDelay: 1800 });
    await openHttp(origin, "dashboard.html", { stub: st, session: true }, async (pg) => {
      const end = Date.now() + 4000;
      while (Date.now() < end && st.rowCount === 0) await sleep(25);
      must(st.rowCount > 0, "no row request was made with a session present");
      const v = await pg.ev(`()=>({t:document.body.innerText,dash:[...document.querySelectorAll('.dash')].filter(vis).length})`);
      must(/One moment/.test(v.t), "the checking state was not visible while waiting");
      must(!/Hello,|Sample|Your plan|Next steps/.test(v.t), "protected content was visible before the row arrived");
      must(v.dash === 0, "the protected region was visible before the row arrived");
      await dashReady(pg);
      await pg.clean("loading");
      done.push("no flash");
    });
  }
  // no session: redirect, no row request, message on login
  {
    const st = mkStub();
    await openHttp(origin, "dashboard.html", { stub: st }, async (pg) => {
      must(await pg.waitUrl(/\/login\.html$/, 8000), "no session did not redirect to login.html");
      await pg.needText("Please sign in to see your dashboard.");
      must(st.rowCount === 0, "a row request was made without a session");
      done.push("signed out redirect");
    });
  }
  // content renders, sample tag follows is_sample
  {
    const st = mkStub();
    await openHttp(origin, "dashboard.html", { stub: st, session: true }, async (pg) => {
      await dashReady(pg);
      for (const s of ["Your plan", "Next steps", "Sample Starter Plan", "Sample: monthly social posts", "Sample: Google profile tune-up",
        "Sample: one small local ad", "Sample: every second Friday", "Sample step: pick your favourite shop photos",
        "Choose five photos you like.", "Sample date: this week", "Sample content for this prototype"]) await pg.needText(s, 2000);
      await pg.clean("ready");
      done.push("row renders");
    });
    const st2 = mkStub({ rowData: Object.assign({}, SAMPLE_ROW, { is_sample: false }) });
    await openHttp(origin, "dashboard.html", { stub: st2, session: true }, async (pg) => {
      await dashReady(pg);
      await pg.lacksText("Sample content for this prototype");
      done.push("tag follows is_sample");
    });
  }
  // markup in the row stays text
  {
    const evil = Object.assign({}, SAMPLE_ROW, {
      first_name: '<img src=x onerror="window.__xss=1">',
      plan_name: '<img src=x onerror="window.__xss=2">Plan',
      plan_items: ['<b onmouseover="window.__xss=3">bold</b>'],
      steps: [{ title: "<script>window.__xss=4</script>", detail: "<svg onload=\"window.__xss=5\">", due: "x" }],
    });
    const st = mkStub({ rowData: evil });
    await openHttp(origin, "dashboard.html", { stub: st, session: true }, async (pg) => {
      await pg.needText("<img src=x", 8000);
      const v = await pg.ev("()=>({xss:window.__xss===undefined,els:document.querySelectorAll('main img, main svg, main b, main script').length})");
      must(v.xss, "row content ran as script");
      must(v.els === 0, "row content created " + v.els + " element(s)");
      await pg.needText("<script>window.__xss=4</script>", 2000);
      done.push("row text stays text");
    });
  }
  // null row
  {
    const st = mkStub({ rowMode: "null" });
    await openHttp(origin, "dashboard.html", { stub: st, session: true }, async (pg) => {
      await pg.needText("Your dashboard isn\u2019t ready yet", 8000);
      await pg.needText("Hello there");
      await pg.lacksText("Sample content for this prototype");
      await pg.lacksText("Your plan");
      must(await pg.ev("()=>!!byText('Sign out')"), "Sign out is missing from the empty state");
      done.push("null row");
    });
  }
  // 500 then retry
  {
    const st = mkStub({ rowMode: "500" });
    await openHttp(origin, "dashboard.html", { stub: st, session: true }, async (pg) => {
      await pg.needText("I couldn\u2019t reach the sign-in service", 8000);
      must(await pg.ev("()=>!!byText('Sign out')"), "Sign out is missing from the failure state");
      const first = st.rowCount;
      st.rowMode = "row";
      await pg.clickText("Try again");
      await dashReady(pg);
      must(st.rowCount > first, "Try again did not re-run the row read");
      done.push("500 and retry");
    });
  }
  // 401 redirects
  {
    const st = mkStub({ rowMode: "401" });
    await openHttp(origin, "dashboard.html", { stub: st, session: true }, async (pg) => {
      must(await pg.waitUrl(/\/login\.html$/, 8000), "a 401 did not redirect to login.html");
      await pg.needText("Your session has ended. Please sign in again.");
      done.push("401");
    });
  }
  // a check slower than about 8 seconds becomes the failure state
  {
    const st = mkStub({ rowDelay: 14000 });
    await openHttp(origin, "dashboard.html", { stub: st, session: true }, async (pg) => {
      await sleep(7000);
      await pg.lacksText("I couldn\u2019t reach the sign-in service");
      await pg.needText("I couldn\u2019t reach the sign-in service", 4500);
      done.push("8 second limit");
    });
  }
  // sign out, including a failing request
  for (const [label, logout] of [["ok", { status: 204 }], ["request fails", { fail: true }], ["server error", { status: 500 }]]) {
    const st = mkStub({ logout });
    await openHttp(origin, "dashboard.html", { stub: st, session: true }, async (pg) => {
      await dashReady(pg);
      await pg.clickText("Sign out");
      must(await pg.waitUrl(/\/login\.html$/, 8000), "sign out (" + label + ") did not redirect to login.html");
      await pg.needText("You\u2019ve been signed out. See you soon.");
      const keys = await pg.ev("()=>Object.keys(localStorage).filter(k=>/^sb-.*-auth-token/.test(k)).length");
      must(keys === 0, "sign out (" + label + ") left a session in storage");
      if (label === "ok") must(stubCount(st, "/auth/v1/logout", "POST") === 1, "no logout request was sent");
      await pg.goto(origin + "/login.html");
      await sleep(500);
      await pg.lacksText("You\u2019ve been signed out. See you soon.");
      done.push("sign out " + label);
    });
  }
  // Back and bfcache pageshow render nothing protected once the session is gone
  {
    const st = mkStub();
    await openHttp(origin, "dashboard.html", { stub: st, session: true }, async (pg) => {
      await dashReady(pg);
      await pg.ev("()=>{localStorage.clear();window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));return true;}");
      must(await pg.waitUrl(/\/login\.html$/, 8000) || !(await pg.ev("()=>/Sample Starter Plan/.test(document.body.innerText)")),
        "pageshow with no session left protected content visible");
      await pg.lacksText("Sample Starter Plan");
      done.push("pageshow");
    });
    const st2 = mkStub();
    await openHttp(origin, "dashboard.html", { stub: st2, session: true }, async (pg) => {
      await dashReady(pg);
      await pg.ev("()=>{setTimeout(()=>{location.href='contact.html';},0);return true;}");
      must(await pg.waitUrl(/contact\.html$/, 6000), "could not leave the dashboard");
      await pg.ev("()=>{localStorage.clear();setTimeout(()=>history.back(),0);return true;}");
      await sleep(2500);
      const t = await pg.ev("()=>document.body.innerText");
      must(!/Sample Starter Plan|Sample: monthly/.test(t), "Back showed protected content after the session was gone");
      done.push("back button");
    });
  }
  return done.join(", ");
};

// ----- stub-reset
const RESET_COPY = "If that email belongs to a client";
async function openReset(pg) {
  await loginReady(pg);
  await pg.clickText("Forgotten your password?");
  await pg.needText("Let\u2019s get you back in", 4000);
  must(await pg.ev("()=>vis(document.querySelector('#reset-form'))"), "#reset-form is not visible");
}
results["stub-reset"] = async () => {
  const origin = await originFor("stub-reset");
  const done = [];
  const mainText = (pg, emails) => pg.ev("()=>document.querySelector('main').innerText").then((t) => {
    let s = t;
    for (const e of emails) s = s.split(e).join("EMAIL");
    return s.replace(/\d+s/g, "Ns").replace(/\s+/g, " ").trim();
  });
  let known, unknown;
  for (const [email, label] of [["alex@example.com", "known"], ["nobody@example.com", "unknown"]]) {
    const st = mkStub();
    await openHttp(origin, "login.html", { stub: st }, async (pg) => {
      await openReset(pg);
      await pg.ev(`()=>{setVal(document.querySelector('#reset-form input[type=email]'),${JSON.stringify(email)});submitLater(document.querySelector('#reset-form'));return true;}`);
      await pg.needText("Check your inbox", 5000);
      const rec = st.reqs.filter((r) => r.path === "/auth/v1/recover");
      must(rec.length === 1, label + ": expected one recover request, saw " + rec.length);
      must(rec[0].json && rec[0].json.email === email, label + ": recover body wrong");
      must(!/redirect/i.test(rec[0].query) && !/redirect/i.test(JSON.stringify(rec[0].json)), label + ": the request carried a redirect parameter");
      await pg.needText(RESET_COPY);
      const mail = await pg.ev("()=>[...document.querySelectorAll('main a[href^=\"mailto:\"]')].filter(vis).length");
      must(mail > 0, label + ": no visible mailto link as the fallback");
      must(await pg.ev("()=>/if nothing arrives/i.test(document.querySelector('main').innerText)"), label + ": no 'if nothing arrives' fallback wording");
      const t = await mainText(pg, [email]);
      if (label === "known") known = t; else unknown = t;
      if (label === "known") {
        const n0 = await pg.ev("()=>{const m=document.body.innerText.match(/Send it again in (\\d+)s/);return m?Number(m[1]):null;}");
        must(n0 !== null && n0 >= 56 && n0 <= 60, "the resend countdown does not start near 60 (saw " + n0 + ")");
        const dis = await pg.ev("()=>{const b=[...document.querySelectorAll('button')].find(x=>/Send it again/.test(x.textContent));return !!b&&(b.disabled||b.getAttribute('aria-disabled')==='true');}");
        must(dis, "the resend button is not disabled during the countdown");
        await sleep(2600);
        const n1 = await pg.ev("()=>{const m=document.body.innerText.match(/Send it again in (\\d+)s/);return m?Number(m[1]):null;}");
        must(n1 !== null && n1 <= n0 - 2, "the countdown is not counting down (" + n0 + " -> " + n1 + ")");
      }
      await pg.clean("reset " + label);
    });
  }
  must(known === unknown, "reset result differs between a known and an unknown address");
  done.push("one recover request, no redirect param, identical result, fallback, countdown");
  {
    const st = mkStub({ recover: { status: 429 } });
    await openHttp(origin, "login.html", { stub: st }, async (pg) => {
      await openReset(pg);
      await pg.ev(`()=>{setVal(document.querySelector('#reset-form input[type=email]'),'alex@example.com');submitLater(document.querySelector('#reset-form'));return true;}`);
      await pg.needText("a lot of tries", 5000);
      await pg.lacksText("Check your inbox");
      done.push("429");
    });
  }
  {
    const st = mkStub();
    await openHttp(origin, "login.html#reset", { stub: st }, async (pg) => {
      await pg.needText("Let\u2019s get you back in", 6000);
      must(await pg.ev("()=>vis(document.querySelector('#reset-form'))"), "login.html#reset did not open the reset view");
      done.push("#reset entry");
    });
  }
  return done.join("; ");
};

// ----- stub-setpass and stub-change
const TOKEN = "tok_9f3a7c21";
const GOOD_PW = "a-long-enough-pass-1";
const fillPw = (a, b) => `()=>{const f=document.querySelector('#password-form');const i=f.querySelectorAll('input[type=password]');
  setVal(i[0],${JSON.stringify(a)});setVal(i[1],${JSON.stringify(b)});return i.length;}`;
const submitPw = "()=>{submitLater(document.querySelector('#password-form'));return true;}";

results["stub-setpass"] = async () => {
  const origin = await originFor("stub-setpass");
  const done = [];
  const min = CFG.min;
  const noSecretsLeaked = (pg, tag, secrets) => {
    // The first document request is the email link itself, so it carries the token by definition.
    // Every other request (service calls, assets, anything after the page opened) must not.
    const urls = pg.log.requests.filter((q) => !(q.method === "GET" && /\/set-password\.html[?]/.test(q.url))).map((q) => q.url);
    for (const s of secrets) {
      must(!urls.some((u) => u.includes(s)), tag + ": a request URL contained a secret value");
      must(!pg.log.console.some((c) => c.includes(s)), tag + ": console output contained a secret value");
    }
  };
  // strip, no verify on load, verify once on Continue, form, validation, success
  {
    const st = mkStub();
    await openHttp(origin, "set-password.html?token_hash=" + TOKEN + "&type=invite", { stub: st }, async (pg) => {
      const loc = await pg.ev("()=>location.href");
      must(!loc.includes(TOKEN) && !/[?]/.test(loc), "the token was still in the address right after load");
      await sleep(1500);
      must(stubCount(st, "/auth/v1/verify") === 0, "a verify request was sent before Continue was clicked");
      await pg.needText("Welcome, let\u2019s set your password", 4000);
      await pg.clickText("Continue");
      await sleep(900);
      const ver = st.reqs.filter((r) => r.path === "/auth/v1/verify");
      must(ver.length === 1, "expected one verify request after Continue, saw " + ver.length);
      must(ver[0].json && ver[0].json.token_hash === TOKEN && ver[0].json.type === "invite", "verify body wrong");
      must(await pg.ev("()=>vis(document.querySelector('#password-form'))"), "the password form did not appear after verifying");
      await pg.ev(fillPw("short", "short"));
      await pg.ev(submitPw);
      await pg.needText("That\u2019s a bit short. Please use at least " + min + " characters.");
      await pg.ev(fillPw(GOOD_PW, GOOD_PW + "x"));
      await pg.ev(submitPw);
      await pg.needText("Those two don\u2019t match yet. Please type the same password in both boxes.");
      must(stubCount(st, "/auth/v1/user", "PUT") === 0, "an update request was sent with invalid input");
      await pg.ev(fillPw(GOOD_PW, GOOD_PW));
      await pg.ev(submitPw);
      await pg.needText("All set", 5000);
      await pg.needText("Your password is saved and you\u2019re signed in.");
      must(await pg.ev("()=>!!byText('Go to my dashboard')"), "no Go to my dashboard link");
      const put = st.reqs.filter((r) => r.path === "/auth/v1/user" && r.method === "PUT");
      must(put.length === 1 && put[0].json && put[0].json.password === GOOD_PW, "expected one update with the new password");
      await sleep(1800);
      must(/set-password\.html$/.test(await pg.url()), "the page redirected by itself after saving");
      const vals = await pg.ev("()=>[...document.querySelectorAll('input[type=password]')].map(i=>i.value).join('')");
      must(vals === "", "password fields were not cleared after saving");
      noSecretsLeaked(pg, "set-password", [TOKEN, GOOD_PW]);
      must(!(await pg.url()).includes(GOOD_PW), "the password appears in the address");
      await pg.clean("set-password", { allowBad: false });
      done.push("strip, no verify on load, one verify, validation, success");
    });
  }
  // heading by type, unknown type
  {
    const st = mkStub();
    await openHttp(origin, "set-password.html?token_hash=" + TOKEN + "&type=recovery", { stub: st }, async (pg) => {
      await pg.needText("Choose a new password", 4000);
      must(stubCount(st, "/auth/v1/verify") === 0, "verify sent on load (recovery)");
      done.push("recovery heading");
    });
    const st2 = mkStub();
    await openHttp(origin, "set-password.html?token_hash=" + TOKEN + "&type=magiclink", { stub: st2 }, async (pg) => {
      await pg.needText("This link has expired", 4000);
      must(stubCount(st2, "/auth/v1/verify") === 0, "an unknown link type sent a verify request");
      done.push("unknown type is expired");
    });
  }
  // verify error and service failure
  {
    const st = mkStub({ verify: { status: 403 } });
    await openHttp(origin, "set-password.html?token_hash=" + TOKEN + "&type=invite", { stub: st }, async (pg) => {
      await pg.needText("Welcome, let\u2019s set your password", 4000);
      await pg.clickText("Continue");
      await pg.needText("This link has expired", 4000);
      const link = await pg.ev("()=>{const a=byText('Send me a new link','a');return a?a.getAttribute('href'):null;}");
      must(link && /login\.html#reset$/.test(link), "Send me a new link does not go to login.html#reset (" + link + ")");
      done.push("expired link");
    });
    const st2 = mkStub({ verify: { fail: true } });
    await openHttp(origin, "set-password.html?token_hash=" + TOKEN + "&type=invite", { stub: st2 }, async (pg) => {
      await pg.needText("Welcome, let\u2019s set your password", 4000);
      await pg.clickText("Continue");
      await pg.needText("I couldn\u2019t reach the sign-in service", 4000);
      await pg.lacksText("This link has expired");
      done.push("service failure is not expiry");
    });
  }
  // service rejects the password
  {
    const st = mkStub({ update: { status: 422 } });
    await openHttp(origin, "set-password.html?token_hash=" + TOKEN + "&type=invite", { stub: st }, async (pg) => {
      await pg.needText("Welcome, let\u2019s set your password", 4000);
      await pg.clickText("Continue");
      await pg.ev("()=>waitFor(()=>vis(document.querySelector('#password-form')),4000)");
      await pg.ev(fillPw(GOOD_PW, GOOD_PW));
      await pg.ev(submitPw);
      await sleep(1000);
      const v = await pg.ev("()=>({raw:document.body.innerText.includes('SERVICE-RAW-TEXT'),inv:!!document.querySelector('#password-form [aria-invalid=true]'),saved:document.body.innerText.includes('All set')})");
      must(!v.raw, "raw service text was shown to the client");
      must(v.inv && !v.saved, "a rejected password did not show a field error");
      done.push("rejected password");
    });
  }
  return done.join("; ");
};

results["stub-change"] = async () => {
  const origin = await originFor("stub-change");
  const done = [];
  {
    const st = mkStub();
    await openHttp(origin, "set-password.html", { stub: st, session: true }, async (pg) => {
      const shown = await pg.ev("async()=>!!(await waitFor(()=>vis(document.querySelector('#password-form')),6000))");
      must(shown, "with a session and no token the password form did not appear directly");
      must(await pg.ev("()=>!byText('Continue')"), "a Continue step appeared on the change route");
      await pg.ev(fillPw(GOOD_PW, GOOD_PW));
      await pg.ev(submitPw);
      await pg.needText("All set", 5000);
      const put = st.reqs.filter((r) => r.path === "/auth/v1/user" && r.method === "PUT");
      must(put.length === 1, "expected one update request, saw " + put.length);
      must(stubCount(st, "/auth/v1/verify") === 0, "the change route sent a verify request");
      done.push("change with a session");
    });
  }
  {
    const st = mkStub();
    await openHttp(origin, "set-password.html", { stub: st }, async (pg) => {
      await pg.needText("This link has expired", 6000);
      must(await pg.ev("()=>!vis(document.querySelector('#password-form'))"), "the form is visible with no token and no session");
      done.push("no token, no session");
    });
  }
  {
    const st = mkStub();
    await openHttp(origin, "dashboard.html", { stub: st, session: true }, async (pg) => {
      await dashReady(pg);
      const href = await pg.ev("()=>{const a=byText('Change your password','a');return a?a.getAttribute('href'):null;}");
      must(href === "set-password.html", "the dashboard has no working Change your password link (" + href + ")");
      await pg.clickText("Change your password", "a");
      must(await pg.waitUrl(/set-password\.html$/, 6000), "the Change your password link did not open set-password.html");
      done.push("dashboard link");
    });
  }
  return done.join("; ");
};

// ----- csp
results.csp = async () => {
  const origin = await originFor("csp");
  const notes = [];
  for (const [w, h, alt] of [[1280, 800, 900], [375, 812, 320]]) {
    for (const rel of ["index.html", "contact.html"]) {
      const tag = rel + "@" + w;
      const isHome = rel === "index.html";
      await openHttp(origin, rel, { width: w, height: h, stub: mkStub(), init: isHome ? MP_INIT : "" }, async (pg) => {
        await sleep(600);
        if (isHome) await checkHomeLive(pg, tag, true);
        else await submitContactOk(pg, tag);
        await scrollAndResize(pg, w, alt);
        await pg.clean(tag);
        await checkResponseHeaders(pg, origin + "/" + rel, tag);
        notes.push(tag);
      });
    }
    {
      const tag = "login@" + w;
      await openHttp(origin, "login.html", { width: w, height: h, stub: mkStub() }, async (pg) => {
        await loginReady(pg);
        await pg.clean(tag);
        await checkResponseHeaders(pg, origin + "/login.html", tag);
        notes.push(tag);
      });
    }
    {
      const tag = "set-password@" + w;
      await openHttp(origin, "set-password.html?token_hash=" + TOKEN + "&type=invite", { width: w, height: h, stub: mkStub() }, async (pg) => {
        await pg.needText("Welcome, let\u2019s set your password", 4000);
        await pg.clickText("Continue");
        await pg.ev("()=>waitFor(()=>vis(document.querySelector('#password-form')),4000)");
        await pg.clean(tag);
        await checkResponseHeaders(pg, origin + "/set-password.html?token_hash=" + TOKEN + "&type=invite", tag);
        notes.push(tag);
      });
    }
    {
      const tag = "dashboard@" + w;
      await openHttp(origin, "dashboard.html", { width: w, height: h, stub: mkStub(), session: true }, async (pg) => {
        await dashReady(pg);
        await pg.clean(tag);
        await checkResponseHeaders(pg, origin + "/dashboard.html", tag);
        notes.push(tag);
      });
    }
  }
  return "no CSP violation, exception or console error on " + notes.length + " page loads, including scroll and resize on Home and Contact";
};

// ----- live
results.live = async () => {
  const origin = await originFor("live");
  const A = { email: process.env.TEST_CLIENT_A_EMAIL, pw: process.env.TEST_CLIENT_A_PASSWORD };
  const B = { email: process.env.TEST_CLIENT_B_EMAIL, pw: process.env.TEST_CLIENT_B_PASSWORD };
  const done = [];
  const signIn = async (pg, who) => {
    await pg.goto(origin + "/login.html");
    await loginReady(pg);
    await pg.typeInto("#login-form input[type=email]", who.email);
    await pg.typeInto("#login-form input[type=password]", who.pw);
    await pg.ev(submitLogin);
  };
  const gridText = (pg) => pg.ev("()=>{const g=document.querySelector('.dash__grid');return g?g.innerText:'';}");
  let aText = "";
  await withPage({ url: origin + "/login.html" }, async (pg) => {
    await signIn(pg, A);
    must(await pg.waitUrl(/\/dashboard\.html$/, 15000), "client A could not sign in");
    await pg.needText("Hello, Sample Alex", 15000);
    await pg.lacksText("Sample Blake");
    aText = await gridText(pg);
    must(aText.length > 0, "client A sees no plan content");
    done.push("A signs in and sees own content");
    await pg.goto(origin + "/dashboard.html");
    await pg.needText("Hello, Sample Alex", 15000);
    must((await gridText(pg)) === aText, "content changed after a reload");
    done.push("reload stays signed in");
    await pg.clickText("Sign out");
    must(await pg.waitUrl(/\/login\.html$/, 10000), "sign out did not return to login");
    await pg.goto(origin + "/dashboard.html");
    must(await pg.waitUrl(/\/login\.html$/, 10000), "the dashboard did not redirect after sign out");
    done.push("sign out");
    await signIn(pg, { email: A.email, pw: "Not-the-password-1" });
    await pg.needText("That didn\u2019t work", 10000);
    done.push("wrong password");
    await signIn(pg, B);
    must(await pg.waitUrl(/\/dashboard\.html$/, 15000), "client B could not sign in");
    await pg.needText("Hello, Sample Blake", 15000);
    await pg.lacksText("Sample Alex");
    const bText = await gridText(pg);
    const bLines = new Set(bText.split("\n").map((s) => s.trim()).filter(Boolean));
    const aOnly = aText.split("\n").map((s) => s.trim()).filter((s) => s && !bLines.has(s));
    must(aOnly.length > 0, "A and B see the same plan content, so the test cannot tell them apart");
    const page = await pg.ev("()=>document.body.innerText");
    must(!aOnly.some((l) => page.includes(l)), "client B can see content that belongs to client A");
    done.push("B sees only B");
    await pg.clean("live");
  });
  return done.join(", ");
};

// ----- deployed and rollback
async function fetchText(u) {
  const r = await fetch(u, { redirect: "manual", cache: "no-store" });
  const buf = Buffer.from(await r.arrayBuffer());
  return { status: r.status, buf, text: buf.toString("utf8") };
}

results.deployed = async () => {
  const done = [];
  if (EXPECT_SHA) {
    const end = Date.now() + 5 * 60 * 1000;
    let stamp = null;
    while (Date.now() < end) {
      try {
        const r = await fetchText(BASE_URL + "/index.html?t=" + Date.now());
        const m = r.text.match(/<!-- build ([A-Za-z0-9]+) -->/);
        stamp = m ? m[1] : null;
        if (stamp === EXPECT_SHA) break;
      } catch (e) { /* retry */ }
      await sleep(5000);
    }
    must(stamp === EXPECT_SHA, "the deployment did not arrive within 5 minutes (stamp is " + stamp + ", expected " + EXPECT_SHA + ")");
    done.push("build stamp matches");
  }
  for (const p of ["index.html", "contact.html", "login.html", "set-password.html", "dashboard.html"]) {
    const r = await fetchText(BASE_URL + "/" + p);
    must(r.status === 200, p + " answered " + r.status + ", expected 200");
  }
  done.push("five pages answer 200");
  for (const p of ["tools/check-auth.js", "supabase/schema.sql", "CLIENT-GUIDE.md", "REPLACE-ME.md", "CLAUDE.md", ".env.local",
    "styleguide.html", "js/styleguide.js", ".planning/STATE.md"]) {
    const r = await fetchText(BASE_URL + "/" + p);
    must(r.status === 404, p + " answered " + r.status + ", expected 404");
  }
  done.push("dev files answer 404");
  // secret scan over every shipped HTML, JS and CSS file
  const { scan } = require("./check-auth.js");
  const SDK_REL = "assets/js/vendor/supabase.min.js";
  const SDK_SHA = "a867edbcfb029370aeec7223dd6180b560b621fbe3bc64c6584fb0369d1b7bce";
  const files = new Set(["index.html", "contact.html", "login.html", "set-password.html", "dashboard.html", "css/styles.css", "js/main.js", SDK_REL]);
  for (const p of ["index.html", "contact.html", "login.html", "set-password.html", "dashboard.html"]) {
    const r = await fetchText(BASE_URL + "/" + p);
    r.text.replace(/\b(?:src|href)="([^"#?]+\.(?:js|css))"/g, (m, f) => { if (!/^(https?:)?\/\//.test(f)) files.add(f.replace(/^\.?\//, "")); return m; });
  }
  let n = 0;
  for (const f of files) {
    const r = await fetchText(BASE_URL + "/" + f);
    must(r.status === 200, f + " answered " + r.status + " during the secret scan");
    const isSdk = f === SDK_REL;
    const sdkOk = isSdk && crypto.createHash("sha256").update(r.buf).digest("hex") === SDK_SHA;
    if (isSdk) must(sdkOk, f + ": the deployed bytes do not match the pinned sha256");
    const hits = scan(r.text, 1, { exemptSbWord: sdkOk });
    must(hits.length === 0, f + " matches secret pattern(s): " + hits.join(", "));
    n++;
  }
  done.push("secret scan clean over " + n + " files");
  for (const [w, h, alt] of [[1280, 800, 900], [375, 812, 320]]) {
    for (const rel of ["index.html", "contact.html"]) {
      await withPage({ url: BASE_URL + "/" + rel, width: w, height: h }, async (pg) => {
        await sleep(600);
        await scrollAndResize(pg, w, alt);
        await pg.clean("deployed " + rel + "@" + w);
        await checkResponseHeaders(pg, BASE_URL + "/" + rel, "deployed " + rel + "@" + w);
      });
    }
  }
  done.push("no CSP violation on Home and Contact after scroll and resize");
  return done.join("; ");
};

results.rollback = async () => {
  const r = await fetchText(BASE_URL + "/index.html?t=" + Date.now());
  const m = r.text.match(/<!-- build ([A-Za-z0-9]+) -->/);
  must(m && m[1] === EXPECT_SHA, "the stamp is " + (m ? m[1] : "missing") + ", expected " + EXPECT_SHA);
  for (const [w, h] of [[1280, 800], [375, 812]]) {
    for (const rel of ["index.html", "contact.html"]) {
      const tag = "rollback " + rel + "@" + w;
      await withPage({ url: BASE_URL + "/" + rel, width: w, height: h }, async (pg) => {
        must(pg.log.status.get(BASE_URL + "/" + rel) === 200, tag + " did not answer 200");
        await sleep(600);
        if (rel === "index.html") await checkHomeLive(pg, tag, false);
        else {
          const f = await pg.ev(FONTS_AND_IMAGES);
          must(f.f400 && f.f600, tag + ": Figtree not loaded");
          must(f.imgs.length === 0, tag + ": images not loaded");
        }
        await pg.clean(tag);
      });
    }
  }
  return "the previous deployment serves Home and Contact with no console errors, hero activity, images and fonts at both widths";
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
let child = null;
process.on("exit", () => { try { if (child) child.kill("SIGKILL"); } catch (e) { /* ignore */ } });

(async () => {
  // A protected hosted address cannot be tested. Say so instead of failing or passing.
  const needsHttp = groups.some((g) => !g.startsWith("file-"));
  if (BASE_URL && needsHttp) {
    try {
      const r = await fetch(BASE_URL + "/index.html", { redirect: "manual", cache: "no-store" });
      const loc = r.headers.get("location") || "";
      let otherHost = false;
      try { otherHost = !!loc && new URL(loc, BASE_URL).host !== new URL(BASE_URL).host; } catch (e) { otherHost = true; }
      if (r.status === 401 || r.status === 403 || otherHost) {
        out("NOT RUN: address is protected");
        process.exit(2);
      }
    } catch (e) {
      out("NOT RUN: could not reach " + BASE_URL);
      process.exit(2);
    }
  }

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "auth-browser-"));
  child = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--user-data-dir=" + profile, "--remote-debugging-port=0", "about:blank"], { stdio: "ignore" });
  const overall = setTimeout(() => { out("FAIL timed out after 900s"); try { child.kill("SIGKILL"); } catch (e) { /* ignore */ } process.exit(1); }, 900000);
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
        safeOut("PASS " + g + ": " + detail);
      } catch (e) {
        failed = true;
        safeOut("FAIL " + g + ": " + e.message);
      }
    }
  } catch (e) {
    failed = true;
    safeOut("FAIL runner: " + e.message);
  } finally {
    clearTimeout(overall);
    try { ws && ws.close(); } catch (e) { /* ignore */ }
    try { child.kill("SIGKILL"); } catch (e) { /* ignore */ }
    if (local.server) local.server.close();
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) { /* best effort */ }
    if (local.built) { try { fs.rmSync(SITE, { recursive: true, force: true }); } catch (e) { /* best effort */ } }
  }
  if (!failed) out("AUTH BROWSER OK");
  process.exit(failed ? 1 : 0);
})();
