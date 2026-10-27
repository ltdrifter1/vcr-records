"use strict";
const { esc, attr } = require("./lib");

/* Astronomical glyphs, drawn as one-stroke marks. viewBox 0 0 24 24. */
const GLYPHS = {
  aries: `<path d="M5 18.5C5 9 8.6 5 12 11.2 15.4 5 19 9 19 18.5"/>`,
  taurus: `<path d="M7.2 12.2C7.2 7.2 9.2 4.6 12 4.6s4.8 2.6 4.8 7.6"/><path d="M12 20.4a4.3 4.3 0 1 0 0-8.6 4.3 4.3 0 0 0 0 8.6z"/>`,
  gemini: `<path d="M6.5 5h11M6.5 19h11M8.2 5v14M15.8 5v14"/>`,
  cancer: `<path d="M7.1 8.2a2.35 2.35 0 1 0 4.7 0 2.35 2.35 0 0 0-4.7 0z"/><path d="M12.2 15.8a2.35 2.35 0 1 0 4.7 0 2.35 2.35 0 0 0-4.7 0z"/><path d="M11.6 7.1C16.4 6 18.6 10.2 16.4 14.4"/><path d="M12.4 16.9C7.6 18 5.4 13.8 7.6 9.6"/>`,
  leo: `<path d="M8.7 13.4a3.15 3.15 0 1 0 0-6.3 3.15 3.15 0 0 0 0 6.3z"/><path d="M11.6 11.6c3.2 1.5 4.8 5.2 2.4 8.1 3.6.2 6.6 1.5 6.2-1.6"/>`,
  virgo: `<path d="M4.6 18.6V10.2"/><path d="M4.6 12.4c0-3.6 3.1-4.2 3.3.2"/><path d="M7.9 12.2c0-3.6 3.1-4.2 3.3.4"/><path d="M11.2 12.4V16c.2 3.2 4.4 3.8 5.1.6.5-2.2-1.6-3.4-3.1-1.6"/>`,
  libra: `<path d="M4.5 16.2h15"/><path d="M7 16.2a5 5 0 0 1 10 0"/>`,
  scorpio: `<path d="M4.4 18.4V10"/><path d="M4.4 12.2c0-3.5 3-4.1 3.2.2"/><path d="M7.6 12c0-3.5 3-4.1 3.2.5V15"/><path d="M10.8 15.2 16.2 9.6"/><path d="M16.2 9.6h-3.3M16.2 9.6v3.3"/>`,
  sagittarius: `<path d="M5.5 18.5 18.2 5.8"/><path d="M18.2 5.8h-6.2M18.2 5.8v6.2"/><path d="M9.2 10.4 14.2 15.4"/>`,
  capricorn: `<path d="M6.2 18.6V10.2c0-3.4 4.2-4 4.6.6v5.4c.8 3.6 5.4 4.2 6.6 1.2"/><path d="M17.2 16.8a2.15 2.15 0 1 0 .4-3.6 2.15 2.15 0 0 0-.4 3.6z"/>`,
  aquarius: `<path d="M3.8 9.2c1.7-2.2 3-2.2 4.2 0s2.5 2.2 4.2 0 2.5-2.2 4.2 0 2.5 2.2 4.2 0"/><path d="M3.8 15.2c1.7-2.2 3-2.2 4.2 0s2.5 2.2 4.2 0 2.5-2.2 4.2 0 2.5 2.2 4.2 0"/>`,
  pisces: `<path d="M8.2 4.4c4.4 3.2 4.4 12 0 15.2"/><path d="M15.8 4.4c-4.4 3.2-4.4 12 0 15.2"/><path d="M5.2 12h13.6"/>`,
};

function signGlyph(id) {
  const inner = GLYPHS[id];
  if (!inner) return "";
  return `<svg class="sign-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
}

function signChart(stars, hrefFor) {
  const href = hrefFor || ((s) => "#" + s.id);
  const items = stars
    .map(
      (s) =>
        `<li><a href="${attr(href(s))}">${signGlyph(s.id)}<span class="sign-name">${esc(s.sign)}</span><em class="mono">${esc(s.dates)}</em></a></li>`
    )
    .join("");
  return `<ol class="sign-chart">${items}</ol>`;
}

module.exports = { signGlyph, signChart, GLYPHS };
