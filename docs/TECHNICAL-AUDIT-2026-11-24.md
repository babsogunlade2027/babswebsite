# BABS Ogunlade Website — Technical Audit

**Audit date:** 24 November 2026  
**Repository:** https://github.com/babsogunlade2027/babswebsite  
**Production domain:** https://babatundeogunlade.com  
**Requested canonical www domain:** https://www.babatundeogunlade.com  
**Branch audited:** main  
**Audited commit:** 51e3cc428b6688b363231a834efb28ba3e8c08cf

## Executive summary

The project is a static HTML/CSS/JavaScript website served by a Cloudflare Worker. GitHub is the source repository and the existing Decap CMS is intended to publish content through GitHub OAuth. The Cloudflare account contains two Worker scripts named `babs07` and `babswebsite-preview`; both apex and www hostnames are currently attached to `babswebsite-preview`. There are no Cloudflare Pages projects and no D1 databases in the connected account at audit time.

This is not yet the requested full administrative CMS. The current CMS config only defines news and gallery collections, and those configured `_posts/news` and `_posts/gallery` folders do not exist in the inspected main-branch tree. The actual public newsroom reads JSON files under `news/`; gallery content is hard-coded in browser JavaScript. The contact form is split across two different implementations: the interior contact page opens a mailto draft, while the Team Babs signup Cloudflare Pages Function sends email through Resend. Neither inspected path stores enquiry records in a database.

## 1. Architecture and hosting

- Public site: static HTML pages, CSS and browser JavaScript.
- Source control: public GitHub repository, default branch `main`.
- Production hosting: Cloudflare Worker script `babswebsite-preview`.
- Custom domains: apex and www are both enabled as Worker domains on that script.
- Cloudflare zone: `babatundeogunlade.com`, active.
- Cloudflare Pages projects: none returned by the connected account API.
- Cloudflare D1 databases: none returned by the connected account API.
- Legacy Worker: `babs07`, with older deployments; it is not the Worker currently attached to the two custom domains.
- Worker deployment history: `babswebsite-preview` has multiple deployments, most recent inspected deployment on 21 November 2026.

## 2. Confirmed findings

| Priority | Finding | Evidence | Recommended action |
|---|---|---|---|
| Critical | Existing CMS content paths do not match the repository | `admin/config.yml` targets `_posts/news` and `_posts/gallery`; neither folder exists in main tree | Reconcile content model and public renderer before enabling editorial changes |
| Critical | OAuth identity is not an application role system | Worker exchanges GitHub OAuth code and returns access token to CMS popup; no role lookup or app session is present | Replace with server-validated identity and role-based authorization before exposing wider staff access |
| High | Production Worker differs from repository Worker source | Cloudflare deployed Worker source was fetched; it lacks the CSP declarations and some hardening present in main-branch `worker.js` | Reconcile deployed artifact with reviewed source and deploy through a controlled release |
| High | Public news content is stored as static generated files | `news/index.json`, `news/articles.json` and individual HTML article files are present; newsroom JavaScript reads JSON | Build a content publishing pipeline that updates public indexes and article routes atomically |
| High | Contact page does not persist enquiries | `contact.html` uses `data-mailto` and opens a mail client; `assets/site.js` constructs a mailto URL | Replace with a protected server endpoint and enquiry database |
| High | Existing serverless signup handler is email-only | `functions/api/contact.js` validates input and sends through Resend, but contains no database write | Extend only after selecting the actual deployment/runtime; persist and audit submissions |
| Medium | Gallery page depends on hard-coded JavaScript | `assets/js/content.js` contains a static photo array; `gallery.html` initially shows an empty-state message | Move gallery metadata to managed content and render published records |
| Medium | Public design system has drift | Homepage uses `assets/css/style.css`; interior pages use `assets/styles.css`; separate palettes and nav patterns | Consolidate shared tokens and components in a controlled visual migration |
| Medium | Admin page is a minimal shell | `admin/index.html` is a short Decap CMS entry page; no custom dashboard or admin modules | Keep current editor as a transition only; build real admin workflows on a secured backend |
| Low | Documentation has outdated or inconsistent brand copy | README and editorial guide contain different tagline/brand palette statements | Reconcile documentation with the approved current campaign brief after confirmation |

## 3. Security observations

- Worker OAuth callback validates a random state cookie and stores the OAuth client secret in Worker bindings, not in the source file.
- The OAuth authorization request uses `public_repo` scope. This is broader than a narrowly scoped application session and returns the access token to the browser-side CMS.
- No application-level staff allowlist, role table, permission map or audit event persistence was found in inspected source.
- `_headers` contains a site-wide CSP, but the production Worker source retrieved from Cloudflare does not currently emit the same CSP policy. Confirm the effective response headers at the edge before relying on the repository header file.
- The contact signup function performs input sanitisation, size checks and same-origin validation, but no persistent storage or explicit rate limiter is present in that function.
- No D1 database or Pages project was found in the connected Cloudflare account.

## 4. Public content and feature coverage

| Area | Current implementation | CMS readiness |
|---|---|---|
| Homepage | Static HTML | Not dynamically managed |
| Biography | Static HTML | Not dynamically managed |
| Priorities | Static HTML | Not dynamically managed |
| Manifesto | Static HTML | Not dynamically managed |
| Newsroom | JSON indexes + HTML articles | CMS config path mismatch |
| Press Centre | Static shell + JSON-driven newsroom | Partial |
| Gallery | Static photo array in JavaScript | Not managed through current CMS |
| Contact | mailto form on contact page | No enquiry inbox |
| Navigation | Repeated HTML navigation, one JS insertion | No menu manager |
| SEO | Per-page meta tags and some JSON-LD | Manually maintained |
| User management | GitHub repository permissions only | No six-role CMS RBAC |
| Analytics | No verified analytics integration in inspected source | Not available as CMS statistics |

## 5. Implementation strategy

### Phase A — safe foundation
- Preserve main branch and all current public content.
- Work on a dedicated feature branch.
- Establish durable design and workflow contracts.
- Reconcile Decap configuration with real content locations.
- Add automated checks for public JSON feeds and content schema.

### Phase B — backend and identity
- Select Cloudflare D1 + Worker API or Supabase after confirming the preferred data ownership and operating model.
- Implement identity verification, staff invitation, role assignment, session expiry, CSRF protection and server-side permission checks.
- Keep secrets in Worker bindings; never return provider tokens to the browser.
- Define retention and access policy for enquiries and user audit records.

### Phase C — editorial and public integration
- Implement content types for pages, articles, profile, policy priorities, press releases, galleries, navigation and settings.
- Provide a single public published-content API or generated content feed.
- Migrate existing content without altering verified facts or URLs.
- Ensure draft/scheduled/archived content is never returned publicly.

### Phase D — media and enquiries
- Use object storage with server-side file validation and size limits.
- Persist contact enquiries and provide role-restricted inbox, status, archive and export.
- Add spam controls and retention controls.

### Phase E — release
- Preview on a non-production URL.
- Test role denial, publishing, unpublishing, public rendering, media upload, enquiries, mobile, accessibility and failure recovery.
- Reconcile production Worker source before deployment.
- Deploy with rollback to the last known-good Worker version.

## 6. Production blockers and unresolved risks

1. The current Decap collection paths are not backed by folders in the repository.
2. Production Worker code and repository Worker code are not identical.
3. The six requested CMS roles do not exist.
4. No relational database or persistent enquiry store currently exists in the connected Cloudflare account.
5. The live website's rendered pages, response headers, real form submission and OAuth flow could not be independently exercised from this runtime; Cloudflare control-plane state and repository source were inspected instead.
6. A production-grade CMS cannot be honestly declared complete until backend identity, persistence, public rendering and browser tests are implemented and exercised.

## 7. Evidence sources

- GitHub main commit: `51e3cc428b6688b363231a834efb28ba3e8c08cf`.
- Repository files: `README.md`, `admin/config.yml`, `admin/index.html`, `worker.js`, `wrangler.toml`, `_headers`, `_redirects`, `functions/api/contact.js`, `assets/site.js`, `assets/js/content.js`, `news/index.json`, `news/articles.json`, `contact.html`, `gallery.html`, `press.html`, `about.html`, `priorities.html`, `manifesto.html`.
- Cloudflare account inventory: active zone, Worker scripts, Worker custom domains, Worker deployments, Pages projects and D1 database list.

**Audit status:** Source and Cloudflare control-plane inspection completed for the above evidence. Live browser and end-to-end verification remain outstanding.
