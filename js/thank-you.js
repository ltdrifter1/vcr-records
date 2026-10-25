if (window.VCRCart) VCRCart.clear();
var params = new URLSearchParams(location.search);
var sid = params.get('session_id');
var isMember = params.get('member') === '1';
var level = (params.get('level') || '').toLowerCase();

if (sid) {
  document.getElementById('msg').textContent =
    'Your order is confirmed. Keep an eye on your inbox for the Stripe receipt.';
}

function storedEmail() {
  var profile = window.ClubMember && ClubMember.readProfile();
  if (profile && profile.email) return profile.email;
  try {
    return sessionStorage.getItem('club_checkout_email')
      || localStorage.getItem('club_credit_email')
      || '';
  } catch (e) {
    return '';
  }
}

function storedName() {
  var profile = window.ClubMember && ClubMember.readProfile();
  if (profile && profile.displayName) return profile.displayName;
  try { return sessionStorage.getItem('club_checkout_name') || ''; } catch (e) { return ''; }
}

function paintMember(profile, memberLevel) {
  var card = document.getElementById('tyCard');
  card.hidden = false;
  var paid = memberLevel === 'premium' ? 'premium' : 'club';
  document.getElementById('tyLevel').textContent = paid === 'premium' ? 'PREMIUM' : 'CLUB';
  var email = (profile && profile.email) || storedEmail();
  var name = (profile && profile.displayName) || storedName() || email || 'Member';
  document.getElementById('tyName').textContent = String(name).toUpperCase();
  var number = (profile && profile.memberNumber) ||
    (window.ClubMember && email ? ClubMember.memberNumberFromEmail(email) : '0000');
  document.getElementById('tyNumber').textContent = number;
  document.getElementById('tyLayer').textContent =
    paid === 'premium' ? 'DIGITAL + PHYSICAL' : 'DIGITAL';
}

if (isMember && sid) {
  var asked = level === 'premium' ? 'premium' : 'club';
  document.getElementById('tyTitle').textContent = 'Your place is reserved.';
  document.getElementById('msg').textContent =
    'The member rate turns on for this email after Stripe confirms the payment.';
  document.getElementById('fulfillNote').textContent =
    asked === 'premium'
      ? 'Premium is 50% off all music, plus Club Credit toward cassettes and pressings you choose.'
      : 'Club is 30% off all music and renews yearly.';
  document.getElementById('tyPrimary').href = '/account';
  document.getElementById('tyPrimary').textContent = 'View your account';
  paintMember(window.ClubMember && ClubMember.readProfile(), asked);

  (async function confirmMembership() {
    var email = storedEmail();
    if (!email || !window.ClubMember) return;
    var attempt;
    for (attempt = 0; attempt < 8; attempt++) {
      try {
        var res = await fetch('/api/club-member?email=' + encodeURIComponent(email));
        var data = await res.json().catch(function () { return null; });
        if (data && (data.level === 'club' || data.level === 'premium')) {
          ClubMember.writeProfile(data);
          paintMember(data, data.level);
          document.getElementById('msg').textContent =
            data.level === 'premium'
              ? 'Premium is active. 50% off all music on this email, plus Club Credit toward cassettes and pressings you choose.'
              : 'Club is active. 30% off all music in the library.';
          document.getElementById('fulfillNote').textContent =
            data.level === 'premium'
              ? 'Browse the library, then apply Club Credit at checkout with the same email.'
              : 'Renews yearly. Browse the library whenever you are ready — 30% off music.';
          return;
        }
      } catch (e) {}
      await new Promise(function (resolve) { setTimeout(resolve, 1500); });
    }
  })();
}
