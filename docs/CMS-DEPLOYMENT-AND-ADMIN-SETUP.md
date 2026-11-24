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

The feature branch's `wrangler.toml` contains:
- D1 binding `DB` to `babs-cms-production`.
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

After staging bindings and secrets are confirmed:

```sh
npx wrangler deploy --config wrangler.toml
```

Run this only from the feature branch and only after changing the script name and host routing to the staging Worker. Do not point the staging configuration at the production custom domains.

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
