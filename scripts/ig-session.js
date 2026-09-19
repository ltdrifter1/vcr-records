/**
 * Guest Instagram session for public profile JSON.
 * Node fetch is 429'd from datacenters; curl with embed cookies is not.
 */
const { execFile } = require("child_process");

const IG_APP_ID = "936619743392459";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const SESSION_MS = 25 * 60 * 1000;

let cache = { at: 0, cookie: "", csrf: "" };

function runCurl(args) {
  return new Promise(function (resolve, reject) {
    execFile("curl", args, { maxBuffer: 8 * 1024 * 1024, timeout: 20000 }, function (err, stdout, stderr) {
      if (err) {
        err.stderr = stderr;
        return reject(err);
      }
      resolve(stdout);
    });
  });
}

function parseSetCookie(dump) {
  const parts = [];
  let csrf = "";
  String(dump || "").split(/\r?\n/).forEach(function (line) {
    if (!/^set-cookie:/i.test(line)) return;
    const nv = line.split(":", 2)[1].trim().split(";")[0].trim();
    if (!nv || nv.indexOf("=") < 0) return;
    parts.push(nv);
    if (nv.indexOf("csrftoken=") === 0) csrf = nv.slice("csrftoken=".length);
  });
  return { cookie: parts.join("; "), csrf: csrf };
}

async function guestSession() {
  if (cache.cookie && Date.now() - cache.at < SESSION_MS) return cache;
  const dump = await runCurl([
    "-sS",
    "-D", "-",
    "-o", "/dev/null",
    "-A", UA,
    "-H", "Accept: text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    "-H", "Accept-Language: en-US,en;q=0.9",
    "https://www.instagram.com/ltdrifta/embed/",
  ]);
  const bits = parseSetCookie(dump);
  if (!bits.cookie) {
    const err = new Error("Instagram guest session missing cookies");
    throw err;
  }
  cache = { at: Date.now(), cookie: bits.cookie, csrf: bits.csrf };
  return cache;
}

async function fetchProfile(username) {
  const session = await guestSession();
  const url = "https://www.instagram.com/api/v1/users/web_profile_info/?username=" + encodeURIComponent(username);
  const stdout = await runCurl([
    "-sS",
    "-w", "\n__IG_HTTP__:%{http_code}",
    "-A", UA,
    "-H", "Accept: application/json",
    "-H", "Accept-Language: en-US,en;q=0.9",
    "-H", "X-IG-App-ID: " + IG_APP_ID,
    "-H", "X-ASBD-ID: 129477",
    "-H", "X-IG-WWW-Claim: 0",
    "-H", "X-CSRFToken: " + (session.csrf || ""),
    "-H", "Referer: https://www.instagram.com/" + username + "/",
    "-H", "Origin: https://www.instagram.com",
    "-H", "Cookie: " + session.cookie,
    url,
  ]);
  const mark = stdout.lastIndexOf("\n__IG_HTTP__:");
  const body = mark >= 0 ? stdout.slice(0, mark) : stdout;
  const status = mark >= 0 ? Number(stdout.slice(mark + "\n__IG_HTTP__:".length)) : 0;
  if (status !== 200) {
    cache = { at: 0, cookie: "", csrf: "" };
    const err = new Error("Instagram " + username + " " + status);
    err.status = status;
    throw err;
  }
  return JSON.parse(body);
}

module.exports = { fetchProfile, UA, IG_APP_ID };
