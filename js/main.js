/*
 * Shared script, loaded on every page.
 * Classic deferred script only: no ES modules, no module syntax, no network
 * calls for local files. Those are blocked over file:// (CORS), which would
 * break double-click opening.
 */
(function () {
  "use strict";

  // Hooks, not dead code: js/no-js drive CSS (.js .sticky-cta, .no-js fallbacks);
  // fonts-loaded/fonts-failed are read by CSS and by tools/smoke-test.js.
  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  if (!document.fonts || !document.fonts.load) {
    root.classList.add("fonts-failed");
    return;
  }

  Promise.all([
    document.fonts.load("600 1em Fraunces"),
    document.fonts.load("400 1em Figtree"),
    document.fonts.load("600 1em Figtree")
  ]).then(function (results) {
    var ok = results.every(function (r) { return r && r.length >= 1; });
    root.classList.add(ok ? "fonts-loaded" : "fonts-failed");
  }, function () {
    root.classList.add("fonts-failed");
  });
})();

/* Sticky "Let's talk" button (phones): shown after the hero CTA, hidden over the
   closing band and footer. Separate IIFE so the fonts early return cannot skip it. */
(function () {
  "use strict";

  var cta = document.querySelector(".sticky-cta");
  var hero = document.getElementById("hero-cta");
  if (!cta || !hero) { return; }

  if (!("IntersectionObserver" in window)) {
    cta.classList.add("is-visible");
    return;
  }

  var band = document.querySelector(".cta-band");
  var footer = document.querySelector("footer.site-footer");
  var pastHero = false;
  var blocked = { band: false, footer: false };

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.target === hero) {
        pastHero = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
      } else if (entry.target === band) {
        blocked.band = entry.isIntersecting;
      } else if (entry.target === footer) {
        blocked.footer = entry.isIntersecting;
      }
    });
    cta.classList.toggle("is-visible", pastHero && !blocked.band && !blocked.footer);
  }, { threshold: 0 });

  observer.observe(hero);
  if (band) { observer.observe(band); }
  if (footer) { observer.observe(footer); }
})();
