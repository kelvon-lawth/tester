#!/usr/bin/env node
// Static Home/shell contract test (Phase 2). Zero dependencies.
// Usage: node tools/check-home.js [group ...]   (no args = every group)
// Prints PASS/FAIL per group, then HOME OK on success. Exit 0 = pass, 1 = fail.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => (fs.existsSync(path.join(ROOT, rel)) ? fs.readFileSync(path.join(ROOT, rel), "utf8") : "");
const index = read("index.html");
const contact = read("contact.html");
const replaceMe = read("REPLACE-ME.md");

// ---- helpers
function mainOf(html) {
  const m = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);
  return m ? m[1] : "";
}
function sectionFrom(html, re) {
  const m = re.exec(html);
  if (!m) return null;
  const end = html.indexOf("</section>", m.index);
  return html.slice(m.index, end < 0 ? html.length : end + "</section>".length);
}
const sectionById = (html, id) => sectionFrom(html, new RegExp('<section\\b[^>]*\\bid="' + id + '"[^>]*>'));
const sectionByClass = (html, cls) => sectionFrom(html, new RegExp('<section\\b[^>]*class="[^"]*\\b' + cls + '\\b[^"]*"[^>]*>'));
const sectionByLabel = (html, id) => sectionFrom(html, new RegExp('<section\\b[^>]*aria-labelledby="' + id + '"[^>]*>'));
const count = (text, re) => (text.match(re) || []).length;
const textOf = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const amp = (s) => s.replace(/&amp;/g, "&");

// An <img> carrying all of attrs, or the documented role="img" placeholder fallback.
function mediaWith(block, attrs, alt, noLoading, altLoose) {
  const errs = [];
  const imgs = block.match(/<img\b[^>]*>/g) || [];
  const okImg = imgs.some((t) => attrs.every((a) => t.includes(a)) && (altLoose ? /\balt="[^"]+"/.test(t) && (t.match(/\balt="([^"]*)"/) || [, ""])[1].includes(alt) : t.includes('alt="' + alt + '"')) && (!noLoading || !/\bloading=/.test(t)));
  if (okImg) return errs;
  const fb = block.match(/<[a-z]+\b[^>]*role="img"[^>]*>/g) || [];
  const okFb = fb.some((t) => (altLoose ? /aria-label="[^"]*/.test(t) && t.includes(alt) : t.includes('aria-label="' + alt + '"')) && /media--placeholder/.test(t));
  if (!okFb) errs.push('no <img> with ' + attrs.join(" ") + ' and alt "' + alt + '" (or media--placeholder fallback)');
  return errs;
}

// Changed in quick 261013-ffc for HERO-05: one visually-hidden sentence is the headline screen readers hear,
// the animated visual line is aria-hidden so cycling words are never announced.
const HERO_H1 = '<h1 class="hero-title"><span class="visually-hidden">Marketing for your bakery, café, salon, gym, florist, shop or restaurant</span><span class="hero-title__visual" aria-hidden="true"><span class="hero-title__lead">Marketing for your</span> <span class="hero-word accent-underline" data-words="bakery,café,salon,gym,florist,shop,restaurant"><span class="hero-word__text">bakery</span><svg class="accent-underline__svg" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M2 7 C 22 3, 40 10, 62 6 S 104 4, 126 8 S 170 4, 198 6"/></svg></span></span></h1>';
const LETS = "Let’s talk";

const groups = {};

groups.shell = () => {
  const e = [];
  for (const [name, html, current] of [["index.html", index, "Home"], ["contact.html", contact, "Contact"]]) {
    const need = [
      '<a class="wordmark" href="index.html">Sam Whitlock</a>',
      '<nav class="site-nav" aria-label="Main">',
      "mailto:hello@samwhitlock.example",
      "tel:+441632960123",
      "Area served",
      "Elmhollow, Fenwick Cross and Thornby",
      "Prototype — sample content",
      "© 2026 Sam Whitlock. All names and details are made up.",
      'href="styleguide.html"',
    ];
    for (const n of need) if (!html.includes(n)) e.push(name + " missing: " + n);
    if (count(html, /aria-current="page"/g) !== 1) e.push(name + ": expected exactly one aria-current=\"page\"");
    else if (!new RegExp('<a href="[^"]+" aria-current="page">' + current + "</a>").test(html)) e.push(name + ": aria-current must be on the " + current + " link");
    if (html.includes("[Name]")) e.push(name + " contains [Name]");
  }
  if (!index.includes("<title>Sam Whitlock | Local marketing help in Elmhollow</title>")) e.push("index.html title wrong");
  if (!index.includes('<meta name="description" content="Friendly, local marketing help for Elmhollow bakeries, gyms, salons and shops. Sample content for a prototype.">')) e.push("index.html meta description wrong");
  if (!contact.includes("<title>Contact | Sam Whitlock, local marketer in Elmhollow</title>")) e.push("contact.html title wrong");
  if (!/<main\b[^>]*>\s*<section class="section">\s*<div class="container">\s*<h1>Let’s talk<\/h1>/.test(contact)) e.push("contact.html main must start with section.section > .container > h1 Let’s talk");
  return e;
};

groups.hero = () => {
  const e = [];
  const m = mainOf(index);
  if (!/^\s*<section class="hero"/.test(m)) e.push("hero section must be first element in main");
  const h = sectionByClass(index, "hero");
  if (!h) return e.concat("no section.hero");
  if (!h.includes(HERO_H1)) e.push("Phase 1 h1 not byte-identical in hero");
  if (!/<p class="hero__lede">I’m Sam, a marketer right here in Elmhollow\. I help neighbourhood businesses get found and get busy\.<\/p>/.test(h)) e.push("hero lede copy missing");
  const cta = /id="hero-cta"[\s\S]*?<\/div>/.exec(h);
  if (!cta) e.push("no #hero-cta");
  else {
    if (!cta[0].includes('class="btn btn--primary" href="contact.html">' + LETS + "</a>")) e.push("hero primary CTA missing");
    if (!cta[0].includes('class="link-cta" href="#services">See how I help</a>')) e.push("hero link-cta missing");
  }
  if (!/class="trust-cue"[^>]*>Trusted by <strong>40\+<\/strong> local businesses in Elmhollow/.test(h)) e.push("trust cue missing");
  const media = /hero__media[\s\S]*$/.exec(h);
  if (!media) e.push("no hero__media");
  else e.push(...mediaWith(media[0], ['width="800"', 'height="1000"', 'decoding="async"', 'referrerpolicy="no-referrer"'], "A smiling shop owner at a counter", true, true));
  // quick 261013-ffc: pause toggle, proof chips, scroll cue
  const toggles = h.match(/<button class="hero-toggle" type="button" aria-pressed="false" hidden>/g) || [];
  if (toggles.length !== 1) e.push("expected exactly one <button class=\"hero-toggle\" type=\"button\" aria-pressed=\"false\" hidden>, found " + toggles.length);
  else {
    const ti = h.indexOf('class="hero-toggle"');
    const ctaStart = h.indexOf('id="hero-cta"');
    const ctaEnd = h.indexOf("</div>", ctaStart);
    if (ti > ctaStart && ti < ctaEnd) e.push("hero-toggle must sit outside #hero-cta");
  }
  if (!/class="hero-word accent-underline" data-words="bakery,café,salon,gym,florist,shop,restaurant"/.test(h)) e.push("hero-word data-words list wrong");
  const mediaBlock = /class="hero__media[\s\S]*$/.exec(h);
  if (count(mediaBlock ? mediaBlock[0] : "", /class="hero-chip\b/g) < 2) e.push("need at least two .hero-chip proof chips in hero__media");
  if (!/<[a-z]+\b[^>]*class="hero-scroll-cue"[^>]*aria-hidden="true"|<[a-z]+\b[^>]*aria-hidden="true"[^>]*class="hero-scroll-cue"/.test(h)) e.push(".hero-scroll-cue with aria-hidden=true missing");
  return e;
};

// Vendored GSAP (quick 261013-ffc). Contact keeps the IntersectionObserver fallback only.
groups.vendor = () => {
  const e = [];
  for (const [f, banner] of [["gsap", "GSAP 3.15.0"], ["ScrollTrigger", "ScrollTrigger 3.15.0"], ["SplitText", "SplitText 3.15.0"]]) {
    const t = read("assets/js/vendor/" + f + ".min.js");
    if (!t) e.push("assets/js/vendor/" + f + ".min.js missing");
    else if (!t.slice(0, 200).includes(banner)) e.push(f + ".min.js lacks banner " + banner);
  }
  const v = read("assets/js/vendor/GSAP-VERSION.md");
  if (!v.includes("3.15.0") || !v.includes("standard-license")) e.push("GSAP-VERSION.md must mention 3.15.0 and standard-license");
  const head = (/<head\b[\s\S]*?<\/head>/.exec(index) || [""])[0];
  const order = ["assets/js/vendor/gsap.min.js", "assets/js/vendor/ScrollTrigger.min.js", "assets/js/vendor/SplitText.min.js", "js/main.js"].map((s) => head.indexOf('<script defer src="' + s + '"></script>'));
  if (order.some((i) => i < 0) || !order.every((v2, i) => i === 0 || v2 > order[i - 1])) e.push("head must load gsap, ScrollTrigger, SplitText, main.js as defer scripts in that order");
  if (!/<!--[^>]*GSAP 3\.15\.0[^>]*-->/.test(head)) e.push("index.html needs an HTML comment pinning GSAP 3.15.0");
  if (/vendor\//.test(contact)) e.push("contact.html must not load the vendor files");
  const inline = head.match(/<script>[\s\S]*?<\/script>/g) || [];
  if (inline.length !== 1) e.push("head needs exactly one inline classic <script>, found " + inline.length);
  else {
    const body = inline[0];
    if (head.indexOf(body) > head.indexOf('<link rel="stylesheet"')) e.push("inline motion-pending script must come BEFORE the stylesheet link");
    for (const need of ["motion-pending", "prefers-reduced-motion", "2500"]) if (!body.includes(need)) e.push("inline script must contain " + need);
    for (const bad of ["innerHTML", "fetch", "import"]) if (body.includes(bad)) e.push("inline script must not contain " + bad);
  }
  return e;
};

groups.services = () => {
  const e = [];
  const s = sectionById(index, "services");
  if (!s) return ["no #services section"];
  if (!/section--tint/.test(s.slice(0, s.indexOf(">")))) e.push("services missing section--tint");
  if (!s.includes('aria-labelledby="services-title"')) e.push("services aria-labelledby missing");
  if (!s.includes('id="services-title"') || !amp(textOf(s)).includes("Four ways I help local businesses get found, get remembered and get busy.")) e.push("services h2 wrong");
  const cards = s.split(/(?=<[a-z]+\b[^>]*class="[^"]*\bservice-card\b(?![_-])[^"]*")/).slice(1);
  if (cards.length !== 4) e.push("expected 4 service-card, found " + cards.length);
  const titles = ["Social media", "Local SEO & Google", "Ads & campaigns", "Branding & design"];
  const descs = [
    "I plan and post the photos, stories and replies that get neighbours following, sharing and walking through your door.",
    "When someone nearby searches for what you sell, I make sure you show up on the map with the right hours and reviews.",
    "Small budgets, clear goals. I run local ads that bring in real customers and tell you plainly what worked.",
    "A friendly logo, sign and menu that look like you and help people remember your name.",
  ];
  cards.forEach((c, i) => {
    const h3 = c.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/);
    if (!h3 || amp(textOf(h3[1])) !== titles[i]) e.push("service card " + (i + 1) + " title should be " + titles[i]);
    if (!/<svg\b[^>]*class="icon"[^>]*>/.test(c) || !/<svg\b[^>]*aria-hidden="true"/.test(c) || !/<svg\b[^>]*focusable="false"/.test(c)) e.push("service card " + (i + 1) + " icon svg needs class icon, aria-hidden, focusable=false");
    if (!amp(textOf(c)).includes(descs[i])) e.push("service card " + (i + 1) + " description missing");
  });
  return e;
};

groups.about = () => {
  const e = [];
  const s = sectionById(index, "about");
  if (!s) return ["no #about section"];
  if (!s.includes('aria-labelledby="about-title"')) e.push("about aria-labelledby missing");
  if (!/<h2\b[^>]*id="about-title"[^>]*>Hi, I’m Sam\. I live here too\.<\/h2>/.test(s)) e.push("about h2 wrong");
  e.push(...mediaWith(s, ['width="800"', 'height="800"', 'loading="lazy"'], "A smiling woman", false, true));
  const c = /class="about__cta"[\s\S]*?<\/div>/.exec(s);
  if (!c || !c[0].includes("Fancy a coffee and a chat?") || !c[0].includes('class="btn btn--primary" href="contact.html">' + LETS + "</a>")) e.push("about__cta missing copy or button");
  return e;
};

groups.testimonials = () => {
  const e = [];
  const s = sectionById(index, "kind-words");
  if (!s) return ["no #kind-words section"];
  if (!/section--tint/.test(s.slice(0, s.indexOf(">")))) e.push("kind-words missing section--tint");
  if (!/<h2\b[^>]*>What my neighbours say<\/h2>/.test(s)) e.push("testimonials h2 wrong");
  const figs = s.match(/<figure class="card card--white testimonial"[\s\S]*?<\/figure>/g) || [];
  if (figs.length !== 3) e.push("expected 3 testimonial figures, found " + figs.length);
  const people = [
    ["Priya Nair", "Owner, Rise & Crumb Bakery, Elmhollow"],
    ["Marcus Bell", "Owner, Iron Orchard Gym, Fenwick Cross"],
    ["Lena Fischer", "Founder, Studio Marigold Salon, Elmhollow"],
  ];
  figs.forEach((f, i) => {
    if (!people[i]) return;
    if (!f.includes("<blockquote>")) e.push("testimonial " + (i + 1) + " missing blockquote");
    if (!f.includes('<figcaption class="testimonial__who"')) e.push("testimonial " + (i + 1) + " missing figcaption.testimonial__who");
    const errs = mediaWith(f, ['class="avatar', 'width="96"', 'height="96"', 'loading="lazy"'], people[i][0], false, true);
    e.push(...errs.map((x) => "testimonial " + (i + 1) + ": " + x));
    if (!amp(textOf(f)).includes(people[i][1])) e.push("testimonial " + (i + 1) + " role line missing: " + people[i][1]);
  });
  return e;
};

const LOGOS = ["Rise & Crumb Bakery", "Iron Orchard Gym", "Studio Marigold Salon", "Fernside Florist", "The Daily Pour Café", "Copperline Hardware"];

groups.logos = () => {
  const e = [];
  const s = sectionByLabel(index, "logos-title");
  if (!s) return ["no section aria-labelledby=logos-title"];
  if (!/section--tight/.test(s.slice(0, s.indexOf(">")))) e.push("logos missing section--tight");
  if (!s.includes('<p id="logos-title" class="logo-strip__caption">Neighbours I’ve helped</p>')) e.push("logo caption wrong");
  const ul = /<ul class="logo-strip">[\s\S]*?<\/ul>/.exec(s);
  if (!ul) return e.concat("no ul.logo-strip");
  const lis = ul[0].match(/<li\b[\s\S]*?<\/li>/g) || [];
  if (lis.length !== 6) e.push("expected 6 logo li, found " + lis.length);
  lis.forEach((li, i) => {
    const m = li.match(/<svg\b[^>]*>/);
    if (!m || !/role="img"/.test(m[0])) e.push("logo " + (i + 1) + " svg needs role=img");
    else if (!m[0].includes('aria-label="' + (LOGOS[i] || "").replace(/&/g, "&amp;") + '"') && !m[0].includes('aria-label="' + LOGOS[i] + '"')) e.push("logo " + (i + 1) + " aria-label should be " + LOGOS[i]);
  });
  if (/<img/.test(ul[0])) e.push("logo strip must not contain <img>");
  if (/href=/.test(ul[0])) e.push("logo strip must not contain href");
  return e;
};

groups.steps = () => {
  const e = [];
  const iLogos = index.indexOf('aria-labelledby="logos-title"');
  const iDiv = index.search(/class="[^"]*\bdivider-squiggle\b/);
  const s = sectionById(index, "how-it-works");
  if (!s) return ["no #how-it-works section"];
  const iHow = index.indexOf(s);
  if (!(iLogos >= 0 && iDiv > iLogos && iDiv < iHow)) e.push("divider-squiggle must sit between logos and #how-it-works");
  if (!s.includes('aria-labelledby="how-title"')) e.push("how-it-works aria-labelledby missing");
  if (!/<h2\b[^>]*id="how-title"[^>]*>Three easy steps, no jargon<\/h2>/.test(s)) e.push("steps h2 wrong");
  const ol = /<ol class="steps"[\s\S]*?<\/ol>/.exec(s);
  if (!ol) return e.concat("no ol.steps");
  const items = ol[0].match(/<li\b[^>]*class="[^"]*\bstep\b[^"]*"[\s\S]*?<\/li>/g) || [];
  if (items.length !== 3) e.push("expected 3 .step items, found " + items.length);
  ["Chat", "Plan", "Grow"].forEach((t, i) => {
    const h3 = items[i] && items[i].match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/);
    if (!h3 || textOf(h3[1]) !== t) e.push("step " + (i + 1) + " h3 should be " + t);
  });
  const badges = s.match(/<[a-z]+\b[^>]*class="[^"]*\bstep__badge\b[^"]*"[^>]*>/g) || [];
  if (badges.length !== 3 || !badges.every((b) => /aria-hidden="true"/.test(b))) e.push("need 3 step__badge each aria-hidden=true");
  const conn = s.match(/<svg\b[^>]*class="[^"]*\bsteps__connector\b[^"]*"[^>]*>/g) || [];
  if (conn.length !== 1 || !/aria-hidden="true"/.test(conn[0])) e.push("need exactly one steps__connector svg with aria-hidden=true");
  return e;
};

// quick 261022-bsb: pricing section
groups.pricing = () => {
  const e = [];
  const s = sectionById(index, "pricing");
  if (!s) return ["no #pricing section"];
  if (!s.includes('aria-labelledby="pricing-title"')) e.push("pricing aria-labelledby missing");
  if (/section--tint/.test(s.slice(0, s.indexOf(">")))) e.push("pricing must not be section--tint");
  if (!/<h2\b[^>]*id="pricing-title"[^>]*>Simple monthly plans, no surprises<\/h2>/.test(s)) e.push("pricing h2 wrong");
  if (!textOf(s).includes("No contracts. Cancel any month.")) e.push("pricing intro missing");
  const ul = /<ul class="pricing-grid">[\s\S]*?<\/ul>\s*<\/div>\s*<\/section>/.exec(s) || /<ul class="pricing-grid">[\s\S]*$/.exec(s);
  if (!ul) return e.concat("no ul.pricing-grid");
  const cards = s.match(/<article\b[^>]*class="[^"]*\bpricing-card\b[^"]*"[\s\S]*?<\/article>/g) || [];
  if (cards.length !== 2) return e.concat("expected 2 .pricing-card articles, found " + cards.length);
  const names = ["Local Basics", "Growth"];
  const prices = ["£195", "£395"];
  cards.forEach((c, i) => {
    const h3 = c.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/);
    if (!h3 || textOf(h3[1]) !== names[i]) e.push("plan " + (i + 1) + " h3 should be " + names[i]);
    if (!new RegExp(prices[i] + "\\s*(<[^>]+>\\s*)*a month").test(c)) e.push("plan " + (i + 1) + " price should read " + prices[i] + " a month");
    const feat = /<ul class="pricing-card__features">([\s\S]*?)<\/ul>/.exec(c);
    if (!feat || count(feat[1], /<li\b/g) < 4) e.push("plan " + (i + 1) + " needs ul.pricing-card__features with at least 4 li");
    if (!c.includes('class="btn btn--primary" href="contact.html">' + LETS + "</a>")) e.push("plan " + (i + 1) + " Let’s talk button missing");
  });
  const feats = s.match(/<[a-z]+\b[^>]*class="[^"]*\bpricing-card--featured\b/g) || [];
  if (feats.length !== 1) e.push("expected exactly one pricing-card--featured, found " + feats.length);
  if (!/pricing-card--featured/.test(cards[1] || "")) e.push("Growth must be the featured card");
  if (/pricing-card--featured/.test(cards[0] || "")) e.push("Local Basics must not be featured");
  if (!/class="pricing-card__badge"[^>]*>Most popular<\/p>/.test(cards[1] || "")) e.push("Growth needs pricing-card__badge Most popular");
  for (const v of s.match(/<svg\b[^>]*>/g) || []) if (!/aria-hidden="true"/.test(v) || !/focusable="false"/.test(v)) e.push("pricing svg needs aria-hidden and focusable=false");
  return e;
};

groups.band = () => {
  const e = [];
  const s = sectionByLabel(index, "cta-title");
  if (!s || !/class="[^"]*\bcta-band\b/.test(s.slice(0, s.indexOf(">")))) return ["no section.cta-band with aria-labelledby=cta-title"];
  if (!/<h2\b[^>]*id="cta-title"[^>]*>[^<]*Let’s get your business <span class="text-coral-on-navy">busy<\/span>/.test(s)) e.push("band h2 wrong");
  if (!s.includes('class="btn btn--primary btn--on-navy" href="contact.html">' + LETS + "</a>")) e.push("band button missing");
  if (!s.includes("Tell me a bit about what you do, and let’s see how I can help.")) e.push("band support line missing");
  if (!s.includes("Prefer email?") || !s.includes("mailto:hello@samwhitlock.example")) e.push("band email line missing");
  return e;
};

groups.sticky = () => {
  const e = [];
  const tail = index.slice(0, index.lastIndexOf("</body>")).trimEnd();
  const want = '<a class="btn btn--primary sticky-cta" href="contact.html">' + LETS + "</a>";
  if (!tail.endsWith(want)) e.push("last element before </body> must be the sticky-cta link");
  if (contact.includes("sticky-cta")) e.push("contact.html must not contain sticky-cta");
  return e;
};

groups.order = () => {
  const e = [];
  const m = mainOf(index);
  const pos = [
    ["hero", m.search(/<section[^>]*class="[^"]*\bhero\b/)],
    ["#services", m.search(/<section[^>]*id="services"/)],
    ["#about", m.search(/<section[^>]*id="about"/)],
    ["#kind-words", m.search(/<section[^>]*id="kind-words"/)],
    ["logos", m.search(/<section[^>]*aria-labelledby="logos-title"/)],
    ["divider", m.search(/class="[^"]*\bdivider-squiggle\b/)],
    ["#how-it-works", m.search(/<section[^>]*id="how-it-works"/)],
    // quick 261022-bsb: pricing sits between steps and the closing band
    ["#pricing", m.search(/<section[^>]*id="pricing"/)],
    [".cta-band", m.search(/<section[^>]*class="[^"]*\bcta-band\b/)],
  ];
  for (const [n, p] of pos) if (p < 0) e.push("missing in main: " + n);
  for (let i = 1; i < pos.length; i++) if (pos[i][1] >= 0 && pos[i - 1][1] >= 0 && pos[i][1] <= pos[i - 1][1]) e.push(pos[i][0] + " must come after " + pos[i - 1][0]);
  const tints = index.match(/<[a-z]+\b[^>]*class="[^"]*\bsection--tint\b[^"]*"[^>]*>/g) || [];
  if (tints.length !== 2 || !/id="services"/.test(tints[0] || "") || !/id="kind-words"/.test(tints[1] || "")) e.push("exactly 2 section--tint required: #services and #kind-words");
  if (count(index, /class="[^"]*\bcta-band\b/g) !== 1) e.push("cta-band must appear exactly once");
  const lets = index.match(/<a\b[^>]*>Let’s talk<\/a>/g) || [];
  // quick 261022-bsb: +2 pricing buttons
  if (lets.length !== 6) e.push("expected 6 Let’s talk links, found " + lets.length);
  if (!lets.every((a) => a.includes('href="contact.html"'))) e.push("every Let’s talk link must go to contact.html");
  return e;
};

groups.replace = () => {
  const e = [];
  for (const h of ["Identity", "Contact details", "Numbers and claims", "Photos", "Testimonials", "Logos", "Copy blocks", "Pricing", "Shell"]) {
    if (!new RegExp("^## " + h + "$", "m").test(replaceMe)) e.push("REPLACE-ME.md missing heading ## " + h);
  }
  const terms = ["Sam Whitlock", "Elmhollow", "Fenwick Cross", "Thornby", "hello@samwhitlock.example", "01632 960 123", "40+", "ten years", "Priya Nair", "Marcus Bell", "Lena Fischer", "Local Basics", "Growth", "£195", "£395", "Most popular", "No contracts. Cancel any month."].concat(LOGOS); // quick 261022-bsb: pricing terms
  for (const t of terms) if (!replaceMe.includes(t)) e.push("REPLACE-ME.md missing: " + t);
  for (const m of index.match(/<img\b[^>]*>/g) || []) {
    const src = ((m.match(/src="(https:\/\/[^"]+)"/) || [])[1] || "").replace(/&amp;/g, "&");
    if (src && !replaceMe.includes(src)) e.push("img src not listed in REPLACE-ME.md: " + src);
  }
  for (const [n, h] of [["index.html", index], ["contact.html", contact]]) if (h.includes("[Name]")) e.push(n + " contains [Name]");
  // proof-chip copy is placeholder claims: read at runtime so the wording stays free
  for (const c of index.match(/<[a-z]+\b[^>]*class="hero-chip\b[\s\S]*?<\/p>/g) || []) {
    const t = amp(textOf(c));
    if (t && !replaceMe.includes(t)) e.push("hero chip text not listed in REPLACE-ME.md: " + t);
  }
  return e;
};

// ---- run
const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(groups);
let bad = false;
for (const n of names) {
  if (!groups[n]) {
    console.log("FAIL " + n + ": unknown group (known: " + Object.keys(groups).join(", ") + ")");
    bad = true;
    continue;
  }
  const errs = groups[n]();
  if (errs.length) {
    bad = true;
    for (const x of errs) console.log("FAIL " + n + ": " + x);
  } else console.log("PASS " + n);
}
if (bad) process.exit(1);
console.log("HOME OK");
