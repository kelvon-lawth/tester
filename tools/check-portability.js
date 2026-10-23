#!/usr/bin/env node
// Static portability scan: proves the site opens over file:// and on any static host.
// Zero dependencies (Node built-ins only). Exit 0 = pass, 1 = fail.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const failures = [];
const fail = (file, reason) => failures.push("FAIL " + file + ": " + reason);

const REQUIRED_PAGES = ["index.html", "contact.html"];
const BLOCKED_HOSTS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.jsdelivr.net",
  "unpkg.com",
  "cdnjs",
];

// Recursive, so vendored code (assets/js/vendor/, js/vendor/) is scanned too.
function listFiles(dir, ext) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  const out = [];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(rel, ext));
    else if (entry.name.endsWith(ext)) out.push(rel);
  }
  return out;
}

const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
const cssFiles = listFiles("css", ".css");
const jsFiles = [...listFiles("js", ".js"), ...listFiles("assets/js", ".js")];

for (const page of REQUIRED_PAGES) {
  if (!fs.existsSync(path.join(ROOT, page))) fail(page, page + " missing");
}

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const isExternal = (v) => /^(?:\/\/|https?:|mailto:|tel:|data:|#)/i.test(v);
const isBadAbsolute = (v) => /^(?:\/|\/\/|https?:)/i.test(v);

function checkExists(file, baseDir, value) {
  const clean = value.split("#")[0].split("?")[0];
  if (!clean) return;
  const target = path.resolve(ROOT, baseDir, clean);
  if (!fs.existsSync(target)) fail(file, "reference does not resolve: " + value);
}

for (const file of htmlFiles) {
  const text = read(file);
  // Every URL attribute on every tag, single or double quoted. (?<![-\w]) skips data-src= etc.
  const tagRe = /<(\w+)\b[^>]*>/gi;
  const attrRe = /(?<![-\w])(href|src|srcset|poster)\s*=\s*(["'])(.*?)\2/gi;
  const refs = [];
  let m;
  while ((m = tagRe.exec(text))) {
    const tag = m[1].toLowerCase();
    let a;
    attrRe.lastIndex = 0;
    while ((a = attrRe.exec(m[0]))) {
      if (a[1].toLowerCase() === "srcset") {
        for (const part of a[3].split(",")) {
          const url = part.trim().split(/\s+/)[0];
          if (url) refs.push([tag, url]);
        }
      } else {
        refs.push([tag, a[3]]);
      }
    }
  }
  for (const [tag, value] of refs) {
    if (tag === "a") {
      if (isExternal(value)) continue;
      if (isBadAbsolute(value)) {
        fail(file, "absolute path in <a href>: " + value);
        continue;
      }
      checkExists(file, ".", value);
      continue;
    }
    if (tag === "img" && /^https?:\/\//i.test(value)) {
      if (file === "styleguide.html") continue; // dev-only page keeps its hotlinked photo
      fail(file, "remote <img> on a shipped page: " + value);
      continue;
    }
    if (/^data:/i.test(value)) continue;
    if (isBadAbsolute(value)) {
      fail(file, "absolute or remote path in <" + tag + ">: " + value);
      continue;
    }
    checkExists(file, ".", value);
  }
  if (/type\s*=\s*["']module["']/i.test(text)) fail(file, 'type="module" is not allowed');
  const scriptRe = /<script\b[^>]*\bsrc\s*=[^>]*>/gi;
  while ((m = scriptRe.exec(text))) {
    if (!/\bdefer\b/i.test(m[0])) fail(file, "<script src> without defer: " + m[0]);
  }
  if (REQUIRED_PAGES.includes(file) || file === "styleguide.html") {
    if (!text.includes('href="css/styles.css"')) fail(file, 'missing href="css/styles.css"');
    if (!text.includes('<script defer src="js/main.js"></script>'))
      fail(file, 'missing <script defer src="js/main.js"></script>');
  }
}

for (const file of cssFiles) {
  const text = read(file);
  const dir = path.dirname(file);
  const urlRe = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  let m;
  while ((m = urlRe.exec(text))) {
    const value = m[2].trim();
    if (/^data:/i.test(value)) continue;
    if (isBadAbsolute(value)) {
      fail(file, "absolute or remote url(): " + value);
      continue;
    }
    checkExists(file, dir, value);
  }
  if (/@import/i.test(text)) fail(file, "@import is not allowed");
}

for (const file of jsFiles) {
  const text = read(file);
  const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  if (/\bfetch\s*\(/.test(code)) fail(file, "fetch( is not allowed (breaks over file://)");
  if (/^\s*import\s/m.test(code)) fail(file, "import statement is not allowed");
  if (/\bimport\s*\(/.test(code)) fail(file, "dynamic import( is not allowed (breaks over file://)");
  if (/\bXMLHttpRequest\b/.test(code)) fail(file, "XMLHttpRequest is not allowed (breaks over file://)");
}

for (const file of [...htmlFiles, ...cssFiles, ...jsFiles]) {
  const text = read(file);
  for (const host of BLOCKED_HOSTS) {
    if (text.includes(host)) fail(file, "references blocked host " + host);
  }
}

if (failures.length) {
  console.log(failures.join("\n"));
  process.exit(1);
}
console.log("PORTABILITY OK");
