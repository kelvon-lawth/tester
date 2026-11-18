/* Dashboard. The page ships empty: this script checks the session, reads the signed-in client's
   own row (row level security decides what comes back), and builds everything with textContent.
   Nothing from the row is stored, and account profile fields are never read. */
(function () {
  "use strict";

  var app = window.AuthApp;
  if (!app || app.unsupported) return;

  var MAILTO = "mailto:hello@samwhitlock.example";
  var LIMIT_MS = 8000;

  var gateEl = document.getElementById("auth-gate");
  var dash = document.getElementById("dash");
  var title = document.getElementById("dash-title");
  var lede = document.getElementById("dash-lede");
  var sample = document.getElementById("dash-sample");
  var grid = document.getElementById("dash-grid");
  var signout = document.getElementById("signout");
  if (!gateEl || !dash || !title || !lede || !sample || !grid || !signout) return;

  var run = 0;
  var timer = null;
  var signingOut = false;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function str(v) { return typeof v === "string" && v.trim() !== "" ? v : ""; }

  function clearGrid() {
    while (grid.firstChild) grid.removeChild(grid.firstChild);
  }

  function mailLink() {
    var a = el("a", "", "hello@samwhitlock.example");
    a.setAttribute("href", MAILTO);
    return a;
  }

  function reveal() {
    if (timer) { clearTimeout(timer); timer = null; }
    app.hide(gateEl);
    app.show(dash);
  }

  function addCard(cls) {
    var card = el("article", "card card--white " + cls);
    grid.appendChild(card);
    return card;
  }

  function renderReady(row) {
    clearGrid();
    var name = str(row.first_name);
    title.textContent = name ? "Hello, " + name : "Hello there";
    app.show(lede);
    if (row.is_sample === false) app.hide(sample); else app.show(sample);

    var plan = addCard("dash__plan");
    plan.appendChild(el("h2", "", "Your plan"));
    var dl = el("dl");
    if (str(row.plan_name)) {
      dl.appendChild(el("dt", "", "Plan"));
      dl.appendChild(el("dd", "", row.plan_name));
    }
    var items = Array.isArray(row.plan_items) ? row.plan_items.filter(str) : [];
    if (items.length) {
      dl.appendChild(el("dt", "", "What’s included"));
      var dd = el("dd");
      var ul = el("ul");
      items.forEach(function (i) { ul.appendChild(el("li", "", i)); });
      dd.appendChild(ul);
      dl.appendChild(dd);
    }
    if (str(row.check_in)) {
      dl.appendChild(el("dt", "", "Check-in"));
      dl.appendChild(el("dd", "", row.check_in));
    }
    plan.appendChild(dl);

    var next = addCard("dash__next");
    next.appendChild(el("h2", "", "Next steps"));
    var steps = Array.isArray(row.steps) ? row.steps : [];
    var ol = el("ol", "dash__steps");
    steps.forEach(function (s) {
      if (!s || typeof s !== "object") return;
      var li = el("li");
      if (str(s.title)) li.appendChild(el("strong", "", s.title));
      if (str(s.detail)) li.appendChild(el("span", "", s.detail));
      if (str(s.due)) li.appendChild(el("span", "dash__due", s.due));
      if (li.firstChild) ol.appendChild(li);
    });
    if (ol.firstChild) next.appendChild(ol);
    reveal();
  }

  function renderEmpty() {
    clearGrid();
    title.textContent = "Hello there";
    app.hide(lede);
    app.hide(sample);
    var card = addCard("dash__empty");
    card.appendChild(el("h2", "", "Your dashboard isn’t ready yet"));
    var p = el("p", "", "I’m still setting things up for you. Check back soon, or email me and I’ll get it moving. ");
    var a = el("a", "", "Email Sam");
    a.setAttribute("href", MAILTO);
    p.appendChild(a);
    p.appendChild(document.createTextNode("."));
    card.appendChild(p);
    reveal();
  }

  function renderFailure() {
    clearGrid();
    title.textContent = "Hello there";
    app.hide(lede);
    app.hide(sample);
    var card = addCard("dash__empty");
    card.setAttribute("role", "alert");
    card.appendChild(el("h2", "", "I couldn’t reach the sign-in service"));
    var p = el("p", "", "That’s on my side, not yours. Check your connection and try again in a moment. If it keeps happening, email ");
    p.appendChild(mailLink());
    p.appendChild(document.createTextNode("."));
    card.appendChild(p);
    var btn = el("button", "btn btn--primary", "Try again");
    btn.type = "button";
    btn.addEventListener("click", function () { gate(); });
    card.appendChild(btn);
    reveal();
  }

  function dropLocalSession() {
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && /^sb-.*-auth-token/.test(k)) keys.push(k);
      }
      keys.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* storage blocked: nothing to remove */ }
  }

  function leave(message) {
    app.flash.set(message);
    var done = function () { dropLocalSession(); location.replace("login.html"); };
    try { app.sb.auth.signOut({ scope: "local" }).then(done, done); } catch (e) { done(); }
  }

  function gate() {
    var mine = ++run;
    if (timer) clearTimeout(timer);
    app.hide(dash);
    app.show(gateEl);
    timer = setTimeout(function () {
      if (mine !== run) return;
      run++;
      renderFailure();
    }, LIMIT_MS);

    app.sb.auth.getSession().then(function (res) {
      if (mine !== run) return null;
      var session = res && res.data && res.data.session;
      if (!session) {
        run++;
        leave("Please sign in to see your dashboard.");
        return null;
      }
      return app.sb.from("client_dashboards")
        .select("first_name, plan_name, plan_items, check_in, steps, is_sample")
        .maybeSingle()
        .then(function (r) {
          if (mine !== run) return;
          var error = r && r.error;
          if (error) {
            run++;
            if (Number(error.status) === 401 || error.code === "PGRST301") leave("Your session has ended. Please sign in again.");
            else renderFailure();
            return;
          }
          run++;
          if (r && r.data) renderReady(r.data); else renderEmpty();
        });
    }).then(null, function () {
      if (mine !== run) return;
      run++;
      renderFailure();
    });
  }

  signout.addEventListener("click", function () {
    if (signingOut) return;
    signingOut = true;
    signout.setAttribute("aria-busy", "true");
    signout.textContent = "Signing out…";
    var finish = function () {
      app.sb.auth.signOut({ scope: "local" }).then(null, function () { /* already gone */ }).then(function () {
        dropLocalSession();
        app.flash.set("You’ve been signed out. See you soon.");
        location.replace("login.html");
      });
    };
    var p;
    try { p = app.sb.auth.signOut(); } catch (e) { finish(); return; }
    p.then(finish, finish);
  });

  window.addEventListener("pageshow", function (e) { if (e.persisted) gate(); });

  if (!app.sb) { renderFailure(); return; }
  gate();
})();
