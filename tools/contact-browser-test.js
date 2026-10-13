#!/usr/bin/env node
// Headless Chrome (Chrome DevTools Protocol) behaviour test for contact.html.
// Usage: node tools/contact-browser-test.js [validate|success|layout|console ...]
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
const ALL = ["validate", "success", "layout", "console"];

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
async function scenario(width, height, noJs, expression, pageUrl) {
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
    await send("Page.navigate", { url: pageUrl || PAGE }, sessionId);
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
// In-page scenarios
// ---------------------------------------------------------------------------
const FILL = `const q=s=>document.querySelector(s);
  const set=(id,v)=>{q('#'+id).value=v;};
  const submit=()=>q('#contact-form').requestSubmit();
  const hidden=s=>q(s).hidden;`;

const VALIDATE = `async()=>{
  ${FILL}
  const flag=id=>({inv:q('#'+id).getAttribute('aria-invalid'),err:q('#'+id+'-error').textContent});
  submit();await raf();
  const empty={name:flag('name'),phone:flag('phone'),email:flag('email'),active:document.activeElement.id,successHidden:hidden('#contact-success')};
  set('name','Jo');set('phone','abc');set('email','bad');submit();await raf();
  const bad={name:flag('name'),phone:flag('phone'),email:flag('email'),active:document.activeElement.id,successHidden:hidden('#contact-success')};
  set('phone','(555) 555-0100');q('#phone').dispatchEvent(new Event('input',{bubbles:true}));
  const cleared=flag('phone');
  return{empty,bad,cleared};}`;

const SUCCESS = `async()=>{
  ${FILL}
  const href=location.href;
  set('name','Jo Baker');set('phone','(555) 555-0100');set('email','jo@example.com');submit();await raf();
  return{formHidden:q('#contact-form').hidden,successHidden:hidden('#contact-success'),text:q('#contact-success').textContent,active:document.activeElement.id,same:location.href===href};}`;

const LAYOUT = `async()=>{
  const r=s=>document.querySelector(s).getBoundingClientRect();
  const f=r('.contact__form-wrap'),d=r('.contact__details');
  return{fLeft:f.left,fTop:f.top,fBottom:f.bottom,dLeft:d.left,dTop:d.top,overflow:document.documentElement.scrollWidth-window.innerWidth};}`;

const results = {};

results.validate = async () => {
  const v = await scenario(1280, 900, false, VALIDATE);
  for (const id of ["name", "phone", "email"]) {
    if (v.empty[id].inv !== "true") throw new Error("empty submit: " + id + " not aria-invalid");
    if (!v.empty[id].err) throw new Error("empty submit: " + id + " has no error text");
  }
  if (v.empty.active !== "name") throw new Error("empty submit: focus on '" + v.empty.active + "', expected name");
  if (!v.empty.successHidden) throw new Error("empty submit showed success");
  if (v.bad.name.inv || v.bad.name.err) throw new Error("valid name was flagged");
  if (v.bad.phone.inv !== "true" || !/phone number/.test(v.bad.phone.err)) throw new Error("bad phone not flagged properly: " + JSON.stringify(v.bad.phone));
  if (v.bad.email.inv !== "true" || !/email/.test(v.bad.email.err)) throw new Error("bad email not flagged properly: " + JSON.stringify(v.bad.email));
  if (v.bad.active !== "phone") throw new Error("bad submit: focus on '" + v.bad.active + "', expected phone");
  if (!v.bad.successHidden) throw new Error("invalid submit showed success");
  if (v.cleared.inv || v.cleared.err) throw new Error("fixing phone did not clear its error");
  return "empty and invalid submits flag fields, focus first invalid, fixing clears";
};

results.success = async () => {
  const s = await scenario(1280, 900, false, SUCCESS);
  if (!s.formHidden) throw new Error("form not hidden after valid submit");
  if (s.successHidden) throw new Error("success panel still hidden");
  if (!/nothing was actually sent/.test(s.text)) throw new Error("success text lacks honest prototype note");
  if (s.active !== "contact-success-title") throw new Error("focus on '" + s.active + "', expected contact-success-title");
  if (!s.same) throw new Error("page navigated on submit");
  return "valid submit shows prototype success, focus on heading, no navigation";
};

results.layout = async () => {
  const w = await scenario(1280, 900, false, LAYOUT);
  if (!(w.dLeft > w.fLeft + 100)) throw new Error("1280px: details not in a second column");
  if (Math.abs(w.dTop - w.fTop) > 40) throw new Error("1280px: columns not on the same row");
  const p = await scenario(375, 740, false, LAYOUT);
  if (!(p.dTop >= p.fBottom)) throw new Error("375px: details not stacked below the form");
  if (p.overflow > 0) throw new Error("375px: horizontal overflow of " + p.overflow);
  return "two columns at 1280, stacked with no overflow at 375";
};

// Collect console errors / exceptions while loading a page.
async function loadErrors(pageUrl) {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const errors = [];
  const handler = (ev) => {
    const d = typeof ev.data === "string" ? ev.data : ev.data.toString();
    const m = JSON.parse(d);
    if (m.sessionId !== sessionId) return;
    if (m.method === "Runtime.exceptionThrown") errors.push("exception: " + JSON.stringify(m.params.exceptionDetails.text));
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push("console.error");
    // Known file:// artefact: the font <link rel=preload crossorigin> is blocked by CORS
    // on file:// (pre-existing in the shared head, fonts still load via @font-face). Ignored.
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/assets\/fonts\//.test(m.params.entry.text + " " + (m.params.entry.url || ""))) errors.push("log: " + m.params.entry.text + " " + (m.params.entry.url || ""));
  };
  ws.addEventListener("message", handler);
  try {
    await send("Runtime.enable", {}, sessionId);
    await send("Log.enable", {}, sessionId);
    await send("Page.enable", {}, sessionId);
    const loaded = once("Page.loadEventFired", sessionId);
    await send("Page.navigate", { url: pageUrl }, sessionId);
    await loaded;
    await sleep(500);
  } finally {
    ws.removeEventListener("message", handler);
    try { await send("Target.closeTarget", { targetId }); } catch (e) { /* ignore */ }
  }
  return errors;
}

results.console = async () => {
  const c = await loadErrors(PAGE);
  if (c.length) throw new Error("contact.html: " + c.join("; "));
  const h = await loadErrors(HOME);
  if (h.length) throw new Error("index.html: " + h.join("; "));
  return "no console errors on contact.html or index.html";
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "contact-browser-"));
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
  if (!failed) console.log("CONTACT BROWSER OK");
  process.exit(failed ? 1 : 0);
})();
