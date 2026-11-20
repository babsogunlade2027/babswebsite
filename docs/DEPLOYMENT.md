# BABS Website — Deployment Guide

## Production components
- Public domain: https://babatundeogunlade.com
- GitHub source: https://github.com/babsogunlade2027/babswebsite
- Publishing branch: main
- Cloudflare Worker: babswebsite-preview
- CMS: /admin/

## Cloudflare Worker secrets
The Worker accepts the existing secret bindings CLIENT_ID and CLIENT_SECRET. It also supports GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET. Never put secret values in source files or wrangler.toml.

## GitHub OAuth App
Set the OAuth App callback URL to https://babatundeogunlade.com/api/callback. Keep the client secret in Cloudflare Worker secrets. The CMS backend targets babsogunlade2027/babswebsite.

## CMS content
The CMS configuration is admin/config.yml. News is stored in _posts/news and gallery entries in _posts/gallery. Uploaded media is stored under assets/img/uploads.

## Release procedure
1. Review the changes on the working branch.
2. Verify desktop/mobile layout, links, images, SEO metadata and CMS configuration.
3. Merge approved changes into main.
4. Deploy the corresponding Worker source.
5. Verify the custom domain, CMS login and retained secret bindings.

## Rollback
Use Cloudflare's previous known-good Worker version. Revert a Git commit rather than deleting files manually.
