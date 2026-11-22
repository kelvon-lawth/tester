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
// Phase 7 lines stay in 07-LIVE-EVIDENCE.md; runs from 07.1 on append here.
const EVIDENCE = path.join(ROOT, ".planning", "phases", "07.1-useful-client-dashboard", "07.1-LIVE-EVIDENCE.md");

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

  await planTierCases(A, B);

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

// ---- Phase 7.1 plan-tier lock (G1-G9). Labels, statuses and counts only: never row contents or ids.
const GROWTH = ["content_calendar", "ad_results", "report_archive"];
const NEW = ["monthly_metrics", "dashboard_items"].concat(GROWTH);
const ORDER = { monthly_metrics: "month", ad_results: "month", report_archive: "month", dashboard_items: "id", content_calendar: "id" };
const REST = "/rest/v1/";

// Previous month of a YYYY-MM-DD string, by string arithmetic (never Date/UTC).
function prevMonth(d) {
  let y = parseInt(d.slice(0, 4), 10);
  let m = parseInt(d.slice(5, 7), 10) - 1;
  if (m === 0) { m = 12; y -= 1; }
  return String(y).padStart(4, "0") + "-" + String(m).padStart(2, "0") + "-01";
}

function probeBody(table, uid) {
  switch (table) {
    case "monthly_metrics": return { user_id: uid, month: "2020-01-01", kpi1: 1 };
    case "dashboard_items": return { user_id: uid, title: "Sample: probe" };
    case "content_calendar": return { user_id: uid, post_on: "2020-01-01", title: "Sample: probe" };
    case "ad_results": return { user_id: uid, month: "2020-01-01" };
    default: return { user_id: uid, month: "2020-01-01", title: "Sample: probe", url: "https://example.com/probe" };
  }
}

async function snapshot(who) {
  const out = {};
  const d = await http("GET", REST + "client_dashboards?select=*", { token: who.token });
  out.client_dashboards = JSON.stringify(d.json);
  for (const t of NEW) {
    const r = await http("GET", REST + t + "?select=*&order=" + ORDER[t], { token: who.token });
    out[t] = JSON.stringify(r.json);
  }
  return out;
}

async function planTierCases(A, B) {
  const before = { A: await snapshot(A), B: await snapshot(B) };
  const own = (r, id) => rows(r).every((x) => x.user_id === id);

  // G1 positive control: B (growth) sees its own Growth rows
  for (const t of GROWTH) {
    const r = await http("GET", REST + t + "?select=*", { token: B.token });
    const ok = r.status === 200 && rows(r).length >= 1 && own(r, B.id);
    add("G1", "B reads own " + t, r.status, rows(r).length, ok, ok ? "" : "table empty or unreachable, G2 would prove nothing");
  }

  // G2 A (basics) gets nothing from Growth tables, plain, by own filter, by B's filter
  for (const t of GROWTH) {
    for (const [lbl, q] of [["plain", ""], ["own filter", "&user_id=eq." + A.id], ["B filter", "&user_id=eq." + B.id]]) {
      const r = await http("GET", REST + t + "?select=*" + q, { token: A.token });
      add("G2", "A " + t + " " + lbl, r.status, rows(r).length, noRows(r));
    }
  }
  // G2b embedding
  const emb = await http("GET", REST + "client_dashboards?select=user_id,plan_tier,content_calendar(*),ad_results(*),report_archive(*)", { token: A.token });
  const e0 = rows(emb)[0] || {};
  const embOk = emb.status === 200 && rows(emb).length === 1 && e0.user_id === A.id && e0.plan_tier === "basics" &&
    GROWTH.every((t) => Array.isArray(e0[t]) && e0[t].length === 0);
  add("G2b", "A embeds Growth tables", emb.status, rows(emb).length, embOk);

  // G3 B cannot read A's rows
  for (const t of GROWTH) {
    const r = await http("GET", REST + t + "?select=*&user_id=eq." + A.id, { token: B.token });
    add("G3", "B reads A " + t, r.status, rows(r).length, noRows(r));
  }

  // G4 metrics window
  const raR = await http("GET", REST + "client_dashboards?select=report_month", { token: A.token });
  const rbR = await http("GET", REST + "client_dashboards?select=report_month", { token: B.token });
  const RA = rows(raR)[0] && rows(raR)[0].report_month;
  const RB = rows(rbR)[0] && rows(rbR)[0].report_month;
  const mA = await http("GET", REST + "monthly_metrics?select=*&order=month.desc", { token: A.token });
  const wantA = RA ? [RA, prevMonth(RA)] : [];
  const gotA = rows(mA).map((x) => String(x.month).slice(0, 10)).sort();
  const okMA = !!RA && mA.status === 200 && rows(mA).length === 2 && own(mA, A.id) &&
    JSON.stringify(gotA) === JSON.stringify(wantA.slice().sort());
  add("G4", "A metrics = report month + prior", mA.status, rows(mA).length, okMA);
  const mB = await http("GET", REST + "monthly_metrics?select=*&order=month.desc", { token: B.token });
  const okMB = !!RB && mB.status === 200 && rows(mB).length >= 6 && own(mB, B.id) &&
    rows(mB).every((x) => String(x.month).slice(0, 10) <= RB);
  add("G4", "B metrics up to report month", mB.status, rows(mB).length, okMB);
  const mBA = await http("GET", REST + "monthly_metrics?select=*&user_id=eq." + A.id, { token: B.token });
  add("G4", "B reads A metrics", mBA.status, rows(mBA).length, noRows(mBA));
  const diA = await http("GET", REST + "dashboard_items?select=*", { token: A.token });
  add("G4", "A reads own items", diA.status, rows(diA).length, diA.status === 200 && rows(diA).length >= 1 && own(diA, A.id));
  const diAB = await http("GET", REST + "dashboard_items?select=*&user_id=eq." + B.id, { token: A.token });
  add("G4", "A reads B items", diAB.status, rows(diAB).length, noRows(diAB));

  // G5 signed out, G6 forged token
  for (const t of NEW) {
    for (const q of ["", "&user_id=eq." + A.id]) {
      const r = await http("GET", REST + t + "?select=*" + q);
      add("G5", "signed-out " + t + (q ? " filtered" : ""), r.status, rows(r).length, noRows(r));
    }
    const f = await http("GET", REST + t + "?select=*", { token: "forged.token.value" });
    add("G6", "forged token " + t, f.status, rows(f).length, noRows(f));
  }

  // G9 the deployed Phase 7 page's exact select still works
  const leg = await http("GET", REST + "client_dashboards?select=first_name,plan_name,plan_items,check_in,steps,is_sample", { token: A.token });
  add("G9", "legacy Phase 7 select", leg.status, rows(leg).length, leg.status === 200 && rows(leg).length === 1);

  // G7 writes: Prefer return=representation so a silent success shows rows
  const PREF = "return=representation";
  const g7 = (label, r) => add("G7", label, r.status, rows(r).length, refusedOrZero(r));
  const CD = REST + "client_dashboards?user_id=eq." + A.id;
  g7("A PATCH plan_tier", await http("PATCH", CD, { token: A.token, prefer: PREF, body: { plan_tier: "growth" } }));
  g7("A PATCH report_month", await http("PATCH", CD, { token: A.token, prefer: PREF, body: { report_month: "2020-01-01" } }));
  for (const t of NEW) {
    for (const [who, tok] of [["A", A.token], ["signed-out", undefined]]) {
      const lbl = (x) => who + " " + x + " " + t;
      g7(lbl("POST A row"), await http("POST", REST + t, { token: tok, prefer: PREF, body: probeBody(t, A.id) }));
      g7(lbl("POST B row"), await http("POST", REST + t, { token: tok, prefer: PREF, body: probeBody(t, B.id) }));
      g7(lbl("PATCH A rows"), await http("PATCH", REST + t + "?user_id=eq." + A.id, { token: tok, prefer: PREF, body: { user_id: A.id } }));
      g7(lbl("PATCH B rows"), await http("PATCH", REST + t + "?user_id=eq." + B.id, { token: tok, prefer: PREF, body: { user_id: B.id } }));
      g7(lbl("DELETE A rows"), await http("DELETE", REST + t + "?user_id=eq." + A.id, { token: tok, prefer: PREF }));
      g7(lbl("DELETE B rows"), await http("DELETE", REST + t + "?user_id=eq." + B.id, { token: tok, prefer: PREF }));
    }
  }
  const reA = await http("GET", REST + "client_dashboards?select=plan_tier,report_month", { token: A.token });
  const r0 = rows(reA)[0] || {};
  add("G7", "A tier and month unchanged", reA.status, rows(reA).length, r0.plan_tier === "basics" && r0.report_month === RA);
  for (const t of GROWTH) {
    const r = await http("GET", REST + t + "?select=*", { token: A.token });
    add("G7", "A still no " + t, r.status, rows(r).length, noRows(r));
  }

  // G8 before/after snapshots identical
  const after = { A: await snapshot(A), B: await snapshot(B) };
  for (const [name, key] of [["A", "A"], ["B", "B"]]) {
    for (const t of ["client_dashboards"].concat(NEW)) {
      add("G8", name + " " + t + " unchanged", "-", "-", before[key][t] === after[key][t]);
    }
  }
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
