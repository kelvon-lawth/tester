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

/* Contact form (contact.html): native Constraint Validation, no submission.
   Separate IIFE so it no-ops on pages without the form. */
(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  if (!form) { return; }

  var success = document.getElementById("contact-success");
  var successTitle = document.getElementById("contact-success-title");
  var fields = ["name", "phone", "email"].map(function (id) {
    return form.elements[id];
  }).filter(Boolean);

  function messageFor(input) {
    var v = input.validity;
    if (v.valueMissing) {
      if (input.id === "name") { return "Please tell me your name."; }
      if (input.id === "phone") { return "Please add a phone number so I can call you back."; }
      if (input.id === "email") { return "Please add your email address."; }
    }
    if (input.id === "email" && v.typeMismatch) {
      return "That email doesn’t look quite right. Try something like name@example.com.";
    }
    if (input.id === "phone" && (v.patternMismatch || v.tooShort)) {
      return "That phone number doesn’t look quite right. Use digits, spaces or a + sign.";
    }
    return "Please check this field.";
  }

  function errorEl(input) { return document.getElementById(input.id + "-error"); }

  function showError(input) {
    var el = errorEl(input);
    input.setAttribute("aria-invalid", "true");
    if (el) { el.textContent = messageFor(input); }
  }

  function clearError(input) {
    var el = errorEl(input);
    input.removeAttribute("aria-invalid");
    if (el) { el.textContent = ""; }
  }

  function normalise(input) {
    if (input.value.trim() === "") { input.value = ""; }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // prototype: nothing is ever sent
    var firstInvalid = null;
    fields.forEach(function (input) {
      normalise(input);
      if (input.checkValidity()) {
        clearError(input);
      } else {
        showError(input);
        if (!firstInvalid) { firstInvalid = input; }
      }
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    form.hidden = true;
    if (success) { success.hidden = false; }
    if (successTitle) { successTitle.focus(); }
  });

  fields.forEach(function (input) {
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true" && input.checkValidity()) {
        clearError(input);
      }
    });
    input.addEventListener("blur", function () {
      if (input.getAttribute("aria-invalid") !== "true") { return; }
      if (input.checkValidity()) { clearError(input); } else { showError(input); }
    });
  });
})();

/* Scroll reveals (quick 261013-ep2). Adds .reveal to a fixed selector list, then
   html.js-reveal, which is the ONLY thing that enables the hidden pre-reveal CSS.
   Bails out (touching nothing) without IntersectionObserver or under
   prefers-reduced-motion, so content is never hidden. Keep REVEAL_TARGETS in sync
   with tools/motion-browser-test.js. */
(function () {
  "use strict";

  var REVEAL_TARGETS = [
    ".section-head", ".service-card", ".about__media", ".about__text", ".testimonial",
    ".logo-strip li", ".step", ".cta-band__inner", ".hero__media", ".divider-squiggle",
    ".steps__connector", ".contact__form-wrap", ".contact__details", ".page-contact .contact__intro"
  ];
  var STAGGER_MS = 90;
  var REVEAL_MS = 700;
  var STAGGERED = /(^|\s)(service-card|testimonial|step)(\s|$)/;

  var root = document.documentElement;
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  if (!("IntersectionObserver" in window) || (reduce && reduce.matches)) { return; }

  var targets = Array.prototype.slice.call(document.querySelectorAll(REVEAL_TARGETS.join(",")));
  if (!targets.length) { return; }

  function delayFor(el) {
    var base = el;
    if (el.classList.contains("service-card") && el.parentElement && el.parentElement.tagName === "LI") {
      base = el.parentElement;
    } else if (!(STAGGERED.test(el.className) || (el.tagName === "LI" && el.parentElement && el.parentElement.classList.contains("logo-strip")))) {
      return 0;
    }
    var idx = Array.prototype.indexOf.call(base.parentElement.children, base);
    return Math.max(0, Math.min(idx, 5)) * STAGGER_MS;
  }

  function reveal(el) {
    if (el.classList.contains("is-revealed")) { return; }
    var delay = delayFor(el);
    if (delay) { el.style.setProperty("--reveal-delay", delay + "ms"); }
    el.classList.add("is-revealed");
    // After the entrance, drop the stagger delay so hover lifts respond instantly.
    window.setTimeout(function () { el.classList.add("is-settled"); }, REVEAL_MS + delay + 150);
  }

  targets.forEach(function (el) { el.classList.add("reveal"); });
  root.classList.add("js-reveal");

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  targets.forEach(function (el) { observer.observe(el); });

  function revealAll() {
    targets.forEach(function (el) { observer.unobserve(el); reveal(el); });
  }

  // Safety net: nothing may stay hidden if the observer misbehaves.
  window.addEventListener("load", function () {
    window.setTimeout(function () {
      targets.forEach(function (el) {
        if (!el.classList.contains("is-revealed") && el.getBoundingClientRect().top < window.innerHeight) {
          observer.unobserve(el);
          reveal(el);
        }
      });
    }, 3000);
  });

  if (reduce) {
    var onChange = function (e) { if (e.matches) { revealAll(); } };
    if (reduce.addEventListener) { reduce.addEventListener("change", onChange); }
    else if (reduce.addListener) { reduce.addListener(onChange); }
  }
})();

/* SVG stroke draw-on (quick 261013-ep2). Measures each stroke and stores its length in
   --draw-len; CSS (html.js-reveal .draw) animates stroke-dashoffset when the owner is
   revealed. Runs only when the reveal IIFE enabled html.js-reveal. */
(function () {
  "use strict";

  var root = document.documentElement;
  if (!root.classList.contains("js-reveal")) { return; }

  function lengthOf(el) {
    var total;
    try { total = el.getTotalLength(); } catch (e) { return 0; }
    if (!total) { return 0; }
    var cs = window.getComputedStyle(el);
    if (cs.vectorEffect !== "non-scaling-stroke") { return total; }
    // Non-scaling strokes dash in screen space: walk the path through the screen matrix.
    var m = el.getScreenCTM && el.getScreenCTM();
    if (!m) { return 0; }
    var steps = Math.max(8, Math.min(2000, Math.ceil(total)));
    var prev = el.getPointAtLength(0);
    var len = 0;
    for (var i = 1; i <= steps; i++) {
      var p = el.getPointAtLength(total * i / steps);
      var dx = (p.x - prev.x) * m.a + (p.y - prev.y) * m.c;
      var dy = (p.x - prev.x) * m.b + (p.y - prev.y) * m.d;
      len += Math.sqrt(dx * dx + dy * dy);
      prev = p;
    }
    return len;
  }

  function prepare(el) {
    var len = lengthOf(el);
    if (!(len > 0)) { return; }
    el.style.setProperty("--draw-len", String(Math.ceil(len * 1.02) + 2));
    el.classList.add("draw");
    el.addEventListener("transitionend", function (e) {
      if (e.propertyName === "stroke-dashoffset") { el.classList.add("is-drawn"); }
    });
  }

  var icons = ".service-card__icon svg path, .service-card__icon svg circle, .steps__connector path";
  Array.prototype.forEach.call(document.querySelectorAll(icons), prepare);

  // The hero underline sits above the fold: draw it once fonts have settled the word's width.
  var word = document.querySelector(".hero-word");
  var underline = word && word.querySelector(".accent-underline__svg path");
  if (word && underline) {
    var started = false;
    var start = function () {
      if (started) { return; }
      started = true;
      window.requestAnimationFrame(function () {
        prepare(underline);
        window.requestAnimationFrame(function () { word.classList.add("is-revealed"); });
      });
    };
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(start, start); }
    window.setTimeout(start, 1500);
  }
})();

/* Glassy header gains a shadow once the page has scrolled (quick 261013-ep2). */
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  if (!header) { return; }
  var ticking = false;

  function update() {
    ticking = false;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
})();
