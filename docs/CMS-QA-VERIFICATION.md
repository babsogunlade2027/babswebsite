# CMS QA and Verification Log

**Date:** 24 November 2026  
**Branch:** `cms/phase-one-audit-and-foundation`

## Checks completed

| Check | Result | Evidence |
|---|---|---|
| Worker JavaScript syntax | Pass | Parsed with JavaScript V8 syntax check; corrected scheduled-publishing result destructuring for policy updates |
| Admin application JavaScript syntax | Pass | Parsed with JavaScript V8 syntax check |
| Public site JavaScript syntax | Pass | Parsed with JavaScript V8 syntax check |
| D1 migration ledger | Pass | Four expected migration filenames present |
| D1 table inventory | Pass | Application tables present, including auth rate limits and CMS entities |
| Editorial category seed | Pass | Nine categories present |
| Foreign-key integrity | Pass | `PRAGMA foreign_key_check` returned zero rows |
| Article public query plan | Pass | SQLite EXPLAIN accepted query and schema |
| Page public query plan | Pass | SQLite EXPLAIN accepted query and schema |
| Homepage CMS feed integration | Pass (code review) | Homepage prefers D1 public article API and falls back to existing static news index |
| Enquiry inbox query plan | Pass | SQLite EXPLAIN accepted query and schema |
| Production domain safety | Pass | No Worker deployment, DNS edit or custom-domain change made |
| R2 provisioning | Blocked | Cloudflare API returned error 10042; R2 must be enabled in dashboard |

## Not yet tested

- Real GitHub OAuth sign-in and callback.
- First Super Administrator bootstrap.
- Invitation acceptance using a verified GitHub email.
- Session expiry, logout and CSRF rejection.
- Role-denial tests for every endpoint.
- Article/page create and update through a browser.
- Scheduled Cron execution.
- Public Press Centre update from a newly published article.
- Dynamic article route rendering and legacy static article fallback.
- Public contact form submission and enquiry status change.
- Mobile, tablet and desktop browser layout.
- Accessibility with keyboard and screen reader.
- File uploads, image transformations and media usage tracking.
- Backup creation and restore.

## Release decision

**Not approved for production.** The source and D1 schema foundation are implemented, but runtime and browser end-to-end checks remain. R2 is unavailable until enabled. The existing Worker custom domains are live, so deployment must use a separate staging Worker or a controlled cutover window.

## Additional implementation pass — 24 November 2026

Added feature-branch workflows:
- Profile section CRUD with JSON validation and public About-page rendering.
- Policy priority CRUD with safe text rendering, ordering, draft/review/scheduled/published/archived states and scheduled publication.
- Primary navigation CRUD with site-relative/HTTPS URL validation and public rendering.
- Press-release list and media-contact metadata editor.
- Super Administrator role/status controls; suspension/disable revokes active sessions and the last active Super Administrator cannot be demoted or disabled.
- Article/page canonical URL validation and optional media-library image references.

Still not verified:
- Runtime execution of the new Worker routes against D1.
- Browser interactions and responsive layout of the new admin views.
- GitHub OAuth, role-denial and session-revocation flows.
- Scheduled policy publication under a real Cron invocation.
- Public page rendering with populated profile/policy/navigation data.
- Media upload/gallery/attachment workflows (R2 remains unavailable).

Additional non-mutating checks performed during this pass:
- JavaScript syntax parsing passed for `worker.js`, `admin/app.js`, `assets/site.js` and `assets/navigation.js`.
- D1 `PRAGMA table_info` inspection confirmed profile, policy, press, navigation, article and page columns used by the new workflows.
- D1 read-only `EXPLAIN` checks accepted the new profile, policy, navigation, press, article/page SEO and policy update SQL.
- No test content, administrator accounts, enquiries or navigation records were created during these checks.


## Additional read-only checks — 25 November 2026

- Production D1 export completed successfully before deployment preparation.
- A Time Travel bookmark was recorded for rollback.
- Read-only `EXPLAIN QUERY PLAN` checks passed for the public newsroom query, sitemap article query and scheduled policy update statement.
- The scheduled handler was corrected to retain all three update results (articles, pages and policy priorities), preventing a runtime reference error when the Cron fires.
- The homepage now prefers the D1 public article API and falls back to the existing static news feed.
- Production Worker deployment and interactive OAuth/browser testing remain release actions; no CMS data was inserted during these checks.
