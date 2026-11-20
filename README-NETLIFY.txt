DEPRECATED — DO NOT USE FOR PRODUCTION DEPLOYMENT

This file contains legacy Netlify deployment notes from an earlier hosting arrangement.
The verified production website is served by the Cloudflare Worker named
"babswebsite-preview", attached to https://babatundeogunlade.com.

Do not create a new Netlify site, change DNS, or migrate the production domain
using the instructions previously contained in this file.

For the current production architecture, GitHub publishing branch, Worker
configuration, OAuth secret handling, CMS feeds, release procedure and rollback
instructions, read:

docs/DEPLOYMENT.md

The repository's _headers and _redirects files are retained for historical or
alternate static-hosting reference. They are not applied by the current
Cloudflare Worker proxy. Production security headers and canonical-host
redirects are implemented in worker.js.
