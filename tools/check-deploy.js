#!/usr/bin/env node
// Guard 12: builds _site with tools/build-site.sh and asserts its exact contents,
// reference resolution and deploy config. Zero dependencies. Exit 0 = pass, 1 = fail.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const failures = [];
const fail = (file, reason) => failures.push("FAIL " + file + ": " + reason);
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const readIf = (abs) => (fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null);

const REQUIRED = [
  "index.html", "contact.html", "css/styles.css", "js/main.js",
  "assets/fonts/Fraunces-SemiBold.woff2", "assets/fonts/Figtree-Regular.woff2", "assets/fonts/Figtree-SemiBold.woff2",
  "assets/fonts/OFL-Fraunces.txt", "assets/fonts/OFL-Figtree.txt",
  "assets/js/vendor/gsap.min.js", "assets/js/vendor/ScrollTrigger.min.js", "assets/js/vendor/SplitText.min.js",
];
const IMG_RE = /^assets\/img\/[^/]+\.(webp|jpg|jpeg|png|svg|avif)$/i;
const REQUIRED_IMG = [
  "about-portrait.webp", "avatar-lena-fischer.webp", "avatar-marcus-bell.webp",
  "avatar-priya-nair.webp", "hero-shop-owner.webp",
].map((f) => "assets/img/" + f);

function walk(dir, base) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = base ? base + "/" + name : name;
    if (fs.statSync(abs).isDirectory()) out.push(...walk(abs, rel));
    else out.push(rel);
  }
  return out;
}

function runBuild(sha) {
  const env = Object.assign({}, process.env);
  delete env.GITHUB_SHA;
  delete env.VERCEL_GIT_COMMIT_SHA;
  env.VERCEL_GIT_COMMIT_SHA = sha;
  return spawnSync("sh", [path.join(ROOT, "tools", "build-site.sh")], { cwd: os.tmpdir(), env, encoding: "utf8" });
}

// ---- Build, from another directory, with a stale file planted first
const script = path.join(ROOT, "tools", "build-site.sh");
let built = false;
if (!fs.existsSync(script)) {
  fail("tools/build-site.sh", "file missing");
} else {
  const s = fs.readFileSync(script, "utf8");
  if (!s.startsWith("#!/bin/sh")) fail("tools/build-site.sh", "must start with #!/bin/sh");
  if (s.includes("sed -i")) fail("tools/build-site.sh", "must not use sed -i");
  fs.mkdirSync(SITE, { recursive: true });
  fs.writeFileSync(path.join(SITE, "stale-file.txt"), "stale");
  const r = runBuild("abc123def");
  if (r.status !== 0) fail("tools/build-site.sh", "build exited " + r.status + ": " + (r.stderr || "").trim());
  else built = true;
}

if (built) {
  if (exists("_site/stale-file.txt")) fail("_site", "stale file survived the build");

  const files = walk(SITE, "");
  for (const f of REQUIRED) if (!files.includes(f)) fail("_site", "missing " + f);
  for (const f of REQUIRED_IMG) if (!files.includes(f)) fail("_site", "missing " + f);
  for (const f of files) {
    if (!REQUIRED.includes(f) && !IMG_RE.test(f)) fail("_site", "unexpected file " + f);
  }

  for (const f of ["index.html", "contact.html"]) {
    const local = readIf(path.join(ROOT, f)) || "";
    if (!local.includes('href="styleguide.html"')) fail(f, 'local copy lost its href="styleguide.html" footer link (D-05)');
  }

  const idx = readIf(path.join(SITE, "index.html")) || "";
  if (!/<!-- build abc123def -->\s*$/.test(idx)) fail("_site/index.html", "must end with <!-- build abc123def -->");

  const r2 = runBuild("a-->b");
  if (r2.status !== 0) fail("tools/build-site.sh", "second build exited " + r2.status + ": " + (r2.stderr || "").trim());
  else {
    const idx2 = readIf(path.join(SITE, "index.html")) || "";
    if (!/<!-- build ab -->\s*$/.test(idx2)) fail("_site/index.html", "hostile SHA not reduced to <!-- build ab -->");
  }

  // Content checks
  const texts = {};
  for (const f of ["index.html", "contact.html", "css/styles.css", "js/main.js"]) texts[f] = readIf(path.join(SITE, f)) || "";
  for (const f of Object.keys(texts)) {
    if (/styleguide|style guide/i.test(texts[f])) fail("_site/" + f, "mentions the style guide");
  }
  if (texts["css/styles.css"].includes(".sg-")) fail("_site/css/styles.css", "contains .sg- rules");
  if (texts["css/styles.css"].includes("removed in Phase 5")) fail("_site/css/styles.css", 'contains "removed in Phase 5"');
  for (const f of ["index.html", "contact.html"]) {
    if (!texts[f].includes("Prototype — sample content")) fail("_site/" + f, "prototype note missing");
  }

  // Reference checks
  const tagRe = /<(\w+)\b[^>]*>/gi;
  const attrRe = /(?<![-\w])(href|src|srcset|poster)\s*=\s*(["'])(.*?)\2/gi;
  const isExternal = (v) => /^(?:\/\/|https?:|mailto:|tel:|data:|#)/i.test(v);
  const urlRe = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  const check = (file, baseDir, value) => {
    const v = value.trim();
    if (!v || isExternal(v)) return;
    if (v.startsWith("/")) return fail("_site/" + file, "root-absolute reference " + v);
    const clean = v.split("#")[0].split("?")[0];
    const target = path.resolve(path.join(SITE, baseDir), decodeURIComponent(clean));
    if (target !== SITE && !target.startsWith(SITE + path.sep)) return fail("_site/" + file, "reference escapes _site: " + v);
    if (!fs.existsSync(target)) fail("_site/" + file, "unresolved reference " + v);
  };
  for (const f of ["index.html", "contact.html"]) {
    let t;
    while ((t = tagRe.exec(texts[f]))) {
      let a;
      attrRe.lastIndex = 0;
      while ((a = attrRe.exec(t[0]))) {
        if (a[1].toLowerCase() === "srcset") {
          for (const part of a[3].split(",")) check(f, "", part.trim().split(/\s+/)[0]);
        } else check(f, "", a[3]);
      }
    }
  }
  {
    let u;
    while ((u = urlRe.exec(texts["css/styles.css"]))) check("css/styles.css", "css", u[2]);
  }
}

// ---- Config checks
{
  const vj = readIf(path.join(ROOT, "vercel.json"));
  if (vj === null) fail("vercel.json", "file missing");
  else {
    let j = null;
    try { j = JSON.parse(vj); } catch (e) { fail("vercel.json", "does not parse: " + e.message); }
    if (j) {
      if (j.buildCommand !== "sh tools/build-site.sh") fail("vercel.json", 'buildCommand must be "sh tools/build-site.sh"');
      if (j.outputDirectory !== "_site") fail("vercel.json", 'outputDirectory must be "_site"');
      if (j.framework !== null) fail("vercel.json", "framework must be null");
      if (j.cleanUrls === true) fail("vercel.json", "cleanUrls must not be true");
    }
  }
  const gi = readIf(path.join(ROOT, ".gitignore"));
  if (gi === null) fail(".gitignore", "file missing");
  else {
    const lines = gi.split(/\r?\n/).map((l) => l.trim());
    for (const need of ["_site/", ".vercel/"]) if (!lines.includes(need)) fail(".gitignore", "missing line " + need);
    if (lines.some((l) => l.includes(".claude"))) fail(".gitignore", "must not mention .claude (D-08)");
  }
  const pages = readIf(path.join(ROOT, ".github/workflows/pages.yml"));
  if (pages !== null) {
    if (!pages.includes("sh tools/build-site.sh")) fail(".github/workflows/pages.yml", "must run sh tools/build-site.sh");
    if (pages.includes("cp -R")) fail(".github/workflows/pages.yml", "must not copy files itself (cp -R)");
  }
}

try { fs.rmSync(SITE, { recursive: true, force: true }); } catch (e) { /* best effort */ }

if (failures.length) {
  console.log(failures.join("\n"));
  process.exit(1);
}
console.log("DEPLOY OK");
