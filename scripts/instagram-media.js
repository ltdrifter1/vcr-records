/**
 * Instagram still proxy for GET /api/instagram-media?p=SHORTCODE
 */
const { execFile } = require("child_process");
const IG_RE = /^[A-Za-z0-9_-]{5,20}$/;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function send(res, status, body, headers) {
  res.statusCode = status;
  Object.keys(headers || {}).forEach(function (k) {
    res.setHeader(k, headers[k]);
  });
  return res.end(body);
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return send(res, 204, "", {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });
  }
  if (req.method !== "GET") {
    return send(res, 405, "Method not allowed", { "Content-Type": "text/plain" });
  }

  const url = new URL(req.url, "http://localhost");
  const code = String(url.searchParams.get("p") || "").trim();
  if (!IG_RE.test(code)) {
    return send(res, 400, "Bad shortcode", { "Content-Type": "text/plain" });
  }

  try {
    const buf = await new Promise(function (resolve, reject) {
      execFile(
        "curl",
        [
          "-sS",
          "-L",
          "-A",
          UA,
          "-H",
          "Referer: https://www.instagram.com/",
          "https://www.instagram.com/p/" + code + "/media/?size=l",
        ],
        { encoding: "buffer", maxBuffer: 6 * 1024 * 1024, timeout: 15000 },
        function (err, stdout) {
          if (err) return reject(err);
          resolve(stdout);
        }
      );
    });
    if (!buf || buf.length < 800) {
      return send(res, 502, "Media unavailable", {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=60",
      });
    }
    return send(res, 200, buf, {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    });
  } catch (err) {
    return send(res, 502, "Media fetch failed", {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=30",
    });
  }
};
