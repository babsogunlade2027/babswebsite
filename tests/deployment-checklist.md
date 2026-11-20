# Deployment Verification Checklist

## Public website
- [ ] Homepage returns HTTP 200.
- [ ] Main stylesheet loads from /assets/css/style.css.
- [ ] JavaScript, mobile navigation, logo and campaign images load.
- [ ] Canonical URL uses https://babatundeogunlade.com/.
- [ ] Public pages are indexable; admin and OAuth endpoints are not.
- [ ] Sitemap and robots.txt are reachable.

## CMS and OAuth
- [ ] /admin/ serves the CMS.
- [ ] /admin/config.yml returns valid YAML.
- [ ] GitHub OAuth starts at /api/auth.
- [ ] Callback URL matches the GitHub OAuth App exactly.
- [ ] OAuth state validation rejects mismatches.
- [ ] Existing Cloudflare secret bindings remain present.
- [ ] CMS publishes only to the intended repository and branch.

## Security and release
- [ ] Path traversal is rejected.
- [ ] Unsupported API paths return 404.
- [ ] Responses have appropriate content types and cache policies.
- [ ] No credentials or private personal data are committed.
- [ ] Test desktop and mobile layouts.
- [ ] Record deployed Worker version and commit SHA.
