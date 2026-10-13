#!/usr/bin/env node
// WCAG 2.x contrast guard for the :root colour tokens in css/styles.css.
// Usage: node tools/check-contrast.js [path-to-css]. Zero dependencies.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const cssPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "css", "styles.css");
const failures = [];

const EXPECTED_TOKENS = {
  "--color-bg": "#FFFFFF",
  "--color-tint": "#F1F5FF",
  "--color-navy": "#1B2A4A",
  "--color-ink": "#1C1E21",
  "--color-ink-soft": "#4A5568",
  "--color-blue": "#3B5BFD",
  "--color-blue-hover": "#2A44D4",
  "--color-coral": "#FF6B6B",
  "--color-error": "#C62828",
  "--color-line": "#C9D3EE",
};

const NAMES = {
  white: "--color-bg",
  tint: "--color-tint",
  navy: "--color-navy",
  ink: "--color-ink",
  "ink-soft": "--color-ink-soft",
  blue: "--color-blue",
  "blue-hover": "--color-blue-hover",
  coral: "--color-coral",
  error: "--color-error",
  "field-border": "--color-field-border",
};

// fg/bg -> ratio stated in UI-SPEC
const REQUIRED = {
  "ink/white": 16.71,
  "ink/tint": 15.31,
  "ink-soft/white": 7.53,
  "ink-soft/tint": 6.9,
  "blue/white": 5.12,
  "blue/tint": 4.69,
  "white/blue": 5.12,
  "white/blue-hover": 7.3,
  "blue-hover/white": 7.3,
  "blue-hover/tint": 6.69,
  "white/navy": 14.22,
  "tint/navy": 13.03,
  "coral/navy": 5.12,
  "error/white": 5.62,
  "error/tint": 5.15,
};
const FORBIDDEN = ["coral/white", "blue/navy"];
// Non-text UI boundaries (WCAG 1.4.11): fg/bg -> expected ratio, minimum 3:1
const NON_TEXT = {
  "field-border/white": 7.53,
  "field-border/tint": 6.9,
  "blue/tint": 4.69,  // Phase 2: service icon (blue) on its tint tile, blue reserved item 5
  "blue/white": 5.12, // Phase 2: step badge fill (blue) against white page, reserved item 6
  "white/navy": 14.22, // Phase 2: 2px white border of .btn--on-navy against the navy band
};

function channel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function ratio(fg, bg) {
  const a = luminance(fg), b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const css = fs.readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const start = css.indexOf(":root {");
if (start < 0) {
  console.log("FAIL no :root block in " + cssPath);
  process.exit(1);
}
let depth = 0, end = -1;
for (let i = css.indexOf("{", start); i < css.length; i++) {
  if (css[i] === "{") depth++;
  else if (css[i] === "}" && --depth === 0) { end = i; break; }
}
const rootBlock = css.slice(start, end);

const tokens = {};
const re = /(--color-[a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g;
let m;
while ((m = re.exec(rootBlock))) tokens[m[1]] = m[2].toUpperCase();
// Resolve alias tokens such as --color-field-border: var(--color-ink-soft);
const aliasRe = /(--color-[a-z-]+)\s*:\s*var\(\s*(--color-[a-z-]+)\s*\)\s*;/g;
while ((m = aliasRe.exec(rootBlock))) {
  if (tokens[m[2]]) tokens[m[1]] = tokens[m[2]];
}

for (const [name, value] of Object.entries(EXPECTED_TOKENS)) {
  if (!tokens[name]) failures.push("FAIL token missing: " + name);
  else if (tokens[name] !== value) failures.push("FAIL token " + name + " is " + tokens[name] + ", expected " + value);
}

function compute(pair) {
  const [fg, bg] = pair.split("/");
  const f = tokens[NAMES[fg]], b = tokens[NAMES[bg]];
  if (!f || !b) return null;
  return ratio(f, b);
}

const lines = [];
for (const [pair, expected] of Object.entries(REQUIRED)) {
  const r = compute(pair);
  if (r === null) { failures.push("FAIL cannot compute " + pair); continue; }
  const shown = r.toFixed(2);
  if (r < 4.5) failures.push("FAIL " + pair + " " + shown + ":1 is below 4.5:1");
  else if (Math.abs(r - expected) > 0.02) failures.push("FAIL " + pair + " " + shown + ":1 differs from UI-SPEC " + expected);
  else lines.push("PASS " + pair + " " + shown + ":1");
}
for (const [pair, expected] of Object.entries(NON_TEXT)) {
  const r = compute(pair);
  if (r === null) { failures.push("FAIL cannot compute " + pair); continue; }
  const shown = r.toFixed(2);
  if (r < 3) failures.push("FAIL non-text " + pair + " " + shown + ":1 is below 3:1 (WCAG 1.4.11)");
  else if (Math.abs(r - expected) > 0.02) failures.push("FAIL non-text " + pair + " " + shown + ":1 differs from expected " + expected);
  else lines.push("PASS non-text " + pair + " " + shown + ":1");
}
for (const pair of FORBIDDEN) {
  const r = compute(pair);
  if (r === null) { failures.push("FAIL cannot compute " + pair); continue; }
  const shown = r.toFixed(2);
  if (r >= 4.5) failures.push("FAIL forbidden pairing " + pair + " now passes at " + shown + ":1 (spec expects < 4.5)");
  else lines.push("FORBIDDEN " + pair + " " + shown + ":1");
}

// ---------------------------------------------------------------------------
// Translucent tokens (glows, glass surfaces): composite over the real
// backgrounds and re-check text contrast. Tokens must not use the --color- prefix.
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex(rgb) {
  return "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function over(rgba, bgHex) {
  const bg = hexToRgb(bgHex);
  const a = rgba[3];
  return toHex([0, 1, 2].map((i) => a * rgba[i] + (1 - a) * bg[i]));
}
const translucent = {};
const trRe = /(--(?:glow|surface-glass)[a-z-]*)\s*:\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)\s*;/g;
while ((m = trRe.exec(rootBlock))) translucent[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])];

function checkText(label, bgHex, fgNames) {
  for (const fg of fgNames) {
    const r = ratio(tokens[NAMES[fg]], bgHex);
    const shown = r.toFixed(2);
    if (r < 4.5) failures.push("FAIL " + label + " " + fg + " on composite " + bgHex + " " + shown + ":1 is below 4.5:1");
    else lines.push("PASS " + label + " " + fg + " " + shown + ":1");
  }
}

const glowNames = Object.keys(translucent).filter((n) => n.startsWith("--glow-"));
if (!glowNames.length) failures.push("FAIL glow token missing: no --glow-* rgba token in :root");
for (const n of glowNames) {
  if (n.indexOf("navy") >= 0) {
    checkText("glow " + n + " over navy", over(translucent[n], tokens["--color-navy"]), ["white", "tint", "coral"]);
  } else if (n.startsWith("--glow-hero-")) {
    // Hero fields (quick 261013-ffc): saturated enough to be bold, so blue TEXT is not expected to pass on the
    // bare field. Ink and ink-soft are checked here; blue (link-cta) is checked in the HERO group on its glass pill.
    checkText("glow " + n + " over white", over(translucent[n], tokens["--color-bg"]), ["ink", "ink-soft"]);
    checkText("glow " + n + " over tint", over(translucent[n], tokens["--color-tint"]), ["ink", "ink-soft"]);
  } else {
    checkText("glow " + n + " over white", over(translucent[n], tokens["--color-bg"]), ["ink", "ink-soft", "blue"]);
    checkText("glow " + n + " over tint", over(translucent[n], tokens["--color-tint"]), ["ink", "ink-soft"]);
  }
}
for (const n of ["--surface-glass-solid", "--surface-glass-top"]) {
  if (!translucent[n]) { failures.push("FAIL glass token missing: " + n); continue; }
}
if (translucent["--surface-glass-solid"]) {
  for (const bg of ["--color-navy", "--color-bg", "--color-tint"]) {
    checkText("glass solid over " + bg, over(translucent["--surface-glass-solid"], tokens[bg]), ["ink", "blue"]);
  }
}
if (translucent["--surface-glass-top"]) {
  for (const bg of ["--color-bg", "--color-tint"]) {
    checkText("glass top over " + bg, over(translucent["--surface-glass-top"], tokens[bg]), ["ink", "blue"]);
  }
}

// HERO group (quick 261013-ffc): all --glow-hero-* fields stacked (worst-case overlap) over tint and bg.
{
  const heroNames = Object.keys(translucent).filter((n) => n.startsWith("--glow-hero-"));
  if (heroNames.length < 2) {
    failures.push("FAIL HERO glow-hero token missing: need at least two --glow-hero-* rgba tokens in :root (found " + heroNames.length + ")");
  } else {
    const glass = translucent["--surface-glass-solid"];
    for (const baseName of ["--color-tint", "--color-bg"]) {
      let comp = tokens[baseName];
      for (const n of heroNames) comp = over(translucent[n], comp);
      checkText("HERO stacked fields over " + baseName + " (" + comp + ")", comp, ["ink", "ink-soft"]);
      // The only blue text in the hero is .link-cta, which sits on a --surface-glass-solid pill.
      if (glass) {
        const pill = over(glass, comp);
        checkText("HERO link-cta glass pill over stacked " + baseName + " (" + pill + ")", pill, ["ink", "blue"]);
      }
    }
  }
}

console.log(lines.join("\n"));
if (failures.length) {
  console.log(failures.join("\n"));
  process.exit(1);
}
console.log("CONTRAST OK");
