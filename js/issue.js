/* Night Shift issues. Renders a new issue from data/issues.json and data/news.json.
   Static Issue 01 pages are already in the HTML. This fills any issue number
   that does not have its own file, and adds new covers to the issues index. */
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

  function issueNumber() {
    var match = location.pathname.match(/issue-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
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

  function coverHtml(issue, article, root) {
    var caption = article.credit ? "<figcaption>" + esc(article.credit) + "</figcaption>" : "";
    var note = issue.editorsNote ? '<p class="issue-editors-note">' + esc(issue.editorsNote) + "</p>" : "";
    return (
      '<article class="issue-cover">' +
      '<p class="issue-kicker">Night Shift · ' + esc(issue.title || ("Issue " + pad(issue.number))) + " · " + esc(issue.dateLabel || "") + "</p>" +
      '<figure class="issue-cover-figure"><img src="' + esc(root + (issue.coverImage || article.image || "")) + '" alt="' + esc(issue.coverImageAlt || article.imageAlt || "") + '"/>' +
      caption +
      "</figure>" +
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

  function renderPage(host, issuesDoc, articles) {
    var number = issueNumber();
    var list = issuesDoc.issues || [];
    var issue = null;
    for (var i = 0; i < list.length; i++) {
      if (number == null && list[i].number === issuesDoc.current) issue = list[i];
      if (number != null && Number(list[i].number) === number) issue = list[i];
    }
    if (!issue) {
      host.innerHTML = '<p class="issue-missing">That issue is not on the desk.</p>';
      return;
    }
    var stories = articles.filter(function (article) {
      return Number(article.issue) === Number(issue.number) && !article.archived;
    });
    var cover = null;
    for (var j = 0; j < articles.length; j++) {
      if (articles[j].slug === issue.coverSlug) cover = articles[j];
    }
    if (!cover) cover = stories[0] || {};
    host.innerHTML =
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/news">Night Shift</a><span>/</span>' +
      esc(issue.title || ("Issue " + pad(issue.number))) +
      "</nav>" +
      coverHtml(issue, cover, prefix()) +
      contentsHtml(stories, issue.coverSlug) +
      '<p class="issue-jump"><a href="/news">Current issue</a> · <a href="/news/issues">All issues</a></p>';
    document.title = (issue.title || "Issue") + " | Night Shift";
  }

  function addIndex(host, issuesDoc, articles) {
    var list = issuesDoc.issues || [];
    var root = prefix();
    list.forEach(function (issue) {
      var href = "/news/issue-" + pad(issue.number);
      if (host.querySelector('a[href="' + href + '"]')) return;
      var cover = null;
      for (var i = 0; i < articles.length; i++) {
        if (articles[i].slug === issue.coverSlug) cover = articles[i];
      }
      var card = document.createElement("a");
      card.className = "issue-card";
      card.href = href;
      card.innerHTML =
        '<img src="' + esc(root + (issue.coverImage || "")) + '" alt="' + esc(issue.coverImageAlt || "") + '"/>' +
        "<div><p>" + esc(issue.title || ("Issue " + pad(issue.number))) + "</p>" +
        "<strong>" + esc(issue.dateLabel || "") + "</strong>" +
        "<span>" + esc(cover ? cover.headline : "") + "</span></div>";
      host.appendChild(card);
    });
  }

  var page = document.querySelector("[data-issue-page]");
  var index = document.querySelector("[data-issue-index]");
  if (!page && !index) return;
  load(function (issuesDoc, articles) {
    if (index) addIndex(index, issuesDoc, articles);
    if (page) renderPage(page, issuesDoc, articles);
  });
})();
