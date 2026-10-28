"use strict";
const L = require("../lib");

/** Record Club form. Ids are the contract of js/join.js and js/member.js. */
function joinSection(opts) {
  opts = opts || {};
  const Tag = opts.h1 ? "h1" : "h2";
  return `<section class="sec sec--join" id="join" aria-labelledby="join-title">
  ${L.sectionHead("Join the club", { titleId: "join-title", kicker: "Record Club", link: ["/account", "Account"], h: Tag })}
  <p class="join-dek page-lede" id="join-dek">A member number, first listens, 30% or 50% off music, and Club Credit toward the pressings you choose. Nothing ships unless you pick it.</p>
  <div class="rows join-levels" id="joinLevels" role="radiogroup" aria-label="Record club level">
    <button type="button" class="row row--level join-level" data-level="free" role="radio" aria-checked="true">
      <span class="row-main">
        <span class="mono row-meta"><span class="join-level-state">Selected</span><span>Alerts · first listens</span></span>
        <span class="row-artist join-level-name">Free</span>
        <span class="row-title join-level-price">$0</span>
        <span class="row-dek join-level-blurb">Release alerts, the catalogue and first listens.</span>
      </span>
      <span class="join-level-dot" aria-hidden="true"></span>
    </button>
    <button type="button" class="row row--level join-level" data-level="club" role="radio" aria-checked="false">
      <span class="row-main">
        <span class="mono row-meta"><span class="join-level-state">Selected</span><span>30% off all music</span></span>
        <span class="row-artist join-level-name">Club</span>
        <span class="row-title join-level-price">$5 CAD a year</span>
        <span class="row-dek join-level-blurb">30% off all music: digital, cassette and vinyl. Pays for itself at $17.</span>
      </span>
      <span class="join-level-dot" aria-hidden="true"></span>
    </button>
    <button type="button" class="row row--level join-level" data-level="premium" role="radio" aria-checked="false">
      <span class="row-main">
        <span class="mono row-meta"><span class="join-level-state">Selected</span><span>50% off · Club Credit</span></span>
        <span class="row-artist join-level-name">Premium</span>
        <span class="row-title join-level-price">from $10 CAD a year</span>
        <span class="row-dek join-level-blurb">50% off all music, plus Club Credit: pay $10, get $25 toward cassette and vinyl.</span>
      </span>
      <span class="join-level-dot" aria-hidden="true"></span>
    </button>
  </div>
  <div class="row row--join join-panel" id="joinPanel">
    <div class="row-main join-form">
      <p class="mono row-meta"><span>Your card</span></p>
      <div class="join-fields">
        <div class="field">
          <label for="joinEmail">Email</label>
          <input type="email" id="joinEmail" name="email" placeholder="you@email.com" autocomplete="email" required/>
        </div>
        <div class="field">
          <label for="joinName">Name <span class="field-opt">optional</span></label>
          <input type="text" id="joinName" name="displayName" placeholder="On the card" maxlength="40" autocomplete="nickname"/>
        </div>
      </div>
      <div class="join-premium" id="premiumAmountBox" hidden>
        <div class="field">
          <label for="premiumAmount">Yearly amount (CAD)</label>
          <div class="premium-presets" id="premiumPresets">
            <button type="button" class="premium-preset" data-amount="10" aria-pressed="true">$10</button>
            <button type="button" class="premium-preset" data-amount="25" aria-pressed="false">$25</button>
            <button type="button" class="premium-preset" data-amount="50" aria-pressed="false">$50</button>
            <button type="button" class="premium-preset" data-amount="100" aria-pressed="false">$100</button>
          </div>
          <input type="number" id="premiumAmount" name="amount" min="10" step="1" value="10" inputmode="decimal"/>
        </div>
        <p class="premium-credit-preview" id="premiumCreditPreview" aria-live="polite">That's <strong>$25.00</strong> toward cassettes.</p>
      </div>
      <div class="row-actions">
        <button type="button" class="btn btn-solid" id="clubJoinBtn">Join free</button>
        <p class="join-note" id="joinNote">We'll email you the details. You can always upgrade later.</p>
      </div>
      <p class="join-status" id="joinStatus" role="status" hidden></p>
    </div>
    <div class="row-art join-card-art">
      <div class="member-card" aria-hidden="true">
        <img class="member-card-mark" src="/club-copy-nav-ink.webp" alt="" width="901" height="418" loading="lazy" decoding="async"/>
        <span class="mono member-card-no" id="joinCardNo">No. ————</span>
        <span class="member-card-name" id="joinCardName"></span>
        <span class="mono member-card-tier" id="joinCardTier">Free</span>
      </div>
    </div>
  </div>
</section>`;
}

module.exports = { joinSection };
