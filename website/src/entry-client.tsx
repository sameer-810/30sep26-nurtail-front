import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { PAGES } from "./lib/site";

const root = document.getElementById("root")!;
// "/privacy", "/privacy/" and "/privacy.html" are the same page.
const path = window.location.pathname.replace(/(\/index)?\.html$/, "").replace(/\/+$/, "") || "/";
const tree = (
  <StrictMode>
    <App path={path} />
  </StrictMode>
);

// Production pages are prerendered HTML, so React hydrates them. In `vite dev`
// the root is empty, so it renders from scratch and fills in the page title.
if (root.firstElementChild) {
  hydrateRoot(root, tree);
} else {
  const meta = PAGES[path] ?? PAGES["/"];
  document.title = meta.title;
  createRoot(root).render(tree);
}
