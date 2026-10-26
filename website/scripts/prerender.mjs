/**
 * Static prerender: turns the client build into one real HTML file per page,
 * so search engines, link previews and slow phones get content before any
 * JavaScript runs. React then hydrates the same markup.
 *
 * Also writes robots.txt and sitemap.xml for the pages it rendered.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const template = await fs.readFile(path.join(dist, "index.html"), "utf8");
const { render, paths } = await import(
  pathToFileURL(path.join(root, "dist-ssr", "entry-server.js")).href
);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
let siteUrl = "";

for (const p of paths) {
  const { html, meta, siteUrl: su, structuredData } = render(p);
  siteUrl = su;
  const page = template
    .replaceAll("<!--page-title-->", esc(meta.title))
    .replaceAll("<!--page-description-->", esc(meta.description))
    .replaceAll("<!--page-url-->", esc(meta.url))
    .replaceAll("<!--site-url-->", esc(su))
    .replace("<!--structured-data-->", structuredData)
    .replace("<!--app-html-->", html);
  const out = p === "/" ? path.join(dist, "index.html") : path.join(dist, `${p.slice(1)}.html`);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, page);
  console.log(
    `prerendered ${p} → ${path.relative(root, out)} (${(page.length / 1024).toFixed(1)} kB)`,
  );
}

await fs.writeFile(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
);
await fs.writeFile(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((p) => `  <url><loc>${siteUrl}${p === "/" ? "/" : p}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);
await fs.rm(path.join(root, "dist-ssr"), { recursive: true, force: true });
console.log("wrote robots.txt and sitemap.xml");
