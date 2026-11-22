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

  var CALL_HREF = "tel:+441632960123";
  var CALL_TEXT = "Call 01632 960 123";
  var MAIL = "hello@samwhitlock.example";
  var DAYS_LONG = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  var DAYS = { weekday: "long", day: "numeric", month: "long" };
  var NUM = typeof Intl !== "undefined" && Intl.NumberFormat ? new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }) : null;

  function isNum(v) { return typeof v === "number" && isFinite(v); }
  function fmtNum(v) { return NUM ? NUM.format(v) : String(v); }

  function parseDay(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof s === "string" ? s : "");
    if (!m) return null;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  function monthKey(s) { return typeof s === "string" ? s.slice(0, 7) : ""; }
  function prevMonthKey(key) {
    var m = /^(\d{4})-(\d{2})$/.exec(key);
    if (!m) return "";
    var y = Number(m[1]);
    var mo = Number(m[2]) - 1;
    if (mo < 1) { y -= 1; mo = 12; }
    return y + "-" + (mo < 10 ? "0" : "") + mo;
  }
  function fmtMonth(d) { return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }
  function fmtDayLong(d) { return d.toLocaleDateString("en-GB", DAYS_LONG).replace(/,/g, ""); }
  function fmtDay(d) { return d.toLocaleDateString("en-GB", DAYS).replace(/,/g, ""); }
  function fmtDayMonth(d) { return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" }); }
  function fmtDayMonthYear(d) { return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }

  function changeText(cur, prev) {
    if (!isNum(cur)) return { arrow: "", text: "No figure for this month yet" };
    if (!isNum(prev)) return { arrow: "", text: "First month we’ve tracked this" };
    if (cur === prev) return { arrow: "→", text: "Same as last month" };
    var up = cur > prev;
    var word = up ? "Up" : "Down";
    if (prev === 0) return { arrow: "↑", text: "Up from none last month" };
    if (prev < 10) return { arrow: up ? "↑" : "↓", text: word + " " + fmtNum(Math.abs(cur - prev)) + " on last month" };
    var pct = Math.round(Math.abs(cur - prev) / prev * 100);
    if (pct === 0) return { arrow: "→", text: "About the same as last month" };
    return { arrow: up ? "↑" : "↓", text: word + " " + pct + "% on last month" };
  }

  function link(cls, text, href) {
    var a = el("a", cls, text);
    a.setAttribute("href", href);
    return a;
  }

  function itemsOf(row, kind) {
    var all = Array.isArray(row.dashboard_items) ? row.dashboard_items : [];
    return all.filter(function (i) { return i && typeof i === "object" && i.kind === kind && str(i.title); });
  }

  function renderGlance(row) {
    var card = addCard("dash__glance");
    card.appendChild(el("h2", "", "At a glance"));
    var report = parseDay(str(row.report_month));
    var labels = [row.kpi1_label, row.kpi2_label, row.kpi3_label];
    var any = labels.some(function (l) { return str(l); });
    if (!report || !any) {
      card.appendChild(el("p", "", "Your first numbers will appear here after your first monthly report."));
      return;
    }
    card.appendChild(el("p", "dash__month", "Figures for " + fmtMonth(report)));
    var rows = Array.isArray(row.monthly_metrics) ? row.monthly_metrics : [];
    var curKey = monthKey(row.report_month);
    var prevKey = prevMonthKey(curKey);
    var cur = null;
    var prev = null;
    rows.forEach(function (m) {
      if (!m || typeof m !== "object") return;
      if (monthKey(m.month) === curKey) cur = m;
      else if (monthKey(m.month) === prevKey) prev = m;
    });
    var tiles = el("div", "dash__tiles");
    labels.forEach(function (label, i) {
      if (!str(label)) return;
      var key = "kpi" + (i + 1);
      var cv = cur ? cur[key] : null;
      var pv = prev ? prev[key] : null;
      var tile = el("div", "dash__tile");
      tile.appendChild(el("p", "dash__tile-label", label));
      tile.appendChild(el("p", "dash__tile-num", isNum(cv) ? fmtNum(cv) : "–"));
      var ch = changeText(isNum(cv) ? cv : null, isNum(pv) ? pv : null);
      var line = el("p", "dash__change" + (ch.arrow === "↓" ? " dash__change--down" : ""));
      if (ch.arrow) {
        var ar = el("span", "", ch.arrow + " ");
        ar.setAttribute("aria-hidden", "true");
        line.appendChild(ar);
      }
      line.appendChild(el("span", "", ch.text));
      tile.appendChild(line);
      tiles.appendChild(tile);
    });
    card.appendChild(tiles);
  }

  function renderWaiting(row) {
    var card = addCard("dash__waiting");
    card.appendChild(el("h2", "", "Waiting on you"));
    var list = itemsOf(row, "waiting").slice().sort(function (a, b) {
      var sa = isNum(a.sort_order) ? a.sort_order : 0;
      var sb = isNum(b.sort_order) ? b.sort_order : 0;
      if (sa !== sb) return sa - sb;
      var da = parseDay(a.item_date);
      var db = parseDay(b.item_date);
      if (da && db) return da - db;
      if (da) return -1;
      if (db) return 1;
      return 0;
    });
    if (!list.length) {
      card.appendChild(el("p", "", "Nothing waiting on you right now."));
      return;
    }
    var ol = el("ol", "dash__steps");
    list.forEach(function (it) {
      var li = el("li");
      li.appendChild(el("strong", "", it.title));
      if (str(it.detail)) li.appendChild(el("span", "", it.detail));
      var d = parseDay(it.item_date);
      if (d) li.appendChild(el("span", "dash__due", "By " + fmtDay(d)));
      ol.appendChild(li);
    });
    card.appendChild(ol);
  }

  function renderDone(row) {
    var card = addCard("dash__done");
    card.appendChild(el("h2", "", "Done this month"));
    var report = parseDay(str(row.report_month));
    var key = monthKey(row.report_month);
    var list = report ? itemsOf(row, "done").filter(function (i) {
      return parseDay(i.item_date) && monthKey(i.item_date) === key;
    }) : [];
    if (!list.length) {
      card.appendChild(el("p", "", report ? "Nothing marked as done for " + report.toLocaleDateString("en-GB", { month: "long" }) + " yet." : "Nothing marked as done yet."));
      return;
    }
    var ul = el("ul", "dash__steps");
    list.forEach(function (it) {
      var li = el("li");
      li.appendChild(el("strong", "", it.title));
      li.appendChild(el("span", "dash__due", fmtDayMonth(parseDay(it.item_date))));
      ul.appendChild(li);
    });
    card.appendChild(ul);
  }

  function renderComing(row) {
    var card = addCard("dash__coming");
    card.appendChild(el("h2", "", "Coming up"));
    var dl = el("dl");
    dl.appendChild(el("dt", "", "Next check-in"));
    var dd = el("dd");
    var nc = parseDay(str(row.next_check_in));
    dd.appendChild(document.createTextNode(nc ? fmtDayLong(nc) : "To be arranged"));
    if (str(row.check_in)) dd.appendChild(el("span", "dash__note", " " + row.check_in));
    dl.appendChild(dd);
    dl.appendChild(el("dt", "", "Renewal"));
    var rn = parseDay(str(row.renewal_on));
    dl.appendChild(el("dd", "", rn ? fmtDayMonthYear(rn) : "To be arranged"));
    card.appendChild(dl);
    var contact = el("div", "dash__contact");
    contact.appendChild(link("btn btn--primary", CALL_TEXT, CALL_HREF));
    contact.appendChild(link("btn btn--ghost", "Email Sam", "mailto:" + MAIL));
    contact.appendChild(link("link-cta", "Book a chat", "mailto:" + MAIL + "?subject=" + encodeURIComponent("Book a chat")));
    card.appendChild(contact);
  }

  function renderPlan(row) {
    var plan = addCard("dash__plan");
    plan.appendChild(el("h2", "", "Your plan"));
    var dl = el("dl");
    dl.appendChild(el("dt", "", "Tier"));
    dl.appendChild(el("dd", "", row.plan_tier === "growth" ? "Growth" : "Local Basics"));
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
    plan.appendChild(dl);
  }

  function renderGrowthArea(row) {
    /* Filled in by plan 07.1-07. Must not fetch anything here. */
    return row;
  }

  function renderReady(row) {
    clearGrid();
    var name = str(row.first_name);
    title.textContent = name ? "Hello, " + name : "Hello there";
    app.show(lede);
    if (row.is_sample === false) app.hide(sample); else app.show(sample);
    renderGlance(row);
    renderWaiting(row);
    renderDone(row);
    renderComing(row);
    renderPlan(row);
    renderGrowthArea(row);
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
        .select("first_name, plan_name, plan_items, check_in, is_sample, plan_tier, report_month, next_check_in, renewal_on, kpi1_label, kpi2_label, kpi3_label, monthly_metrics(month, kpi1, kpi2, kpi3), dashboard_items(id, kind, title, detail, item_date, sort_order)")
        .order("month", { referencedTable: "monthly_metrics", ascending: false })
        .limit(6, { referencedTable: "monthly_metrics" })
        .order("sort_order", { referencedTable: "dashboard_items", ascending: true })
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
