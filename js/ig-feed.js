/* Club Copy — mixed Instagram wall (@ltdrifta + @clubcopyrecords) */
(function () {
  var root = document.querySelector("[data-ig-grid]");
  if (!root) return;
  var LIMIT = 16;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function card(post) {
    var handle = esc(post.handle || "");
    var href = esc(post.href || "https://www.instagram.com/" + handle + "/");
    var src = String(post.image || post.thumb || "");
    if (src && src.charAt(0) !== "/" && src.indexOf("http") !== 0) src = "/" + src;
    var img = esc(src);
    var alt = esc(post.alt || "Instagram post from @" + handle);
    var video = post.isVideo
      ? '<span class="ig-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span>'
      : "";
    return (
      '<a class="ig-card rv" href="' + href + '" rel="noopener noreferrer" target="_blank">' +
        '<span class="ig-art">' +
          '<img src="' + img + '" alt="' + alt + '" width="640" height="640" loading="lazy" decoding="async"/>' +
          video +
        "</span>" +
        '<span class="ig-meta">' +
          "<b>@" + handle + "</b>" +
        "</span>" +
      "</a>"
    );
  }

  function render(posts) {
    if (!posts || !posts.length) {
      root.innerHTML =
        '<p class="ig-empty">The floor is quiet. See <a href="https://www.instagram.com/ltdrifta/" rel="noopener noreferrer" target="_blank">@ltdrifta</a> and <a href="https://www.instagram.com/clubcopyrecords/" rel="noopener noreferrer" target="_blank">@clubcopyrecords</a>.</p>';
      return;
    }
    root.innerHTML = posts.map(card).join("");
    if (window.IntersectionObserver) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
      root.querySelectorAll(".rv").forEach(function (el) { obs.observe(el); });
    }
  }

  function load(url) {
    return fetch(url, { headers: { Accept: "application/json" } }).then(function (res) {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    });
  }

  function mix(posts) {
    var list = (posts || []).slice().sort(function (a, b) {
      return (Number(b.takenAt) || 0) - (Number(a.takenAt) || 0);
    });
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < list.length && out.length < LIMIT; i++) {
      var p = list[i];
      if (!p || !p.shortcode || seen[p.shortcode]) continue;
      seen[p.shortcode] = true;
      out.push(p);
    }
    return out;
  }

  load("/api/instagram-feed")
    .then(function (data) {
      if (!data || !data.posts || !data.posts.length) throw new Error("empty live feed");
      return data;
    })
    .catch(function () {
      return load("/data/instagram-feed.json");
    })
    .then(function (data) {
      render(mix(data && data.posts));
    })
    .catch(function () {
      render([]);
    });
})();
