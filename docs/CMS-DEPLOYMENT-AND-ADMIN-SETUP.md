# CMS Deployment and Administrator Setup

## Important: staging before production

The existing Cloudflare Worker `babswebsite-preview` currently owns the apex and www custom domains. It is therefore serving the live website despite its name. Do not deploy a feature branch to this Worker until production cutover is approved.

Create a separate staging Worker (for example, `babswebsite-cms-staging`) or use a controlled preview environment. Configure a staging hostname and use that hostname as the GitHub OAuth callback origin.

## Existing OAuth bindings

The current Worker settings were inspected and show:
- `GITHUB_OAUTH_CLIENT_ID` (plain text)
- `GITHUB_OAUTH_CLIENT_SECRET` (secret)

Preserve these bindings when deploying the new Worker. Do not copy secrets into Wrangler variables or GitHub.

## Wrangler configuration in this branch

The feature branch's `wrangler.toml` is deliberately staging-safe and contains:
- D1 binding `DB` is a staging placeholder (`babs-cms-staging`); replace the database ID only after creating and migrating a separate staging database.
- The production D1 database `babs-cms-production` remains isolated and is not bound by this staging config.
- `CONTENT_BRANCH` set to `cms/phase-one-audit-and-foundation`.
- `ADMIN_GITHUB_IDS` set to the repository owner's verified GitHub numeric account ID for initial Super Administrator bootstrap.
- A one-minute Cron trigger for scheduled publishing.

The account allowlist is an identity ID, not a password or secret. Confirm that the intended owner GitHub account is the one represented before production deployment.

## Initial Super Administrator

The first successful OAuth sign-in from an allowlisted GitHub account creates the initial Super Administrator only if no active Super Administrator exists. The OAuth callback must be registered as:

`https://<staging-host>/api/callback`

After that first account is created, additional administrators must be invited by email from the CMS. Invitees must sign in with GitHub and have a verified email address matching the invitation.

## Migrations

The D1 schema was applied through the Cloudflare D1 API and the migration ledger was baselined. Four migration filenames are recorded in `d1_migrations`. Review the migration ledger before running Wrangler migrations against the existing database; do not manually replay SQL against an already migrated database.

For a fresh staging database, create a new D1 database and run:

```sh
npx wrangler d1 migrations apply babs-cms-staging --remote
```

Update the staging `database_name` and `database_id` in a staging-specific Wrangler configuration first.

## R2 media storage

R2 bucket creation was attempted and Cloudflare returned error 10042: R2 must first be enabled through the Cloudflare Dashboard. Once enabled:
1. Create a private bucket named `babs-cms-media`.
2. Bind it to the Worker as `MEDIA`.
3. Implement upload validation and public delivery via a controlled Worker route or custom domain.
4. Do not expose bucket credentials or make the bucket public by default.

## Deploy commands

After creating a separate staging D1 database, applying the migrations, configuring the staging OAuth callback and adding the OAuth secret binding, deploy only the staging Worker.

After staging bindings and secrets are confirmed:

```sh
npx wrangler deploy --config wrangler.toml
```

The script name is already `babswebsite-cms-staging`. Replace the staging D1 placeholder before running. Never point this staging configuration at the production custom domains or production D1 database.

## Production cutover

Before deploying to the live Worker:
- Confirm staging sign-in, RBAC, publishing, contact enquiries and rollback.
- Create a D1 backup.
- Confirm the public site and admin URL work on the canonical hostname.
- Confirm GitHub OAuth callback URL.
- Preserve existing Worker bindings and custom-domain settings.
- Deploy and smoke-test the Worker.
- Retain the previous Worker version for rollback.

## Security operations

- Keep `GITHUB_OAUTH_CLIENT_SECRET` as a Cloudflare secret binding.
- Do not commit real credentials or session tokens.
- Review and remove access for departed staff.
- Use invitations for new users; do not share administrator sessions.
- Restrict enquiry data to Super Administrators and Administrators.
- Schedule periodic D1 backups and test restore procedures.


## Production configuration added

A separate `wrangler.production.toml` now records the live Worker name, production D1 binding, canonical content branch, initial GitHub account allowlist and one-minute Cron. The existing `wrangler.toml` remains staging-only. OAuth secrets must be inherited from the current Worker or set as Cloudflare secret bindings; they are not stored in either file.

The production D1 database was exported successfully before cutover preparation. A Time Travel recovery bookmark was recorded:

`00000008-00000000-0000512e-08fc139be4b5908af35f4fabcbbe6f50`

The export completed successfully on 25 November 2026. The database currently contains the schema and nine seeded categories, with no administrator or editorial records.

After deployment, the first login must use the allowlisted GitHub account (numeric account ID `351999827`). The first successful OAuth sign-in bootstraps the initial Super Administrator. Additional team members must be invited from the dashboard.


## Live production state

- Admin dashboard: https://babatundeogunlade.com/admin/
- Worker: `babswebsite-preview`, version 21, 100% traffic.
- D1 binding: `babs-cms-production`.
- Cron: every minute for scheduled publishing.
- GitHub source branch: `main`.
- Initial sign-in: use the allowlisted GitHub account `babsogunlade2027` (ID `351999827`). The first successful login creates the Super Administrator.
- Media upload and gallery features remain disabled until R2 is enabled.

## Connect automatic GitHub deployments

Cloudflare Workers Builds could not be connected through the API because the Cloudflare account currently reports that its Git account is disconnected. In the Cloudflare dashboard, open **Workers & Pages → babswebsite-preview → Settings → Builds → Connect**, authorize GitHub, and select `babsogunlade2027/babswebsite` on branch `main`. Use root directory `/`, no separate build step, and deploy command `npx wrangler deploy --config wrangler.production.toml`. The Worker name in the production Wrangler config already matches the live Worker. If the repository is not listed, install and authorize the **Cloudflare Workers & Pages** GitHub App for this account/repository, then reconnect.

Do not enable pull-request preview deployments with the production D1 configuration; previews should use an isolated staging database.
