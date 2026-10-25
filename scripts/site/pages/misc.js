"use strict";
const L = require("../lib");
const { esc, attr, asset, money, onSite } = L;
const { joinSection } = require("./join");

function head(title, lede, crumbsList) {
  return `<header class="page-head">
  ${L.crumbs(crumbsList || [["/", "Home"], [null, title]])}
  <h1 class="page-title">${esc(title)}</h1>
  ${lede ? `<p class="page-lede">${lede}</p>` : ""}
</header>`;
}

function joinPage() {
  return L.page({ title: "Record Club", description: "Join the Club Copy Record Club: Free alerts, Club at $5 a year for 30% off music, Premium from $10 a year for 50% off plus Club Credit.", path: "/join", main: head("Record Club", "Three levels. Nothing ships unless you pick it.", [["/", "Home"], [null, "Record Club"]]) + joinSection({ h1: false }), scripts: ["join.js"] });
}

function about(data) {
  const { catalog } = data;
  const releases = catalog.releases.filter(onSite).sort((a, b) => String(b.released || "").localeCompare(String(a.released || ""))).slice(0, 6);
  const main = `
${head("About", "Small library. Long shelf life. No filler. House, jungle and instrumental hip-hop from the Pacific Northwest.")}
<section class="sec prose">
  <h2 class="sec-title">The label</h2>
  <p>House, UK garage, jungle, instrumental hip-hop. Records that hit the room finished, and still open years later.</p>
  <p>Small editions. The record club is the invite: a member number, first listens, 30% or 50% off music, and Club Credit toward pressings you choose. Nothing ships unless you pick it.</p>
  <p>Founded by Charlie Archer. Published under Copy House Publishing. Based in British Columbia, Canada.</p>
  <div class="lead-actions"><a class="btn btn-solid" href="/join">Join the club</a><a class="btn" href="/library">Library</a></div>
</section>
<section class="sec">
  <dl class="specs specs--wide">
    <div><dt class="mono">Based</dt><dd>Pacific Northwest · British Columbia</dd></div>
    <div><dt class="mono">Record club</dt><dd><a href="/join">Free · Club $5/yr · Premium from $10/yr</a></dd></div>
    <div><dt class="mono">Roster</dt><dd>${catalog.artists.map((a) => `<a href="/artists/${attr(a.id)}">${esc(a.name)}</a>`).join(" · ")}</dd></div>
    <div><dt class="mono">Listen</dt><dd><a href="/planet">Planet MP3</a></dd></div>
    <div><dt class="mono">Contact</dt><dd><a href="mailto:charlie@clubcopy.ca">charlie@clubcopy.ca</a></dd></div>
    <div><dt class="mono">Orders</dt><dd><a href="/shipping">Shipping &amp; returns</a></dd></div>
  </dl>
</section>
<section class="sec">
  ${L.sectionHead("Recent releases", { link: ["/library", "Library"] })}
  <div class="sleeve-strip">${releases.map((r) => `<a href="${attr(r.page)}"><img src="${asset(r.coverThumb || r.cover)}" alt="${attr(r.title)}" width="480" height="480" loading="lazy"/></a>`).join("")}</div>
</section>
<section class="sec prose" aria-labelledby="about-faq-title">
  <h2 class="sec-title" id="about-faq-title">Club Copy, explained</h2>
  <details><summary>What is Club Copy?</summary><p>An independent Pacific Northwest record label based in British Columbia. House, jungle, instrumental hip-hop on digital and cassette, small editions, plus a record club for collecting those releases.</p></details>
  <details><summary>Is Club Copy a record club?</summary><p>Yes, and a label. The imprint releases the music; the club is how you collect it. <a href="/join">Free</a> for alerts and first listens, <strong>Club</strong> ($5/yr) for 30% off all music, and <strong>Premium</strong> (from $10/yr) for 50% off all music plus Club Credit toward cassettes and limited pressings. Nothing ships unless you choose it.</p></details>
  <details><summary>Where is the label based?</summary><p>Pacific Northwest · British Columbia, Canada.</p></details>
  <details><summary>Who is on the roster?</summary><p>${catalog.artists.map((a) => `<a href="/artists/${attr(a.id)}">${esc(a.name)}</a>`).join(", ")}.</p></details>
  <details><summary>Where do I buy releases?</summary><p>In the <a href="/library">library</a>: digital and cassette. Club members get 30% off all music; Premium gets 50% off. Merch and physical editions ship to Canada and the US.</p></details>
</section>`;
  return L.page({ title: "About", description: "Club Copy is an independent record label and record club from British Columbia. House, jungle and instrumental hip-hop.", path: "/about", main, scripts: ["cc.js"] });
}

function contact() {
  const main = `
${head("Contact", 'Press, bookings, demos and general inquiries. <a href="mailto:charlie@clubcopy.ca">charlie@clubcopy.ca</a>')}
<section class="sec">
  <div class="join-grid">
    <form class="form panel" action="https://formspree.io/f/xdkwjzzr" method="POST" aria-label="Contact form">
      <div class="field"><label for="name">Name</label><input id="name" name="name" type="text" autocomplete="name" required placeholder="Your name"/></div>
      <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required placeholder="you@email.com"/></div>
      <div class="field"><label for="subject">Subject</label><input id="subject" name="subject" type="text" required placeholder="Press / booking / demo"/></div>
      <div class="field"><label for="message">Message</label><textarea id="message" name="message" required placeholder="Tell us what's up" rows="6"></textarea></div>
      <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="sr-only"/>
      <button class="btn btn-solid" type="submit">Send</button>
    </form>
    <dl class="specs">
      <div><dt class="mono">Email</dt><dd><a href="mailto:charlie@clubcopy.ca">charlie@clubcopy.ca</a></dd></div>
      <div><dt class="mono">Demos</dt><dd>Private SoundCloud or Bandcamp links. Two or three tracks. We listen to everything; we answer what we can.</dd></div>
      <div><dt class="mono">Orders</dt><dd><a href="/shipping">Shipping &amp; returns</a></dd></div>
      <div><dt class="mono">Instagram</dt><dd><a href="https://www.instagram.com/clubcopyrecords/" rel="noopener noreferrer">@clubcopyrecords</a> · <a href="https://www.instagram.com/ltdrifta/" rel="noopener noreferrer">@ltdrifta</a></dd></div>
      <div><dt class="mono">SoundCloud</dt><dd><a href="https://soundcloud.com/ltdrifta" rel="noopener noreferrer">soundcloud.com/ltdrifta</a></dd></div>
    </dl>
  </div>
</section>`;
  return L.page({ title: "Contact", description: "Contact Club Copy: press, bookings, demos.", path: "/contact", main });
}

function shipping() {
  const main = `
${head("Shipping & returns", "Clear terms before you check out. If something is unclear, write us.")}
<section class="sec prose">
  <h2 class="sec-title">Shipping</h2>
  <p>Orders ship from British Columbia, Canada. Most merch and cassettes leave within 2–4 business days. You will receive tracking when the parcel is scanned.</p>
  <dl class="specs ship-rates">
    <div><dt class="mono">Canada</dt><dd>$8 · Tracked · 3–7 business days after dispatch</dd></div>
    <div><dt class="mono">United States</dt><dd>$14 · Tracked · 5–12 business days after dispatch</dd></div>
    <div><dt class="mono">Digital</dt><dd>$0 · Delivered by email</dd></div>
  </dl>
  <p>Physical orders ship to Canada and the United States only. Choose a rate at Stripe Checkout. Cassettes ship in protective mailers. Apparel is folded and bagged.</p>
  <h2 class="sec-title">Returns</h2>
  <p>Unopened merch and sealed cassettes may be returned within 14 days of delivery for a refund of the item price. Return shipping is the buyer's responsibility unless the item arrived damaged or incorrect.</p>
  <p>Opened cassettes and worn apparel cannot be returned except for manufacturing defects. Digital downloads are non-refundable once delivered.</p>
  <p>To start a return, email <a href="mailto:charlie@clubcopy.ca">charlie@clubcopy.ca</a> with your order number and reason.</p>
  <h2 class="sec-title">Damaged or lost</h2>
  <p>If a parcel arrives damaged, photograph the outer packaging and the item and contact us within 7 days. We will replace or refund at our discretion. Lost packages with active tracking are investigated with the carrier before a replacement is issued.</p>
  <h2 class="sec-title">Authenticity</h2>
  <p>Everything sold in the Club Copy shop is produced or pressed for the label. Each title in the library is an edition you can hear and keep.</p>
</section>`;
  return L.page({ title: "Shipping & returns", description: "Club Copy shipping rates and returns. Canada $8, United States $14, digital free.", path: "/shipping", main });
}

function cart() {
  const main = `
${head("Cart", "Review your bag, apply Club Credit, and check out securely with Stripe.")}
<section class="sec cart-layout">
  <section aria-label="Cart items" class="cart-items">
    <div id="cartLines" class="cart-lines"></div>
    <div id="cartEmpty" class="cart-empty" hidden>
      <p class="mono">Your bag is empty</p>
      <div class="lead-actions"><a class="btn btn-solid" href="/library">Library</a><a class="btn" href="/merch">Shop</a></div>
    </div>
    <div id="undoBar" class="undo-bar mono" hidden><span id="undoMsg">Item removed</span><button type="button" id="undoBtn">Undo</button></div>
  </section>
  <aside class="summary-panel panel" id="summaryPanel">
    <h2 class="sec-title">Summary</h2>
    <div class="sum-row"><span>Subtotal</span><span id="sumSubtotal">$0.00</span></div>
    <div class="sum-row credit" id="sumCreditRow" hidden><span>Club Credit</span><span id="sumCredit">−$0.00</span></div>
    <div class="sum-row"><span>Shipping</span><span id="sumShipping">CA $8 / US $14</span></div>
    <div class="sum-row total"><span>Total</span><span id="sumTotal">$0.00</span></div>
    <div class="credit-box">
      <label class="mono credit-email-label" for="creditEmail">Club Credit</label>
      <div class="credit-row"><input type="email" id="creditEmail" name="email" placeholder="Email used to join" autocomplete="email"/><button type="button" class="btn btn-small" id="creditCheckBtn">Check</button></div>
      <p class="credit-status mono" id="creditStatus" role="status" aria-live="polite"></p>
      <label class="credit-apply" id="creditApplyLabel" hidden><input type="checkbox" id="creditApply" checked/><span id="creditApplyText">Apply Club Credit at checkout</span></label>
    </div>
    <p class="summary-note" id="checkoutNote">Ships from British Columbia in 2–4 business days, tracked. Canada $8 CAD · United States $14 CAD, chosen at payment.</p>
    <button class="btn btn-solid btn-wide" id="checkoutBtn" type="button" disabled>Check out</button>
    <a class="btn btn-wide" href="/merch">Continue shopping</a>
    <p class="trust-line mono"><span>Secure checkout via Stripe</span><a href="/shipping">Shipping &amp; returns</a></p>
    <p class="summary-note summary-error" id="checkoutError" hidden role="alert"></p>
  </aside>
</section>`;
  return L.page({ title: "Cart", description: "Your Club Copy bag.", path: "/cart", bodyClass: "cart-page", main, noindex: true, scripts: ["cart-page.js"] });
}

function account() {
  const main = `
${head("Your account", "Your record club card, Club Credit balance and membership details.")}
<section class="sec account-grid">
  <section class="panel" id="acctLookup" aria-label="Find your membership" hidden>
    <div class="member-card acct-plate" aria-hidden="true">
      <img class="member-card-mark" src="/club-copy-nav-ink.webp" alt="" width="901" height="418"/>
      <span class="mono member-card-no acct-plate-no">No. ————</span>
      <span class="mono member-card-tier acct-plate-tier">Record club</span>
    </div>
    <h2 class="sec-title">Find your membership</h2>
    <p class="page-lede">Enter the email you joined with and we'll pull up your card.</p>
    <div class="field"><label for="acctLookupEmail">Email</label><input type="email" id="acctLookupEmail" placeholder="you@email.com" autocomplete="email"/></div>
    <div class="lead-actions acct-actions"><button type="button" class="btn btn-solid" id="acctLookupBtn">Find my card</button><a class="btn" href="/join">Not a member yet? Join</a></div>
    <p class="acct-status mono" id="acctLookupStatus" role="status" hidden></p>
    <p class="acct-lookup-note">This site doesn't use passwords. Your card is looked up by email, so don't share this page publicly.</p>
  </section>
  <div id="acctSignedIn" hidden>
    <section class="panel" aria-label="Membership card">
      <h2 class="sec-title">Membership card</h2>
      <p class="page-lede" id="acctLead">Loading your card…</p>
      <div class="member-card acct-card">
        <div class="acct-card-top mono"><span>Club Copy</span><strong id="acctLevel">FREE</strong></div>
        <p class="acct-card-name member-card-name" id="acctName">Member</p>
        <p class="acct-card-meta mono">MEMBER <b id="acctNumber">0000</b><br/><span id="acctLayer">CATALOG</span> · PACIFIC NORTHWEST <span id="acctSince"></span></p>
      </div>
      <div class="lead-actions acct-actions"><a class="btn btn-solid" href="/library">Browse the library</a><a class="btn" href="/join" id="acctChangePlan">Change plan</a><button type="button" class="btn btn-text" id="acctSignOut">Sign out on this device</button></div>
    </section>
    <section class="panel" aria-label="Club Credit">
      <h2 class="sec-title">Club Credit</h2>
      <p class="page-lede">Credit toward cassettes and vinyl, applied automatically at checkout on this email.</p>
      <div class="acct-credit"><span class="mono acct-credit-label">Available balance</span><span class="acct-credit-amount" id="acctBalance">$0.00</span></div>
      <ul class="acct-entries" id="acctEntries"></ul>
      <p class="acct-empty-note mono" id="acctEntriesEmpty" hidden>No Club Credit activity yet.</p>
    </section>
    <section class="panel" aria-label="Update your details">
      <h2 class="sec-title">Update your details</h2>
      <p class="page-lede">Changes save to your card immediately.</p>
      <div class="field"><label for="acctDisplayName">Name on card</label><input type="text" id="acctDisplayName" maxlength="40" placeholder="Your name"/></div>
      <div class="lead-actions acct-actions"><button type="button" class="btn btn-solid" id="acctSaveName">Save</button></div>
      <p class="acct-status mono" id="acctSaveStatus" role="status" hidden></p>
    </section>
  </div>
</section>`;
  return L.page({ title: "Account", description: "Your Club Copy record club card and Club Credit.", path: "/account", main, noindex: true, scripts: ["account-page.js"] });
}

function thankYou(data) {
  const rel = data.catalog.releases.find((r) => r.id === "champion-sound") || data.catalog.releases[0];
  const main = `
<section class="sec confirm">
  <p class="mono sec-kicker">Order confirmed</p>
  <h1 class="page-title" id="tyTitle">Thank you.</h1>
  <p class="page-lede" id="msg">Your order is confirmed. A receipt is on its way from Stripe.</p>
  <div class="member-card ty-card" id="tyCard" hidden>
    <div class="ty-card-top mono"><span>Club Copy</span><strong id="tyLevel">CLUB</strong></div>
    <p class="ty-card-name member-card-name" id="tyName">Member</p>
    <p class="ty-card-meta mono">MEMBER <b id="tyNumber">0000</b><br/><span id="tyLayer">DIGITAL</span> · PACIFIC NORTHWEST</p>
  </div>
  <p class="page-lede" id="fulfillNote">Physical orders leave British Columbia in 2–4 business days with tracking. Cassettes include a download code in the parcel.</p>
  <a class="ty-plate row row--release" id="tyPlate" href="${attr(rel.page)}"><span class="row-main"><span class="mono row-meta"><span>${esc(rel.catalogue)}</span><span>${esc(rel.kind)}</span></span><span class="row-artist">${esc(rel.artist)}</span><span class="row-title">${esc(rel.title)}</span></span><span class="row-art"><img src="${asset(rel.coverThumb || rel.cover)}" alt="${attr(rel.title)}" width="480" height="480"/></span></a>
  <div class="lead-actions"><a class="btn btn-solid" id="tyPrimary" href="${attr(rel.page)}">Play ${esc(rel.title)}</a><a class="btn" href="/shipping">Shipping &amp; returns</a><a class="btn btn-text" href="/library">Library</a></div>
</section>`;
  return L.page({ title: "Thank you", description: "Order confirmed.", path: "/thank-you", main, noindex: true, scripts: ["thank-you.js"] });
}

function planet() {
  const main = `
${head("Planet MP3", "Music that follows the day. Planet MP3 shapes what you hear around the time of day, then lets you take the wheel.")}
<section class="sec">
  <dl class="specs specs--wide planet-points">
    <div><dt class="mono">Time of day</dt><dd>Morning clarity, afternoon drive, late-night depth. The music shifts as the hours do.</dd></div>
    <div><dt class="mono">Pace</dt><dd>Speed it up or slow it down without leaving the session.</dd></div>
    <div><dt class="mono">Length</dt><dd>Twenty minutes, an hour, an evening. A mix shaped to fit. No endless scroll.</dd></div>
  </dl>
  <div class="lead-actions"><a class="btn btn-solid planet-cta" href="https://planetmp3.net" target="_blank" rel="noopener">Open Planet MP3 ↗</a></div>
</section>`;
  return L.page({ title: "Planet MP3", description: "Planet MP3: music that follows the day. A Club Copy listening project.", path: "/planet", main, image: "/planetmp3-logo.webp" });
}

function notFound(data) {
  const rel = data.catalog.releases.find((r) => r.id === "champion-sound") || data.catalog.releases[0];
  const main = `
<section class="sec miss">
  <p class="mono sec-kicker">404</p>
  <h1 class="page-title">This file isn't in the catalogue.</h1>
  <p class="page-lede">The link is old, or the page moved.</p>
  <a class="miss-plate row row--release" href="${attr(rel.page)}"><span class="row-main"><span class="mono row-meta"><span>${esc(rel.catalogue)}</span><span>${esc(rel.kind)}</span><span>Digital $${money(rel.formats.digital.price)}</span></span><span class="row-artist">${esc(rel.artist)}</span><span class="row-title">${esc(rel.title)}</span></span><span class="row-art"><img src="${asset(rel.coverThumb || rel.cover)}" alt="${attr(rel.title)}" width="480" height="480"/></span></a>
  <div class="lead-actions"><a class="btn btn-solid" href="/">Home</a><a class="btn" href="/library">Library</a><a class="btn" href="/merch">Shop</a></div>
</section>`;
  return L.page({ title: "Not found", description: "This page is not in the catalogue.", path: "/404", main, noindex: true });
}


function person(data) {
  const { catalog } = data;
  const produced = catalog.releases.filter((r) => onSite(r) && /CJ Archer/i.test(JSON.stringify(r.credits || "")));
  const main = `
${head("CJ Archer", "Producer. Vancouver, BC. Founder of Club Copy and Copy House Publishing.", [["/", "Home"], ["/artists", "Artists"], [null, "CJ Archer"]])}
<section class="sec">
  <dl class="specs specs--wide">
    <div><dt class="mono">Role</dt><dd>Producer · label founder · Night Shift desk</dd></div>
    <div><dt class="mono">Based</dt><dd>Vancouver, British Columbia</dd></div>
    <div><dt class="mono">Writes</dt><dd><a href="/news">Night Shift</a> · <a href="/news/cj-archer-interview">The interview</a></dd></div>
    <div><dt class="mono">Contact</dt><dd><a href="mailto:charlie@clubcopy.ca">charlie@clubcopy.ca</a></dd></div>
  </dl>
</section>
${produced.length ? `<section class="sec" aria-labelledby="prod-title">${L.sectionHead("Produced", { titleId: "prod-title", kicker: "Club Copy releases with production by CJ Archer" })}<div class="rows">${produced.map((r) => require("./fragments").releaseRow(r)).join("\n")}</div></section>` : ""}`;
  return L.page({ title: "CJ Archer", description: "CJ Archer: producer, founder of Club Copy and Copy House Publishing, Vancouver BC.", path: "/artists/cj-archer", nav: "/artists", main, scripts: ["cc.js"], jsonld: [{ "@context": "https://schema.org", "@type": "Person", name: "CJ Archer", url: L.ORIGIN + "/artists/cj-archer", jobTitle: "Producer", worksFor: { "@type": "Organization", name: "Club Copy" } }] });
}

module.exports = { person, joinPage, about, contact, shipping, cart, account, thankYou, planet, notFound };
