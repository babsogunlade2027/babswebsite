# BABS Website

Official public information website for Hon. Babatunde Sunday Ogunlade (BABS), Ibarapa East State Constituency, Oyo State.

## Production architecture
- Canonical public domain: https://babatundeogunlade.com
- Production Cloudflare Worker: `babswebsite-preview`
- GitHub source: `babsogunlade2027/babswebsite`, publishing branch `main`
- The Worker serves public files from the published GitHub branch and handles the Decap CMS OAuth callback and public CMS feeds.
- `babs07` is a separate preview/legacy Worker. Do not change it as part of a routine production release.
- This is not currently a Netlify or Cloudflare Pages deployment. The repository's legacy `_headers` and `_redirects` files are not applied by the production Worker; canonical redirects and response security headers are handled in `worker.js`.

## Project structure
- `index.html` — public homepage
- `about.html`, `priorities.html`, `press.html`, `gallery.html`, `contact.html`, `privacy.html` — public information pages
- `assets/css/style.css` — homepage design system
- `assets/styles.css` — secondary-page design system
- `assets/js/main.js` — homepage navigation, form validation and email-draft handling
- `assets/site.js` — secondary-page navigation and CMS-powered Press Centre/Gallery
- `admin/` — Decap CMS interface and configuration
- `_posts/news/` and `_posts/gallery/` — editorial content collections
- `assets/img/uploads/` — CMS-uploaded media
- `docs/` — deployment and editorial guidance
- `worker.js` — Cloudflare Worker file proxy, security headers, CMS OAuth and public feed endpoints

## Brand
- Primary: deep green `#0b5d34`
- Accent: gold `#f5b301`
- Navy: `#0B1B3D`
- Tagline: Building the Future. Empowering the People. Advancing Ibarapa East

## Content integrity
Proposed priorities must remain clearly distinguished from completed achievements. Do not invent claims, endorsements, figures or quotations. Public content requires editorial verification and approval. The CMS editorial workflow and repository write permissions are the publication gate.

## CMS
Visit `/admin/` and authenticate with an authorised GitHub account. News and gallery entries committed to the published `main` branch are served through `/api/news` and `/api/gallery`. Draft editorial branches are not displayed publicly.

## Contact and privacy
The homepage and contact page prepare an email in the visitor's email application. Visitors must review and send the message themselves. The website does not claim to store or submit those entries automatically. See `privacy.html`.

## Operations
Read [the production deployment guide](docs/DEPLOYMENT.md) before changing Cloudflare, GitHub OAuth, or production routing. Never put OAuth secrets in repository files or plain-text Worker variables.
