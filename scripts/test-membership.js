#!/usr/bin/env node
/**
 * Membership grant rules: paid levels are not writable before checkout settles.
 */
const assert = require("assert");
const {
  resolveProfileWrite,
  sessionPaymentSettled,
  higherLevel,
} = require("../lib/membership");

assert.deepStrictEqual(resolveProfileWrite("free", "free"), {
  ok: true,
  level: "free",
});
assert.deepStrictEqual(resolveProfileWrite("", "club"), {
  ok: false,
  code: "PAYMENT_REQUIRED",
  level: "free",
});
assert.deepStrictEqual(resolveProfileWrite("free", "premium"), {
  ok: false,
  code: "PAYMENT_REQUIRED",
  level: "free",
});
assert.deepStrictEqual(resolveProfileWrite("club", "club"), {
  ok: true,
  level: "club",
});
assert.deepStrictEqual(resolveProfileWrite("premium", "free"), {
  ok: true,
  level: "premium",
});
assert.deepStrictEqual(resolveProfileWrite("premium", "club"), {
  ok: true,
  level: "premium",
});
assert.deepStrictEqual(resolveProfileWrite("club", "premium"), {
  ok: false,
  code: "PAYMENT_REQUIRED",
  level: "club",
});

assert.strictEqual(higherLevel("free", "club"), "club");
assert.strictEqual(higherLevel("premium", "club"), "premium");
assert.strictEqual(higherLevel("club", "premium"), "premium");

assert.strictEqual(sessionPaymentSettled({ payment_status: "paid" }), true);
assert.strictEqual(
  sessionPaymentSettled({ payment_status: "no_payment_required" }),
  true
);
assert.strictEqual(sessionPaymentSettled({ payment_status: "unpaid" }), false);
assert.strictEqual(sessionPaymentSettled(null), false);

async function invoke(body) {
  const handler = require("../api/club-member");
  const req = { method: "POST", body, headers: {} };
  let statusCode = 0;
  let raw = "";
  const res = {
    setHeader() {},
    end(payload) {
      raw = payload;
    },
  };
  Object.defineProperty(res, "statusCode", {
    get() {
      return statusCode;
    },
    set(value) {
      statusCode = value;
    },
  });
  await handler(req, res);
  return { status: statusCode, body: JSON.parse(raw || "{}") };
}

(async function main() {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.RESEND_API_KEY;
  const blocked = await invoke({
    email: "not-a-member@clubcopy.ca",
    level: "premium",
    displayName: "Audit",
  });
  assert.strictEqual(blocked.status, 402);
  assert.strictEqual(blocked.body.code, "PAYMENT_REQUIRED");
  assert.notStrictEqual(blocked.body.level, "premium");

  const free = await invoke({
    email: "listener@clubcopy.ca",
    level: "free",
    displayName: "Listener",
  });
  assert.strictEqual(free.status, 200);
  assert.strictEqual(free.body.level, "free");
  assert.strictEqual(free.body.displayName, "Listener");

  console.log("membership grant rules ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
