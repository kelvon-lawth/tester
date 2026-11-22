#!/usr/bin/env node
// Guard 13: static guard for Phase 7 (client login). Zero dependencies.
// Usage: node tools/check-auth.js [group ...]
// A bare run executes every group except `history`, which runs only when named.
// Exit 0 = pass, 1 = fail. Prints PASS <group> / FAIL <group>: <reason>, then AUTH OK.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");
const authEnv = require("./auth-env");

const ROOT = path.resolve(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const SDK_REL = "assets/js/vendor/supabase.min.js";
const SDK_SHA = "a867edbcfb029370aeec7223dd6180b560b621fbe3bc64c6584fb0369d1b7bce";

const abs = (rel) => path.join(ROOT, rel);
const exists = (rel) => fs.existsSync(abs(rel));
const read = (rel) => (exists(rel) ? fs.readFileSync(abs(rel), "utf8") : null);
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

// ---------------------------------------------------------------- secrets scan
// Samples are built by concatenation so this source never matches its own patterns.
const W_SB = "sb_" + "secret_";
const W_ROLE = "service" + "_role";
const W_JWT = "ey" + "J";

const TIER1 = {
  "sb-secret-word": new RegExp(W_SB),
  "service-role-word": new RegExp(W_ROLE),
  "jwt-shaped": new RegExp(W_JWT + "[A-Za-z0-9_-]{10,}"),
};
const TIER2 = {
  "sb-secret-value": new RegExp(W_SB + "[A-Za-z0-9_-]{8,}"),
  "jwt-three-segment": new RegExp(W_JWT + "[A-Za-z0-9_-]+\\." + W_JWT + "[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+"),
  "jwt-long-run": new RegExp(W_JWT + "[A-Za-z0-9_-]{20,}"),
  "service-role-value": new RegExp(W_ROLE + "\\w*\\s*[:=]\\s*[\"']?[A-Za-z0-9._-]{16,}"),
};

// Returns the names of the patterns that matched. opts.exemptSbWord skips the bare sb-secret rule.
function scan(text, tier, opts) {
  const table = tier === 1 ? TIER1 : TIER2;
  const hits = [];
  for (const name of Object.keys(table)) {
    if (tier === 1 && name === "sb-secret-word" && opts && opts.exemptSbWord) continue;
    if (table[name].test(text)) hits.push(name);
  }
  return hits;
}

const BINARY_EXT = /\.(woff2?|ttf|otf|eot|webp|png|jpe?g|gif|avif|ico|pdf|zip|gz|mp4|mov)$/i;

function walk(dir, base) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const a = path.join(dir, name);
    const rel = base ? base + "/" + name : name;
    if (fs.statSync(a).isDirectory()) out.push(...walk(a, rel));
    else out.push(rel);
  }
  return out;
}

function git(args) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
}

let builtSite = false;
function ensureBuilt() {
  if (builtSite) return true;
  const env = Object.assign({}, process.env);
  delete env.GITHUB_SHA;
  env.VERCEL_GIT_COMMIT_SHA = "authcheck";
  const r = spawnSync("sh", [path.join(ROOT, "tools", "build-site.sh")], { cwd: os.tmpdir(), env, encoding: "utf8" });
  builtSite = r.status === 0;
  return builtSite;
}
function cleanupSite() {
  if (builtSite) fs.rmSync(SITE, { recursive: true, force: true });
  builtSite = false;
}

function repoFiles() {
  const r = git(["ls-files", "-co", "--exclude-standard"]);
  return r.stdout.split("\n").filter(Boolean)
    .filter((f) => f !== ".claude" && !f.startsWith(".claude/"))
    .filter((f) => exists(f) && fs.statSync(abs(f)).isFile())
    .filter((f) => !BINARY_EXT.test(f));
}
const isTier1Source = (f) =>
  (/\.html$/.test(f) && !f.includes("/")) ||
  f.startsWith("js/") || f.startsWith("css/") || f.startsWith("assets/js/") ||
  f === "vercel.json" || f.startsWith("supabase/");

function siteFiles() {
  return walk(SITE, "").filter((f) => !BINARY_EXT.test(f)).map((f) => "_site/" + f);
}

function selfTest() {
  const out = [];
  const sbVal = W_SB + "abcdefgh1234";
  const roleVal = W_ROLE + ": " + "x".repeat(20);
  const jwtRun = W_JWT + "a".repeat(25);
  const jwt3 = W_JWT + "hbGciOi" + "." + W_JWT + "zdWIiOi" + "." + "sig_abc-123";
  const doc = "Never commit the " + W_ROLE + " key or a value starting " + W_SB + " here.";
  const expect = (label, text, tier, name, want) => {
    const got = scan(text, tier).includes(name);
    if (got !== want) out.push("self-test: " + label + " tier " + tier + (want ? " did not fire" : " fired unexpectedly"));
  };
  expect("sb value", sbVal, 1, "sb-secret-word", true);
  expect("sb value", sbVal, 2, "sb-secret-value", true);
  expect("role word", W_ROLE, 1, "service-role-word", true);
  expect("role value", roleVal, 2, "service-role-value", true);
  expect("jwt run", jwtRun, 1, "jwt-shaped", true);
  expect("jwt run", jwtRun, 2, "jwt-long-run", true);
  expect("jwt three-segment", jwt3, 2, "jwt-three-segment", true);
  if (scan(doc, 1).length === 0) out.push("self-test: documentation sentence did not fire in tier 1");
  if (scan(doc, 2).length !== 0) out.push("self-test: documentation sentence fired in tier 2");
  if (scan(W_SB, 1, { exemptSbWord: true }).includes("sb-secret-word")) out.push("self-test: sb exemption did not apply");
  if (scan(W_ROLE, 1, { exemptSbWord: true }).length === 0) out.push("self-test: exemption leaked to the role pattern");
  return out;
}

function groupSecrets() {
  const fails = selfTest();
  authEnv.load();
  const passwords = [];
  for (const n of ["TEST_CLIENT_A_PASSWORD", "TEST_CLIENT_B_PASSWORD"]) {
    if (process.env[n]) passwords.push({ name: n, value: process.env[n] });
  }
  if (!ensureBuilt()) {
    fails.push("tools/build-site.sh failed, cannot scan _site");
    return fails;
  }
  const repo = repoFiles();
  const site = siteFiles();

  for (const need of ["index.html", ".planning/STATE.md"]) {
    if (!repo.includes(need)) fails.push("scan is vacuous: repo list lacks " + need);
  }
  for (const need of ["_site/index.html", "_site/js/main.js"]) {
    if (!site.includes(need)) fails.push("scan is vacuous: site list lacks " + need);
  }

  let sdkExempt = false;
  if (exists(SDK_REL)) sdkExempt = sha256(fs.readFileSync(abs(SDK_REL))) === SDK_SHA;

  const tier1 = repo.filter(isTier1Source).concat(site);
  const all = new Set(repo.concat(site));
  for (const f of all) {
    let text;
    try { text = fs.readFileSync(abs(f), "utf8"); } catch (e) { continue; }
    const isSdk = f === SDK_REL || f === "_site/" + SDK_REL;
    if (tier1.includes(f)) {
      for (const h of scan(text, 1, { exemptSbWord: isSdk && sdkExempt })) fails.push(f + " matches " + h + " (tier 1)");
    }
    for (const h of scan(text, 2)) fails.push(f + " matches " + h + " (tier 2)");
    for (const p of passwords) {
      if (text.includes(p.value)) fails.push(f + " contains the value of " + p.name);
    }
  }
  return fails;
}

function groupIgnore() {
  const fails = [];
  const gi = read(".gitignore") || "";
  if (!/^\.env\*\s*$/m.test(gi)) fails.push(".gitignore lacks a .env* line");
  const tracked = git(["ls-files"]).stdout.split("\n").filter(Boolean);
  for (const f of tracked) {
    if (/(^|\/)\.env/.test(f)) fails.push("tracked env file: " + f);
    if (f === ".claude" || f.startsWith(".claude/")) fails.push("tracked file under .claude/: " + f);
  }
  if (git(["check-ignore", "-q", ".env.local"]).status !== 0) fails.push("git does not ignore .env.local");
  return fails;
}

function groupHistory() {
  const r = git(["log", "-p", "--all", "--no-color"]);
  if (r.status !== 0) return ["git log failed"];
  const seen = new Set();
  const fails = [];
  let commit = "?";
  for (const line of r.stdout.split("\n")) {
    const m = line.match(/^commit ([0-9a-f]{40})/);
    if (m) { commit = m[1].slice(0, 12); continue; }
    if (line[0] !== "+" && line[0] !== "-") continue;
    for (const h of scan(line, 2)) {
      const key = commit + h;
      if (!seen.has(key)) { seen.add(key); fails.push("commit " + commit + " matches " + h); }
    }
  }
  return fails;
}

// ---------------------------------------------------------------- feature groups
const missing = (rel) => rel + ": file missing";

function groupSdk() {
  const fails = [];
  if (!exists(SDK_REL)) fails.push(missing(SDK_REL));
  else if (sha256(fs.readFileSync(abs(SDK_REL))) !== SDK_SHA) fails.push(SDK_REL + ": sha256 differs from the pinned value");
  const v = read("assets/js/vendor/SUPABASE-VERSION.md");
  if (v === null) fails.push(missing("assets/js/vendor/SUPABASE-VERSION.md"));
  else {
    if (!v.includes("2.119.0")) fails.push("SUPABASE-VERSION.md does not name 2.119.0");
    if (!v.includes(SDK_SHA)) fails.push("SUPABASE-VERSION.md does not record the sha256");
    if (!/https?:\/\//.test(v)) fails.push("SUPABASE-VERSION.md has no source URL");
  }
  const lic = read("assets/js/vendor/SUPABASE-LICENSE.txt");
  if (lic === null) fails.push(missing("assets/js/vendor/SUPABASE-LICENSE.txt"));
  else if (!/MIT/.test(lic)) fails.push("SUPABASE-LICENSE.txt does not mention MIT");
  for (const f of fs.readdirSync(ROOT).filter((n) => n.endsWith(".html"))) {
    const t = read(f);
    if (/<script[^>]*\bsrc="(https?:)?\/\//i.test(t)) fails.push(f + " loads a script from a remote host");
  }
  return fails;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function groupSql() {
  const fails = [];
  const s = read("supabase/schema.sql");
  if (s === null) fails.push(missing("supabase/schema.sql"));
  else {
    if (!/enable\s+row\s+level\s+security/i.test(s)) fails.push("schema.sql: no enable row level security");
    if (!/revoke\s[^;]*from\s[^;]*\banon\b[^;]*\bauthenticated\b|revoke\s[^;]*from\s[^;]*\bauthenticated\b[^;]*\banon\b/i.test(s)) {
      fails.push("schema.sql: no revoke from anon and authenticated");
    }
    if (!/grant\s+select\s[^;]*\bto\s+authenticated\b/i.test(s)) fails.push("schema.sql: no grant select to authenticated");
    const policies = s.match(/create\s+policy[^;]*;/gi) || [];
    if (policies.length !== 1) fails.push("schema.sql: expected exactly one create policy, found " + policies.length);
    else {
      const p = policies[0];
      if (!/for\s+select/i.test(p)) fails.push("schema.sql: policy is not for select");
      if (!/to\s+authenticated/i.test(p)) fails.push("schema.sql: policy is not to authenticated");
      if (!/auth\.uid\(\)/i.test(p)) fails.push("schema.sql: policy does not use auth.uid()");
      if (/\banon\b/i.test(p)) fails.push("schema.sql: policy names anon");
    }
    if (/user_metadata/i.test(s)) fails.push("schema.sql: mentions user_metadata");
    if (/raw_user_meta_data/i.test(s)) fails.push("schema.sql: mentions raw_user_meta_data");
    if (/force\s+row\s+level/i.test(s)) fails.push("schema.sql: uses force row level");
    if (/\bgrant\b[^;]*\banon\b/i.test(s)) fails.push("schema.sql: grants to anon");
  }
  const seed = read("supabase/seed-test-clients.sql");
  if (seed === null) fails.push(missing("supabase/seed-test-clients.sql"));
  else {
    if (!/raise\s+exception/i.test(seed)) fails.push("seed-test-clients.sql: no raise exception guard");
    for (const e of seed.match(EMAIL_RE) || []) {
      if (!/@example\.com$/i.test(e)) fails.push("seed-test-clients.sql: email outside @example.com");
    }
  }
  const t = read("supabase/email-templates.md");
  if (t === null) fails.push(missing("supabase/email-templates.md"));
  else {
    if (!t.includes("token_hash={{ .TokenHash }}")) fails.push("email-templates.md: no token_hash={{ .TokenHash }}");
    if (!t.includes("type=invite")) fails.push("email-templates.md: no type=invite");
    if (!t.includes("type=recovery")) fails.push("email-templates.md: no type=recovery");
    if (t.includes("{{ .ConfirmationURL }}")) fails.push("email-templates.md: uses ConfirmationURL");
  }
  return fails;
}

function groupConfig() {
  const c = read("js/auth-config.js");
  if (c === null) return [missing("js/auth-config.js")];
  const fails = [];
  if (!/url\s*:\s*["']https:\/\/[a-z0-9]+\.supabase\.co["']/.test(c)) fails.push("auth-config.js: url is not https://<ref>.supabase.co");
  if (!/publishableKey\s*:\s*["']sb_publishable_[A-Za-z0-9_-]+["']/.test(c)) fails.push("auth-config.js: publishableKey does not start sb_publishable_");
  if (!/PASSWORD_MIN\s*[:=]\s*10\b/.test(c)) fails.push("auth-config.js: PASSWORD_MIN is not 10");
  if (/REPLACE|placeholder|TODO|YOUR_|<ref>|xxxx/i.test(c)) fails.push("auth-config.js: contains placeholder text");
  return fails;
}

function groupPublic() {
  const fails = [];
  const want = {
    "index.html": ["assets/js/vendor/gsap.min.js", "assets/js/vendor/ScrollTrigger.min.js", "assets/js/vendor/SplitText.min.js", "js/main.js"],
    "contact.html": ["js/main.js"],
  };
  for (const f of Object.keys(want)) {
    const t = read(f);
    if (t === null) { fails.push(missing(f)); continue; }
    const low = t.toLowerCase();
    for (const w of ["supabase", "auth-", "sb_", "login.js", "dashboard.js", "set-password"]) {
      if (low.includes(w)) fails.push(f + ": contains '" + w + "'");
    }
    const srcs = [];
    t.replace(/<script\b[^>]*\bsrc="([^"]+)"/g, (m, s) => { srcs.push(s); return m; });
    if (srcs.join("|") !== want[f].join("|")) fails.push(f + ": script sources are " + JSON.stringify(srcs));
    const links = t.split('<a href="login.html">Client login</a>').length - 1;
    if (links !== 1) fails.push(f + ": expected one plain Client login link, found " + links);
    if ((t.match(/login\.html/g) || []).length !== 1) fails.push(f + ": other reference to login.html");
    if (/dashboard\.html/.test(t)) fails.push(f + ": references dashboard.html");
  }
  return fails;
}

function pageChecks(rel, title, scriptName) {
  const t = read(rel);
  if (t === null) return [missing(rel)];
  const fails = [];
  const need = (cond, msg) => { if (!cond) fails.push(rel + ": " + msg); };
  need(t.includes('<meta name="robots" content="noindex, nofollow">'), "missing robots noindex, nofollow meta");
  need(t.includes("<title>" + title + "</title>"), "title is not '" + title + "'");
  need(!/<meta\s+name="description"/i.test(t), "has a meta description");
  need(/<a class="skip-link" href="#main">/.test(t), "no skip link");
  need(t.includes('<main id="main" tabindex="-1">'), "no main#main with tabindex -1");
  for (const m of ["HEADER START", "HEADER END", "FOOTER START", "FOOTER END"]) need(t.includes("SHELL:" + m), "no SHELL:" + m + " marker");
  need(/<noscript[\s>]/.test(t), "no noscript message");
  need((t.match(/<h1[\s>]/g) || []).length === 1, "expected exactly one h1");
  need(!/<script(?![^>]*\bsrc=)[^>]*>/.test(t), "has an inline script");
  need(!/<style[\s>]/.test(t), "has a style element");
  need(!/\sstyle=/.test(t), "has a style attribute");
  need(!/type="module"/.test(t), "uses a module script");
  const order = [SDK_REL, "js/auth-config.js", "js/auth-common.js", "js/" + scriptName];
  let last = -1;
  for (const src of order) {
    const m = t.match(new RegExp('<script\\b[^>]*\\bdefer\\b[^>]*\\bsrc="' + src.replace(/[.]/g, "\\.") + '"|<script\\b[^>]*\\bsrc="' + src.replace(/[.]/g, "\\.") + '"[^>]*\\bdefer\\b'));
    if (!m) { need(false, "no deferred script " + src); continue; }
    const idx = t.indexOf(m[0]);
    need(idx > last, "script " + src + " is out of order");
    last = idx;
  }
  need(/<script\b[^>]*\bsrc="js\/main\.js"/.test(t), "js/main.js not loaded");
  return fails;
}

function groupLoginPage() { return pageChecks("login.html", "Client login | Sam Whitlock", "login.js"); }

function groupDashboardPage() {
  const fails = pageChecks("dashboard.html", "Your dashboard | Sam Whitlock", "dashboard.js");
  const t = read("dashboard.html");
  if (t !== null) {
    for (const s of ["Sample Starter", "Sample step", "Hello,", "Your plan", "At a glance", "Waiting on you", "Done this month", "Coming up", "Growth plan", "Figures for", "Ask about Growth"]) {
      if (t.includes(s)) fails.push("dashboard.html: contains '" + s + "', it must be created by script after a verified row read");
    }
  }
  return fails;
}

function groupSetpassPage() {
  const fails = pageChecks("set-password.html", "Set your password | Sam Whitlock", "set-password.js");
  const t = read("set-password.html");
  if (t !== null) {
    if (!/<button[^>]*>\s*Continue\s*<\/button>/.test(t)) fails.push("set-password.html: no Continue button");
    if (/<input[^>]*type="password"[^>]*\svalue=/i.test(t)) fails.push("set-password.html: password input has a value attribute");
  }
  return fails;
}

function groupResetCopy() {
  const t = read("login.html");
  if (t === null) return [missing("login.html")];
  const fails = [];
  const noScript = t.replace(/<script[\s\S]*?<\/script>/gi, "");
  if (!/mailto:/i.test(noScript)) fails.push("login.html: no mailto: link for the reset fallback");
  if (!/if nothing arrives/i.test(noScript)) fails.push("login.html: reset wording does not say what to do if nothing arrives");
  if (/a reset link is on its way/i.test(noScript) && !/a reset link should be on its way/i.test(noScript)) {
    fails.push("login.html: unconditional 'a reset link is on its way'");
  }
  if (/is on its way/i.test(noScript) && !/if that email belongs to a client/i.test(noScript)) {
    fails.push("login.html: reset-sent wording is not conditional");
  }
  return fails;
}

function navLinks(t) {
  const m = t.match(/<nav class="site-nav"[^>]*>([\s\S]*?)<\/nav>/);
  if (!m) return null;
  const out = [];
  m[1].replace(/<a href="([^"]+)"([^>]*)>([^<]*)<\/a>/g, (x, href, rest, text) => {
    out.push({ href, text: text.trim(), current: /aria-current="page"/.test(rest) });
    return x;
  });
  return out;
}

function groupNav() {
  const fails = [];
  const pages = { "index.html": "Home", "contact.html": "Contact", "login.html": "Client login", "dashboard.html": "Client login", "set-password.html": null };
  for (const f of Object.keys(pages)) {
    const t = read(f);
    if (t === null) { fails.push(missing(f)); continue; }
    const links = navLinks(t);
    if (!links) { fails.push(f + ": no site-nav"); continue; }
    const sig = links.map((l) => l.text + ">" + l.href).join(" | ");
    if (sig !== "Home>index.html | Contact>contact.html | Client login>login.html") fails.push(f + ": nav links are [" + sig + "]");
    const cur = links.filter((l) => l.current).map((l) => l.text);
    const wantCur = pages[f] === null ? [] : [pages[f]];
    if (cur.join(",") !== wantCur.join(",")) fails.push(f + ": aria-current on [" + cur.join(",") + "], expected [" + wantCur.join(",") + "]");
  }
  return fails;
}

function groupJs() {
  const fails = [];
  const files = ["js/auth-config.js", "js/auth-common.js", "js/login.js", "js/set-password.js", "js/dashboard.js"];
  const texts = {};
  for (const f of files) {
    const t = read(f);
    if (t === null) { fails.push(missing(f)); continue; }
    texts[f] = t;
    const code = t.replace(/^(\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, "");
    if (f !== "js/auth-config.js" && !/^;?\s*(\(function\s*\(|\(\s*\(\s*\)\s*=>|\(\s*function\s*\()/.test(code)) fails.push(f + ": not an IIFE");
    if (/^var\s+supabase\b/m.test(t)) fails.push(f + ": top-level var supabase");
    if (/innerHTML/.test(t)) fails.push(f + ": uses innerHTML");
    if (/console\.log/.test(t)) fails.push(f + ": uses console.log");
    if (/user_metadata/.test(t)) fails.push(f + ": uses user_metadata");
    if (/\beval\b/.test(t)) fails.push(f + ": uses eval");
    if (/redirectTo/.test(t)) fails.push(f + ": uses redirectTo");
    if (/\bfetch\s*\(/.test(t)) fails.push(f + ": calls fetch(");
    if (f !== "js/auth-config.js" && /PASSWORD_MIN\s*[:=]/.test(t)) fails.push(f + ": defines PASSWORD_MIN");
  }
  const c = texts["js/auth-common.js"];
  if (c) {
    if (!/detectSessionInUrl\s*:\s*false/.test(c)) fails.push("js/auth-common.js: detectSessionInUrl is not false");
    const p = c.indexOf("location.protocol"), cc = c.indexOf("createClient");
    if (p < 0) fails.push("js/auth-common.js: never checks location.protocol");
    else if (cc >= 0 && p > cc) fails.push("js/auth-common.js: location.protocol is checked after createClient");
  }
  return fails;
}

function groupCsp() {
  const v = read("vercel.json");
  if (v === null) return [missing("vercel.json")];
  let j;
  try { j = JSON.parse(v); } catch (e) { return ["vercel.json: invalid JSON"]; }
  const fails = [];
  if (j.buildCommand !== "sh tools/build-site.sh") fails.push("vercel.json: buildCommand changed");
  if (j.outputDirectory !== "_site") fails.push("vercel.json: outputDirectory changed");
  if (j.framework !== null) fails.push("vercel.json: framework changed");
  const rule = (j.headers || []).find((h) => h.source === "/(.*)");
  if (!rule) { fails.push("vercel.json: no headers rule for /(.*)"); return fails; }
  const hv = (k) => { const e = (rule.headers || []).find((h) => h.key.toLowerCase() === k.toLowerCase()); return e ? e.value : null; };
  if (hv("Referrer-Policy") !== "same-origin") fails.push("vercel.json: Referrer-Policy is not same-origin");
  if (hv("X-Content-Type-Options") !== "nosniff") fails.push("vercel.json: X-Content-Type-Options is not nosniff");
  if (hv("X-Frame-Options") !== "DENY") fails.push("vercel.json: X-Frame-Options is not DENY");
  const csp = hv("Content-Security-Policy");
  if (csp === null) { fails.push("vercel.json: no Content-Security-Policy"); return fails; }
  if (/unsafe-inline|unsafe-eval/.test(csp)) fails.push("CSP: contains unsafe-inline or unsafe-eval");
  if (/\*/.test(csp)) fails.push("CSP: contains a wildcard");
  const dir = {};
  csp.split(";").map((d) => d.trim()).filter(Boolean).forEach((d) => { const p = d.split(/\s+/); dir[p[0]] = p.slice(1); });
  const script = dir["script-src"] || [];
  if (!script.includes("'self'")) fails.push("CSP: script-src lacks 'self'");
  if (!ensureBuilt()) fails.push("tools/build-site.sh failed, cannot compute inline script hashes");
  else {
    const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
    const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
    let m;
    while ((m = re.exec(html))) {
      const h = "'sha256-" + crypto.createHash("sha256").update(m[1]).digest("base64") + "'";
      if (!script.includes(h)) fails.push("CSP: script-src lacks " + h + " for an inline script in index.html");
    }
  }
  const cfg = read("js/auth-config.js");
  const um = cfg && cfg.match(/url\s*:\s*["'](https:\/\/[a-z0-9]+\.supabase\.co)["']/);
  const conn = (dir["connect-src"] || []).filter((x) => x !== "'self'");
  if (!um) fails.push("CSP: cannot read the origin from js/auth-config.js");
  else if (conn.length !== 1 || conn[0] !== um[1]) fails.push("CSP: connect-src does not name exactly " + um[1]);
  return fails;
}

function groupDocs() {
  const fails = [];
  const c = read("CLAUDE.md");
  if (c === null) fails.push(missing("CLAUDE.md"));
  else {
    if (c.includes("Exactly two pages")) fails.push("CLAUDE.md: still says 'Exactly two pages'");
    if (c.includes("Static only")) fails.push("CLAUDE.md: still says 'Static only'");
    const m = c.match(/### Constraints([\s\S]*?)(\n#{1,3} |$)/);
    const block = m ? m[1] : "";
    for (const w of ["Login", "Set password", "Dashboard", "Supabase"]) {
      if (!block.includes(w)) fails.push("CLAUDE.md: Constraints block does not name " + w);
    }
  }
  const r = read("REPLACE-ME.md");
  if (r === null) fails.push(missing("REPLACE-ME.md"));
  else {
    const m = r.match(/^## Client login[^\n]*\n([\s\S]*?)(\n## |(?![\s\S]))/m);
    if (!m) fails.push("REPLACE-ME.md: no '## Client login' heading");
    else {
      for (const w of ["login.html", "set-password.html", "dashboard.html", "auth-config.js"]) {
        if (!m[1].includes(w)) fails.push("REPLACE-ME.md: Client login section does not list " + w);
      }
    }
  }
  const g = read("CLIENT-GUIDE.md");
  if (g === null) fails.push(missing("CLIENT-GUIDE.md"));
  else {
    const heads = g.split("\n").filter((l) => /^#{1,6}\s/.test(l)).join("\n");
    const need = [
      [/add(ing)?\s+a\s+client/i, "adding a client"],
      [/temporary\s+password/i, "the temporary password"],
      [/edit(ing)?\s+a\s+dashboard/i, "editing a dashboard"],
      [/email\s+limits?/i, "email limits"],
      [/before\s+a\s+demo/i, "checking the project before a demo"],
    ];
    for (const [re, label] of need) if (!re.test(heads)) fails.push("CLIENT-GUIDE.md: no heading for " + label);
  }
  return fails;
}

const GROUPS = {
  secrets: groupSecrets, ignore: groupIgnore, sdk: groupSdk, sql: groupSql, config: groupConfig,
  public: groupPublic, "login-page": groupLoginPage, "dashboard-page": groupDashboardPage,
  "reset-copy": groupResetCopy, "setpass-page": groupSetpassPage, nav: groupNav, js: groupJs,
  csp: groupCsp, docs: groupDocs, history: groupHistory,
};

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => !GROUPS[a]);
  if (unknown.length) {
    console.error("Unknown group(s): " + unknown.join(", ") + ". Known: " + Object.keys(GROUPS).join(", "));
    process.exit(1);
  }
  const names = args.length ? args : Object.keys(GROUPS).filter((g) => g !== "history");
  let bad = 0;
  try {
    for (const g of names) {
      let fails;
      try { fails = GROUPS[g](); } catch (e) { fails = ["guard error: " + e.message]; }
      if (fails.length === 0) console.log("PASS " + g);
      else { bad++; for (const f of fails) console.log("FAIL " + g + ": " + f); }
    }
  } finally {
    cleanupSite();
  }
  if (bad === 0) console.log("AUTH OK");
  process.exit(bad === 0 ? 0 : 1);
}

if (require.main === module) main();
module.exports = { scan };
