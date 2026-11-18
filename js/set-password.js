/* Set-password page: invite links, reset links and the change-password route.
   The link token is taken out of the address bar before anything else happens and is only used
   when the person presses Continue (email scanners open links in advance, so opening alone must
   not use the link up). Passwords and tokens are never logged, stored or written into the page. */
(function () {
  "use strict";

  // Read the token and take it out of the address bar before any await.
  var params = new URLSearchParams(location.search);
  var linkToken = params.get("token_hash");
  var linkType = params.get("type");
  var hadLink = linkToken !== null || linkType !== null;
  if (location.search || location.hash) {
    try { history.replaceState(null, "", location.pathname); } catch (e) { /* nothing to strip */ }
  }
  params = null;

  var app = window.AuthApp;
  if (!app || app.unsupported) return;

  var MAILTO = "mailto:hello@samwhitlock.example";
  var MIN = (window.AUTH_CONFIG && Number(window.AUTH_CONFIG.PASSWORD_MIN)) || 10;
  var TITLES = { invite: "Welcome, let’s set your password", recovery: "Choose a new password" };

  var gateEl = document.getElementById("auth-gate");
  var view = document.getElementById("password-view");
  var title = document.getElementById("sp-title");
  var lede = document.getElementById("sp-lede");
  var status = document.getElementById("sp-status");
  var contStep = document.getElementById("sp-continue");
  var contBtn = document.getElementById("continue-btn");
  var form = document.getElementById("password-form");
  var pw1 = document.getElementById("sp-new");
  var pw2 = document.getElementById("sp-again");
  var toggle = document.getElementById("sp-toggle");
  var doneStep = document.getElementById("sp-done");
  var expiredStep = document.getElementById("sp-expired");
  if (!gateEl || !view || !title || !lede || !status || !contStep || !contBtn || !form || !pw1 || !pw2 ||
      !toggle || !doneStep || !expiredStep) return;
  var saveBtn = form.querySelector("button[type=submit]");
  if (!saveBtn) return;

  var busy = false;
  var verified = false;

  pw1.setAttribute("minlength", String(MIN));
  pw2.setAttribute("minlength", String(MIN));

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function clearBanner() {
    while (status.firstChild) status.removeChild(status.firstChild);
    status.hidden = true;
  }

  // opts: { title, lines: [text], mail: bool, login: bool, retry: fn, alert: bool }
  function banner(opts) {
    clearBanner();
    var b = el("div", "auth__banner" + (opts.alert ? "" : " auth__banner--info"));
    b.setAttribute("role", opts.alert ? "alert" : "status");
    b.appendChild(el("p", "auth__title", opts.title));
    (opts.lines || []).forEach(function (l) { b.appendChild(el("p", "", l)); });
    var last = b.lastChild;
    if (opts.mail && last) {
      last.appendChild(document.createTextNode(" "));
      var m = el("a", "", "hello@samwhitlock.example");
      m.setAttribute("href", MAILTO);
      last.appendChild(m);
      last.appendChild(document.createTextNode("."));
    }
    if (opts.login) {
      var p = el("p");
      var a = el("a", "", "Go to sign in");
      a.setAttribute("href", "login.html");
      p.appendChild(a);
      b.appendChild(p);
    }
    if (opts.retry) {
      var btn = el("button", "btn btn--primary", "Try again");
      btn.type = "button";
      btn.addEventListener("click", opts.retry);
      b.appendChild(btn);
    }
    status.appendChild(b);
    status.hidden = false;
  }

  function serviceBanner(retry) {
    banner({
      title: "I couldn’t reach the sign-in service",
      lines: ["That’s on my side, not yours. Check your connection and try again in a moment. If it keeps happening, email"],
      mail: true, retry: retry, alert: true
    });
  }

  function setFieldError(input, msg) {
    var err = document.getElementById(input.id + "-error");
    if (err) err.textContent = msg;
    if (msg) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function hidePasswords() {
    pw1.type = "password";
    pw2.type = "password";
    toggle.setAttribute("aria-pressed", "false");
    toggle.textContent = "Show password";
  }

  function hideSteps() {
    app.hide(contStep);
    app.hide(form);
    app.hide(doneStep);
    app.hide(expiredStep);
  }

  function open() {
    app.hide(gateEl);
    app.show(view);
  }

  function showHeading(text, lines) {
    title.textContent = text;
    lede.textContent = lines || "";
    lede.hidden = !lines;
  }

  function showContinue() {
    open();
    hideSteps();
    clearBanner();
    showHeading(TITLES[linkType], "You’re nearly there. Press the button to carry on.");
    app.show(contStep);
    contBtn.disabled = false;
    contBtn.removeAttribute("aria-busy");
  }

  function showForm() {
    open();
    hideSteps();
    clearBanner();
    showHeading(TITLES[linkType] || TITLES.recovery, "Pick something you’ll remember. At least " + MIN + " characters.");
    app.show(form);
  }

  function showExpired() {
    open();
    hideSteps();
    clearBanner();
    showHeading("This link has expired", "Links like this only work for a short time, and once. No harm done, I can send you a fresh one.");
    app.show(expiredStep);
    title.focus();
  }

  function showDone() {
    hideSteps();
    clearBanner();
    showHeading("All set", "Your password is saved and you’re signed in.");
    app.show(doneStep);
    title.focus();
  }

  // ----- link step: the click is what uses the link
  function verify() {
    if (busy || !linkToken || !linkType) return;
    if (!app.storageOk()) {
      banner({
        title: "I couldn’t reach the sign-in service",
        lines: ["Your browser is blocking what I need to keep you signed in. Try turning off private mode or allowing site data, then try again."],
        retry: verify, alert: true
      });
      return;
    }
    busy = true;
    clearBanner();
    contBtn.disabled = true;
    contBtn.setAttribute("aria-busy", "true");
    app.sb.auth.verifyOtp({ token_hash: linkToken, type: linkType }).then(function (res) {
      busy = false;
      var error = res && res.error;
      if (error) {
        if (isNetwork(error)) { fail(); return; }
        linkToken = null;
        showExpired();
        return;
      }
      linkToken = null;
      verified = true;
      showForm();
      pw1.focus();
    }, function () {
      busy = false;
      fail();
    });
    function fail() {
      contBtn.disabled = false;
      contBtn.removeAttribute("aria-busy");
      serviceBanner(function () { verify(); });
    }
  }

  // A link that is used up or out of date comes back as a 4xx. Only a dropped connection or a
  // server fault says nothing about the link, and the link may still be good.
  function isNetwork(error) {
    var s = Number(error.status);
    return !s || s >= 500 || error.name === "AuthRetryableFetchError";
  }

  // ----- password form
  function validate() {
    setFieldError(pw1, "");
    setFieldError(pw2, "");
    if (pw1.value.length < MIN) {
      setFieldError(pw1, "That’s a bit short. Please use at least " + MIN + " characters.");
      pw1.focus();
      return false;
    }
    if (pw1.value !== pw2.value) {
      setFieldError(pw2, "Those two don’t match yet. Please type the same password in both boxes.");
      pw2.focus();
      return false;
    }
    return true;
  }

  function save() {
    if (busy) return;
    if (!validate()) return;
    clearBanner();
    hidePasswords();
    busy = true;
    saveBtn.setAttribute("aria-busy", "true");
    saveBtn.textContent = "Saving…";
    app.sb.auth.updateUser({ password: pw1.value }).then(function (res) {
      busy = false;
      reset();
      var error = res && res.error;
      if (!error) {
        pw1.value = "";
        pw2.value = "";
        showDone();
        return;
      }
      var s = Number(error.status);
      if (s === 429) {
        banner({ title: "Let’s slow down a moment", lines: ["There have been a few tries in a row. Please wait a few minutes and try again."], alert: true });
      } else if (s === 422) {
        var same = error.code === "same_password";
        setFieldError(pw1, same
          ? "That’s the same as your current password. Please choose a different one."
          : "That password can’t be used. Please try a different one.");
        pw1.focus();
      } else if (error.name === "AuthSessionMissingError" || s === 401 || s === 403) {
        banner({ title: "Please sign in again", lines: ["For safety, please sign in again and then change your password."], login: true, alert: true });
      } else {
        serviceBanner(function () { save(); });
      }
    }, function () {
      busy = false;
      reset();
      serviceBanner(function () { save(); });
    });
    function reset() {
      saveBtn.removeAttribute("aria-busy");
      saveBtn.textContent = "Save password";
    }
  }

  // ----- starting point
  function checkSession() {
    app.hide(view);
    app.show(gateEl);
    app.sb.auth.getSession().then(function (res) {
      if (res && res.data && res.data.session) showForm();
      else showExpired();
    }, function () {
      open();
      hideSteps();
      showHeading("Set your password", "");
      serviceBanner(checkSession);
    });
  }

  contBtn.addEventListener("click", verify);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    save();
  });
  pw1.addEventListener("input", function () { setFieldError(pw1, ""); });
  pw2.addEventListener("input", function () { setFieldError(pw2, ""); });
  toggle.addEventListener("click", function () {
    var showing = pw1.type === "text";
    var t = showing ? "password" : "text";
    pw1.type = t;
    pw2.type = t;
    toggle.setAttribute("aria-pressed", showing ? "false" : "true");
    toggle.textContent = showing ? "Show password" : "Hide password";
  });
  // A page restored from the back button never re-reads a token: it only re-checks the session.
  window.addEventListener("pageshow", function (e) {
    if (e.persisted && !hadLink && app.sb) checkSession();
  });

  if (!app.sb) {
    open();
    hideSteps();
    showHeading("Set your password", "");
    serviceBanner(function () { location.reload(); });
    return;
  }

  if (hadLink) {
    if (linkToken && (linkType === "invite" || linkType === "recovery")) showContinue();
    else showExpired();
  } else {
    checkSession();
  }
})();
