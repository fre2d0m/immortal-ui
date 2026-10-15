import { useEffect, useState } from "react";
import { componentById } from "../content/components";

export type SiteRoute =
  | { section: "home"; path: "/" }
  | { section: "components"; path: string; componentId?: string }
  | { section: "docs"; path: "/docs/getting-started" }
  | {
      section: "examples";
      path: string;
      exampleId: "cards" | "dashboard" | "playground" | "forms";
    }
  | { section: "materials"; path: "/materials" }
  | { section: "not-found"; path: string };

export function parseRoute(hash: string): SiteRoute {
  const path = hash.replace(/^#/, "").split("?")[0].replace(/\/+$/, "") || "/";
  if (path === "/") return { section: "home", path: "/" };
  if (path === "/components") return { section: "components", path };
  const componentId = path.match(/^\/components\/([^/]+)$/)?.[1];
  if (componentId && componentById(componentId))
    return { section: "components", path, componentId };
  if (path === "/docs" || path === "/docs/getting-started")
    return { section: "docs", path: "/docs/getting-started" };
  if (path === "/materials") return { section: "materials", path };
  const exampleId =
    path === "/examples"
      ? "cards"
      : path.match(/^\/examples\/(cards|dashboard|playground|forms)$/)?.[1];
  if (exampleId)
    return {
      section: "examples",
      path: `/examples/${exampleId}`,
      exampleId: exampleId as "cards" | "dashboard" | "playground" | "forms",
    };
  return { section: "not-found", path };
}

export function useSiteRoute() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    const name =
      route.section === "components" && route.componentId
        ? componentById(route.componentId)?.name
        : {
            home: "Sculpted components for the web",
            components: "Components",
            docs: "Getting started",
            examples: "Examples",
            materials: "Materials",
            "not-found": "Page not found",
          }[route.section];
    document.title = `${name} — Immortal UI`;
  }, [route.path]);
  return route;
}
