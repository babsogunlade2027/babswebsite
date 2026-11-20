# BABS Website — Production Deployment and Operations

## Verified production topology
- Public canonical domain: https://babatundeogunlade.com
- GitHub source repository: https://github.com/babsogunlade2027/babswebsite
- Publishing branch: main
- Production Cloudflare Worker: babswebsite-preview
- Production custom domain: babatundeogunlade.com
- CMS: /admin/
- Separate legacy/preview Worker: babs07 (do not modify as part of a production release without a separate review)

The production custom domain is attached to `babswebsite-preview`. The Worker currently retrieves public site files from the repository's `main` branch at runtime. It is not configured as a Wrangler Static Assets deployment. Do not add an assets binding or change the production routing model without a planned migration and rollback.

## GitHub OAuth and secret handling
- OAuth App callback URL must be exactly: `https://babatundeogunlade.com/api/callback`.
- OAuth client ID is not secret and may be stored as a plain-text Worker variable.
- OAuth client secret must be a Cloudflare Worker Secret (secret-text binding), never a plain-text variable, source file, repository file, or Wrangler variable.
- The production audit found the existing `CLIENT_SECRET` binding configured as plain text. Before the next production deployment, create a replacement OAuth client secret in the GitHub OAuth App and add it to the production Worker as `GITHUB_OAUTH_CLIENT_SECRET` using Cloudflare's Secret control. Do not paste the secret into chat, GitHub, or this document.
- The Worker currently prefers `GITHUB_OAUTH_CLIENT_SECRET` and retains `CLIENT_SECRET` only as a temporary compatibility fallback. After a successful CMS login using the new secret, remove the old plain-text `CLIENT_SECRET` variable.
- Keep the existing `CLIENT_ID` binding until the OAuth configuration has been tested.
- The CMS backend targets `babsogunlade2027/babswebsite`, branch `main`, with the editorial workflow enabled. Repository write permission remains the publication gate.

## CMS content and public feeds
- CMS configuration: `admin/config.yml`.
- News articles: `_posts/news`.
- Gallery entries: `_posts/gallery`.
- Uploaded media: `assets/img/uploads`.
- Public feed endpoints: `GET /api/news` and `GET /api/gallery`.
- Only content present on the published `main` branch is returned by the public feeds. Draft editorial branches are not exposed.
- Feed responses are cached briefly at the edge. The client renders all CMS text as text nodes; it does not inject article HTML.

## Contact forms
- The homepage volunteer form prepares an email in the visitor's default email application. The visitor must review and send the email; the website does not claim to store or submit the form automatically.
- The contact page uses the same email-draft model.
- Do not add a server-side contact endpoint unless an approved email provider, retention policy, consent wording, and spam controls are configured.

## Security and content controls
- Keep `/admin/` unindexed and uncached.
- Keep OAuth state validation enabled and use the canonical host for the callback.
- Never expose Worker secrets in repository files or logs.
- Public news and gallery feeds must include only content committed to `main` after editorial approval.
- Administrative access is restricted. Do not publish unverified claims, private information, or material that has not been approved by the campaign office.
- Preserve existing approved copy, images, and public URLs during maintenance.

## Release procedure
1. Review changes on a dedicated branch and validate syntax and file paths.
2. Confirm the production Worker custom-domain attachment and active deployment.
3. Confirm the GitHub OAuth callback URL and secret-text binding without printing secret values.
4. Verify homepage, all existing public pages, mobile navigation, feed endpoints, CMS access, image paths, canonical redirects, and security headers.
5. Merge only the approved code changes into `main`.
6. Deploy the matching Worker code to `babswebsite-preview`.
7. Re-test the live custom domain and CMS login. Do not publish unapproved content.

## Rollback
Use the previous known-good Worker deployment version for rollback. Revert a Git commit rather than deleting files manually. Do not alter DNS or the separate `babs07` Worker as a routine rollback step.
