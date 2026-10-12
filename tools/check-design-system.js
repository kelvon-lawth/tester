#!/usr/bin/env node
// Static design-system guard: tokens-only CSS, exactly 2 accent types, style guide complete.
// Zero dependencies. Exit 0 = pass, 1 = fail.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const failures = [];
const fail = (file, reason) => failures.push("FAIL " + file + ": " + reason);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));

// ---- CSS rules (a) and (b)
const rawCss = read("css/styles.css");
let css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");
const start = css.indexOf(":root {");
let end = -1;
if (start < 0) fail("css/styles.css", "no :root block");
else {
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) { end = i; break; }
  }
}
const outside = start < 0 ? css : css.slice(0, start) + css.slice(end + 1);
// data-URIs may legitimately contain encoded characters; ignore url(...) contents
const scanned = outside.replace(/@font-face\s*\{[^}]*\}/g, "").replace(/url\(\s*(["']?)data:[^)]*?\1\s*\)/gi, "url()");

const hexes = scanned.match(/#[0-9a-fA-F]{3,8}\b(?![-\w])/g);
// ignore id selectors: only flag hex used as a value (after ':' or whitespace within declarations)
for (const decl of scanned.match(/[a-z-]+\s*:[^;{}]*;/gi) || []) {
  if (/#[0-9a-fA-F]{3,8}\b/.test(decl.replace(/^[^:]+:/, ""))) fail("css/styles.css", "hex colour outside :root: " + decl.trim());
}
void hexes;
for (const decl of scanned.match(/font-size\s*:[^;}]*/gi) || []) {
  if (!/var\(--fs-/.test(decl)) fail("css/styles.css", "font-size not a token: " + decl.trim());
}
for (const decl of scanned.match(/font-weight\s*:[^;}]*/gi) || []) {
  if (!/var\(--fw-/.test(decl)) fail("css/styles.css", "font-weight not a token: " + decl.trim());
}

if (!/\.divider-squiggle\b/.test(css)) fail("css/styles.css", ".divider-squiggle not defined");
if (!/\.accent-underline\b/.test(css)) fail("css/styles.css", ".accent-underline not defined");
for (const word of ["grain", "noise", "blob", "feTurbulence", "italic"]) {
  if (new RegExp(word, "i").test(css)) fail("css/styles.css", "forbidden word: " + word);
}

// ---- Style guide (c) and (e)
if (!exists("styleguide.html")) {
  fail("styleguide.html", "file missing");
} else {
  const sg = read("styleguide.html");
  for (const id of ["sg-colors", "sg-contrast", "sg-type", "sg-spacing", "sg-accents", "sg-hero", "sg-buttons", "sg-icons", "sg-photo", "sg-grid"]) {
    if (!new RegExp('id="' + id + '"').test(sg)) fail("styleguide.html", "missing section id " + id);
  }
  const m = sg.match(/data-words="([^"]*)"/);
  if (!m || m[1] !== "bakery,café,salon,gym,florist,shop,restaurant") fail("styleguide.html", "data-words list missing or wrong order");
  const lis = (sg.match(/<ul[^>]*data-words[\s\S]*?<\/ul>/) || [""])[0];
  const order = ["bakery", "café", "salon", "gym", "florist", "shop", "restaurant"];
  let pos = 0;
  for (const w of order) {
    const i = lis.indexOf(">" + w + "<", pos);
    if (i < 0) { fail("styleguide.html", "hero word list missing/out of order: " + w); break; }
    pos = i;
  }
}

// ---- HTML-wide rules (d), (f), (g), (h)
for (const file of htmlFiles) {
  const text = read(file);
  if (/\sstyle\s*=/i.test(text)) fail(file, "inline style= attribute");
  if (file !== "styleguide.html") {
    const sq = (text.match(/class="[^"]*\bdivider-squiggle\b[^"]*"/g) || []);
    if (sq.length > 2) fail(file, "more than 2 divider-squiggle elements");
    if (sq.filter((c) => /divider-squiggle--coral/.test(c)).length > 1) fail(file, "more than 1 coral squiggle");
  }
  for (const tag of text.match(/<[^>]*\baccent-underline\b[^>]*>/g) || []) {
    if (!/\bhero-word\b/.test(tag) && !/class="accent-underline__svg"/.test(tag)) fail(file, "accent-underline outside .hero-word: " + tag);
  }
  if (file === "index.html" && (text.match(/class="[^"]*\baccent-underline\b(?!__)[^"]*"/g) || []).length > 1) {
    fail(file, ".accent-underline appears more than once");
  }
  for (const img of text.match(/<img\b[^>]*>/gi) || []) {
    if (!/src="https?:/i.test(img)) continue;
    for (const attr of ["width", "height", "alt"]) {
      if (!new RegExp("\\b" + attr + "=\"").test(img)) fail(file, "remote <img> missing " + attr);
    }
    if (!/referrerpolicy="no-referrer"/.test(img)) fail(file, 'remote <img> missing referrerpolicy="no-referrer"');
  }
}

if (failures.length) {
  console.log(failures.join("\n"));
  process.exit(1);
}
console.log("DESIGN SYSTEM OK");
