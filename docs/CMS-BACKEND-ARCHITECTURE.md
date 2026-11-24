# CMS Backend Architecture — Initial Foundation

## Selected runtime

The current public site and domain already run through Cloudflare Workers. The initial CMS database therefore uses Cloudflare D1 (SQLite at the edge) rather than introducing a second hosting provider. The Worker remains the intended API boundary; the public site continues to be static until the content API and rendering adapters are implemented.

## Provisioned database

- Database: `babs-cms-production`
- Database ID: `ce86e7a4-c7d7-4630-8924-62e7b64aae73`
- Primary region hint: `WEUR`
- Wrangler binding name: `DB`
- Migration: `migrations/0001_initial_schema.sql`

The initial migration was applied through the Cloudflare D1 API and the resulting schema was queried. The database currently contains the CMS tables and indexes, but no user records, content records, enquiry records or seeded dashboard statistics.

## Data model

The first migration creates:
- Identity and access: `admin_users`, `admin_sessions`, `admin_invites`.
- Editorial: `pages`, `articles`, `categories`, `tags`, `article_tags`.
- Media and galleries: `media`, `galleries`, `gallery_items`.
- Profile and policy: `profile_sections`, `policy_priorities`.
- Press: `press_releases`.
- Enquiries: `enquiries`.
- Site configuration: `navigation_menus`, `navigation_items`, `site_settings`.
- Audit: `activity_logs`.

Content states are constrained in the database. Public queries must explicitly filter to `published`; the database schema alone does not expose a public API.

## Security design requirements before API release

1. Authenticate staff using a server-validated identity provider.
2. Store only hashes of random session and invitation tokens.
3. Enforce role and permission checks inside every Worker API handler.
4. Set session cookies `HttpOnly; Secure; SameSite=Lax`, use CSRF protection for mutations and rotate/revoke sessions.
5. Do not return GitHub OAuth access tokens to the browser.
6. Restrict uploads by MIME sniffing, file signature, size and extension; use generated object keys.
7. Rate-limit public enquiry submissions and apply spam controls.
8. Keep enquiry message bodies and credentials out of logs.
9. Add scheduled publication processing and backup/restore runbooks.
10. Bind D1 to the deployed Worker only after the API implementation and tests are ready.

## Important deployment boundary

The D1 binding is present in the feature branch's `wrangler.toml`, not in the currently deployed Worker configuration. The existing production Worker has not been changed. Do not deploy this branch until the API implementation, identity flow, authorization tests and public content adapters are complete.
