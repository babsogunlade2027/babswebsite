# CMS QA and Verification Log

**Date:** 24 November 2026  
**Branch:** `cms/phase-one-audit-and-foundation`

## Checks completed

| Check | Result | Evidence |
|---|---|---|
| Worker JavaScript syntax | Pass | Parsed with JavaScript V8 syntax check |
| Admin application JavaScript syntax | Pass | Parsed with JavaScript V8 syntax check |
| Public site JavaScript syntax | Pass | Parsed with JavaScript V8 syntax check |
| D1 migration ledger | Pass | Four expected migration filenames present |
| D1 table inventory | Pass | Application tables present, including auth rate limits and CMS entities |
| Editorial category seed | Pass | Nine categories present |
| Foreign-key integrity | Pass | `PRAGMA foreign_key_check` returned zero rows |
| Article public query plan | Pass | SQLite EXPLAIN accepted query and schema |
| Page public query plan | Pass | SQLite EXPLAIN accepted query and schema |
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
