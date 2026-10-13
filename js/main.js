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

/* Motion (quick 261013-ffc): GSAP 3.15.0 + SplitText + ScrollTrigger, vendored under assets/js/vendor.
   Everything here is progressive enhancement:
   - html.motion-pending (set by the inline head script) never hides anything by itself.
   - html.has-motion is the ONLY gate for the pre-animation CSS and JS states. It is added in the
     no-preference branch of gsap.matchMedia and removed again on revert or on any failure.
   - No GSAP, reduced motion or a failure leaves the static page (or the IntersectionObserver reveals below).
   Animated properties: transform, opacity, clip-path (one-shot only) and stroke-dashoffset. */
(function () {
  "use strict";

  var root = document.documentElement;
  var hero = document.querySelector(".hero");
  var word = document.querySelector(".hero-word[data-words]");

  function pendingOff() { root.classList.remove("motion-pending"); }

  if (!window.gsap || !window.ScrollTrigger || !window.SplitText || !hero || !word) { pendingOff(); return; }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var SplitText = window.SplitText;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  var mm = gsap.matchMedia();
  var failed = false;
  var alive = false;

  // Any failure: undo everything and leave a fully visible static page.
  function fail(err) {
    if (failed) { return; }
    failed = true;
    alive = false;
    try { mm.revert(); } catch (e) { /* nothing more to do */ }
    root.classList.remove("has-motion");
    pendingOff();
    try {
      gsap.set(document.querySelectorAll(".hero *, main section *, .hero, main section"), { clearProps: "all" });
    } catch (e2) { /* ignore */ }
    if (window.console && window.console.warn) {
      window.console.warn("Motion disabled:", err && err.message ? err.message : err);
    }
  }

  // Length of a stroked path in screen pixels (non-scaling strokes dash in screen space).
  function lengthOf(el) {
    var total;
    try { total = el.getTotalLength(); } catch (e) { return 0; }
    if (!total) { return 0; }
    var cs = window.getComputedStyle(el);
    if (cs.vectorEffect !== "non-scaling-stroke") { return total; }
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

  function fontsReady() {
    var parts = [];
    if (document.fonts && document.fonts.load) {
      parts.push(document.fonts.load("600 1em Fraunces"), document.fonts.load("400 1em Figtree"), document.fonts.load("600 1em Figtree"));
    }
    var loaded = Promise.all(parts).then(function () { return document.fonts && document.fonts.ready; }, function () { /* fall through */ });
    var timeout = new Promise(function (resolve) { window.setTimeout(resolve, 1500); });
    return Promise.race([loaded, timeout]);
  }

  // Hero, cycle and (later) section choreography live in the motion branch only.
  mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, function (context) {
    if (!context.conditions.motion) { pendingOff(); return; }

    var cleanups = [];
    alive = true;
    try {
      root.classList.add("has-motion");
      pendingOff();
      cleanups.push(function () { root.classList.remove("has-motion"); });

      var q = function (s) { return hero.querySelector(s); };
      var toggle = q(".hero-toggle");
      var svg = word.querySelector(".accent-underline__svg");
      var path = svg && svg.querySelector("path");
      var textEl = word.querySelector(".hero-word__text");
      var lead = q(".hero-title__lead");
      var lede = q(".hero__lede");
      var actions = q(".hero__actions");
      var trust = q(".trust-cue");
      var photo = q(".hero__photo");
      var photoImg = q(".hero__photo .media");
      var frames = hero.querySelectorAll(".hero__accent, .hero__outline");
      var chips = hero.querySelectorAll(".hero-chip");
      var cue = q(".hero-scroll-cue");
      if (!toggle || !svg || !path || !textEl || !lead) { throw new Error("hero markup incomplete"); }

      // ---- Hero entrance. From-states are applied synchronously (immediateRender) so the first paint after
      // this script already shows the pre-state. motion-pending alone cannot prevent a flash: the accepted
      // residual is at most one frame.
      var leadSplit = SplitText.create(lead, { type: "words", mask: "words", wordsClass: "hw", aria: "none" });
      var intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
      gsap.set(svg, { opacity: 0 });
      intro.from(leadSplit.words, { yPercent: 125, duration: 1.1, stagger: 0.08 }, 0);
      intro.from(word, { y: 46, opacity: 0, duration: 1.1 }, 0.35);
      intro.from([lede, actions, trust], { y: 30, opacity: 0, duration: 1, stagger: 0.1 }, 0.6);
      intro.fromTo(photo, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" }, 0.15);
      intro.from(photoImg, { scale: 1.22, duration: 1.7 }, 0.15);
      intro.from(frames, { opacity: 0, scale: 0.86, duration: 1.2, stagger: 0.14, ease: "power3.out" }, 0.55);
      intro.from(chips, { scale: 0.4, opacity: 0, duration: 0.85, stagger: 0.16, ease: "back.out(1.7)" }, 1.1);
      if (cue) { intro.from(cue, { opacity: 0, duration: 0.9 }, 1.5); }

      // ---- Pause model (HERO-03): the cycle and all ambient hero motion pause while ANY reason is active.
      var reasons = {};
      var started = false;
      var cycle = null;
      function apply() {
        var active = Object.keys(reasons).filter(function (k) { return reasons[k]; });
        var paused = active.length > 0;
        if (cycle) { cycle.paused(paused || !started); }
        hero.classList.toggle("is-paused", paused);
        word.setAttribute("data-state", paused ? "paused" : "playing");
        word.setAttribute("data-paused-by", active.join(" "));
        toggle.setAttribute("aria-pressed", reasons.user ? "true" : "false");
      }
      function setReason(name, on) {
        if (!!reasons[name] === !!on) { return; }
        reasons[name] = !!on;
        apply();
      }
      word.setAttribute("data-state", "playing");
      word.setAttribute("data-paused-by", "");

      var title = q(".hero-title");
      var hoverCapable = function () { return window.matchMedia && window.matchMedia("(hover: hover)").matches; };
      // Hover pauses for a real mouse only. Touch and pen taps never set it, so a tap cannot leave the cycle stuck.
      var onEnter = function (e) { if (e.pointerType === "mouse" && hoverCapable()) { setReason("hover", true); } };
      var onLeave = function () { setReason("hover", false); };
      var onClick = function () { setReason("user", !reasons.user); };
      var onFocusIn = function (e) { setReason("focus", e.target !== toggle); };
      var onFocusOut = function (e) {
        var n = e.relatedTarget;
        setReason("focus", !!(n && hero.contains(n) && n !== toggle));
      };
      var onVis = function () { setReason("hidden", document.hidden); };
      title.addEventListener("pointerenter", onEnter);
      title.addEventListener("pointerleave", onLeave);
      title.addEventListener("pointercancel", onLeave);
      toggle.addEventListener("click", onClick);
      hero.addEventListener("focusin", onFocusIn);
      hero.addEventListener("focusout", onFocusOut);
      document.addEventListener("visibilitychange", onVis);
      var io = null;
      if ("IntersectionObserver" in window) {
        io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { setReason("offscreen", !en.isIntersecting); });
        }, { threshold: 0 });
        io.observe(hero);
      }
      cleanups.push(function () {
        title.removeEventListener("pointerenter", onEnter);
        title.removeEventListener("pointerleave", onLeave);
        title.removeEventListener("pointercancel", onLeave);
        toggle.removeEventListener("click", onClick);
        hero.removeEventListener("focusin", onFocusIn);
        hero.removeEventListener("focusout", onFocusOut);
        document.removeEventListener("visibilitychange", onVis);
        if (io) { io.disconnect(); }
        hero.classList.remove("is-paused");
        word.removeAttribute("data-state");
        word.removeAttribute("data-paused-by");
        word.removeAttribute("data-current");
        toggle.hidden = true;
        toggle.setAttribute("aria-pressed", "false");
        Array.prototype.forEach.call(word.querySelectorAll(".hero-word__alt"), function (a) { a.parentNode.removeChild(a); });
      });

      // ---- Build the kinetic word cycle once fonts have settled (needs real glyph widths).
      fontsReady().then(function () {
        if (!alive) { return; }
        context.add(function () {
          var list = word.getAttribute("data-words").split(",");
          var els = [textEl];
          for (var i = 1; i < list.length; i++) {
            var alt = document.createElement("span");
            alt.className = "hero-word__alt";
            alt.textContent = list[i];
            word.insertBefore(alt, svg);
            els.push(alt);
          }
          // Everything from here to the underline set-up is ONE synchronous block: widths are measured on live,
          // inserted elements (a detached fragment would measure 0), and the underline is scaled to the first word
          // before any frame can paint it at the width of the longest word.
          var charSets = els.map(function (el) {
            return SplitText.create(el, { type: "chars", mask: "chars", charsClass: "hc", aria: "none" }).chars;
          });
          var slotW = word.getBoundingClientRect().width;
          var ratios = els.map(function (el) { return slotW > 0 ? Math.min(1, el.getBoundingClientRect().width / slotW) : 1; });
          gsap.set(svg, { transformOrigin: "0% 50%", scaleX: ratios[0] });
          charSets.forEach(function (cs, idx) { if (idx > 0) { gsap.set(cs, { yPercent: 140, rotate: 8 }); } });
          word.setAttribute("data-current", "0");

          // Underline draw joins the entrance (the path is measured after the scale is applied).
          var len = Math.ceil(lengthOf(path) * 1.02) + 2;
          intro.set(svg, { opacity: 1 }, 0.95);
          intro.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.out" }, 0.95);

          // One looping timeline: hold, chars out, swap, underline resize, chars in.
          cycle = gsap.timeline({ repeat: -1, paused: true });
          els.forEach(function (el, idx) {
            var next = (idx + 1) % els.length;
            cycle.to({}, { duration: 1.8 });
            cycle.to(charSets[idx], { yPercent: -140, rotate: -8, duration: 0.4, ease: "power2.in", stagger: 0.02 });
            cycle.addLabel("swap" + idx);
            cycle.call(function () { word.setAttribute("data-current", String(next)); }, null, "swap" + idx);
            cycle.to(svg, { scaleX: ratios[next], duration: 0.55, ease: "power3.inOut" }, "swap" + idx);
            cycle.fromTo(charSets[next], { yPercent: 140, rotate: 8 }, { yPercent: 0, rotate: 0, duration: 0.55, ease: "expo.out", stagger: 0.025, immediateRender: false }, "swap" + idx + "+=0.02");
          });

          intro.eventCallback("onComplete", function () {
            leadSplit.revert();
            gsap.set([word, lede, actions, trust, photo, photoImg, svg, path, cue].concat(Array.prototype.slice.call(frames), Array.prototype.slice.call(chips)).filter(Boolean), { clearProps: "transform,opacity,clipPath,scale,strokeDasharray,strokeDashoffset" });
            gsap.set(svg, { transformOrigin: "0% 50%", scaleX: ratios[0] });
            Array.prototype.forEach.call(chips, function (c) { c.classList.add("is-bobbing"); });
            started = true;
            toggle.hidden = false;
            apply();
          });
          intro.play();
        });
      }).catch(fail);

      return function () {
        alive = false;
        cleanups.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
      };
    } catch (err) {
      fail(err);
    }
  });
})();

/* Scroll reveals (quick 261013-ep2). Adds .reveal to a fixed selector list, then
   html.js-reveal, which is the ONLY thing that enables the hidden pre-reveal CSS.
   Bails out (touching nothing) without IntersectionObserver or under
   prefers-reduced-motion, so content is never hidden. Keep REVEAL_TARGETS in sync
   with tools/motion-browser-test.js. */
(function () {
  "use strict";

  // The GSAP motion IIFE above owns the page when it is active; this is the fallback path.
  if (document.documentElement.classList.contains("has-motion")) { return; }

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
