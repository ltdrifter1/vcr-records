(function () {
  var addBtn = document.getElementById('pdpAdd');
  var img = document.getElementById('pdpImage');
  var art = document.getElementById('pdpArt');
  var sizeError = document.getElementById('pdpSizeError');
  var thumbs = document.getElementById('pdpThumbs');

  function setActiveThumb(btn) {
    if (!thumbs || !btn) return;
    Array.prototype.forEach.call(thumbs.querySelectorAll('.pdp-thumb'), function (b) {
      var on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function showSrc(src, alt, isCover) {
    if (!img) return;
    img.src = src;
    if (alt) img.alt = alt;
    if (art) art.classList.toggle('pdp-art--cover', !!isCover);
  }

  if (thumbs) {
    thumbs.addEventListener('click', function (e) {
      var btn = e.target.closest('.pdp-thumb');
      if (!btn) return;
      setActiveThumb(btn);
      showSrc(btn.getAttribute('data-src'), btn.getAttribute('data-alt'), btn.getAttribute('data-cover') === '1');
      var colour = btn.getAttribute('data-colour');
      if (colour) {
        var colourBtn = document.querySelector('#pdpColours .pdp-opt[data-colour="' + colour + '"]');
        if (colourBtn) {
          Array.prototype.forEach.call(document.querySelectorAll('#pdpColours .pdp-opt'), function (b) {
            var on = b === colourBtn;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        }
      }
    });
  }

  function wireGroup(host, onPick) {
    if (!host) return;
    host.addEventListener('click', function (e) {
      var btn = e.target.closest('.pdp-opt');
      if (!btn) return;
      Array.prototype.forEach.call(host.querySelectorAll('.pdp-opt'), function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (onPick) onPick(btn);
    });
  }

  wireGroup(document.getElementById('pdpColours'), function (btn) {
    var colour = btn.getAttribute('data-colour');
    var mapRaw = img.getAttribute('data-img-map');
    if (mapRaw) {
      try {
        var map = JSON.parse(mapRaw);
        var next = map[colour];
        if (next) showSrc(next, img.alt, false);
      } catch (err) {}
    }
    if (thumbs) {
      var match = thumbs.querySelector('.pdp-thumb[data-colour="' + colour + '"]');
      if (match) setActiveThumb(match);
    }
  });
  wireGroup(document.getElementById('pdpSizes'));

  addBtn.addEventListener('click', function () {
    var needsSize = addBtn.getAttribute('data-needs-size') === '1';
    var sizeBtn = document.querySelector('#pdpSizes .pdp-opt.is-active');
    if (needsSize && !sizeBtn) {
      if (sizeError) sizeError.hidden = false;
      return;
    }
    if (sizeError) sizeError.hidden = true;
    var colourBtn = document.querySelector('#pdpColours .pdp-opt.is-active');
    var item = {
      sku: addBtn.getAttribute('data-sku'),
      name: addBtn.getAttribute('data-name'),
      price: Number(addBtn.getAttribute('data-price')),
      colour: colourBtn ? colourBtn.getAttribute('data-colour') : null,
      size: sizeBtn ? sizeBtn.getAttribute('data-size') : null,
      image: img ? img.getAttribute('src') : addBtn.getAttribute('data-image'),
      qty: 1
    };
    if (window.VCRCart) {
      item.id = VCRCart.lineId(item);
      VCRCart.add(item);
    }
    window.location.href = '/cart';
  });
})();
