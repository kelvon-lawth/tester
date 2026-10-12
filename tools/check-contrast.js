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

console.log(lines.join("\n"));
if (failures.length) {
  console.log(failures.join("\n"));
  process.exit(1);
}
console.log("CONTRAST OK");
