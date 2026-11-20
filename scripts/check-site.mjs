import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const pages = [
  "index.html",
  "about.html",
  "priorities.html",
  "press.html",
  "gallery.html",
  "contact.html",
  "privacy.html",
  "404.html",
  "admin/index.html"
];
const errors = [];

function localTarget(page, raw) {
  if (!raw || raw.startsWith("#") || /^(?:[a-z]+:|\/\/)/i.test(raw)) return null;
  const clean = raw.split("#")[0].split("?")[0];
  if (!clean || clean.startsWith("/api/")) return null;
  let target = clean.startsWith("/")
    ? resolve(root, "." + clean)
    : resolve(root, dirname(page), clean);
  const candidates = [target];
  if (!/\.[a-z0-9]+$/i.test(target)) candidates.push(target + ".html", resolve(target, "index.html"));
  if (clean === "/") candidates.push(resolve(root, "index.html"));
  return candidates.find(candidate => existsSync(candidate)) || target;
}

for (const page of pages) {
  const file = resolve(root, page);
  if (!existsSync(file)) {
    errors.push("Missing required page: " + page);
    continue;
  }
  const html = readFileSync(file, "utf8");
  if (!/<title>[^<]+<\/title>/i.test(html)) errors.push("Missing title: " + page);
  if (!/<meta[^>]+name=["']description["']/i.test(html)) errors.push("Missing meta description: " + page);
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const raw = match[1];
    if (/^(?:mailto:|tel:|javascript:|data:)/i.test(raw)) continue;
    const target = localTarget(page, raw);
    if (target && !existsSync(target)) errors.push("Broken local reference in " + page + ": " + raw);
  }
}

const worker = readFileSync(resolve(root, "worker.js"), "utf8");
for (const route of ['/api/content/news', '/api/content/gallery', '/api/auth', '/api/callback']) {
  if (!worker.includes(route)) errors.push("Missing Worker route: " + route);
}
const cms = readFileSync(resolve(root, "admin/config.yml"), "utf8");
if (!cms.includes("publish_mode: editorial_workflow")) errors.push("CMS editorial workflow must remain enabled.");
if (!cms.includes("folder: \"_posts/news\"")) errors.push("CMS news collection path is missing.");
if (!cms.includes("folder: \"_posts/gallery\"")) errors.push("CMS gallery collection path is missing.");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("BABS site checks passed: required pages, local references, Worker routes and CMS review workflow.");
