/**
 * Restock list for sold-out shop goods.
 *
 * Stored in Redis when KV / Upstash is configured:
 *   HSET club:restock:{sku} {email} {json}
 *   SADD club:restock:skus {sku}
 *
 * The shop is also emailed (Resend). If mail is not configured, the same
 * note is posted to the footer Formspree inbox with a Restock subject.
 * The buyer gets a confirmation only when Resend is configured.
 */
"use strict";

const merch = require("../data/merch.json");
const { normalizeEmail, isValidEmail, redisConfig } = require("./credit-ledger");
const { sendMail } = require("./mailer");

const FORMSPREE_URL =
  process.env.RESTOCK_FORM_URL || "https://formspree.io/f/xdkwjzzr";
const SHOP_EMAIL = process.env.RESTOCK_NOTIFY_EMAIL || "charlie@clubcopy.ca";

function findProduct(sku) {
  const key = String(sku || "").trim().toLowerCase();
  const products = Array.isArray(merch.products) ? merch.products : [];
  return products.find((p) => String(p.sku || "").toLowerCase() === key) || null;
}

function isSoldOut(product) {
  return !!(product && product.stockQty != null && Number(product.stockQty) <= 0);
}

function validateRestock(body) {
  const input = body && typeof body === "object" ? body : {};
  if (String(input._gotcha || input.company || "").trim()) {
    return { ok: true, spam: true };
  }
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    return { ok: false, status: 400, error: "Enter a valid email." };
  }
  const product = findProduct(input.sku);
  if (!product) {
    return { ok: false, status: 400, error: "Unknown product." };
  }
  if (!isSoldOut(product)) {
    return { ok: false, status: 400, error: "This one is in stock." };
  }
  const size = String(input.size || "").trim().slice(0, 40);
  const colour = String(input.colour || "").trim().slice(0, 40);
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const colours = Array.isArray(product.colours) ? product.colours : [];
  if (size && sizes.length && sizes.indexOf(size) === -1) {
    return { ok: false, status: 400, error: "That size isn't on this piece." };
  }
  if (colour && colours.length && colours.indexOf(colour) === -1) {
    return { ok: false, status: 400, error: "That colour isn't on this piece." };
  }
  return {
    ok: true,
    entry: {
      email,
      sku: String(product.sku).toLowerCase(),
      name: product.name,
      slug: product.slug,
      size,
      colour,
    },
  };
}

async function redisCommand(cfg, args) {
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) || `Redis error ${res.status}`;
    throw new Error(msg);
  }
  return data.result;
}

async function saveRedis(entry, now) {
  const cfg = redisConfig();
  if (!cfg) return { saved: false, reason: "NO_REDIS" };
  const key = `club:restock:${entry.sku}`;
  const existingRaw = await redisCommand(cfg, ["HGET", key, entry.email]);
  let createdAt = now;
  let already = false;
  if (existingRaw) {
    already = true;
    try {
      const prev =
        typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw;
      if (prev && prev.createdAt) createdAt = prev.createdAt;
    } catch (e) {
      /* keep the new timestamp */
    }
  }
  const value = JSON.stringify({
    email: entry.email,
    sku: entry.sku,
    name: entry.name,
    size: entry.size || "",
    colour: entry.colour || "",
    createdAt,
    updatedAt: now,
  });
  await redisCommand(cfg, ["HSET", key, entry.email, value]);
  await redisCommand(cfg, ["SADD", "club:restock:skus", entry.sku]);
  return { saved: true, already };
}

function variantLine(entry) {
  const bits = [];
  if (entry.colour) bits.push(entry.colour);
  if (entry.size) bits.push("size " + entry.size);
  return bits.length ? " (" + bits.join(", ") + ")" : "";
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

async function notifyShop(entry) {
  const line = variantLine(entry);
  const subject = `Restock list · ${entry.name}`;
  const text = `${entry.email} asked to hear when ${entry.name}${line} is back in stock.\nSKU ${entry.sku}\nhttps://www.clubcopy.ca/merch/${entry.slug}`;
  const html = `<p>${escapeHtml(entry.email)} asked to hear when <strong>${escapeHtml(entry.name)}</strong>${escapeHtml(line)} is back in stock.</p><p>SKU ${escapeHtml(entry.sku)}<br/><a href="https://www.clubcopy.ca/merch/${escapeHtml(entry.slug)}">View the piece</a></p>`;
  return sendMail({
    to: SHOP_EMAIL,
    subject,
    text,
    html,
    replyTo: entry.email,
  });
}

async function confirmBuyer(entry) {
  const line = variantLine(entry);
  const subject = `We'll write when ${entry.name} is back`;
  const text = `You're on the list for ${entry.name}${line}. We'll email ${entry.email} when it's back in stock.\n\nhttps://www.clubcopy.ca/merch/${entry.slug}`;
  const html = `<p>You're on the list for <strong>${escapeHtml(entry.name)}</strong>${escapeHtml(line)}.</p><p>We'll email ${escapeHtml(entry.email)} when it's back in stock.</p>`;
  return sendMail({ to: entry.email, subject, text, html });
}

async function postFormspree(entry) {
  if (!FORMSPREE_URL) return { sent: false, reason: "NO_FORM" };
  try {
    const res = await fetch(FORMSPREE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: entry.email,
        product: entry.name,
        sku: entry.sku,
        size: entry.size || "",
        colour: entry.colour || "",
        _subject: `Restock: ${entry.name}`,
        message: `${entry.email} wants to know when ${entry.name}${variantLine(entry)} is back in stock.`,
      }),
    });
    if (!res.ok) return { sent: false, reason: `FORM_${res.status}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: (err && err.message) || "FORM_FAILED" };
  }
}

async function captureRestock(entry, deps) {
  const now = new Date().toISOString();
  const save = (deps && deps.saveRedis) || saveRedis;
  const shop = (deps && deps.notifyShop) || notifyShop;
  const buyer = (deps && deps.confirmBuyer) || confirmBuyer;
  const form = (deps && deps.postFormspree) || postFormspree;

  let redisResult = { saved: false, reason: "SKIPPED" };
  try {
    redisResult = await save(entry, now);
  } catch (err) {
    redisResult = { saved: false, reason: (err && err.message) || "REDIS_FAILED" };
  }

  const already = !!(redisResult && redisResult.already);
  let shopMail = { sent: false, reason: "SKIPPED" };
  let formResult = { sent: false, reason: "SKIPPED" };
  if (!already) {
    try {
      shopMail = await shop(entry);
    } catch (err) {
      shopMail = { sent: false, reason: (err && err.message) || "MAIL_FAILED" };
    }
    if (!shopMail.sent) {
      try {
        formResult = await form(entry);
      } catch (err) {
        formResult = { sent: false, reason: (err && err.message) || "FORM_FAILED" };
      }
    }
  }

  const captured = !!(
    (redisResult && redisResult.saved) ||
    shopMail.sent ||
    formResult.sent ||
    already
  );

  let confirm = { sent: false, reason: "SKIPPED" };
  if (captured && !already) {
    try {
      confirm = await buyer(entry);
    } catch (err) {
      confirm = { sent: false, reason: (err && err.message) || "CONFIRM_FAILED" };
    }
  }

  return {
    captured,
    already,
    notified: !!(shopMail.sent || formResult.sent),
    confirmed: !!confirm.sent,
  };
}

module.exports = {
  findProduct,
  isSoldOut,
  validateRestock,
  captureRestock,
  FORMSPREE_URL,
  SHOP_EMAIL,
};
