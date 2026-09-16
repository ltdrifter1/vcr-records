/**
 * Same-origin Instagram stills for the homepage wall.
 * GET /api/instagram-media?p=SHORTCODE
 */
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
    const upstream = await fetch("https://www.instagram.com/p/" + code + "/media/?size=l", {
      headers: {
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.instagram.com/",
      },
      redirect: "follow",
    });
    if (!upstream.ok) {
      return send(res, upstream.status === 404 ? 404 : 502, "Media unavailable", {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=60",
      });
    }
    const type = upstream.headers.get("content-type") || "image/jpeg";
    if (type.indexOf("image/") !== 0 && type.indexOf("octet-stream") === -1) {
      return send(res, 502, "Unexpected media type", { "Content-Type": "text/plain" });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    return send(res, 200, buf, {
      "Content-Type": type.indexOf("image/") === 0 ? type : "image/jpeg",
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
