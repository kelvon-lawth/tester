// Dev-only font metrics harness. Writes JSON into #results.
(function () {
  "use strict";

  function px(v) {
    return parseFloat(v);
  }

  function width(id) {
    return document.getElementById(id).getBoundingClientRect().width;
  }

  function pct(real, other) {
    return ((other - real) / real) * 100;
  }

  function lines(id) {
    var el = document.getElementById(id);
    var lh = px(getComputedStyle(el).lineHeight);
    return Math.round(el.getBoundingClientRect().height / lh);
  }

  function canvasMetrics(font, text) {
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.font = font;
    var m = ctx.measureText(text);
    return { width: m.width, ascent: m.fontBoundingBoxAscent, descent: m.fontBoundingBoxDescent };
  }

  function recommend(realFont, rawFont, text) {
    var real = canvasMetrics(realFont, text);
    var raw = canvasMetrics(rawFont, text);
    var sizeAdjust = real.width / raw.width;
    return {
      sizeAdjust: Math.round(sizeAdjust * 1000) / 10,
      ascent: Math.round((real.ascent / 100 / sizeAdjust) * 1000) / 10,
      descent: Math.round((real.descent / 100 / sizeAdjust) * 1000) / 10,
    };
  }

  function run() {
    var results = { fontsLoaded: true };
    var doc = document.documentElement;
    var sample = "Marketing for your restaurant";

    ["display", "heading", "body"].forEach(function (k) {
      var r = width(k + "-real");
      var f = width(k + "-fb");
      var raw = width(k + "-raw");
      results[k] = { real: r, fallback: f, raw: raw, deltaPct: pct(r, f), rawDeltaPct: pct(r, raw) };
    });

    results.bodyLines = { real: lines("para-real"), fallback: lines("para-fb") };

    var fit = document.getElementById("fit-word");
    var container = fit.closest(".container");
    var cs = getComputedStyle(container);
    var contentWidth =
      container.getBoundingClientRect().width - px(cs.paddingLeft) - px(cs.paddingRight);
    var fitWidth = fit.getBoundingClientRect().width;
    var fitHeight = fit.getBoundingClientRect().height;
    var lh = px(getComputedStyle(fit).lineHeight);
    results.restaurant = {
      width: fitWidth,
      contentWidth: contentWidth,
      fits: fitWidth <= contentWidth + 0.01,
      singleLine: fitHeight <= lh * 1.5,
    };

    // Simulated 320px viewport: substitute 320px-equivalent vw into the real --fs-display token.
    var token = getComputedStyle(document.documentElement).getPropertyValue("--fs-display").trim();
    var simSize = token.replace(/(-?\d*\.?\d+)vw/g, function (_, n) {
      return "(" + n + " * 3.2px)";
    });
    var simTitle = document.getElementById("sim-title");
    simTitle.style.fontSize = simSize;
    var simWord = document.getElementById("sim-word");
    var simContainer = simTitle.closest(".container");
    var scs = getComputedStyle(simContainer);
    var simContent =
      simContainer.getBoundingClientRect().width - px(scs.paddingLeft) - px(scs.paddingRight);
    var simW = simWord.getBoundingClientRect().width;
    results.sim320 = {
      token: token,
      fontSizePx: px(getComputedStyle(simTitle).fontSize),
      width: simW,
      contentWidth: simContent,
      fits: simW <= simContent + 0.01,
      singleLine: simWord.getBoundingClientRect().height <= px(getComputedStyle(simTitle).lineHeight) * 1.5,
    };
    results.viewport = { innerWidth: window.innerWidth };
    results.overflow = { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
    results.fsDisplayPx = px(getComputedStyle(fit).fontSize);

    results.recommended = {
      "Fraunces Fallback": recommend("600 100px Fraunces", "600 100px Georgia", sample),
      "Figtree Fallback": recommend(
        "400 100px Figtree",
        "400 100px Arial",
        "Four ways I help local businesses get found"
      ),
    };

    document.getElementById("results").textContent = JSON.stringify(results);
    doc.dataset.metrics = "done";
  }

  function fail() {
    document.getElementById("results").textContent = JSON.stringify({ fontsLoaded: false });
    document.documentElement.dataset.metrics = "fonts-failed";
  }

  Promise.all([
    document.fonts.load("600 1em Fraunces"),
    document.fonts.load("400 1em Figtree"),
    document.fonts.load("600 1em Figtree"),
  ])
    .then(function (faces) {
      var ok = faces.every(function (f) {
        return f.length > 0;
      });
      return document.fonts.ready.then(function () {
        ok ? run() : fail();
      });
    })
    .catch(fail);
})();
