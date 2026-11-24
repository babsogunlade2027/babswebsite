# CMS Implementation Status

**Updated:** 24 November 2026 (continued implementation)  
**Branch:** `cms/phase-one-audit-and-foundation`  
**Pull request:** #4 (draft)  
**Production deployment:** Not performed

## Architecture retained

The existing public site remains a static HTML/CSS/JavaScript website served by the existing Cloudflare Worker. The CMS API is implemented in that Worker and persists records in Cloudflare D1. No Next.js, React or separate hosting migration is introduced.

## Implemented in this branch

### Authentication and authorization foundation
- GitHub OAuth callback is processed server-side.
- OAuth access tokens are not returned to browser JavaScript.
- GitHub account ID allowlist is configured in the branch's non-secret Wrangler variables for the initial bootstrap account.
- First allowlisted account can bootstrap as Super Administrator only while no active Super Administrator exists.
- Subsequent accounts are provisioned through email invitations; invitation acceptance requires a verified GitHub email matching the invited email.
- Session tokens are random and stored only as SHA-256 hashes.
- Session cookie is HttpOnly, Secure, SameSite=Lax, eight-hour expiry.
- Mutations require same-origin validation and a session-bound CSRF token.
- OAuth start and public contact submissions use hashed-IP D1 rate-limit counters.
- Roles supported by the policy layer: Super Administrator, Administrator, Editor, Author, Media Manager and Viewer.
- Enquiry access is restricted to Super Administrators and Administrators.
- Administrator invitation endpoint is restricted to Super Administrators.
- Super Administrators can update administrator roles and suspend/disable accounts; changes to inactive accounts revoke existing sessions.

### Editorial workflows
- D1-backed article list, create, read and update endpoints.
- D1-backed page list, create, read and update endpoints.
- Article categories seeded with the nine editorial categories in the project brief.
- Draft, in-review, scheduled, published and archived states.
- Server-side validation of title, slug, body and category.
- Author role is restricted to own articles and cannot publish directly.
- Scheduled articles and pages require a future publication time.
- Worker Cron handler promotes scheduled content when due.
- Only published records are returned through public content queries.
- Published CMS articles are served on the existing `/news/{slug}.html` route. Existing static news files remain available as fallback.
- CMS-created pages are namespaced under `/pages/{slug}.html` to avoid colliding with existing static page URLs.

### Public enquiry workflow
- Existing mailto-only contact form is replaced on this branch with a same-origin JSON submission to `POST /api/contact`.
- Enquiries are persisted in D1.
- Validation, payload-size limits, honeypot, same-origin checks and hashed-IP rate limits are implemented.
- Protected enquiry list and status-update endpoints are implemented.
- Dedicated press-release metadata API and admin view support media-contact details; file attachments remain blocked by R2.
- Admin inbox displays sender, topic, message excerpt and receipt date; administrators can update status.\n- Public pages can now submit enquiries without opening the visitor's mail client.

### Administrative interface
- Responsive vanilla HTML/CSS/JavaScript dashboard at `/admin/`.
- Dashboard counts are read from D1, not hard-coded.
- Editorial list views, search/filter, article/page editor, category selection, scheduling controls, status selection and administrator list.
- Enquiry inbox with status updates.
- Role-aware navigation and action visibility.
- Admin styles follow the approved green, navy, gold and neutral palette.
- Profile section editor stores structured JSON content; published sections are rendered on the public About page.
- Policy priority editor supports draft, review, scheduled, published and archived states; scheduled policies publish through the Worker Cron and published priorities render on the public Priorities page.
- Primary navigation manager validates site-relative/HTTPS links and exposes the saved menu to public pages, including the homepage.
- Article and page editors now validate and store canonical URLs and optional media-library IDs for social images; canonical URLs are applied to generated public content.
- No third-party admin JavaScript bundle is loaded.

## D1 database status

Database: `babs-cms-production`  
Database ID: `ce86e7a4-c7d7-4630-8924-62e7b64aae73`

Four migration names are recorded in `d1_migrations`. The schema includes identity, sessions, invitations, editorial content, categories/tags, media metadata, galleries, profile, policy, press, enquiries, navigation, settings, audit logs and rate limits. Nine categories are seeded.

Verified against the live D1 control plane:
- 20 application tables (plus SQLite's internal sequence table).
- `PRAGMA foreign_key_check` returned no issues.
- 9 editorial categories exist.
- No administrator, article, page or enquiry records were seeded.
- The database is empty of user content by design.

## Not yet implemented or blocked

| Capability | Status | Dependency / next step |
|---|---|---|
| Media upload and optimisation | Blocked | R2 is not enabled on the Cloudflare account. Bucket creation returned Cloudflare error 10042; enable R2 in the dashboard, then provision bucket and bind it to Worker. |
| Gallery management | Pending | Requires media storage and gallery API/UI. |
| Biography/profile editor | Implemented | Structured JSON profile sections, role-protected editor and public About-page rendering. Existing static biography remains the fallback until CMS sections are published. |
| Policy priorities editor | Implemented | CRUD editor, sort order, status workflow, scheduled publication and public Priorities-page rendering. Existing static priorities remain the fallback until CMS items are published. |
| Press release module | Partial | Dedicated list and media-contact editor are implemented. Attachments still depend on R2 media storage. |
| Navigation manager | Implemented | Primary menu CRUD, URL validation and public navigation rendering are implemented. The homepage has its own navigation loader. |
| SEO manager | Partial | Article/page SEO title, meta description and canonical URL controls are implemented. Sitemap is dynamic; OG image IDs are accepted only for existing media records and cannot be populated until media storage is available. |
| User role editing/deactivation | Partial | Super Administrators can change roles and suspend/disable accounts with session revocation. Password reset is not applicable to GitHub OAuth; richer login history remains outstanding. |
| Analytics | Not connected | Dashboard intentionally omits unverified performance metrics. |
| Rich WYSIWYG editor | Pending | Current editor accepts plain text/Markdown content; safe rich-text toolbar and sanitisation are not yet implemented. |
| Media usage tracking | Pending | Depends on media API and reference tracking. |
| Backup automation | Pending | Configure and test D1 backup schedule/restore procedure before production. |

## Required deployment configuration

The existing Worker custom domains are attached to `babswebsite-preview`. Deploying this branch to that script would change the live website. Do not deploy until a separate staging Worker or approved maintenance window and rollback plan are established.

Existing Worker settings were inspected:
- `GITHUB_OAUTH_CLIENT_ID` is a plain-text binding.
- `GITHUB_OAUTH_CLIENT_SECRET` is a secret binding.
- Wrangler now targets the isolated `babswebsite-cms-staging` Worker and a staging D1 placeholder; it does not bind the production D1 database.
- `CONTENT_BRANCH` points at this feature branch.
- `ADMIN_GITHUB_IDS` identifies the initial bootstrap GitHub account.
- A minute Cron trigger is configured for scheduled publication.

Before deployment, verify that the OAuth app callback URL includes the staging or production host being used. Preserve the existing OAuth bindings when updating the Worker.

## Verification performed

- JavaScript syntax parsing succeeded for `worker.js`, `admin/app.js` and `assets/site.js`.
- D1 table inventory, migration ledger, category seed count and foreign-key check were queried directly.
- No live browser, OAuth round-trip, file upload, visual responsive or full end-to-end publication test has yet been run. New management endpoints and public rendering were added to the feature branch but still require staging runtime tests.
- No production Worker, DNS, custom-domain route or public production content was changed.

## Release gates

Do not mark the CMS production-ready until:
1. A separate staging Worker has the D1 binding and existing OAuth secrets configured.
2. OAuth bootstrap and invitation flows are tested with real authorised accounts.
3. Role-denial tests prove that Viewer/Editor/Author cannot read enquiries.
4. Article and page draft/publish/schedule/unpublish flows pass against staging.
5. Public Press Centre and dynamic article routes render correctly while legacy static articles still work.
6. Contact submission and enquiry status workflow pass end-to-end.
7. R2 is enabled and media upload validation is tested.
8. Browser tests cover Android-sized mobile, tablet and desktop breakpoints.
9. A D1 backup and rollback plan are confirmed.
10. The owner approves production cutover.
