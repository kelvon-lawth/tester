#!/usr/bin/env node
// Live REST matrix for Phase 7: signed-out, client A, client B against client_dashboards.
// Zero dependencies. Exit 0 = all cases ran and passed, 1 = a case failed, 2 = could not run.
// Credentials come from tools/auth-env.js. Output passes through one redacting print function.
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const authEnv = require("./auth-env");

const ROOT = path.resolve(__dirname, "..");
const EVIDENCE = path.join(ROOT, ".planning", "phases", "07-client-login-dashboard", "07-LIVE-EVIDENCE.md");

authEnv.load();

// ---- redacting output
const SENSITIVE = new Set();
function addSensitive(v) { if (typeof v === "string" && v.length > 0) SENSITIVE.add(v); }
authEnv.secretValues().forEach(addSensitive);
addSensitive(process.env.TEST_CLIENT_A_EMAIL);
addSensitive(process.env.TEST_CLIENT_B_EMAIL);
function print(text) {
  const s = String(text);
  for (const v of SENSITIVE) {
    if (s.includes(v)) throw new Error("refusing to print: output contains a secret value");
  }
  console.log(s);
}

function sha() {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "unknown";
}
function record(result) {
  const date = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(path.dirname(EVIDENCE), { recursive: true });
  fs.appendFileSync(EVIDENCE, "RLS-RUN | " + date + " | " + sha() + " | " + result + "\n");
}

// ---- inputs
function fromConfig() {
  const p = path.join(ROOT, "js", "auth-config.js");
  if (!fs.existsSync(p)) return {};
  const t = fs.readFileSync(p, "utf8");
  const u = t.match(/url\s*:\s*["'](https:\/\/[^"']+)["']/);
  const k = t.match(/publishableKey\s*:\s*["'](sb_publishable_[^"']+)["']/);
  return { url: u && u[1], key: k && k[1] };
}
const cfg = fromConfig();
const URL_BASE = (process.env.SUPABASE_URL || cfg.url || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || cfg.key || "";
const missingInputs = [];
if (!URL_BASE) missingInputs.push("SUPABASE_URL");
if (!KEY) missingInputs.push("SUPABASE_PUBLISHABLE_KEY");
for (const n of authEnv.NAMES) if (!process.env[n]) missingInputs.push(n);
if (missingInputs.length) {
  print("LIVE TESTS NOT RUN: " + missingInputs.join(", "));
  record("NOT RUN");
  process.exit(2);
}

// ---- helpers
class RateLimited extends Error {}

async function http(method, p, opts) {
  opts = opts || {};
  const headers = { apikey: KEY };
  if (opts.token) headers.Authorization = "Bearer " + opts.token;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.prefer) headers.Prefer = opts.prefer;
  const res = await fetch(URL_BASE + p, {
    method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  if (res.status === 429) throw new RateLimited("HTTP 429");
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { /* not JSON */ }
  return { status: res.status, json, text };
}

async function signIn(email, password) {
  const r = await http("POST", "/auth/v1/token?grant_type=password", { body: { email, password } });
  if (r.status !== 200 || !r.json || !r.json.access_token) return null;
  addSensitive(r.json.access_token);
  return { token: r.json.access_token, id: r.json.user && r.json.user.id };
}

const rows = (r) => (Array.isArray(r.json) ? r.json : []);
const TABLE = "/rest/v1/client_dashboards";
const results = [];
function add(id, label, status, count, ok, note) {
  results.push({ id, label, status, count, ok, note: note || "" });
}
const noRows = (r) => rows(r).length === 0 && (r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404);
const refusedOrZero = (r) => r.status >= 400 || rows(r).length === 0;

async function main() {
  const A = await signIn(process.env.TEST_CLIENT_A_EMAIL, process.env.TEST_CLIENT_A_PASSWORD);
  const B = await signIn(process.env.TEST_CLIENT_B_EMAIL, process.env.TEST_CLIENT_B_PASSWORD);
  if (A && A.id) addSensitive(A.id);
  if (B && B.id) addSensitive(B.id);

  // R1, R2 positive controls
  const readA = A ? await http("GET", TABLE + "?select=*", { token: A.token }) : { status: 0, json: null };
  const readB = B ? await http("GET", TABLE + "?select=*", { token: B.token }) : { status: 0, json: null };
  const okA = !!A && readA.status === 200 && rows(readA).length === 1 && rows(readA)[0].user_id === A.id;
  const okB = !!B && readB.status === 200 && rows(readB).length === 1 && rows(readB)[0].user_id === B.id;
  add("R1", "client A", readA.status, rows(readA).length, okA, A ? "" : "sign-in failed");
  add("R2", "client B", readB.status, rows(readB).length, okB, B ? "" : "sign-in failed");
  if (!okA || !okB) return finish("controls failed, later cases would prove nothing");

  // R3 sample data only
  add("R3", "client A", readA.status, rows(readA).length, rows(readA).every((x) => x.is_sample === true));
  add("R3", "client B", readB.status, rows(readB).length, rows(readB).every((x) => x.is_sample === true));

  // R4, R5 cross reads
  const aSeesB = await http("GET", TABLE + "?select=*&user_id=eq." + B.id, { token: A.token });
  add("R4", "client A reads B", aSeesB.status, rows(aSeesB).length, noRows(aSeesB));
  const bSeesA = await http("GET", TABLE + "?select=*&user_id=eq." + A.id, { token: B.token });
  add("R5", "client B reads A", bSeesA.status, rows(bSeesA).length, noRows(bSeesA));

  // R6 signed out
  const so1 = await http("GET", TABLE + "?select=*");
  add("R6", "signed-out", so1.status, rows(so1).length, noRows(so1));
  const so2 = await http("GET", TABLE + "?select=*&user_id=eq." + A.id);
  add("R6", "signed-out, filtered", so2.status, rows(so2).length, noRows(so2));

  // R7 forged token
  const forged = await http("GET", TABLE + "?select=*", { token: "forged.token.value" });
  add("R7", "forged token", forged.status, rows(forged).length, noRows(forged));

  // R8 writes as A
  const ownRow = rows(readA)[0];
  const w = [];
  w.push(["POST row for B", await http("POST", TABLE, { token: A.token, prefer: "return=representation", body: Object.assign({}, rows(readB)[0], { user_id: B.id }) })]);
  w.push(["PATCH own row", await http("PATCH", TABLE + "?user_id=eq." + A.id, { token: A.token, prefer: "return=representation", body: { plan_name: "tampered" } })]);
  w.push(["PATCH B row", await http("PATCH", TABLE + "?user_id=eq." + B.id, { token: A.token, prefer: "return=representation", body: { plan_name: "tampered" } })]);
  w.push(["DELETE own row", await http("DELETE", TABLE + "?user_id=eq." + A.id, { token: A.token, prefer: "return=representation" })]);
  w.push(["DELETE B row", await http("DELETE", TABLE + "?user_id=eq." + B.id, { token: A.token, prefer: "return=representation" })]);
  for (const [label, r] of w) add("R8", "A: " + label, r.status, rows(r).length, refusedOrZero(r));

  // R9 signed-out writes
  const s = [];
  s.push(["POST", await http("POST", TABLE, { prefer: "return=representation", body: Object.assign({}, ownRow, { user_id: A.id }) })]);
  s.push(["PATCH", await http("PATCH", TABLE + "?user_id=eq." + A.id, { prefer: "return=representation", body: { plan_name: "tampered" } })]);
  s.push(["DELETE", await http("DELETE", TABLE + "?user_id=eq." + A.id, { prefer: "return=representation" })]);
  for (const [label, r] of s) add("R9", "signed-out " + label, r.status, rows(r).length, refusedOrZero(r));

  // Re-read both rows: nothing may have changed, whatever the write responses said
  const afterA = await http("GET", TABLE + "?select=*", { token: A.token });
  const afterB = await http("GET", TABLE + "?select=*", { token: B.token });
  add("R8/R9", "re-read A unchanged", afterA.status, rows(afterA).length, JSON.stringify(afterA.json) === JSON.stringify(readA.json));
  add("R8/R9", "re-read B unchanged", afterB.status, rows(afterB).length, JSON.stringify(afterB.json) === JSON.stringify(readB.json));

  // S1 AUTH-06 sign-up closed
  const settings = await http("GET", "/auth/v1/settings");
  const closed = settings.status === 200 && settings.json && settings.json.disable_signup === true;
  add("S1", "settings disable_signup", settings.status, "-", closed, closed ? "" : "sign-up is not disabled, not probing");
  if (closed) {
    const addr = "probe-" + Date.now() + "@example.invalid";
    const su = await http("POST", "/auth/v1/signup", { body: { email: addr, password: "Probe-" + Date.now() + "-xZ9" } });
    const refused = su.status >= 400;
    add("S1", "signup refused", su.status, "-", refused, refused ? "" : "SIGN-UP SUCCEEDED: delete the stray account in the Supabase console");
  }

  // P1 to P3 observation probes
  const p1 = await http("POST", "/auth/v1/token?grant_type=password", { body: { email: process.env.TEST_CLIENT_A_EMAIL, password: "wrong-" + Date.now() + "-Pw" } });
  add("P1", "wrong password", p1.status, "-", p1.status >= 400 && p1.status < 500 && !(p1.json && p1.json.access_token),
    "observed code=" + (p1.json && (p1.json.error_code || p1.json.error) || "none"));
  const known = await http("POST", "/auth/v1/recover", { body: { email: process.env.TEST_CLIENT_A_EMAIL } });
  const unknown = await http("POST", "/auth/v1/recover", { body: { email: "nobody-" + Date.now() + "@example.invalid" } });
  add("P2", "recover unknown email", unknown.status, "-", unknown.status === known.status,
    "known status=" + known.status + ", unknown status=" + unknown.status);
  const p3 = await http("POST", "/auth/v1/verify", { body: { type: "recovery", token_hash: "invalid-token-hash-probe" } });
  add("P3", "invalid token_hash", p3.status, "-", p3.status >= 400 && !(p3.json && p3.json.access_token),
    "observed code=" + (p3.json && (p3.json.error_code || p3.json.error) || "none"));

  return finish();
}

function finish(stop) {
  print("case    | label                       | status | rows | result");
  for (const r of results) {
    print([r.id.padEnd(7), r.label.padEnd(27), String(r.status).padEnd(6), String(r.count).padEnd(4), r.ok ? "PASS" : "FAIL"].join(" | ") + (r.note ? "  (" + r.note + ")" : ""));
  }
  if (stop) print("STOPPED: " + stop);
  const pass = !stop && results.length > 0 && results.every((r) => r.ok);
  if (pass) {
    print("RLS OK");
    record("RLS OK");
    process.exit(0);
  }
  print("RLS FAILED");
  record("FAILED");
  process.exit(1);
}

main().catch((e) => {
  if (e instanceof RateLimited) {
    print("LIVE TESTS NOT RUN: rate limited by the auth service (HTTP 429), try again in a few minutes");
    record("NOT RUN");
    process.exit(2);
  }
  print("RLS FAILED: " + (e && e.message ? e.message : "unexpected error"));
  record("FAILED");
  process.exit(1);
});
