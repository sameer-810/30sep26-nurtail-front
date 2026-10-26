import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { PAGES, SITE_URL, structuredData } from "./lib/site";

/** Render one page to HTML plus the head values the prerender script injects. */
export function render(path: string) {
  const meta = PAGES[path] ?? PAGES["/"];
  const html = renderToString(
    <StrictMode>
      <App path={path} />
    </StrictMode>,
  );
  return {
    html,
    meta: { ...meta, url: `${SITE_URL}${path === "/" ? "/" : path}` },
    siteUrl: SITE_URL,
    structuredData: structuredData(),
  };
}

export const paths = Object.keys(PAGES);
