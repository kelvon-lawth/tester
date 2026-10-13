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
