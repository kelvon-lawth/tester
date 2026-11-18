#!/usr/bin/env node
// Credential loader. Fills process.env from an untracked .env.local in the primary
// checkout root. Never prints a value. `--check` prints variable names only.
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const NAMES = ["TEST_CLIENT_A_EMAIL", "TEST_CLIENT_A_PASSWORD", "TEST_CLIENT_B_EMAIL", "TEST_CLIENT_B_PASSWORD"];

function primaryRoot() {
  const r = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
    cwd: path.resolve(__dirname, ".."), encoding: "utf8",
  });
  if (r.status !== 0) return path.resolve(__dirname, "..");
  return path.dirname(r.stdout.trim());
}

function load() {
  const file = path.join(primaryRoot(), ".env.local");
  if (!fs.existsSync(file)) return false;
  const text = fs.readFileSync(file, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line[0] === "#") continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
  return true;
}

function secretValues() {
  return ["TEST_CLIENT_A_PASSWORD", "TEST_CLIENT_B_PASSWORD"]
    .map((n) => process.env[n])
    .filter((v) => typeof v === "string" && v.length > 0);
}

module.exports = { load, secretValues, NAMES };

if (require.main === module && process.argv.includes("--check")) {
  load();
  for (const n of NAMES) console.log(n + ": " + (process.env[n] ? "set" : "missing"));
}
