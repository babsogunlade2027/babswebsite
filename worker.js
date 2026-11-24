const REPOSITORY = "babsogunlade2027/babswebsite";
const STATE_COOKIE = "babs_oauth_state";
const SESSION_COOKIE = "babs_cms_session";
const SESSION_TTL = 60 * 60 * 8;
const CONTENT_BRANCH = "main";

const PUBLIC_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://raw.githubusercontent.com https://res.cloudinary.com",
  "connect-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join("; ");

const ADMIN_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://avatars.githubusercontent.com",
  "connect-src 'self' https://api.github.com",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join("; ");

const ROLES = ["super_admin", "administrator", "editor", "author", "media_manager", "viewer"];
const STATES = ["draft", "in_review", "scheduled", "published", "archived"];

function headers(extra = {}) {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    ...extra
  };
}
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra })
  });
}
function text(message, status = 200, extra = {}) {
  return new Response(message, { status, headers: headers({ "Content-Type": "text/plain; charset=utf-8", ...extra }) });
}
function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return Array.from(value, b => b.toString(16).padStart(2, "0")).join("");
}
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
function cookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i >= 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}
function cookieHeader(name, value, maxAge, path = "/") {
  return name + "=" + value + "; HttpOnly; Secure; SameSite=Lax; Path=" + path + "; Max-Age=" + maxAge;
}
function clearCookie(name, path = "/") {
  return name + "=; HttpOnly; Secure; SameSite=Lax; Path=" + path + "; Max-Age=0";
}
function originOk(request) {
  const origin = request.headers.get("Origin");
  return !!origin && origin === new URL(request.url).origin;
}
function clientId(env) { return env.GITHUB_OAUTH_CLIENT_ID || env.CLIENT_ID || ""; }
function clientSecret(env) { return env.GITHUB_OAUTH_CLIENT_SECRET || env.CLIENT_SECRET || ""; }
function allowedGithubIds(env) {
  const raw = String(env.ADMIN_GITHUB_IDS || "");
  return raw.split(",").map(x => x.trim()).filter(Boolean);
}
function clean(value, max = 5000) {
  return String(value == null ? "" : value).replace(/\u0000/g, "").trim().slice(0, max);
}
function validSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 120;
}
function slugify(value) {
  return clean(value, 180).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}
function can(user, action, resource) {
  const role = user.role;
  if (role === "super_admin") return true;
  if (action === "read") return ["administrator", "editor", "author", "media_manager", "viewer"].includes(role);
  if (resource === "users") return false;
  if (resource === "media") return role === "administrator" || role === "media_manager" || role === "editor";
  if (resource === "enquiries") return role === "administrator";
  if (resource === "settings" || resource === "navigation") return role === "administrator";
  if (resource === "articles" || resource === "pages" || resource === "policies" || resource === "press") {
    if (role === "administrator" || role === "editor") return true;
    return role === "author" && action === "create";
  }
  return false;
}
async function getUser(request, env) {
  if (!env.DB) return null;
  const raw = cookie(request, SESSION_COOKIE);
  if (!raw) return null;
  const tokenHash = await sha256(raw);
  const row = await env.DB.prepare(
    "SELECT u.id,u.github_user_id,u.email,u.display_name,u.role,u.status,s.id AS session_id,s.csrf_hash,s.expires_at " +
    "FROM admin_sessions s JOIN admin_users u ON u.id=s.admin_user_id " +
    "WHERE s.token_hash=? AND s.expires_at>? AND u.status='active' LIMIT 1"
  ).bind(tokenHash, new Date().toISOString()).first();
  return row || null;
}
async function requireUser(request, env) {
  const user = await getUser(request, env);
  if (!user) return { error: json({ ok: false, error: "Authentication required." }, 401) };
  return { user };
}
async function requireMutation(request, env, user) {
  if (!originOk(request)) return json({ ok: false, error: "Origin validation failed." }, 403);
  const supplied = request.headers.get("X-CSRF-Token") || "";
  if (!supplied || !user.csrf_hash || await sha256(supplied) !== user.csrf_hash) {
    return json({ ok: false, error: "Security token expired. Refresh and try again." }, 403);
  }
  return null;
}
async function audit(env, actor, action, entityType, entityId, summary) {
  await env.DB.prepare(
    "INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary) VALUES (?,?,?,?,?,?)"
  ).bind(crypto.randomUUID(), actor.id, action, entityType, entityId || null, summary).run();
}
async function authStart(request, env) {
  if (request.method !== "GET") return text("Method not allowed", 405, { Allow: "GET" });
  if (!clientId(env)) return text("GitHub OAuth is not configured.", 503);
  const state = randomToken();
  const callback = new URL("/api/callback", new URL(request.url).origin).toString();
  const params = new URLSearchParams({
    client_id: clientId(env),
    redirect_uri: callback,
    scope: "read:user user:email",
    state
  });
  return new Response(null, {
    status: 302,
    headers: headers({
      Location: "https://github.com/login/oauth/authorize?" + params.toString(),
      "Set-Cookie": cookieHeader(STATE_COOKIE, state, 600, "/api"),
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer"
    })
  });
}
async function authCallback(request, env) {
  const url = new URL(request.url);
  const saved = cookie(request, STATE_COOKIE);
  const clearState = clearCookie(STATE_COOKIE, "/api");
  if (url.searchParams.has("error")) return new Response(null, { status: 302, headers: headers({ Location: "/admin/?login=cancelled", "Set-Cookie": clearState }) });
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  if (!state || !saved || state !== saved || !code) return text("OAuth state validation failed.", 400, { "Set-Cookie": clearState });
  if (!env.DB || !clientId(env) || !clientSecret(env)) return text("CMS authentication is not configured.", 503, { "Set-Cookie": clearState });
  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "BABS-CMS" },
      body: JSON.stringify({ client_id: clientId(env), client_secret: clientSecret(env), code, redirect_uri: new URL("/api/callback", url.origin).toString() })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error("GitHub token exchange failed.");
    const apiHeaders = { Authorization: "Bearer " + tokenData.access_token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "BABS-CMS" };
    const profileResponse = await fetch("https://api.github.com/user", { headers: apiHeaders });
    if (!profileResponse.ok) throw new Error("Unable to verify GitHub account.");
    const profile = await profileResponse.json();
    let email = profile.email || "";
    if (!email) {
      const emailsResponse = await fetch("https://api.github.com/user/emails", { headers: apiHeaders });
      if (emailsResponse.ok) {
        const emails = await emailsResponse.json();
        const primary = Array.isArray(emails) ? emails.find(x => x.primary && x.verified) : null;
        email = primary ? primary.email : "";
      }
    }
    const allowed = allowedGithubIds(env);
    if (!allowed.includes(String(profile.id))) return new Response(null, { status: 302, headers: headers({ Location: "/admin/?login=not-authorised", "Set-Cookie": clearState }) });
    if (!email) email = "github-" + profile.id + "@users.noreply.github.com";
    let user = await env.DB.prepare("SELECT * FROM admin_users WHERE github_user_id=? LIMIT 1").bind(String(profile.id)).first();
    if (!user) {
      const root = await env.DB.prepare("SELECT id FROM admin_users WHERE role='super_admin' AND status='active' LIMIT 1").first();
      if (root) return new Response(null, { status: 302, headers: headers({ Location: "/admin/?login=invitation-required", "Set-Cookie": clearState }) });
      const id = crypto.randomUUID();
      await env.DB.prepare(
        "INSERT INTO admin_users (id,github_user_id,email,display_name,role,status) VALUES (?,?,?,?,?,?)"
      ).bind(id, String(profile.id), email, clean(profile.name || profile.login, 120), "super_admin", "active").run();
      user = await env.DB.prepare("SELECT * FROM admin_users WHERE id=?").bind(id).first();
    }
    if (!user || user.status !== "active") return new Response(null, { status: 302, headers: headers({ Location: "/admin/?login=inactive", "Set-Cookie": clearState }) });
    const sessionToken = randomToken();
    const csrfToken = randomToken();
    const expires = new Date(Date.now() + SESSION_TTL * 1000).toISOString();
    await env.DB.prepare(
      "INSERT INTO admin_sessions (id,admin_user_id,token_hash,csrf_hash,expires_at) VALUES (?,?,?,?,?)"
    ).bind(crypto.randomUUID(), user.id, await sha256(sessionToken), await sha256(csrfToken), expires).run();
    await env.DB.prepare("UPDATE admin_users SET last_login_at=?,updated_at=? WHERE id=?")
      .bind(new Date().toISOString(), new Date().toISOString(), user.id).run();
    await env.DB.prepare(
      "INSERT INTO activity_logs (id,actor_id,action,entity_type,summary) VALUES (?,?,?,?,?)"
    ).bind(crypto.randomUUID(), user.id, "login", "session", "Administrator signed in.").run();
    const out = new Response(null, {
      status: 302,
      headers: headers({ Location: "/admin/", "Cache-Control": "no-store" })
    });
    out.headers.append("Set-Cookie", cookieHeader(SESSION_COOKIE, sessionToken, SESSION_TTL));
    out.headers.append("Set-Cookie", clearState);
    return out;
  } catch (error) {
    return new Response(null, { status: 302, headers: headers({ Location: "/admin/?login=error", "Set-Cookie": clearState }) });
  }
}
async function sessionRoute(request, env) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const csrf = randomToken();
  await env.DB.prepare("UPDATE admin_sessions SET csrf_hash=?,last_seen_at=? WHERE id=?")
    .bind(await sha256(csrf), new Date().toISOString(), auth.user.session_id).run();
  return json({
    ok: true,
    user: { id: auth.user.id, email: auth.user.email, displayName: auth.user.display_name, role: auth.user.role },
    csrfToken: csrf
  });
}
async function logoutRoute(request, env) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const failure = await requireMutation(request, env, auth.user);
  if (failure) return failure;
  await env.DB.prepare("DELETE FROM admin_sessions WHERE id=?").bind(auth.user.session_id).run();
  await audit(env, auth.user, "logout", "session", auth.user.session_id, "Administrator signed out.");
  return json({ ok: true }, 200, { "Set-Cookie": clearCookie(SESSION_COOKIE) });
}
async function dashboardRoute(request, env, user) {
  const queries = [
    ["articles", "SELECT COUNT(*) AS n FROM articles"],
    ["publishedArticles", "SELECT COUNT(*) AS n FROM articles WHERE status='published'"],
    ["draftArticles", "SELECT COUNT(*) AS n FROM articles WHERE status='draft'"],
    ["scheduledArticles", "SELECT COUNT(*) AS n FROM articles WHERE status='scheduled'"],
    ["pages", "SELECT COUNT(*) AS n FROM pages"],
    ["publishedPages", "SELECT COUNT(*) AS n FROM pages WHERE status='published'"],
    ["media", "SELECT COUNT(*) AS n FROM media"],
    ["enquiries", "SELECT COUNT(*) AS n FROM enquiries WHERE status IN ('unread','read','in_progress')"],
    ["unreadEnquiries", "SELECT COUNT(*) AS n FROM enquiries WHERE status='unread'"]
  ];
  const values = await Promise.all(queries.map(async ([key, sql]) => {
    const row = await env.DB.prepare(sql).first();
    return [key, Number(row?.n || 0)];
  }));
  const recent = await env.DB.prepare(
    "SELECT l.id,l.action,l.entity_type,l.summary,l.created_at,u.display_name FROM activity_logs l LEFT JOIN admin_users u ON u.id=l.actor_id ORDER BY l.created_at DESC LIMIT 8"
  ).all();
  return json({ ok: true, stats: Object.fromEntries(values), recentActivity: recent.results || [] });
}
async function listArticles(request, env) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const q = clean(url.searchParams.get("q"), 100);
  let sql = "SELECT a.id,a.title,a.slug,a.excerpt,a.status,a.published_at,a.scheduled_at,a.created_at,a.updated_at,c.name AS category_name,u.display_name AS author_name FROM articles a LEFT JOIN categories c ON c.id=a.category_id LEFT JOIN admin_users u ON u.id=a.author_id WHERE 1=1";
  const params = [];
  if (STATES.includes(status)) { sql += " AND a.status=?"; params.push(status); }
  if (q) { sql += " AND (a.title LIKE ? OR a.excerpt LIKE ?)"; params.push("%"+q+"%","%"+q+"%"); }
  sql += " ORDER BY COALESCE(a.published_at,a.updated_at,a.created_at) DESC LIMIT 200";
  const result = await env.DB.prepare(sql).bind(...params).all();
  return json({ ok: true, items: result.results || [] });
}
async function saveArticle(request, env, user, id = null) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ ok: false, error: "Invalid article payload." }, 400);
  const title = clean(body.title, 180);
  const excerpt = clean(body.excerpt, 500);
  const bodyMarkdown = clean(body.bodyMarkdown, 50000);
  const slug = slugify(body.slug || title);
  let status = STATES.includes(body.status) ? body.status : "draft";
  if (user.role === "author") status = "draft";
  if (title.length < 3 || !validSlug(slug)) return json({ ok: false, error: "Enter a valid title and URL slug." }, 422);
  if (!bodyMarkdown) return json({ ok: false, error: "Article body is required." }, 422);
  const categoryId = clean(body.categoryId, 80) || null;
  if (categoryId) {
    const category = await env.DB.prepare("SELECT id FROM categories WHERE id=?").bind(categoryId).first();
    if (!category) return json({ ok: false, error: "Choose a valid category." }, 422);
  }
  const now = new Date().toISOString();
  if (id) {
    const existing = await env.DB.prepare("SELECT id,author_id FROM articles WHERE id=?").bind(id).first();
    if (!existing) return json({ ok: false, error: "Article not found." }, 404);
    if (user.role === "author" && existing.author_id !== user.id) return json({ ok: false, error: "You can only edit your own articles." }, 403);
    const publishedAt = status === "published" ? now : null;
    await env.DB.prepare(
      "UPDATE articles SET title=?,slug=?,excerpt=?,body_markdown=?,category_id=?,status=?,published_at=COALESCE(?,published_at),scheduled_at=?,updated_at=? WHERE id=?"
    ).bind(title,slug,excerpt,bodyMarkdown,categoryId,status,publishedAt,body.scheduledAt || null,now,id).run();
    await audit(env,user,"update","article",id,"Updated article: "+title);
    return json({ ok: true, id });
  }
  const newId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO articles (id,title,slug,excerpt,body_markdown,category_id,status,author_id,published_at,scheduled_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
  ).bind(newId,title,slug,excerpt,bodyMarkdown,categoryId,status,user.id,status==="published"?now:null,body.scheduledAt||null).run();
  await audit(env,user,"create","article",newId,"Created article: "+title);
  return json({ ok: true, id: newId }, 201);
}
async function listPages(request, env) {
  const result = await env.DB.prepare(
    "SELECT id,title,slug,excerpt,status,show_in_navigation,created_at,updated_at,published_at FROM pages ORDER BY updated_at DESC LIMIT 200"
  ).all();
  return json({ ok: true, items: result.results || [] });
}
async function savePage(request, env, user, id = null) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ ok: false, error: "Invalid page payload." }, 400);
  const title = clean(body.title, 180);
  const excerpt = clean(body.excerpt, 500);
  const bodyMarkdown = clean(body.bodyMarkdown, 50000);
  const slug = slugify(body.slug || title);
  const status = STATES.includes(body.status) ? body.status : "draft";
  if (title.length < 3 || !validSlug(slug) || !bodyMarkdown) return json({ ok: false, error: "Enter a valid title, slug and page content." }, 422);
  const nav = body.showInNavigation === true ? 1 : 0;
  const now = new Date().toISOString();
  if (id) {
    const existing = await env.DB.prepare("SELECT id FROM pages WHERE id=?").bind(id).first();
    if (!existing) return json({ ok: false, error: "Page not found." }, 404);
    await env.DB.prepare(
      "UPDATE pages SET title=?,slug=?,excerpt=?,body_markdown=?,status=?,show_in_navigation=?,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END,updated_at=? WHERE id=?"
    ).bind(title,slug,excerpt,bodyMarkdown,status,nav,status,now,now,id).run();
    await audit(env,user,"update","page",id,"Updated page: "+title);
    return json({ ok: true, id });
  }
  const newId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO pages (id,title,slug,excerpt,body_markdown,status,show_in_navigation,author_id,published_at) VALUES (?,?,?,?,?,?,?,?,?)"
  ).bind(newId,title,slug,excerpt,bodyMarkdown,status,nav,user.id,status==="published"?now:null).run();
  await audit(env,user,"create","page",newId,"Created page: "+title);
  return json({ ok: true, id: newId }, 201);
}
async function publicArticles(env) {
  const result = await env.DB.prepare(
    "SELECT a.title,a.slug,a.excerpt AS summary,a.body_markdown AS body,a.published_at AS iso,c.name AS category FROM articles a LEFT JOIN categories c ON c.id=a.category_id WHERE a.status='published' AND (a.scheduled_at IS NULL OR a.scheduled_at<=?) ORDER BY a.published_at DESC LIMIT 100"
  ).bind(new Date().toISOString()).all();
  const items = (result.results || []).map(a => ({
    title: a.title, slug: a.slug, summary: a.summary || "", body: a.body || "",
    iso: a.iso || "", date: a.iso ? new Date(a.iso).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) : "",
    type: a.category === "Press Releases" ? "Press Release" : "News Report"
  }));
  return json({ ok: true, items }, 200, { "Cache-Control": "public, max-age=60, s-maxage=60" });
}
async function api(request, env) {
  const path = new URL(request.url).pathname;
  if (path === "/api/auth") return authStart(request, env);
  if (path === "/api/callback") return authCallback(request, env);
  if (path === "/api/public/articles" && request.method === "GET") return publicArticles(env);
  if (path === "/api/session" && request.method === "GET") return sessionRoute(request, env);
  if (!env.DB) return json({ ok: false, error: "CMS database binding is unavailable." }, 503);
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const user = auth.user;
  if (path === "/api/auth/logout" && request.method === "POST") return logoutRoute(request, env);
  if (path === "/api/dashboard" && request.method === "GET") return dashboardRoute(request, env, user);
  if (path === "/api/categories" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT id,name,slug FROM categories ORDER BY name").all();
    return json({ ok: true, items: result.results || [] });
  }
  if (path === "/api/articles" && request.method === "GET") {
    if (!can(user,"read","articles")) return json({ok:false,error:"Forbidden."},403);
    return listArticles(request,env);
  }
  if (path === "/api/articles" && request.method === "POST") {
    if (!can(user,"create","articles")) return json({ok:false,error:"Forbidden."},403);
    const fail=await requireMutation(request,env,user); if(fail)return fail;
    return saveArticle(request,env,user);
  }
  const articleMatch=path.match(/^\/api\/articles\/([0-9a-f-]+)$/i);
  if(articleMatch && request.method==="GET"){
    const row=await env.DB.prepare("SELECT * FROM articles WHERE id=?").bind(articleMatch[1]).first();
    if(!row)return json({ok:false,error:"Not found."},404);
    if(user.role==="author"&&row.author_id!==user.id)return json({ok:false,error:"Forbidden."},403);
    return json({ok:true,item:row});
  }
  if(articleMatch && request.method==="PUT"){
    if(!["super_admin","administrator","editor","author"].includes(user.role))return json({ok:false,error:"Forbidden."},403);
    const fail=await requireMutation(request,env,user);if(fail)return fail;
    return saveArticle(request,env,user,articleMatch[1]);
  }
  if(path==="/api/pages"&&request.method==="GET"){
    if(!can(user,"read","pages"))return json({ok:false,error:"Forbidden."},403);
    return listPages(request,env);
  }
  if(path==="/api/pages"&&request.method==="POST"){
    if(!can(user,"create","pages"))return json({ok:false,error:"Forbidden."},403);
    const fail=await requireMutation(request,env,user);if(fail)return fail;
    return savePage(request,env,user);
  }
  const pageMatch=path.match(/^\/api\/pages\/([0-9a-f-]+)$/i);
  if(pageMatch&&request.method==="GET"){
    const row=await env.DB.prepare("SELECT * FROM pages WHERE id=?").bind(pageMatch[1]).first();
    return row?json({ok:true,item:row}):json({ok:false,error:"Not found."},404);
  }
  if(pageMatch&&request.method==="PUT"){
    if(!can(user,"update","pages"))return json({ok:false,error:"Forbidden."},403);
    const fail=await requireMutation(request,env,user);if(fail)return fail;
    return savePage(request,env,user,pageMatch[1]);
  }
  if(path==="/api/users"&&request.method==="GET"){
    if(user.role!=="super_admin")return json({ok:false,error:"Forbidden."},403);
    const result=await env.DB.prepare("SELECT id,email,display_name,role,status,last_login_at,created_at FROM admin_users ORDER BY created_at DESC").all();
    return json({ok:true,items:result.results||[]});
  }
  return json({ok:false,error:"Not found."},404);
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[ch]);
}
async function publicArticlePage(env, slug) {
  if (!env.DB) return text("Not found",404);
  const row = await env.DB.prepare(
    "SELECT a.title,a.slug,a.excerpt,a.body_markdown,a.published_at,c.name AS category FROM articles a LEFT JOIN categories c ON c.id=a.category_id WHERE a.slug=? AND a.status='published' AND (a.scheduled_at IS NULL OR a.scheduled_at<=?) LIMIT 1"
  ).bind(slug,new Date().toISOString()).first();
  if (!row) return text("Article not found",404);
  const paragraphs = String(row.body_markdown || "").split(/\n\s*\n/).map(part => part.trim()).filter(Boolean)
    .map(part => "<p>" + escapeHtml(part).replace(/\n/g,"<br>") + "</p>").join("\n");
  const title = escapeHtml(row.title);
  const description = escapeHtml(row.excerpt || row.title);
  const category = escapeHtml(row.category || "News and Updates");
  const dateLabel = row.published_at ? new Date(row.published_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) : "";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><title>${title} | BABS Ogunlade</title><meta name="description" content="${description}"><link rel="canonical" href="https://babatundeogunlade.com/news/${encodeURIComponent(row.slug)}.html"><meta property="og:type" content="article"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="https://babatundeogunlade.com/news/${encodeURIComponent(row.slug)}.html"><link rel="stylesheet" href="/assets/styles.css"><style>.cms-article{max-width:850px;margin:0 auto;padding:52px 22px 80px}.cms-article h1{font-size:clamp(2rem,5vw,3.4rem);line-height:1.12;color:#0A2540}.cms-article .meta{color:#64748b;font-size:13px;margin:18px 0 30px}.cms-article .body{font-size:17px;line-height:1.85;color:#243244}.cms-article .body p{margin:0 0 1.25em}.cms-article .back{color:#008751;font-weight:700}</style></head><body><header class="site-header"><div class="wrap"><a class="brand" href="/"><span class="brand-mark">BABS</span><span class="brand-text"><strong>Hon. Babatunde Sunday Ogunlade</strong><span>Public Information</span></span></a><nav class="nav"><a href="/">Home</a><a href="/about.html">About</a><a href="/priorities.html">Priorities</a><a href="/press.html">Press Centre</a></nav></div></header><main class="cms-article"><a class="back" href="/press.html#news">← Back to Press Centre</a><p class="eyebrow">${category}</p><h1>${title}</h1><div class="meta">${escapeHtml(dateLabel)} · Official BABS Ogunlade update</div><div class="body">${paragraphs}</div></main><footer class="site-footer"><div class="wrap"><p>© ${new Date().getFullYear()} Babatunde Sunday Ogunlade. All rights reserved.</p></div></footer></body></html>`;
  return new Response(html,{status:200,headers:headers({"Content-Type":"text/html; charset=utf-8","Cache-Control":"public, max-age=60","Content-Security-Policy":PUBLIC_CSP,"X-Frame-Options":"DENY"})});
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
async function serveFile(path, isAdmin, env) {
  const branch = env.CONTENT_BRANCH || CONTENT_BRANCH;
  const rawBase = "https://raw.githubusercontent.com/" + REPOSITORY + "/" + branch.split("/").map(encodeURIComponent).join("/") + "/";
  for (const candidate of pathsFor(path)) {
    const target = rawBase + candidate.split("/").map(encodeURIComponent).join("/");
    const upstream = await fetch(target, { headers: { Accept: "*/*", "User-Agent": "BABS-Cloudflare-Worker" } });
    if (upstream.status === 404) continue;
    if (!upstream.ok) return text("Website source temporarily unavailable.",502,{ "Cache-Control":"no-store" });
    const extra = {
      "Content-Type": mime(candidate),
      "Cache-Control": isAdmin ? "no-store" : (candidate.endsWith(".html") ? "public, max-age=0, must-revalidate" : "public, max-age=300")
    };
    if (isAdmin) {
      extra["X-Robots-Tag"]="noindex, nofollow";
      extra["Content-Security-Policy"]=ADMIN_CSP;
      extra["Cross-Origin-Opener-Policy"]="same-origin";
    } else {
      extra["X-Frame-Options"]="DENY";
      extra["Content-Security-Policy"]=PUBLIC_CSP;
    }
    return new Response(upstream.body,{status:200,headers:headers(extra)});
  }
  return text("Not found",404,isAdmin?{"Cache-Control":"no-store"}:{});
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname.startsWith("/api/")) return api(request,env);
    const articlePath=url.pathname.match(/^\/news\/([a-z0-9-]+)\.html$/);
    if(articlePath) return publicArticlePage(env,articlePath[1]);
    const path=resolvePath(url.pathname);
    if(path===null)return text("Bad path",400);
    return serveFile(path,url.pathname.startsWith("/admin"),env);
  }
};
