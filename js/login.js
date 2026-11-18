/* Sign-in page. Session check first, then validation, then signInWithPassword.
   Never logs values and never puts the email or password in a URL. */
(function () {
  "use strict";

  var app = window.AuthApp;
  if (!app || app.unsupported) return;

  var MAILTO = "mailto:hello@samwhitlock.example";
  var EMAIL_MSG = "That email doesn’t look quite right. Check for a typo and try again.";

  var gateEl = document.getElementById("auth-gate");
  var view = document.getElementById("login-view");
  var status = document.getElementById("auth-status");
  var form = document.getElementById("login-form");
  var email = document.getElementById("login-email");
  var password = document.getElementById("login-password");
  var toggle = document.getElementById("login-toggle");
  var submit = form ? form.querySelector("button[type=submit]") : null;
  var loginTitle = document.getElementById("login-title");
  var loginLede = document.getElementById("login-lede");
  var signinCard = document.getElementById("signin-card");
  var forgot = document.getElementById("forgot-link");
  var resetView = document.getElementById("reset-view");
  var resetStatus = document.getElementById("reset-status");
  var resetRequest = document.getElementById("reset-request");
  var resetForm = document.getElementById("reset-form");
  var resetEmail = document.getElementById("reset-email");
  var resetSent = document.getElementById("reset-sent");
  var resetSentTitle = document.getElementById("reset-sent-title");
  var resetAnnounce = document.getElementById("reset-announce");
  var resetAgain = document.getElementById("reset-again");
  var resetBack = document.getElementById("reset-back");
  if (!gateEl || !view || !status || !form || !email || !password || !toggle || !submit) return;
  if (!loginTitle || !loginLede || !signinCard || !forgot || !resetView || !resetStatus || !resetRequest ||
      !resetForm || !resetEmail || !resetSent || !resetSentTitle || !resetAnnounce || !resetAgain || !resetBack) return;

  var TITLE_SIGNIN = loginTitle.textContent;
  var LEDE_SIGNIN = loginLede.textContent;
  var TITLE_RESET = "Let\u2019s get you back in";
  var COUNTDOWN = 60;
  var resetBusy = false;
  var countTimer = null;
  var lastResetEmail = "";

  var busy = false;

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

  // opts: { title, lines: [text], mail: bool, retry: bool, alert: bool }
  function banner(opts) {
    clearBanner();
    var b = el("div", "auth__banner" + (opts.alert ? "" : " auth__banner--info"));
    b.setAttribute("role", opts.alert ? "alert" : "status");
    b.appendChild(el("p", "auth__title", opts.title));
    (opts.lines || []).forEach(function (l) { b.appendChild(el("p", "", l)); });
    if (opts.mail) {
      var p = b.lastChild;
      p.appendChild(document.createTextNode(" "));
      var a = el("a", "", "hello@samwhitlock.example");
      a.setAttribute("href", MAILTO);
      p.appendChild(a);
      p.appendChild(document.createTextNode("."));
    }
    if (opts.retry) {
      var btn = el("button", "btn btn--primary", "Try again");
      btn.type = "button";
      btn.addEventListener("click", function () { attempt(); });
      b.appendChild(btn);
    }
    status.appendChild(b);
    status.hidden = false;
  }

  function setFieldError(input, msg) {
    var err = document.getElementById(input.id + "-error");
    if (err) err.textContent = msg;
    if (msg) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function clearFieldErrors() {
    setFieldError(email, "");
    setFieldError(password, "");
  }

  function validate() {
    clearFieldErrors();
    var first = null;
    if (email.validity.valueMissing || email.value.trim() === "") {
      setFieldError(email, "Please add your email address.");
      first = email;
    } else if (!email.validity.valid) {
      setFieldError(email, EMAIL_MSG);
      first = email;
    }
    if (password.value === "") {
      setFieldError(password, "Please enter your password.");
      if (!first) first = password;
    }
    if (first) { first.focus(); return false; }
    return true;
  }

  function setBusy(on) {
    busy = on;
    if (on) {
      submit.setAttribute("aria-busy", "true");
      submit.textContent = "Signing in…";
    } else {
      submit.removeAttribute("aria-busy");
      submit.textContent = "Sign in";
    }
  }

  function hidePassword() {
    password.type = "password";
    toggle.setAttribute("aria-pressed", "false");
    toggle.textContent = "Show password";
  }

  function attempt() {
    if (busy) return;
    if (!validate()) return;
    clearBanner();
    hidePassword();
    if (!app.storageOk()) {
      banner({
        title: "I couldn’t reach the sign-in service",
        lines: ["Your browser is blocking what I need to keep you signed in. Try turning off private mode or allowing site data, then try again."],
        retry: true, alert: true
      });
      return;
    }
    setBusy(true);
    app.sb.auth.signInWithPassword({ email: email.value.trim(), password: password.value }).then(function (res) {
      var error = res && res.error;
      if (!error && res && res.data && res.data.session) {
        location.replace("dashboard.html");
        return;
      }
      setBusy(false);
      var kind = error ? app.classifyError(error) : "service";
      if (kind === "credentials") {
        password.value = "";
        banner({
          title: "That didn’t work",
          lines: ["That email and password don’t match. Check them and try again, or use “Forgotten your password?” below."],
          alert: true
        });
        email.focus();
      } else if (kind === "rate") {
        banner({
          title: "Let’s slow down a moment",
          lines: ["There have been a few tries in a row. Please wait a few minutes and try again."],
          alert: true
        });
      } else {
        serviceBanner();
      }
    }, function () {
      setBusy(false);
      serviceBanner();
    });
  }

  function serviceBanner() {
    banner({
      title: "I couldn’t reach the sign-in service",
      lines: ["That’s on my side, not yours. Check your connection and try again in a moment. If it keeps happening, email"],
      mail: true, retry: true, alert: true
    });
  }

  function openForm() {
    app.hide(gateEl);
    app.show(view);
    submit.disabled = false;
    var msg = app.flash.take();
    if (location.hash === "#reset") { showReset(); return; }
    if (msg) banner({ title: msg, lines: [], alert: false });
  }

  function gate() {
    app.hide(view);
    app.show(gateEl);
    app.sb.auth.getSession().then(function (res) {
      if (res && res.data && res.data.session) location.replace("dashboard.html");
      else openForm();
    }, openForm);
  }

  // ----- forgotten password
  function clearResetBanner() {
    while (resetStatus.firstChild) resetStatus.removeChild(resetStatus.firstChild);
    resetStatus.hidden = true;
  }

  function resetBanner(title, lines, alertIt, retry) {
    clearResetBanner();
    var b = el("div", "auth__banner" + (alertIt ? "" : " auth__banner--info"));
    b.setAttribute("role", alertIt ? "alert" : "status");
    b.appendChild(el("p", "auth__title", title));
    lines.forEach(function (l) { b.appendChild(el("p", "", l)); });
    if (retry) {
      var last = b.lastChild;
      last.appendChild(document.createTextNode(" "));
      var a = el("a", "", "hello@samwhitlock.example");
      a.setAttribute("href", MAILTO);
      last.appendChild(a);
      last.appendChild(document.createTextNode("."));
      var btn = el("button", "btn btn--primary", "Try again");
      btn.type = "button";
      btn.addEventListener("click", function () { sendReset(lastResetEmail, false); });
      b.appendChild(btn);
    }
    resetStatus.appendChild(b);
    resetStatus.hidden = false;
  }

  function stopCountdown() {
    if (countTimer) { clearInterval(countTimer); countTimer = null; }
  }

  function startCountdown() {
    stopCountdown();
    var left = COUNTDOWN;
    resetAgain.disabled = true;
    resetAgain.textContent = "Send it again in " + left + "s";
    resetAnnounce.textContent = "You can ask for another email in " + left + " seconds.";
    countTimer = setInterval(function () {
      left--;
      if (left <= 0) {
        stopCountdown();
        resetAgain.disabled = false;
        resetAgain.textContent = "Send it again";
        resetAnnounce.textContent = "You can ask for another email now.";
        return;
      }
      resetAgain.textContent = "Send it again in " + left + "s";
    }, 1000);
  }

  function showSignin(focusTitle) {
    stopCountdown();
    clearResetBanner();
    hidePassword();
    resetView.hidden = true;
    resetSent.hidden = true;
    resetRequest.hidden = false;
    resetEmail.value = "";
    setFieldError(resetEmail, "");
    loginTitle.textContent = TITLE_SIGNIN;
    loginLede.textContent = LEDE_SIGNIN;
    loginLede.hidden = false;
    signinCard.hidden = false;
    if (focusTitle) loginTitle.focus();
  }

  function showReset() {
    clearBanner();
    hidePassword();
    signinCard.hidden = true;
    loginTitle.textContent = TITLE_RESET;
    loginLede.textContent = "";
    loginLede.hidden = true;
    resetView.hidden = false;
    resetEmail.value = email.value.trim();
    loginTitle.focus();
  }

  // Any answer from the service other than a rate limit looks the same to the person, so the
  // page never reveals whether an address belongs to a client. A dropped connection is different:
  // nothing was sent, so it must not say "check your inbox".
  function isNetwork(error) {
    return !error.status || error.name === "AuthRetryableFetchError";
  }

  function sendReset(address, fromAgain) {
    if (resetBusy) return;
    resetBusy = true;
    clearResetBanner();
    lastResetEmail = address;
    app.sb.auth.resetPasswordForEmail(address).then(function (res) {
      resetBusy = false;
      var error = res && res.error;
      if (error && Number(error.status) === 429) {
        resetBanner("Let\u2019s slow down a moment", ["That\u2019s a lot of tries in a short time. Please wait a few minutes and try again."], true, false);
        return;
      }
      if (error && isNetwork(error)) { resetServiceBanner(); return; }
      resetRequest.hidden = true;
      resetSent.hidden = false;
      startCountdown();
      if (!fromAgain) resetSentTitle.focus();
    }, function () {
      resetBusy = false;
      resetServiceBanner();
    });
  }

  function resetServiceBanner() {
    resetBanner("I couldn\u2019t reach the sign-in service",
      ["That\u2019s on my side, not yours. Check your connection and try again in a moment. If it keeps happening, email"], true, true);
  }

  resetForm.addEventListener("submit", function (e) {
    e.preventDefault();
    setFieldError(resetEmail, "");
    var v = resetEmail.value.trim();
    if (v === "") {
      setFieldError(resetEmail, "Please add your email address.");
      resetEmail.focus();
      return;
    }
    if (!resetEmail.validity.valid) {
      setFieldError(resetEmail, EMAIL_MSG);
      resetEmail.focus();
      return;
    }
    sendReset(v, false);
  });
  resetEmail.addEventListener("input", function () { setFieldError(resetEmail, ""); });
  resetAgain.addEventListener("click", function () {
    if (resetAgain.disabled || !lastResetEmail) return;
    resetAgain.disabled = true;
    sendReset(lastResetEmail, true);
  });
  forgot.addEventListener("click", showReset);
  resetBack.addEventListener("click", function () { showSignin(true); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    attempt();
  });
  email.addEventListener("input", function () { setFieldError(email, ""); });
  password.addEventListener("input", function () { setFieldError(password, ""); });
  toggle.addEventListener("click", function () {
    var showing = password.type === "text";
    password.type = showing ? "password" : "text";
    toggle.setAttribute("aria-pressed", showing ? "false" : "true");
    toggle.textContent = showing ? "Show password" : "Hide password";
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted) gate(); });

  if (!app.sb) {
    app.hide(gateEl);
    app.show(view);
    serviceBanner();
    return;
  }
  gate();
})();
