/* Style guide only (removed in Phase 5): live WCAG contrast ratios from the CSS tokens. */
(function () {
  "use strict";

  function parseHex(value) {
    var m = /^#([0-9a-f]{6})$/i.exec(value.trim());
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function channel(c) {
    var s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }

  function luminance(rgb) {
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  }

  function ratio(a, b) {
    var la = luminance(a);
    var lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  var styles = window.getComputedStyle(document.documentElement);
  var rows = document.querySelectorAll("#sg-contrast tr[data-fg][data-bg]");

  Array.prototype.forEach.call(rows, function (row) {
    var fg = parseHex(styles.getPropertyValue(row.getAttribute("data-fg")));
    var bg = parseHex(styles.getPropertyValue(row.getAttribute("data-bg")));
    var cell = row.querySelector(".sg-ratio");
    if (!fg || !bg || !cell) return;
    cell.textContent = ratio(fg, bg).toFixed(2) + ":1";
  });
})();
