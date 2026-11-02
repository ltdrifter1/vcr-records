#!/usr/bin/env node
/**
 * Shop restock rules: only sold-out pieces take an email, and a signup
 * has to land somewhere before we tell the buyer it worked.
 *
 * RESTOCK_FORM_URL is pointed at a closed port so this file never posts
 * to the live inbox.
 */
process.env.RESTOCK_FORM_URL = "http://127.0.0.1:9";
delete process.env.RESEND_API_KEY;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const assert = require("assert");
const { PRODUCTS } = require("../lib/catalog");
const { validateRestock, captureRestock } = require("../lib/restock");
const handler = require("../api/restock-notify");

assert.strictEqual(PRODUCTS["sm-simple-tee"].stock, 80);
assert.strictEqual(PRODUCTS["sm-hoodie"].stock, 0);
assert.strictEqual(PRODUCTS["sm-longsleeve"].stock, 0);
assert.strictEqual(PRODUCTS["sm-sleeve-tee"].stock, 0);
assert.strictEqual(PRODUCTS["sm-crewneck"].stock, 0);
assert.strictEqual(PRODUCTS["sm-cap"].stock, 0);
assert.strictEqual(PRODUCTS["sm-bikini"].stock, 0);
assert.strictEqual(PRODUCTS["sm-slipmat"].stock, 0);
assert.strictEqual(PRODUCTS["sm-poly-outer"].stock, 0);
assert.strictEqual(PRODUCTS["sm-globe-tee"].stock, 40);

const badEmail = validateRestock({ email: "nope", sku: "sm-hoodie" });
assert.strictEqual(badEmail.ok, false);

const inStock = validateRestock({ email: "a@b.co", sku: "sm-simple-tee" });
assert.strictEqual(inStock.ok, false);
assert.strictEqual(inStock.error, "This one is in stock.");

const unknown = validateRestock({ email: "a@b.co", sku: "sm-not-real" });
assert.strictEqual(unknown.ok, false);

const hoodie = validateRestock({
  email: "Buyer@Example.com",
  sku: "sm-hoodie",
  size: "M",
});
assert.strictEqual(hoodie.ok, true);
assert.strictEqual(hoodie.entry.email, "buyer@example.com");
assert.strictEqual(hoodie.entry.size, "M");
assert.strictEqual(hoodie.entry.slug, "hoodie");

const badSize = validateRestock({ email: "a@b.co", sku: "sm-hoodie", size: "XXXL" });
assert.strictEqual(badSize.ok, false);

const spam = validateRestock({
  email: "a@b.co",
  sku: "sm-hoodie",
  _gotcha: "bot",
});
assert.strictEqual(spam.spam, true);

const entry = {
  email: "a@b.co",
  sku: "sm-hoodie",
  name: "Club Copy Hoodie",
  slug: "hoodie",
  size: "M",
  colour: "",
};

(async function () {
  const shops = [];
  const forms = [];
  const buyers = [];
  const first = await captureRestock(entry, {
    saveRedis: async () => ({ saved: true, already: false }),
    notifyShop: async (saved) => {
      shops.push(saved.email);
      return { sent: true };
    },
    confirmBuyer: async (saved) => {
      buyers.push(saved.email);
      return { sent: true };
    },
    postFormspree: async () => {
      forms.push(1);
      return { sent: true };
    },
  });
  assert.strictEqual(first.captured, true);
  assert.strictEqual(first.already, false);
  assert.deepStrictEqual(shops, ["a@b.co"]);
  assert.strictEqual(forms.length, 0);
  assert.deepStrictEqual(buyers, ["a@b.co"]);

  const fallback = await captureRestock(entry, {
    saveRedis: async () => ({ saved: false, reason: "NO_REDIS" }),
    notifyShop: async () => ({ sent: false, reason: "MAIL_NOT_CONFIGURED" }),
    confirmBuyer: async () => ({ sent: false, reason: "MAIL_NOT_CONFIGURED" }),
    postFormspree: async () => ({ sent: true }),
  });
  assert.strictEqual(fallback.captured, true);
  assert.strictEqual(fallback.notified, true);
  assert.strictEqual(fallback.confirmed, false);

  const none = await captureRestock(entry, {
    saveRedis: async () => ({ saved: false }),
    notifyShop: async () => ({ sent: false }),
    confirmBuyer: async () => ({ sent: true }),
    postFormspree: async () => ({ sent: false }),
  });
  assert.strictEqual(none.captured, false);
  assert.strictEqual(none.confirmed, false);

  const again = await captureRestock(entry, {
    saveRedis: async () => ({ saved: true, already: true }),
    notifyShop: async () => {
      throw new Error("should not notify");
    },
    confirmBuyer: async () => {
      throw new Error("should not confirm");
    },
    postFormspree: async () => {
      throw new Error("should not form");
    },
  });
  assert.strictEqual(again.already, true);
  assert.strictEqual(again.captured, true);

  function mockRes() {
    return {
      statusCode: 0,
      headers: {},
      body: "",
      setHeader(key, value) {
        this.headers[key] = value;
      },
      end(payload) {
        this.body = payload || "";
        return this;
      },
    };
  }

  const soldOut = mockRes();
  await handler(
    { method: "POST", body: { email: "a@b.co", sku: "sm-hoodie", size: "L" } },
    soldOut
  );
  assert.strictEqual(soldOut.statusCode, 503);
  assert.strictEqual(JSON.parse(soldOut.body).code, "RESTOCK_NOT_CAPTURED");

  const tee = mockRes();
  await handler(
    { method: "POST", body: { email: "a@b.co", sku: "sm-simple-tee" } },
    tee
  );
  assert.strictEqual(tee.statusCode, 400);
  assert.strictEqual(JSON.parse(tee.body).error, "This one is in stock.");

  const options = mockRes();
  await handler({ method: "OPTIONS" }, options);
  assert.strictEqual(options.statusCode, 204);

  console.log("restock tests ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
