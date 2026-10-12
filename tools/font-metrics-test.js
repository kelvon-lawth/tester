#!/usr/bin/env node
// Headless Chrome font-metrics test (FND-04, D-07).
// Uses spawn with an argument array (same safety as execFileSync; headless Chrome hangs after --dump-dom with execFileSync here).
// Usage: node tools/font-metrics-test.js
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const url = require("url");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PAGE = url.pathToFileURL(path.join(__dirname, "font-metrics.html")).href;
const MAX_DELTA = 3;

function dumpDom(size, profile) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--user-data-dir=" + profile,
        "--window-size=" + size,
        "--virtual-time-budget=8000",
        "--dump-dom",
        PAGE,
      ],
      { stdio: ["ignore", "pipe", "ignore"] }
    );
    let out = "";
    let settled = false;
    const finish = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      err ? reject(err) : resolve(out);
    };
    const timer = setTimeout(() => finish(new Error("timed out after 30s")), 30000);
    child.stdout.on("data", (d) => {
      out += d;
      if (/<\/html>\s*$/i.test(out)) finish();
    });
    child.on("error", finish);
    child.on("close", () => finish());
  });
}

function decode(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function measure(size) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "fm-"));
  try {
    const dom = await dumpDom(size, profile);
    const m = /<pre id="results">([\s\S]*?)<\/pre>/.exec(dom);
    if (!m || !m[1].trim()) throw new Error("no results in DOM at " + size);
    return JSON.parse(decode(m[1]));
  } finally {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) { /* temp dir cleanup is best effort */ }
  }
}

(async () => {
  if (!fs.existsSync(CHROME)) {
    console.log("FAIL chrome not found at " + CHROME);
    process.exit(1);
  }
  const fails = [];
  let narrow, wide;
  try {
    narrow = await measure("320,900");
    wide = await measure("1440,900");
  } catch (e) {
    console.log("FAIL " + (e.message || e));
    process.exit(1);
  }

  for (const [label, r] of [["320", narrow], ["1440", wide]]) {
    console.log("--- viewport " + label + " (innerWidth " + (r.viewport && r.viewport.innerWidth) + ") ---");
    if (!r.fontsLoaded) {
      fails.push(label + ": fonts did not load");
      continue;
    }
    for (const k of ["display", "heading", "body"]) {
      const d = r[k];
      console.log(
        k + ": real " + d.real.toFixed(1) + "px, fallback " + d.fallback.toFixed(1) +
          "px, delta " + d.deltaPct.toFixed(2) + "% (raw unadjusted " + d.rawDeltaPct.toFixed(2) + "%)"
      );
    }
    console.log("body lines real/fallback: " + r.bodyLines.real + "/" + r.bodyLines.fallback);
    console.log(
      "restaurant: " + r.restaurant.width.toFixed(1) + "px in " + r.restaurant.contentWidth.toFixed(1) +
        "px, singleLine " + r.restaurant.singleLine
    );
    console.log("scrollWidth " + r.overflow.scrollWidth + " clientWidth " + r.overflow.clientWidth);
    console.log("--fs-display " + r.fsDisplayPx + "px");
    console.log("recommended: " + JSON.stringify(r.recommended));
  }

  if (wide.fontsLoaded) {
    for (const k of ["display", "heading", "body"]) {
      if (Math.abs(wide[k].deltaPct) > MAX_DELTA)
        fails.push(k + " width delta " + wide[k].deltaPct.toFixed(2) + "% > " + MAX_DELTA + "%");
    }
    if (wide.bodyLines.real !== wide.bodyLines.fallback)
      fails.push("body line count differs " + wide.bodyLines.real + " vs " + wide.bodyLines.fallback);
    if (wide.fsDisplayPx > 72) fails.push("--fs-display " + wide.fsDisplayPx + "px > 72px at 1440");
  }
  if (narrow.fontsLoaded) {
    // Headless Chrome enforces a minimum window width, so 320px is simulated in a 320px box
    // using the real --fs-display token with 320px-equivalent vw.
    const s = narrow.sim320;
    console.log(
      "sim 320: token " + s.token + " -> " + s.fontSizePx + "px; restaurant " + s.width.toFixed(1) +
        "px in " + s.contentWidth.toFixed(1) + "px, singleLine " + s.singleLine
    );
    if (!s.fits || !s.singleLine) fails.push("restaurant does not fit on one line at 320px");
    if (s.width > s.contentWidth) fails.push("horizontal overflow at 320px");
    if (narrow.overflow.scrollWidth > narrow.overflow.clientWidth)
      fails.push("document horizontal overflow at narrow window");
    if (s.fontSizePx < 39.99 || s.fontSizePx > 40.01)
      console.log("NOTE --fs-display at 320 is " + s.fontSizePx + "px (documented lowered minimum?)");
  }
  if (wide.fontsLoaded) {
    if (wide.sim320 && wide.fsDisplayPx > 72) fails.push("--fs-display > 72px");
  }

  if (fails.length) {
    fails.forEach((f) => console.log("FAIL " + f));
    process.exit(1);
  }
  console.log("FONT METRICS OK");
  process.exit(0);
})();
