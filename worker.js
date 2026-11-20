const REPOSITORY = "babsogunlade2027/babswebsite";
const BRANCH = "main";
const RAW_BASE = "https://raw.githubusercontent.com/" + REPOSITORY + "/" + BRANCH + "/";
const API_BASE = "https://api.github.com/repos/" + REPOSITORY;
const CANONICAL_HOST = "babatundeogunlade.com";
const CANONICAL_ORIGIN = "https://" + CANONICAL_HOST;
const STATE_COOKIE = "babs_decap_state";

function baseHeaders(extra = {}) {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    ...extra
  };
}
function reply(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: baseHeaders(extra) });
}
function privateHeaders(extra = {}) {
  return { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", ...extra };
}
function jsonReply(data, status = 200, extra = {}) {
  return reply(JSON.stringify(data), status, {
    "Content-Type": "application/json; charset=utf-8",
    ...extra
  });
}
function getCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i >= 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}
function makeState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}
function clientId(env) { return env.GITHUB_OAUTH_CLIENT_ID || env.CLIENT_ID || ""; }
function clientSecret(env) { return env.GITHUB_OAUTH_CLIENT_SECRET || env.CLIENT_SECRET || ""; }

function popup(status, payload) {
  const message = "authorization:github:" + status + ":" + JSON.stringify(payload);
  const messageJs = JSON.stringify(message).replace(/</g, "\\u003c");
  const originJs = JSON.stringify(CANONICAL_ORIGIN);
  const html = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>CMS authentication</title></head><body><p>Completing GitHub sign-in…</p><script>(function(){var m=" +
    messageJs + ";var o=" + originJs + ";if(window.opener){window.opener.postMessage(m,o);window.close();}})();</script></body></html>";
  return reply(html, status === "success" ? 200 : 400, privateHeaders({
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer"
  }));
}

function isCanonicalHost(request) {
  return new URL(request.url).hostname === CANONICAL_HOST;
}
async function startAuth(request, env) {
  if (request.method !== "GET") return reply("Method not allowed", 405, privateHeaders({ Allow: "GET" }));
  if (!isCanonicalHost(request)) return reply("CMS authentication is available on the canonical website only.", 403, privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
  const id = clientId(env);
  if (!id) return reply("GitHub OAuth is not configured.", 503, privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
  const state = makeState();
  const callback = CANONICAL_ORIGIN + "/api/callback";
  const params = new URLSearchParams({ client_id: id, redirect_uri: callback, scope: "public_repo", state });
  return new Response(null, { status: 302, headers: baseHeaders({
    Location: "https://github.com/login/oauth/authorize?" + params.toString(),
    "Set-Cookie": STATE_COOKIE + "=" + state + "; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer"
  }) });
}

async function finishAuth(request, env) {
  if (request.method !== "GET") return reply("Method not allowed", 405, privateHeaders({ Allow: "GET" }));
  if (!isCanonicalHost(request)) return reply("CMS authentication is available on the canonical website only.", 403, privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const saved = getCookie(request, STATE_COOKIE);
  const clear = STATE_COOKIE + "=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0";
  if (url.searchParams.has("error")) {
    const out = popup("error", { message: "GitHub authorisation was cancelled or denied." });
    out.headers.append("Set-Cookie", clear);
    return out;
  }
  if (!state || !saved || state !== saved) {
    return reply("OAuth state validation failed. Close this window and try again.", 400, privateHeaders({
      "Set-Cookie": clear,
      "Content-Type": "text/plain; charset=utf-8"
    }));
  }
  const code = url.searchParams.get("code") || "";
  const id = clientId(env);
  const secret = clientSecret(env);
  if (!code || !id || !secret) {
    return reply("GitHub OAuth is not fully configured. Check the Worker secret binding and OAuth callback URL.", 503, privateHeaders({
      "Set-Cookie": clear,
      "Content-Type": "text/plain; charset=utf-8"
    }));
  }
  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "BABS-Decap-CMS" },
      body: JSON.stringify({ client_id: id, client_secret: secret, code, redirect_uri: CANONICAL_ORIGIN + "/api/callback" })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      const out = popup("error", { message: "GitHub token exchange failed. Verify the OAuth App configuration." });
      out.headers.append("Set-Cookie", clear);
      return out;
    }
    const out = popup("success", { token: tokenData.access_token, provider: "github" });
    out.headers.append("Set-Cookie", clear);
    return out;
  } catch {
    const out = popup("error", { message: "Unable to complete GitHub sign-in. Please try again." });
    out.headers.append("Set-Cookie", clear);
    return out;
  }
}

function resolvePath(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  if (decoded.includes("\\") || decoded.includes("\0")) return null;
  const segments = decoded.split("/").filter(Boolean);
  if (segments.some(segment => segment === "." || segment === "..")) return null;
  return segments.join("/");
}
function pathsFor(path) {
  if (!path) return ["index.html"];
  if (path === "admin") return ["admin/index.html"];
  if (path.endsWith("/")) return [path + "index.html"];
  if (path.includes(".")) return [path];
  return [path + ".html", path + "/index.html"];
}
function mime(path) {
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  return ({
    ".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",
    ".json":"application/json; charset=utf-8",".yml":"text/yaml; charset=utf-8",".yaml":"text/yaml; charset=utf-8",
    ".svg":"image/svg+xml",".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp",
    ".avif":"image/avif",".gif":"image/gif",".ico":"image/x-icon",".xml":"application/xml; charset=utf-8",
    ".txt":"text/plain; charset=utf-8",".webmanifest":"application/manifest+json; charset=utf-8",
    ".woff":"font/woff",".woff2":"font/woff2",".pdf":"application/pdf",".mp4":"video/mp4",".webm":"video/webm"
  })[ext] || "application/octet-stream";
}
function isInternalPath(path) {
  return path === "worker.js" || path === "wrangler.toml" || path === "package.json" ||
    path.startsWith("README") || path.startsWith("_posts/") || path.startsWith("docs/") ||
    path.startsWith(".github/") || path.startsWith(".git/") || path.startsWith("functions/");
}
async function serveFile(path, isAdmin) {
  if (isInternalPath(path)) return reply("Not found", 404, { "Content-Type": "text/plain; charset=utf-8" });
  for (const candidate of pathsFor(path)) {
    const target = RAW_BASE + candidate.split("/").map(encodeURIComponent).join("/");
    const upstream = await fetch(target, { headers: { Accept: "*/*", "User-Agent": "BABS-Cloudflare-Worker" } });
    if (upstream.status === 404) continue;
    if (!upstream.ok) return reply("Website source temporarily unavailable.", 502, privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
    const extra = {
      "Content-Type": mime(candidate),
      "Cache-Control": isAdmin ? "no-store" : (candidate.endsWith(".html") ? "public, max-age=0, must-revalidate" : "public, max-age=300"),
      "Content-Security-Policy": "object-src 'none'; base-uri 'self'; frame-ancestors " + (isAdmin ? "'self'" : "'none'"),
      "X-Frame-Options": isAdmin ? "SAMEORIGIN" : "DENY"
    };
    if (isAdmin) extra["X-Robots-Tag"] = "noindex, nofollow";
    return new Response(upstream.body, { status: 200, headers: baseHeaders(extra) });
  }
  return reply("Not found", 404, isAdmin ? privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }) : { "Content-Type": "text/plain; charset=utf-8" });
}

function scalar(value) {
  const text = String(value || "").trim();
  if (text.length >= 2 && text[0] === '"' && text[text.length - 1] === '"') {
    try { return JSON.parse(text); } catch { return text.slice(1, -1); }
  }
  if (text.length >= 2 && text[0] === "'" && text[text.length - 1] === "'") return text.slice(1, -1).replace(/''/g, "'");
  return text;
}
function parseFrontMatter(markdown) {
  const match = String(markdown || "").match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!match) return { fields: {}, body: String(markdown || "") };
  const fields = {};
  let blockKey = "";
  const lines = match[1].split(/\r?\n/);
  for (const line of lines) {
    if (blockKey && (/^\s/.test(line) || !line.trim())) {
      fields[blockKey] = (fields[blockKey] || "") + (fields[blockKey] ? "\n" : "") + line.replace(/^\s{2}/, "");
      continue;
    }
    blockKey = "";
    const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!item) continue;
    const key = item[1];
    const value = item[2] || "";
    if (/^(?:\||\|-|>|>-)$/.test(value.trim())) {
      fields[key] = "";
      blockKey = key;
    } else {
      fields[key] = scalar(value);
    }
  }
  return { fields: fields, body: String(markdown || "").slice(match[0].length).trim() };
}
function safeAssetPath(value) {
  const path = String(value || "").trim();
  if (!path || path.includes("..") || path.includes("\\") || /^https?:/i.test(path) || path.startsWith("//")) return "";
  if (!(path.startsWith("/assets/") || path.startsWith("assets/"))) return "";
  return path.startsWith("/") ? path : "/" + path;
}
function plainText(markdown) {
  return String(markdown || "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[\x60*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
async function loadCollection(collection, limit) {
  const url = API_BASE + "/contents/_posts/" + collection + "?ref=" + encodeURIComponent(BRANCH) + "&per_page=100";
  const listingResponse = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "BABS-Website-Feed"
    }
  });
  if (listingResponse.status === 404) return [];
  if (!listingResponse.ok) throw new Error("Content repository request failed.");
  const listing = await listingResponse.json();
  if (!Array.isArray(listing)) return [];
  const files = listing.filter(file => file && file.type === "file" && /\.md$/i.test(file.name)).slice(0, 100);
  const posts = await Promise.all(files.map(async file => {
    if (!file.download_url) return null;
    const response = await fetch(file.download_url, { headers: { "User-Agent": "BABS-Website-Feed" } });
    if (!response.ok) return null;
    const parsed = parseFrontMatter(await response.text());
    const fields = parsed.fields;
    const content = plainText(parsed.body);
    const title = String(fields.title || file.name.replace(/\.md$/i, "").replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/[-_]/g, " "));
    const description = plainText(fields.description || "") || content.slice(0, 260);
    return {
      slug: file.name.replace(/\.md$/i, ""),
      title: title,
      date: String(fields.date || ""),
      image: safeAssetPath(fields.image),
      description: description,
      caption: String(fields.caption || ""),
      content: content
    };
  }));
  return posts.filter(Boolean).sort((a, b) => {
    const da = Date.parse(a.date) || 0;
    const db = Date.parse(b.date) || 0;
    return db - da || a.title.localeCompare(b.title);
  }).slice(0, limit);
}
async function collectionResponse(request, collection) {
  if (request.method !== "GET") return jsonReply({ error: "Method not allowed" }, 405, privateHeaders({ Allow: "GET" }));
  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") || "50", 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 50)) : 50;
  const key = new Request(CANONICAL_ORIGIN + "/__feed-cache/" + collection + "?limit=" + limit);
  try {
    const cached = await caches.default.match(key);
    if (cached) return cached;
  } catch {}
  try {
    const posts = await loadCollection(collection, limit);
    const response = jsonReply({ posts: posts, count: posts.length }, 200, {
      "Cache-Control": "public, max-age=60, s-maxage=300"
    });
    try { await caches.default.put(key, response.clone()); } catch {}
    return response;
  } catch {
    return jsonReply({ error: "The published content feed is temporarily unavailable." }, 502, privateHeaders());
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www." + CANONICAL_HOST) {
      return new Response(null, { status: 308, headers: baseHeaders({
        Location: CANONICAL_ORIGIN + url.pathname + url.search,
        "Cache-Control": "public, max-age=300"
      }) });
    }
    if (url.pathname === "/api/auth") return startAuth(request, env);
    if (url.pathname === "/api/callback") return finishAuth(request, env);
    if (url.pathname === "/api/news") return collectionResponse(request, "news");
    if (url.pathname === "/api/gallery") return collectionResponse(request, "gallery");
    if (url.pathname.startsWith("/api/")) return reply("Not found", 404, privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
    const path = resolvePath(url.pathname);
    if (path === null) return reply("Bad path", 400, privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
    const isAdmin = path === "admin" || path.startsWith("admin/");
    return serveFile(path, isAdmin);
  }
};
