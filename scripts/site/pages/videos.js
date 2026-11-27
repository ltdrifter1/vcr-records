"use strict";
const L = require("../lib");
const { esc, attr } = L;

function videoRow(v) {
  return `<article class="row row--video" data-video="${attr(v.id)}">
  <div class="row-main">
    <p class="mono row-meta"><span>Video</span><span>${esc(L.dateShort(v.published))}</span><span>YouTube</span></p>
    <h2 class="row-artist">LT Drifta</h2>
    <p class="row-title"><a href="${attr(v.url)}" rel="noopener noreferrer" data-video-embed="${attr(v.id)}">${esc(L.dashTitle(v.title))}</a></p>
    ${v.description ? `<p class="row-dek">${esc(v.description)}</p>` : ""}
    <div class="row-actions">
      <button type="button" class="key video-key" data-video-embed="${attr(v.id)}" aria-label="Play ${attr(v.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>
      <a class="mono row-fmt" href="${attr(v.url)}" rel="noopener noreferrer">Watch on YouTube ↗</a>
    </div>
  </div>
  <a class="row-art row-art--wide video-art" href="${attr(v.url)}" rel="noopener noreferrer" data-video-embed="${attr(v.id)}" aria-label="Play ${attr(v.title)}"><img src="${attr(v.thumbnail)}" alt="" width="480" height="360" loading="lazy"/></a>
</article>`;
}

module.exports = function videos(data) {
  const feed = data.videos || {};
  const list = feed.videos || [];
  const channel = feed.channelUrl || "https://www.youtube.com/@ltdrifta";
  const rows = list.map(videoRow).join("\n");
  const main = `
<header class="page-head">
  ${L.crumbs([["/", "Home"], [null, "Videos"]])}
  <h1 class="page-title">Videos</h1>
  <p class="page-lede">LT Drifta on YouTube. A click plays the video here. <a href="${attr(channel)}" rel="noopener noreferrer">@ltdrifta ↗</a></p>
</header>
${
  rows
    ? `<section class="sec sec--tight" aria-label="Video feed" id="videos">
  <div class="rows">
    ${rows}
  </div>
</section>`
    : `<section class="sec"><p class="page-lede">No videos on the site yet. Watch the channel at <a href="${attr(channel)}" rel="noopener noreferrer">youtube.com/@ltdrifta</a>.</p></section>`
}
`;
  return L.page({
    title: "Videos",
    description: "LT Drifta videos from the Club Copy YouTube channel, played on the site.",
    path: "/videos",
    main,
    scripts: ["cc.js"],
  });
};
