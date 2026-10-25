"use strict";
const L = require("../lib");

/** Record Club form. Ids are the contract of js/join.js and js/member.js. */
function joinSection(opts) {
  opts = opts || {};
  const Tag = opts.h1 ? "h1" : "h2";
  return `<section class="sec sec--join" id="join" aria-labelledby="join-title">
  <div class="join-grid">
    <div class="join-copy">
      <p class="mono sec-kicker">Record Club</p>
      <${Tag} class="sec-title" id="join-title">Join the club</${Tag}>
      <p class="join-dek" id="join-dek">A member number, first listens, 30% or 50% off music, and Club Credit toward the pressings you choose. Nothing ships unless you pick it.</p>
      <div class="join-levels" id="joinLevels" role="radiogroup" aria-label="Record club level">
        <button type="button" class="join-level" data-level="free" role="radio" aria-checked="true">
          <span class="join-level-dot" aria-hidden="true"></span>
          <span class="join-level-name">Free</span>
          <span class="mono join-level-price">$0</span>
          <span class="join-level-blurb">Release alerts, the catalogue and first listens.</span>
        </button>
        <button type="button" class="join-level" data-level="club" role="radio" aria-checked="false">
          <span class="join-level-dot" aria-hidden="true"></span>
          <span class="join-level-name">Club</span>
          <span class="mono join-level-price">$5 CAD / year</span>
          <span class="join-level-blurb">30% off all music: digital, cassette and vinyl. Pays for itself at $17.</span>
        </button>
        <button type="button" class="join-level" data-level="premium" role="radio" aria-checked="false">
          <span class="join-level-dot" aria-hidden="true"></span>
          <span class="join-level-name">Premium</span>
          <span class="mono join-level-price">from $10 CAD / year</span>
          <span class="join-level-blurb">50% off all music, plus Club Credit: pay $10, get $25 toward cassette and vinyl.</span>
        </button>
      </div>
    </div>
    <div class="join-panel" id="joinPanel">
      <div class="member-card" aria-hidden="true">
        <img class="member-card-mark" src="/club-copy-nav-ink.webp" alt="" width="901" height="418" loading="lazy" decoding="async"/>
        <span class="mono member-card-no" id="joinCardNo">No. ————</span>
        <span class="member-card-name" id="joinCardName"></span>
        <span class="mono member-card-tier" id="joinCardTier">Free</span>
      </div>
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
      <button type="button" class="btn btn-solid btn-wide" id="clubJoinBtn">Join free</button>
      <p class="join-note" id="joinNote">We'll email you the details. You can always upgrade later.</p>
      <p class="join-status" id="joinStatus" role="status" hidden></p>
    </div>
  </div>
</section>`;
}

module.exports = { joinSection };
