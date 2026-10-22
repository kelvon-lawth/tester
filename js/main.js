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
  // getPointAtLength is slow on long paths, so a long periodic path (the steps connector) is measured on a
  // short prefix and scaled: the screen/user length ratio is the same for every period.
  function lengthOf(el) {
    var total;
    try { total = el.getTotalLength(); } catch (e) { return 0; }
    if (!total) { return 0; }
    var cs = window.getComputedStyle(el);
    if (cs.vectorEffect !== "non-scaling-stroke") { return total; }
    var m = el.getScreenCTM && el.getScreenCTM();
    if (!m) { return 0; }
    var span = total > 300 ? 90 : total;
    var steps = Math.max(8, Math.min(36, Math.ceil(span)));
    var prev = el.getPointAtLength(0);
    var len = 0;
    for (var i = 1; i <= steps; i++) {
      var p = el.getPointAtLength(span * i / steps);
      var dx = (p.x - prev.x) * m.a + (p.y - prev.y) * m.c;
      var dy = (p.x - prev.x) * m.b + (p.y - prev.y) * m.d;
      len += Math.sqrt(dx * dx + dy * dy);
      prev = p;
    }
    return len * total / span;
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

  // ------------------------------------------------------------------------------------------------
  // Scroll choreography. Rules shared by every section:
  // - One-shot entrances use start "clamp(top N%)" with once:true, so a trigger near the page end (or skipped
  //   by a jump) is still reachable, and finish with clearProps so CSS hover lifts work afterwards.
  // - Scrubbed tweens change transform only (never clip-path), scrub: 0.6, end "clamp(...)": at progress 1 the
  //   content is at identity.
  // - Parallax is only for aria-hidden .deco shapes. Native scrolling is never touched.
  // ------------------------------------------------------------------------------------------------
  var oneShots = [];

  function qa(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }

  function oneShot(trigger, start, vars) {
    var tl = gsap.timeline({
      scrollTrigger: { trigger: trigger, start: start || "clamp(top 85%)", once: true },
      defaults: { ease: "expo.out" }
    });
    if (vars && vars.onDone) { tl.eventCallback("onComplete", vars.onDone); }
    if (tl.scrollTrigger) { oneShots.push(tl.scrollTrigger); }
    return tl;
  }

  // Safety net: an entrance must never stay hidden because a trigger was skipped or never reachable.
  // "soft" plays entrances that should already have fired and finishes ones that are fully above the viewport;
  // "final" also finishes anything still unfinished that is on or above the viewport.
  function sweep(mode) {
    oneShots.forEach(function (st) {
      var a = st.animation;
      if (!a || !st.trigger || a.progress() >= 1) { return; }
      var r = st.trigger.getBoundingClientRect();
      if (r.bottom < 0) { a.progress(1); }
      else if (mode === "final" && r.top < window.innerHeight && !a.isActive()) { a.progress(1); }
      else if (a.progress() === 0 && !a.isActive() && r.top < window.innerHeight * 0.9) { a.play(); }
    });
  }

  function drawLength(el) {
    var len = 0;
    try { len = el.getTotalLength(); } catch (e) { len = 0; }
    return Math.ceil(len) + 2;
  }

  function choreography(cleanups) {
    // Section headings: words rise through a mask, then the split is reverted to plain text.
    qa(".section-head h2, .about__text h2").forEach(function (h) {
      var split = SplitText.create(h, { type: "words", mask: "words", wordsClass: "hw" });
      var tl = oneShot(h, "clamp(top 88%)", { onDone: function () { split.revert(); } });
      tl.from(split.words, { yPercent: 120, duration: 1, stagger: 0.06 });
    });

    // Squiggle divider draws left to right
    qa(".divider-squiggle").forEach(function (d) {
      var tl = oneShot(d, "clamp(top 92%)", { onDone: function () { gsap.set(d, { clearProps: "transform,opacity" }); } });
      tl.fromTo(d, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 1.2, ease: "power3.out" });
    });

    // Services: cards cascade, tiles pop, icon strokes draw
    var grid = document.querySelector(".services-grid");
    if (grid) {
      var items = qa(".services-grid > li");
      var tiles = qa(".service-card__icon", grid);
      var strokes = items.map(function (li) { return qa(".service-card__icon svg path, .service-card__icon svg circle", li); });
      var stl = oneShot(grid, "clamp(top 85%)", {
        onDone: function () {
          gsap.set(items, { clearProps: "transform,opacity" });
          gsap.set(tiles, { clearProps: "transform" });
          strokes.forEach(function (list) { gsap.set(list, { clearProps: "strokeDasharray,strokeDashoffset" }); });
          items.forEach(function (li) { li.classList.remove("is-animating"); });
        }
      });
      items.forEach(function (li) { li.classList.add("is-animating"); });
      stl.from(items, { y: 64, rotate: 2, opacity: 0, duration: 1.1, stagger: 0.12 }, 0);
      stl.from(tiles, { scale: 0.6, duration: 0.7, ease: "back.out(2)", stagger: 0.12 }, 0.2);
      strokes.forEach(function (list, i) {
        list.forEach(function (p, j) {
          var len = drawLength(p);
          stl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out" }, 0.35 + i * 0.12 + j * 0.08);
        });
      });
    }

    // About: photo un-masks and settles, text slides in
    var aPhoto = document.querySelector(".about__photo");
    var aImg = document.querySelector(".about__photo .media");
    var aText = document.querySelector(".about__text");
    if (aPhoto && aImg) {
      var atl = oneShot(aPhoto, "clamp(top 82%)");
      atl.fromTo(aPhoto, { clipPath: "inset(12% 12% 12% 12% round 24px)" }, { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.1, onComplete: function () { gsap.set(aPhoto, { clearProps: "clipPath" }); } });
      gsap.fromTo(aImg, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: aPhoto, start: "top bottom", end: "clamp(top 55%)", scrub: 0.6 } });
    }
    if (aText) {
      var kids = qa(".about__text > :not(h2)");
      var ttl = oneShot(aText, "clamp(top 82%)", { onDone: function () { gsap.set(kids, { clearProps: "transform,opacity" }); } });
      ttl.from(kids, { x: 48, opacity: 0, duration: 1, stagger: 0.12 });
    }

    // Testimonials: alternate sides, one trigger per card so stacked phones animate as each card arrives
    var wide = window.innerWidth >= 1024;
    qa(".testimonial").forEach(function (fig, i) {
      var tl = oneShot(fig, "clamp(top 88%)", { onDone: function () { gsap.set(fig, { clearProps: "transform,opacity" }); fig.classList.remove("is-animating"); } });
      fig.classList.add("is-animating");
      tl.from(fig, { x: i % 2 === 0 ? -64 : 64, rotate: i % 2 === 0 ? -3 : 3, opacity: 0, duration: 1, delay: wide ? i * 0.12 : 0 });
    });

    // Pricing (quick 261022-bsb): per-card trigger so stacked phone cards animate as each arrives (transform and opacity only)
    qa(".pricing-card").forEach(function (card, i) {
      var items = qa(".pricing-card__features li", card);
      var badge = card.querySelector(".pricing-card__badge");
      var ptl = oneShot(card, "clamp(top 88%)", {
        onDone: function () {
          gsap.set([card, badge].concat(items).filter(Boolean), { clearProps: "transform,opacity" });
          card.classList.remove("is-animating");
        }
      });
      card.classList.add("is-animating");
      ptl.from(card, { y: 56, opacity: 0, duration: 1, delay: wide ? i * 0.12 : 0 });
      ptl.from(items, { y: 16, opacity: 0, duration: 0.6, stagger: 0.06 }, 0.3);
      if (badge) { ptl.from(badge, { scale: 0.6, opacity: 0, duration: 0.7, ease: "back.out(2)" }, 0.4); }
    });

    // Logo ticker: scroll-linked only (never auto-moves, so no WCAG 2.2.2 concern)
    var strip = document.querySelector(".logo-strip");
    var logosSection = strip && strip.closest("section");
    if (strip && logosSection) {
      var wrap = document.createElement("div");
      wrap.className = "logo-ticker";
      var track = document.createElement("div");
      track.className = "logo-ticker__track";
      strip.parentNode.insertBefore(wrap, strip);
      wrap.appendChild(track);
      track.appendChild(strip);
      var clone = strip.cloneNode(true);
      clone.classList.add("logo-strip--clone");
      clone.setAttribute("aria-hidden", "true");
      qa("svg", clone).forEach(function (svg) { svg.removeAttribute("role"); svg.removeAttribute("aria-label"); });
      qa("[id]", clone).forEach(function (el) { el.removeAttribute("id"); });
      track.appendChild(clone);
      gsap.fromTo(track, { xPercent: 0 }, { xPercent: -40, ease: "none", scrollTrigger: { trigger: logosSection, start: "top bottom", end: "bottom top", scrub: 0.6 } });
      cleanups.push(function () {
        if (clone.parentNode) { clone.parentNode.removeChild(clone); }
        if (wrap.parentNode) { wrap.parentNode.insertBefore(strip, wrap); wrap.parentNode.removeChild(wrap); }
      });
    }

    // Closing band: grows from an inset, a soft light sweeps across, the big headline rises
    var band = document.querySelector(".cta-band");
    if (band) {
      var sweepEl = band.querySelector(".cta-band__sweep");
      var h2 = band.querySelector("h2");
      var busy = band.querySelector(".text-coral-on-navy");
      var bsplit = h2 ? SplitText.create(h2, { type: "words", mask: "words", wordsClass: "hw" }) : null;
      var btl = oneShot(band, "clamp(top 88%)", { onDone: function () { if (bsplit) { bsplit.revert(); } if (sweepEl) { gsap.set(sweepEl, { autoAlpha: 0 }); } } });
      btl.fromTo(band, { clipPath: "inset(6% 4% 6% 4% round 40px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.2, onComplete: function () { gsap.set(band, { clearProps: "clipPath" }); } }, 0);
      if (sweepEl) { btl.fromTo(sweepEl, { xPercent: -100 }, { xPercent: 200, duration: 1.6, ease: "power2.inOut" }, 0.2); }
      if (bsplit) { btl.from(bsplit.words, { yPercent: 120, duration: 1, stagger: 0.07 }, 0.25); }
      if (busy) { btl.from(busy, { scale: 0.8, duration: 0.9, ease: "back.out(2)" }, 0.9); }
      gsap.fromTo(band, { scale: 0.94 }, { scale: 1, ease: "none", scrollTrigger: { trigger: band, start: "top bottom", end: "clamp(top 50%)", scrub: 0.6 } });
    }

    // Decor parallax (aria-hidden shapes only)
    qa(".deco").forEach(function (d) {
      gsap.fromTo(d, { y: -50 }, { y: 50, ease: "none", scrollTrigger: { trigger: d.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Safety nets: load, 4s after load, every scrollEnd, and whenever the page bottom is reached
    function onLoaded() {
      ScrollTrigger.refresh();
      sweep("soft");
      window.setTimeout(function () { sweep("final"); }, 4000);
    }
    if (document.readyState === "complete") { onLoaded(); } else { window.addEventListener("load", onLoaded, { once: true }); }
    var onEnd = function () { sweep("soft"); };
    ScrollTrigger.addEventListener("scrollEnd", onEnd);
    var ticking = false;
    var onScroll = function () {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
          sweep("soft");
          window.setTimeout(function () { sweep("final"); }, 1500);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(function () {
      ScrollTrigger.removeEventListener("scrollEnd", onEnd);
      window.removeEventListener("scroll", onScroll);
    });
  }

  var ready = fontsReady();

  // Hero, cycle and section choreography live in the motion branches only.
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
      ready.then(function () {
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
          var len = Math.ceil(lengthOf(path) * 1.05) + 3;
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
          choreography(cleanups);
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

  // Steps. Desktop: the connector draws in proportion to scroll and the badges pop. Phones: no connector, steps rise.
  function stepOneShot(step, whole) {
    var badge = step.querySelector(".step__badge");
    var rest = qa("h3, p", step);
    var tl = oneShot(step, "clamp(top 85%)", { onDone: function () { gsap.set([step, badge].concat(rest).filter(Boolean), { clearProps: "transform,opacity" }); } });
    if (whole) { tl.from(step, { y: 44, opacity: 0, duration: 1 }, 0); }
    if (badge) { tl.from(badge, { scale: 0.3, duration: 0.8, ease: "back.out(2)" }, 0.1); }
    if (!whole) { tl.from(rest, { y: 28, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.2); }
  }

  mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", function (context) {
    var live = true;
    ready.then(function () {
      if (!live || failed) { return; }
      context.add(function () {
        var wrapEl = document.querySelector(".steps-wrap");
        var conn = document.querySelector(".steps__connector");
        var path = conn && conn.querySelector("path");
        if (wrapEl && path) {
          var lenOf = function () { return Math.ceil(lengthOf(path) * 1.08) + 4; };
          gsap.set(path, { strokeDasharray: lenOf() });
          ScrollTrigger.addEventListener("refreshInit", function () { gsap.set(path, { strokeDasharray: lenOf() }); });
          gsap.fromTo(path, { strokeDashoffset: function () { return lenOf(); } }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: wrapEl, start: "top 75%", end: "clamp(bottom 55%)", scrub: 0.6, invalidateOnRefresh: true } });
        }
        qa(".step").forEach(function (step) { stepOneShot(step, false); });
      });
    }).catch(fail);
    return function () { live = false; };
  });

  mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", function (context) {
    var live = true;
    ready.then(function () {
      if (!live || failed) { return; }
      context.add(function () { qa(".step").forEach(function (step) { stepOneShot(step, true); }); });
    }).catch(fail);
    return function () { live = false; };
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
    ".logo-strip li", ".step", ".pricing-card", ".cta-band__inner", ".hero__media", ".divider-squiggle",
    ".steps__connector", ".contact__form-wrap", ".contact__details", ".page-contact .contact__intro"
  ];
  var STAGGER_MS = 90;
  var REVEAL_MS = 700;
  var STAGGERED = /(^|\s)(service-card|pricing-card|testimonial|step)(\s|$)/;

  var root = document.documentElement;
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  if (!("IntersectionObserver" in window) || (reduce && reduce.matches)) { return; }

  var targets = Array.prototype.slice.call(document.querySelectorAll(REVEAL_TARGETS.join(",")));
  if (!targets.length) { return; }

  function delayFor(el) {
    var base = el;
    if ((el.classList.contains("service-card") || el.classList.contains("pricing-card")) && el.parentElement && el.parentElement.tagName === "LI") {
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
