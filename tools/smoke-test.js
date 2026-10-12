#!/usr/bin/env node
// Headless Chrome file:// smoke test. Mimics a double-click open (no file-access flags).
// Usage: node tools/smoke-test.js [page.html ...]
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const url = require("url");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

let pages = process.argv.slice(2);
if (!pages.length) {
  pages = ["index.html", "contact.html"];
  if (fs.existsSync(path.join(ROOT, "styleguide.html"))) pages.push("styleguide.html");
}

let failed = false;

if (!fs.existsSync(CHROME)) {
  console.log("FAIL chrome not found at " + CHROME);
  process.exit(1);
}

for (const page of pages) {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) {
    console.log("FAIL " + page + ": page missing");
    failed = true;
    continue;
  }
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "smoke-"));
  try {
    const dom = execFileSync(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--user-data-dir=" + profile,
        "--virtual-time-budget=5000",
        "--dump-dom",
        url.pathToFileURL(file).href,
      ],
      { encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "ignore"], maxBuffer: 20 * 1024 * 1024 }
    );
    const tag = /<html\b[^>]*>/i.exec(dom);
    const cls = tag && /class="([^"]*)"/i.exec(tag[0]);
    const classes = cls ? cls[1].split(/\s+/).filter(Boolean) : [];
    if (classes.includes("no-js")) {
      console.log("FAIL " + page + ": still has no-js (" + classes.join(" ") + ")");
      failed = true;
    } else if (!classes.includes("js")) {
      console.log("FAIL " + page + ": js class missing (" + classes.join(" ") + ")");
      failed = true;
    } else if (!classes.includes("fonts-loaded")) {
      console.log("FAIL " + page + ": fonts-loaded missing (" + classes.join(" ") + ")");
      failed = true;
    } else {
      console.log("PASS " + page + " (" + classes.join(" ") + ")");
    }
  } catch (e) {
    console.log("FAIL " + page + ": " + (e.message || e).split("\n")[0]);
    failed = true;
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

process.exit(failed ? 1 : 0);
