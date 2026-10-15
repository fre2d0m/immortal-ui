import React, { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Search } from "lucide-react";
import { componentCatalog, componentGroups } from "../content/components";
import { SiteRoute } from "../lib/navigation";
import {
  GettingStarted,
  gettingStartedSections,
} from "../pages/GettingStarted";
import { ComponentCatalog } from "../pages/ComponentCatalog";
import { ComponentDocs } from "./ComponentDocs";

export function DocumentationLayout({
  route,
}: {
  route: Extract<SiteRoute, { section: "docs" | "components" }>;
}) {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const componentId =
    route.section === "components" ? route.componentId : undefined;
  const isGuide = route.section === "docs";
  useEffect(() => {
    setMobileOpen(false);
  }, [route.path]);
  const sections = isGuide
    ? gettingStartedSections
    : componentId
      ? [
          ["preview", "Preview"],
          ["usage", "Usage"],
          ["setup", "Setup & dependencies"],
          ["api", "API reference"],
          ["related", "Explore further"],
        ]
      : [];
  function scrollToSection(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div className="site-container">
      <div className="immortal-container border-b border-white/[0.07] py-3 md:hidden">
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="documentation-sidebar"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex min-h-10 w-full items-center justify-between text-sm text-zinc-300"
        >
          Browse documentation <ChevronDown size={16} />
        </button>
      </div>
      <div className="docs-layout">
        <aside
          id="documentation-sidebar"
          aria-label="Documentation navigation"
          className={`docs-sidebar ${mobileOpen ? "block" : "hidden"} md:block`}
        >
          <label className="relative mb-7 block">
            <span className="sr-only">Search components</span>
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-3.5 text-zinc-600"
            />
            <input
              id="component-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a component…"
              className="h-10 w-full rounded-lg border border-white/10 bg-black/25 pl-9 pr-3 text-xs text-zinc-300 outline-none focus:border-white/30"
            />
          </label>
          <nav
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a"))
                setMobileOpen(false);
            }}
          >
            <p className="site-eyebrow mb-3">GET STARTED</p>
            <a
              href="#/docs/getting-started"
              aria-current={isGuide ? "page" : undefined}
              className={`docs-nav-link ${isGuide ? "is-active" : ""}`}
            >
              Introduction & setup
            </a>
            <a
              href="#/components"
              aria-current={!isGuide && !componentId ? "page" : undefined}
              className={`docs-nav-link ${!isGuide && !componentId ? "is-active" : ""}`}
            >
              All components{" "}
              <span className="text-[10px] text-zinc-600">
                {componentCatalog.length}
              </span>
            </a>
            {componentGroups.map((group) => {
              const items = componentCatalog.filter(
                (c) =>
                  c.category === group &&
                  `${c.name} ${c.summary} ${c.category}`
                    .toLowerCase()
                    .includes(query.toLowerCase().trim()),
              );
              return (
                items.length > 0 && (
                  <div key={group} className="mt-7">
                    <p className="site-eyebrow mb-2">{group.toUpperCase()}</p>
                    {items.map((item) => (
                      <a
                        key={item.id}
                        href={`#/components/${item.id}`}
                        aria-current={
                          componentId === item.id ? "page" : undefined
                        }
                        className={`docs-nav-link ${componentId === item.id ? "is-active" : ""}`}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                )
              );
            })}
            {query &&
              !componentCatalog.some((c) =>
                `${c.name} ${c.summary} ${c.category}`
                  .toLowerCase()
                  .includes(query.toLowerCase().trim()),
              ) && (
                <p className="mt-5 text-xs text-zinc-500">
                  No matching components.
                </p>
              )}
            <a
              href="https://github.com/fre2d0m/immortal-ui"
              target="_blank"
              rel="noreferrer"
              className="mt-8 flex items-center gap-2 border-t border-white/[0.07] pt-5 text-xs text-zinc-500 hover:text-zinc-200"
            >
              Browse the source <ArrowUpRight size={13} />
            </a>
          </nav>
        </aside>
        <main id="main-content" tabIndex={-1} className="docs-main min-w-0">
          {isGuide ? (
            <GettingStarted />
          ) : componentId ? (
            <ComponentDocs key={componentId} componentId={componentId} />
          ) : (
            <ComponentCatalog query={query} />
          )}
        </main>
        {sections.length > 0 && (
          <aside aria-label="On this page" className="docs-toc">
            <p className="site-eyebrow mb-4">ON THIS PAGE</p>
            {sections.map(([id, name]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className="block min-h-10 w-full text-left text-xs leading-5 text-zinc-500 transition-colors hover:text-zinc-200"
              >
                {name}
              </button>
            ))}
            <div className="immortal-container mt-6 border-t border-white/[0.07] pt-5">
              <a
                href="#/docs/getting-started"
                className="text-xs leading-6 text-zinc-400 hover:text-white"
              >
                New to Immortal UI?
                <br />
                Start with the setup guide.
              </a>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
