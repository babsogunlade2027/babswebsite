
BABS WEBSITE — NETLIFY READY STATIC PACKAGE
===========================================

CONTENTS
- Responsive multi-page public information website
- Premium green / navy / gold design system
- Home, About, Profile, Proposed Priorities, News, Press Centre, Press Release detail, Gallery, Contact, Privacy and 404 pages
- Searchable JSON news and press feeds
- Mobile navigation, keyboard support, focus states, reduced-motion support
- Netlify configuration, redirects, basic security headers, robots.txt and sitemap.xml
- No build step, npm install, database or environment variables required

DEPLOY FROM GITHUB (RECOMMENDED)
1. Upload these files to a GitHub repository (root of repository; do not nest the website in another folder).
2. In Netlify, choose Add new site -> Import an existing project.
3. Connect GitHub and select the repository.
4. Build command: leave blank.
5. Publish directory: . (a single dot).
6. Deploy site.
7. In Netlify -> Domain management, add your domain and follow the DNS instructions displayed there.

DEPLOY BY MANUAL UPLOAD
1. Extract the ZIP file on your computer or phone.
2. In Netlify, open the Sites page and choose Add new site / Deploy manually (wording can vary).
3. Upload the extracted folder contents, ensuring index.html is at the root.
4. Do not upload the ZIP as a nested folder; publish the extracted website folder.

IMPORTANT BEFORE PUBLIC LAUNCH
- Replace assets/images/babs-portrait.svg with an approved portrait (update the homepage image path accordingly) with an approved portrait of Hon. Babatunde Sunday Ogunlade. The design shows a graceful fallback if the portrait is absent.
- Verify the contact email info@babatundeogunlade.com and replace it in contact/index.html and assets/js/site.js if the official address differs.
- Review every news and press release for approval, dates, source attribution and factual accuracy.
- Gallery tiles are deliberate placeholders; add approved photographs and captions before representing them as real event photos.
- This is a static site. The contact form opens the visitor's email app; it does not store or send submissions on its own.
- All priorities are explicitly marked as proposals, not completed outcomes.

CUSTOMISE
- Brand colours and responsive styling: assets/css/site.css
- Navigation / feeds / mobile menu / contact email: assets/js/site.js
- News feed: news.json
- Press release feed: press-centre.json
- Gallery images: assets/images/gallery/
