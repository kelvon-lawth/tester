/*
 * Shared script, loaded on every page.
 * Classic deferred script only: no ES modules, no module syntax, no network
 * calls for local files. Those are blocked over file:// (CORS), which would
 * break double-click opening.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  if (!document.fonts || !document.fonts.load) {
    root.classList.add("fonts-failed");
    return;
  }

  Promise.all([
    document.fonts.load("600 1em Fraunces"),
    document.fonts.load("400 1em Figtree")
  ]).then(function (results) {
    var ok = results.every(function (r) { return r && r.length >= 1; });
    root.classList.add(ok ? "fonts-loaded" : "fonts-failed");
  }, function () {
    root.classList.add("fonts-failed");
  });
})();
