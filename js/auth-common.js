/* Shared sign-in helpers for login, set-password and dashboard. Loaded only on those pages.
   Exposes window.AuthApp. Never logs values, never touches the page's data. */
(function () {
  "use strict";

  var LIVE_SITE = "https://tester-five-sage.vercel.app/login.html";
  var FLASH_KEY = "auth-flash";

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  var flash = {
    set: function (text) {
      try { sessionStorage.setItem(FLASH_KEY, String(text)); } catch (e) { /* storage blocked: skip the message */ }
    },
    take: function () {
      try {
        var v = sessionStorage.getItem(FLASH_KEY);
        if (v !== null) sessionStorage.removeItem(FLASH_KEY);
        return v;
      } catch (e) { return null; }
    }
  };

  // Writes and reads a throwaway key, because a blocked store can throw on write only.
  function storageOk() {
    try {
      var k = "auth-probe";
      localStorage.setItem(k, "1");
      var ok = localStorage.getItem(k) === "1";
      localStorage.removeItem(k);
      return ok;
    } catch (e) { return false; }
  }

  // Works from the HTTP status and error type, not from error code names.
  // Anything unknown falls through to "service", never to "credentials".
  function classifyError(error) {
    if (!error) return "service";
    var status = Number(error.status);
    if (status === 429) return "rate";
    if (status === 400 || status === 401 || status === 403) return "credentials";
    return "service";
  }

  function showFileCard() {
    var gate = document.getElementById("auth-gate");
    var views = document.querySelectorAll("#login-view, #reset-view, #password-view, .dash");
    hide(gate);
    for (var i = 0; i < views.length; i++) hide(views[i]);
    show(document.getElementById("file-card"));
  }

  var unsupported = location.protocol === "file:";
  var sb = null;

  if (unsupported) {
    showFileCard();
  } else if (window.supabase && window.AUTH_CONFIG) {
    var cfg = window.AUTH_CONFIG;
    sb = window.supabase.createClient(cfg.url, cfg.publishableKey, {
      auth: { flowType: "implicit", detectSessionInUrl: false, persistSession: true, autoRefreshToken: true }
    });
  }

  window.AuthApp = {
    unsupported: unsupported,
    sb: sb,
    liveSite: LIVE_SITE,
    classifyError: classifyError,
    storageOk: storageOk,
    flash: flash,
    showFileCard: showFileCard,
    show: show,
    hide: hide
  };
})();
