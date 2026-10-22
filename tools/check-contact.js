#!/usr/bin/env node
// Static contract test for contact.html and its form script (quick task 261013-eil).
// Usage: node tools/check-contact.js [markup|success|details|js|map|replace ...]   (no args = every group)
// Prints PASS/FAIL per group, then CONTACT OK on success. Exit 0 = pass, 1 = fail.
// Dev-only (removed in Phase 5). Zero dependencies.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => (fs.existsSync(path.join(ROOT, rel)) ? fs.readFileSync(path.join(ROOT, rel), "utf8") : "");
const contact = read("contact.html");
const mainJs = read("js/main.js");
const replaceMe = read("REPLACE-ME.md");

const mainOf = (html) => { const m = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/); return m ? m[1] : ""; };
const textOf = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const main = mainOf(contact);
const formM = main.match(/<form\b[^>]*id="contact-form"[^>]*>[\s\S]*?<\/form>/);
const form = formM ? formM[0] : "";

function control(id) {
  const re = new RegExp('<(input|textarea|select)\\b[^>]*\\bid="' + id + '"[^>]*>');
  const m = form.match(re);
  return m ? m[0] : null;
}

const groups = {};

groups.markup = () => {
  const e = [];
  if (!form) return ["form#contact-form not found in <main>"];
  if (!/<form\b[^>]*\bnovalidate\b/.test(form)) e.push("form lacks novalidate");
  const controls = form.match(/<(input|textarea|select)\b[^>]*>/g) || [];
  const ids = controls.map((c) => (c.match(/\bid="([^"]+)"/) || [, ""])[1]).sort();
  if (ids.join(",") !== "email,message,name,phone") e.push("controls must be exactly name, phone, email, message (found " + ids.join(",") + ")");
  if (/(?:id|name)="[^"]*business/i.test(form) || /<select\b/.test(form) || /type="checkbox"/.test(form)) e.push("form must not contain business, select or checkbox fields (D-01)");
  for (const id of ["name", "phone", "email"]) {
    const c = control(id);
    if (!c) { e.push("missing #" + id); continue; }
    if (!/\brequired\b/.test(c)) e.push(id + " not required");
    if (!c.includes('aria-describedby="' + id + '-error"')) e.push(id + " lacks aria-describedby");
    const err = form.match(new RegExp('<p\\b[^>]*id="' + id + '-error"[^>]*>'));
    if (!err || !err[0].includes('aria-live="polite"') || !/class="[^"]*field__error/.test(err[0])) e.push(id + "-error must be p.field__error with aria-live=polite");
  }
  const phone = control("phone"), email = control("email"), msg = control("message");
  if (phone && !(phone.includes('type="tel"') && phone.includes('autocomplete="tel"'))) e.push('phone needs type="tel" and autocomplete="tel"');
  if (email && !email.includes('type="email"')) e.push('email needs type="email"');
  if (msg && /\brequired\b/.test(msg)) e.push("message must not be required");
  for (const id of ["name", "phone", "email", "message"]) {
    if (!new RegExp('<label\\b[^>]*\\bfor="' + id + '"').test(form)) e.push("no <label for=" + id + ">");
  }
  if (!/<button\b[^>]*class="[^"]*\bbtn btn--primary\b[^"]*"[^>]*type="submit"|<button\b[^>]*type="submit"[^>]*class="[^"]*\bbtn btn--primary\b/.test(form)) e.push("no submit button.btn.btn--primary");
  return e;
};

groups.success = () => {
  const e = [];
  const m = main.match(/<div\b[^>]*id="contact-success"[^>]*>[\s\S]*?<\/div>/);
  if (!m) return ["#contact-success not found"];
  const open = m[0].match(/<div\b[^>]*>/)[0];
  if (!/\bhidden\b/.test(open)) e.push("#contact-success lacks hidden");
  if (!open.includes('role="status"')) e.push('#contact-success lacks role="status"');
  const t = textOf(m[0]);
  if (!t.includes("prototype")) e.push('success text lacks "prototype"');
  if (!t.includes("nothing was actually sent")) e.push('success text lacks "nothing was actually sent"');
  if (t.includes("!")) e.push("success text has an exclamation mark");
  return e;
};

groups.details = () => {
  const e = [];
  if (!main.includes("mailto:hello@samwhitlock.example")) e.push("main lacks mailto link");
  if (!main.includes("tel:+441632960123")) e.push("main lacks tel link");
  if (!/class="[^"]*\bcontact__grid\b/.test(main)) e.push("main lacks .contact__grid");
  return e;
};

groups.js = () => {
  const e = [];
  for (const s of ['getElementById("contact-form")', "checkValidity", "preventDefault", "aria-invalid", ".focus(", "contact-success"]) {
    if (!mainJs.includes(s)) e.push("js/main.js lacks " + s);
  }
  for (const s of ["innerHTML", "insertAdjacentHTML", "outerHTML", "fetch(", "import"]) {
    if (mainJs.includes(s)) e.push("js/main.js contains forbidden " + s);
  }
  return e;
};

groups.map = () => {
  const e = [];
  const css = read("css/styles.css");
  const am = contact.match(/<aside\b[^>]*class="[^"]*\bcontact__details\b[\s\S]*?<\/aside>/);
  const sm = am && am[0].match(/<svg\b[^>]*class="[^"]*\barea-map__svg\b[\s\S]*?<\/svg>/);
  if (!sm) return ["area-map svg not found in .contact__details"];
  const svg = sm[0];
  if (!/<figure\b[^>]*class="[^"]*\barea-map\b[^"]*"[^>]*>[\s\S]*<svg\b[^>]*area-map__svg/.test(am[0])) e.push("svg not inside figure.area-map");
  const open = svg.match(/<svg\b[^>]*>/)[0];
  if (!open.includes('role="img"')) e.push('svg lacks role="img"');
  if (!/\bviewBox="/.test(open)) e.push("svg lacks viewBox");
  if (/\s(width|height)=/.test(open)) e.push("svg must not have width/height attributes");
  const lb = open.match(/aria-labelledby="([^"\s]+)/);
  const tm = lb && svg.match(new RegExp('<title\\b[^>]*id="' + lb[1] + '"[^>]*>([\\s\\S]*?)</title>'));
  if (!tm) e.push("aria-labelledby does not match a <title id>");
  else for (const n of ["Elmhollow", "Fenwick Cross", "Thornby"]) if (!tm[1].includes(n)) e.push("title lacks " + n);
  const texts = (svg.match(/<text\b[\s\S]*?<\/text>/g) || []).map(textOf);
  for (const n of ["Elmhollow", "Fenwick Cross", "Thornby"]) if (!texts.some((t) => t.includes(n))) e.push("no <text> label for " + n);
  const els = svg.match(/<(path|circle|ellipse|line|polyline|polygon|rect)\b[^>]*>/g) || [];
  const hasCls = (t, c) => new RegExp('class="[^"]*\\b' + c + '\\b').test(t);
  if (els.filter((t) => hasCls(t, "area-map__road") || hasCls(t, "area-map__river")).length < 2) e.push("need at least 2 road/river elements");
  const rings = els.filter((t) => hasCls(t, "area-map__ring"));
  if (rings.length < 1) e.push("need at least 1 area-map__ring");
  if (rings.some((t) => hasCls(t, "area-map__road"))) e.push("ring must not be a road (.draw would kill the dash)");
  for (const bad of ["<image", "<img", "<foreignObject", 'href="http', "url(http", "style=", 'fill="#', 'stroke="#', 'fill="rgb', 'stroke="rgb']) if (svg.includes(bad)) e.push("svg contains forbidden " + bad);
  if (!css.includes(".area-map__svg")) e.push("styles.css lacks .area-map__svg");
  for (const m of css.matchAll(/([^{}]*area-map[^{}]*)\{([^}]*)\}/g)) if (m[2].includes("--color-blue")) e.push("area-map rule uses --color-blue: " + m[1].trim());
  if (!/\.area-map__road/.test((mainJs.match(/var icons = [^;]*;/) || [""])[0])) e.push("js/main.js draw selector lacks .area-map__road");
  return e;
};

groups.replace = () => {
  const e = [];
  for (const s of ["contact__intro", "contact-success", "contact__details", "area-map"]) {
    if (!replaceMe.includes(s)) e.push("REPLACE-ME.md lacks " + s);
  }
  return e;
};

const requested = process.argv.slice(2);
for (const g of requested) {
  if (!groups[g]) { console.log("FAIL unknown group: " + g + " (use " + Object.keys(groups).join(", ") + ")"); process.exit(1); }
}
let failed = false;
for (const g of requested.length ? requested : Object.keys(groups)) {
  const errs = groups[g]();
  if (errs.length) { failed = true; console.log("FAIL " + g); errs.forEach((x) => console.log("  - " + x)); }
  else console.log("PASS " + g);
}
if (!failed) console.log("CONTACT OK");
process.exit(failed ? 1 : 0);
