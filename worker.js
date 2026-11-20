const REPOSITORY = "babsogunlade2027/babswebsite";
const BRANCH = "main";
const RAW_BASE = "https://raw.githubusercontent.com/" + REPOSITORY + "/" + BRANCH + "/";
const STATE_COOKIE = "babs_decap_state";

function baseHeaders(extra = {}) {
  return { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", ...extra };
}
function reply(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: baseHeaders(extra) });
}
function privateHeaders(extra = {}) {
  return { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", ...extra };
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

function popup(status, payload, origin) {
  const message = "authorization:github:" + status + ":" + JSON.stringify(payload);
  const messageJs = JSON.stringify(message).replace(/</g, "\\u003c");
  const originJs = JSON.stringify(origin);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CMS authentication</title></head><body><p>Completing GitHub sign-in…</p><script>(function(){var m=${messageJs};var o=${originJs};if(window.opener){window.opener.postMessage(m,o);window.close();}})();</script></body></html>`;
  return reply(html, status === "success" ? 200 : 400, privateHeaders({
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
  }));
}

async function startAuth(request, env) {
  if (request.method !== "GET") return reply("Method not allowed", 405, privateHeaders({ Allow: "GET" }));
  const id = clientId(env);
  if (!id) return reply("GitHub OAuth is not configured.", 503, privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
  const url = new URL(request.url);
  const state = makeState();
  const callback = new URL("/api/callback", url.origin).toString();
  const params = new URLSearchParams({ client_id: id, redirect_uri: callback, scope: "public_repo", state });
  return new Response(null, { status: 302, headers: baseHeaders({
    Location: "https://github.com/login/oauth/authorize?" + params.toString(),
    "Set-Cookie": STATE_COOKIE + "=" + state + "; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600",
    "Cache-Control": "no-store", "Referrer-Policy": "no-referrer"
  }) });
}

async function finishAuth(request, env) {
  if (request.method !== "GET") return reply("Method not allowed", 405, privateHeaders({ Allow: "GET" }));
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const saved = getCookie(request, STATE_COOKIE);
  const clear = STATE_COOKIE + "=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0";
  if (url.searchParams.has("error")) {
    const out = popup("error", { message: "GitHub authorisation was cancelled or denied." }, url.origin);
    out.headers.append("Set-Cookie", clear);
    return out;
  }
  if (!state || !saved || state !== saved) {
    return reply("OAuth state validation failed. Close this window and try again.", 400, privateHeaders({
      "Set-Cookie": clear, "Content-Type": "text/plain; charset=utf-8"
    }));
  }
  const code = url.searchParams.get("code") || "";
  const id = clientId(env);
  const secret = clientSecret(env);
  if (!code || !id || !secret) {
    return reply("GitHub OAuth is not fully configured. Check Worker secret bindings and the OAuth callback URL.", 503, privateHeaders({
      "Set-Cookie": clear, "Content-Type": "text/plain; charset=utf-8"
    }));
  }
  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "BABS-Decap-CMS" },
      body: JSON.stringify({ client_id: id, client_secret: secret, code, redirect_uri: new URL("/api/callback", url.origin).toString() })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      const out = popup("error", { message: "GitHub token exchange failed. Verify the OAuth App configuration." }, url.origin);
      out.headers.append("Set-Cookie", clear);
      return out;
    }
    const out = popup("success", { token: tokenData.access_token, provider: "github" }, url.origin);
    out.headers.append("Set-Cookie", clear);
    return out;
  } catch {
    const out = popup("error", { message: "Unable to complete GitHub sign-in. Please try again." }, url.origin);
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
    ".gif":"image/gif",".ico":"image/x-icon",".xml":"application/xml; charset=utf-8",".txt":"text/plain; charset=utf-8",
    ".webmanifest":"application/manifest+json; charset=utf-8",".woff2":"font/woff2",".pdf":"application/pdf"
  })[ext] || "application/octet-stream";
}
async function serveFile(path, isAdmin) {
  for (const candidate of pathsFor(path)) {
    const target = RAW_BASE + candidate.split("/").map(encodeURIComponent).join("/");
    const upstream = await fetch(target, { headers: { Accept: "*/*", "User-Agent": "BABS-Cloudflare-Worker" } });
    if (upstream.status === 404) continue;
    if (!upstream.ok) return reply("Website source temporarily unavailable.", 502, privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
    const extra = {
      "Content-Type": mime(candidate),
      "Cache-Control": isAdmin ? "no-store" : (candidate.endsWith(".html") ? "public, max-age=0, must-revalidate" : "public, max-age=300")
    };
    if (isAdmin) { extra["X-Robots-Tag"] = "noindex, nofollow"; extra["X-Frame-Options"] = "SAMEORIGIN"; }
    else { extra["X-Frame-Options"] = "DENY"; }
    return new Response(upstream.body, { status: 200, headers: baseHeaders(extra) });
  }
  return reply("Not found", 404, isAdmin ? privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }) : { "Content-Type": "text/plain; charset=utf-8" });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/auth") return startAuth(request, env);
    if (url.pathname === "/api/callback") return finishAuth(request, env);
    if (url.pathname.startsWith("/api/")) return reply("Not found", 404, privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
    const path = resolvePath(url.pathname);
    if (path === null) return reply("Bad path", 400, privateHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
    return serveFile(path, url.pathname.startsWith("/admin"));
  }
};
