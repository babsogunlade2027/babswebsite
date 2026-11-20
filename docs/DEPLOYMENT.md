# BABS Website — Deployment Guide

## Production components
- Public domain: https://babatundeogunlade.com
- GitHub source: https://github.com/babsogunlade2027/babswebsite
- Publishing branch: main
- Cloudflare production Worker: `babswebsite-preview` (currently attached to `babatundeogunlade.com`; the name is historical and does not mean it is a safe preview target)
- Separate Worker: `babs07` (has static assets but is not currently attached to the custom domain)
- CMS: /admin/

## Cloudflare Worker secrets
The Worker accepts `CLIENT_ID` and `CLIENT_SECRET`, and also supports `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET`. `CLIENT_ID` is an identifier and may be a plain-text variable. The client secret must be stored as an encrypted Cloudflare Worker secret, not as a plain-text variable. The production Worker currently exposes a `CLIENT_SECRET` plain-text variable binding; migrate it to an encrypted secret and rotate the OAuth client secret before the next production deployment. Never put secret values in source files, GitHub, or `wrangler.toml`.

## GitHub OAuth App
Set the OAuth App callback URL to https://babatundeogunlade.com/api/callback. Keep the client secret in Cloudflare Worker secrets. The CMS backend targets babsogunlade2027/babswebsite.

## CMS content
The CMS configuration is admin/config.yml. News is stored in _posts/news and gallery entries in _posts/gallery. Uploaded media is stored under assets/img/uploads.

## Production topology and release procedure

The custom domain `babatundeogunlade.com` is attached to `babswebsite-preview`. That Worker currently serves repository files by fetching the `main` branch from `raw.githubusercontent.com`; it is not using the separate `babs07` static-assets Worker. The repository's `_headers` and `_redirects` files are therefore not automatically applied by the current proxy Worker. Equivalent security headers and route handling must be implemented in `worker.js`.

1. Review changes on a non-production branch and pass the repository quality checks.
2. Verify desktop/mobile layout, links, images, SEO metadata, content feeds and CMS configuration.
3. Obtain explicit campaign-office approval for any public content changes. Technical changes must not publish unapproved claims or private information.
4. Migrate the OAuth client secret to an encrypted Worker secret and rotate it; do not expose the value in logs or source control.
5. Merge the approved code into `main` only after review.
6. Deploy the corresponding Worker source to `babswebsite-preview` only after confirming its production bindings and rollback version.
7. Verify the custom domain, CMS login, public content feeds, response headers and retained bindings.

Do not deploy to `babs07` as a shortcut. It is a separate Worker and would require a deliberate domain/asset migration plan.

## Rollback
Use Cloudflare's previous known-good Worker version. Revert a Git commit rather than deleting files manually.
