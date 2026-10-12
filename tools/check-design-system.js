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
if (start >= 0 && end === -1) fail("css/styles.css", ":root block has unbalanced braces");
const outside = start < 0 || end === -1 ? css : css.slice(0, start) + css.slice(end + 1);
// data-URIs may legitimately contain encoded characters; ignore url(...) contents
const scanned = outside.replace(/@font-face\s*\{[^}]*\}/g, "").replace(/url\(\s*(["']?)data:[^)]*?\1\s*\)/gi, "url()");

// Per-declaration scan. Accepts a missing trailing ';' before '}'. Selectors and
// @media preludes end in '{', so they never match.
const NAMED_COLOURS = [
  "black", "white", "red", "green", "blue", "yellow", "orange", "purple", "pink", "brown",
  "gray", "grey", "navy", "teal", "coral", "tomato", "gold", "silver", "maroon", "olive",
  "lime", "aqua", "cyan", "magenta", "fuchsia", "indigo", "violet", "salmon", "crimson",
  "beige", "ivory", "khaki", "lavender", "turquoise", "tan", "plum", "orchid", "chocolate",
];
const namedRe = new RegExp("(?<![-\\w])(" + NAMED_COLOURS.join("|") + ")(?![-\\w])", "i");
const declRe = /([a-z-]+)\s*:\s*([^;{}]+)(?=;|\})/gi;
let d;
while ((d = declRe.exec(scanned))) {
  const prop = d[1].toLowerCase();
  const value = d[2].trim();
  const decl = prop + ": " + value;
  if (/#[0-9a-fA-F]{3,8}\b/.test(value)) fail("css/styles.css", "hex colour outside :root: " + decl);
  if (/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/i.test(value))
    fail("css/styles.css", "colour function outside :root: " + decl);
  if (namedRe.test(value)) fail("css/styles.css", "named colour outside :root: " + decl);
  if (prop === "font") fail("css/styles.css", "font shorthand bypasses size/weight tokens: " + decl);
  if (prop === "font-size" && !/var\(--fs-/.test(value)) fail("css/styles.css", "font-size not a token: " + decl);
  if (prop === "font-weight" && !/var\(--fw-/.test(value)) fail("css/styles.css", "font-weight not a token: " + decl);
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
    // Squiggle budget: dividers plus the Home timeline connector (steps__connector) count together.
    const conn = (text.match(/class="[^"]*\bsteps__connector\b[^"]*"/g) || []).length;
    if (sq.length + conn > 2) fail(file, "more than 2 squiggles (divider-squiggle + steps__connector)");
    if (sq.filter((c) => /divider-squiggle--coral/.test(c)).length + conn > 1) fail(file, "more than 1 coral squiggle (divider-squiggle--coral + steps__connector)");
  }
  for (const tag of text.match(/<[^>]*\baccent-underline\b[^>]*>/g) || []) {
    if (!/\bhero-word\b/.test(tag) && !/class="accent-underline__svg"/.test(tag)) fail(file, "accent-underline outside .hero-word: " + tag);
  }
  // Phase 3 swaps the cycling word's text; keep it in its own span so the SVG survives.
  for (const tag of text.match(/<span\b[^>]*class="[^"]*\bhero-word\b[^"]*\baccent-underline\b[^"]*"[^>]*>(?!<span class="hero-word__text">)/g) || []) {
    fail(file, "hero word text must be wrapped in .hero-word__text: " + tag);
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

// ---- Blue allow-list: --color-blue is reserved (UI-SPEC accent list)
const BLUE_ALLOWED = new Set([
  ":focus-visible",                 // reserved item 4: focus ring
  "a",                              // item 3: inline text links
  '.site-nav a[aria-current="page"]', // item 3: current page indicator
  ".btn--primary",                  // item 1: primary CTA
  ".is-focus",                      // item 4: focus ring (style guide state)
  ".prose a",
  ".field__input:focus",
  ".field__input.is-focus",
  ".link-cta",                      // item 3: text CTA link
  ".service-card__icon",            // item 5 (Phase 2): service icons
  ".step__badge",                   // item 6 (Phase 2): step badges
]);
{
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let r;
  while ((r = ruleRe.exec(outside))) {
    if (!/var\(--color-blue\)/.test(r[2])) continue;
    for (const raw of r[1].split(",")) {
      const sel = raw.replace(/\s+/g, " ").trim();
      if (!BLUE_ALLOWED.has(sel) && !sel.startsWith(".sg-")) fail("css/styles.css", "blue used outside the reserved list: " + sel);
    }
  }
}

// ---- Shell parity and typographic apostrophes (index.html, contact.html only)
{
  const block = (text, name) => {
    const a = text.indexOf("<!-- SHELL:" + name + " START -->");
    const b = text.indexOf("<!-- SHELL:" + name + " END -->");
    return a < 0 || b < 0 ? null : text.slice(a, b).replace(/ aria-current="page"/g, "");
  };
  for (const name of ["HEADER", "FOOTER"]) {
    const blocks = ["index.html", "contact.html"].map((f) => {
      const b = block(read(f), name);
      if (b === null) fail(f, "SHELL:" + name + " marker missing");
      return b;
    });
    if (blocks[0] !== null && blocks[1] !== null && blocks[0] !== blocks[1]) fail("index.html", "SHELL:" + name + " differs between index.html and contact.html");
  }
  for (const file of ["index.html", "contact.html"]) {
    const stripped = read(file)
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "");
    const bodyText = stripped.replace(/<[^>]*>/g, "\u0001");
    const bad = /'|&#39;|&apos;/.exec(bodyText);
    if (bad) fail(file, "straight apostrophe in visible text: " + bodyText.slice(Math.max(0, bad.index - 15), bad.index + 15).replace(/\u0001/g, " ").replace(/\s+/g, " "));
    for (const a of stripped.match(/\b(?:title|alt|aria-label|content)="[^"]*'[^"]*"/g) || []) {
      fail(file, "straight apostrophe in visible text: " + a.slice(0, 30));
    }
    for (const t of stripped.match(/<title>[^<]*<\/title>/g) || []) {
      if (t.includes("'")) fail(file, "straight apostrophe in visible text: " + t.slice(0, 30));
    }
  }
}

if (failures.length) {
  console.log(failures.join("\n"));
  process.exit(1);
}
console.log("DESIGN SYSTEM OK");
