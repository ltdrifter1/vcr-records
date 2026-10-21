/* Night Shift volumes. Renders a volume from data/issues.json and data/news.json.
   Vol. 01–10 are static files. This fills any later volume that has no file
   (the /news/vol-NN rewrite lands here) and prepends a missing spine on the index.
   January 2026 is Vol. 01. current is the open volume. next is the following
   month and is not rendered until it is added to volumes. */
(function () {
  "use strict";

  var ORDER = ["Feature", "Essay", "Interview", "Scene Report", "Review", "Release", "Mix", "Column"];
  var MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

  function pad(n) {
    n = String(n);
    return n.length < 2 ? "0" + n : n;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function dateLabel(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    if (parts.length < 3) return iso;
    return String(parseInt(parts[2], 10)) + " " + MONTHS[parseInt(parts[1], 10) - 1] + " " + parts[0];
  }

  function prefix() {
    return /\/news\//.test(location.pathname) ? "../" : "";
  }

  function volumeNumber() {
    var match = location.pathname.match(/(?:vol|issue)-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  function volumeOf(article) {
    if (article.volume != null && article.volume !== "") return Number(article.volume);
    if (article.issue != null && article.issue !== "") return Number(article.issue);
    return null;
  }

  function load(cb) {
    var root = prefix();
    Promise.all([
      fetch(root + "data/issues.json", { credentials: "same-origin" }).then(function (r) { return r.json(); }),
      fetch(root + "data/news.json", { credentials: "same-origin" }).then(function (r) { return r.json(); })
    ]).then(function (pair) {
      cb(pair[0] || {}, (pair[1] && pair[1].articles) || []);
    }).catch(function () {});
  }

  function figureHtml(issue, article, root) {
    if (!issue.coverImage) {
      return (
        '<div class="cover-plate"><span>' + esc(issue.title || "") + "</span><span>" +
        esc(issue.dateLabel || "") + "</span><span>" + esc(article.headline || "") + "</span></div>"
      );
    }
    var caption = article.credit ? "<figcaption>" + esc(article.credit) + "</figcaption>" : "";
    return (
      '<figure class="issue-cover-figure"><img src="' + esc(root + issue.coverImage) + '" alt="' +
      esc(issue.coverImageAlt || article.imageAlt || "") + '"/>' + caption + "</figure>"
    );
  }

  function coverHtml(issue, article, root) {
    var note = issue.editorsNote ? '<p class="issue-editors-note">' + esc(issue.editorsNote) + "</p>" : "";
    return (
      '<article class="issue-cover">' +
      '<p class="issue-kicker">Night Shift · ' + esc(issue.title || ("Vol. " + pad(issue.number))) + " · " + esc(issue.dateLabel || "") + "</p>" +
      figureHtml(issue, article, root) +
      '<p class="issue-cover-format">' + esc(article.format || "") + "</p>" +
      '<h2 class="issue-cover-headline"><a href="' + esc(article.slug) + '">' + esc(article.headline) + "</a></h2>" +
      '<p class="issue-cover-dek">' + esc(article.dek || "") + "</p>" +
      note +
      "</article>"
    );
  }

  function contentsHtml(stories, coverSlug) {
    var groups = {};
    stories.forEach(function (article) {
      var name = article.format || "Essay";
      if (!groups[name]) groups[name] = [];
      groups[name].push(article);
    });
    var html = '<section class="issue-contents"><h2>Contents</h2>';
    ORDER.forEach(function (name) {
      var items = groups[name];
      if (!items || !items.length) return;
      items.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
      items.sort(function (a, b) { return (a.slug === coverSlug ? 0 : 1) - (b.slug === coverSlug ? 0 : 1); });
      html += "<section><h3>" + esc(name) + '</h3><ol class="issue-toc">';
      items.forEach(function (article) {
        html +=
          "<li><a href=\"" + esc(article.slug) + "\">" + esc(article.headline) + "</a>" +
          "<span>" + esc(article.dek || "") + "</span>" +
          '<time datetime="' + esc(article.date) + '">' + esc(dateLabel(article.date)) + "</time></li>";
      });
      html += "</ol></section>";
    });
    return html + "</section>";
  }

  function colophonHtml(stories) {
    var writers = [];
    var photos = [];
    var listens = [];
    var seenListen = {};
    stories.forEach(function (article) {
      var writer = article.author || "CJ Archer";
      if (writers.indexOf(writer) === -1) writers.push(writer);
      if (article.credit) {
        photos.push("<li>" + esc(article.credit) + ' · <a href="' + esc(article.slug) + '">' + esc(article.headline) + "</a></li>");
      }
      var listen = article.listen;
      if (listen && listen.title && !seenListen[listen.title]) {
        seenListen[listen.title] = true;
        var cat = listen.catalogue && /^CC\d/.test(listen.catalogue) ? esc(listen.catalogue) + " · " : "";
        listens.push("<li>" + cat + '<a href="' + esc(listen.page || listen.url || "#") + '">' + esc(listen.title) + "</a> · " + esc(listen.artist || "") + "</li>");
      }
    });
    var html = '<section class="issue-colophon" data-issue-colophon aria-labelledby="colophon-title"><h2 id="colophon-title">Colophon</h2>';
    html += "<section><h3>Writers</h3><ul>" + writers.map(function (name) { return "<li>" + esc(name) + "</li>"; }).join("") + "</ul></section>";
    if (photos.length) html += "<section><h3>Photographs</h3><ul>" + photos.join("") + "</ul></section>";
    if (listens.length) html += "<section><h3>Listen</h3><ul>" + listens.join("") + "</ul></section>";
    return html + "</section>";
  }

  function renderPage(host, issuesDoc, articles) {
    var number = volumeNumber();
    var list = issuesDoc.volumes || issuesDoc.issues || [];
    var issue = null;
    for (var i = 0; i < list.length; i++) {
      if (number == null && list[i].number === issuesDoc.current) issue = list[i];
      if (number != null && Number(list[i].number) === number) issue = list[i];
    }
    if (!issue) {
      host.innerHTML = '<p class="issue-missing">That volume is not on the desk.</p>';
      return;
    }
    var stories = articles.filter(function (article) {
      return volumeOf(article) === Number(issue.number) && !article.archived;
    });
    var cover = null;
    for (var j = 0; j < articles.length; j++) {
      if (articles[j].slug === issue.coverSlug) cover = articles[j];
    }
    if (!cover) cover = stories[0] || {};
    host.innerHTML =
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/news">Night Shift</a><span>/</span>' +
      esc(issue.title || ("Vol. " + pad(issue.number))) +
      "</nav>" +
      coverHtml(issue, cover, prefix()) +
      contentsHtml(stories, issue.coverSlug) +
      colophonHtml(stories) +
      '<p class="issue-jump"><a href="/news">Current volume</a> · <a href="/news/issues">All volumes</a></p>';
    document.title = (issue.title || "Volume") + " | Night Shift";
  }

  function addIndex(host, issuesDoc, articles) {
    var list = issuesDoc.volumes || issuesDoc.issues || [];
    var root = prefix();
    for (var n = list.length - 1; n >= 0; n--) {
      var issue = list[n];
      var href = "/news/vol-" + pad(issue.number);
      if (host.querySelector('a[href="' + href + '"]') || host.querySelector('a[href="/news/issue-' + pad(issue.number) + '"]')) continue;
      var cover = null;
      for (var i = 0; i < articles.length; i++) {
        if (articles[i].slug === issue.coverSlug) cover = articles[i];
      }
      var count = 0;
      for (var a = 0; a < articles.length; a++) {
        if (volumeOf(articles[a]) === Number(issue.number) && !articles[a].archived) count++;
      }
      var visual = issue.coverImage
        ? '<img src="' + esc(root + issue.coverImage) + '" alt="' + esc(issue.coverImageAlt || "") + '"/>'
        : '<div class="cover-plate"><span>' + esc(issue.title || "") + "</span><span>" + esc(issue.dateLabel || "") + "</span><span>" + esc(cover ? cover.headline : "") + "</span></div>";
      var card = document.createElement("a");
      card.className = "issue-card";
      card.href = href;
      card.innerHTML =
        visual +
        "<div><p>" + esc(issue.title || ("Vol. " + pad(issue.number))) + "</p>" +
        "<strong>" + esc(issue.dateLabel || "") + "</strong>" +
        '<span class="issue-count">' + (count === 1 ? "1 story" : count + " stories") + "</span>" +
        "<span>" + esc(cover ? cover.headline : "") + "</span></div>";
      host.insertBefore(card, host.firstChild);
    }
  }

  var page = document.querySelector("[data-issue-page]");
  var index = document.querySelector("[data-issue-index]");
  if (!page && !index) return;
  load(function (issuesDoc, articles) {
    if (index) addIndex(index, issuesDoc, articles);
    if (page) renderPage(page, issuesDoc, articles);
  });
})();
