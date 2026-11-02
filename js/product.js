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

  if (addBtn && !addBtn.disabled) addBtn.addEventListener('click', function () {
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

  var form = document.getElementById('pdpRestock');
  if (!form) return;
  var status = document.getElementById('pdpRestockStatus');
  var submit = document.getElementById('pdpRestockSubmit');
  var emailInput = document.getElementById('pdpRestockEmail');

  function showStatus(msg, isError) {
    if (!status) return;
    status.hidden = false;
    status.textContent = msg;
    status.classList.toggle('is-error', !!isError);
  }

  function picked(selector, key) {
    var btn = document.querySelector(selector);
    return btn ? (btn.getAttribute(key) || '') : '';
  }

  function postJson(url, payload) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { ok: res.ok, status: res.status, data: data || {} };
      });
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = emailInput ? emailInput.value.trim() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus('Enter a valid email.', true);
      if (emailInput) emailInput.focus();
      return;
    }
    var gotcha = form.querySelector('[name="_gotcha"]');
    var payload = {
      email: email,
      sku: form.getAttribute('data-sku'),
      size: picked('#pdpSizes .pdp-opt.is-active', 'data-size'),
      colour: picked('#pdpColours .pdp-opt.is-active', 'data-colour'),
      _gotcha: gotcha ? gotcha.value : ''
    };
    if (submit) submit.disabled = true;
    showStatus('Saving…', false);

    function done(already) {
      showStatus(already ? "You're already on the list." : "We'll email you when it's back.", false);
      if (emailInput) emailInput.disabled = true;
    }

    function fail(result) {
      var msg = (result && result.data && result.data.error) || "We couldn't save that. Email charlie@clubcopy.ca and we'll add you.";
      showStatus(msg, true);
      if (submit) submit.disabled = false;
    }

    postJson('/api/restock-notify', payload).catch(function () {
      return { ok: false, status: 0, data: {} };
    }).then(function (result) {
      if (result.ok) {
        done(!!(result.data && result.data.already));
        return;
      }
      if (result.status && result.status < 500) {
        fail(result);
        return;
      }
      var fallback = form.getAttribute('data-fallback');
      if (!fallback || payload._gotcha) {
        fail(result);
        return;
      }
      return postJson(fallback, {
        email: email,
        product: form.getAttribute('data-name') || '',
        sku: payload.sku,
        size: payload.size,
        colour: payload.colour,
        _subject: 'Restock: ' + (form.getAttribute('data-name') || 'Club Copy'),
        message: email + ' wants to know when this is back in stock.'
      }).then(function (formResult) {
        if (formResult.ok) done(false);
        else fail(result);
      }).catch(function () { fail(result); });
    });
  });
})();
