import { lazy, Suspense, useEffect, useState } from "react";
import { Moon, Sun, CodeXml, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CatalogPage } from "@/pages/CatalogPage";
import { DocsPage } from "@/pages/DocsPage";
import { ThemePage } from "@/pages/ThemePage";
import { iconCategories, iconCounts } from "@/content/icons";
import { useRoute } from "@/lib/navigation";
import {
  catalog,
  componentRedirects,
  componentGroups,
  blockGroups,
  itemHref,
} from "@/content/catalog";
import { useThemeSettings } from "@/hooks/use-theme-settings";
import "./site.css";
import "./catalog.css";
import "./theme-editor.css";

const ThemePanel = lazy(() =>
  import("@/components/theme-panel").then((module) => ({
    default: module.ThemePanel,
  })),
);

const nav = [
  { name: "Components", path: "/components" },
  { name: "Blocks", path: "/blocks" },
  { name: "Icons", path: "/icons" },
  { name: "Theme", path: "/theme" },
  { name: "Docs", path: "/docs" },
];
const HomePage = lazy(() =>
  import("@/pages/HomePage").then((module) => ({ default: module.HomePage })),
);
const ItemPage = lazy(() =>
  import("@/pages/ItemPage").then((module) => ({ default: module.ItemPage })),
);
const IconsPage = lazy(() =>
  import("@/pages/IconsPage").then((module) => ({ default: module.IconsPage })),
);
function Sidebar({
  path,
  onNavigate,
}: {
  path: string;
  onNavigate?: () => void;
}) {
  if (path.startsWith("/icons"))
    return (
      <nav aria-label="Registry navigation" className="sidebar-nav">
        <a
          data-slot="navigation-link"
          className="sidebar-overview"
          href="#/icons"
          aria-current={path === "/icons" ? "page" : undefined}
          onClick={onNavigate}
        >
          图标目录 <span>{iconCounts.total}</span>
        </a>
        <div className="sidebar-group">
          {iconCategories.map((group) => (
            <a
              data-slot="navigation-link"
              key={group.id}
              href={`#/icons/category/${group.id}`}
              aria-current={
                path === `/icons/category/${group.id}` ? "page" : undefined
              }
              onClick={onNavigate}
            >
              {group.title} <span>{group.icons.length}</span>
            </a>
          ))}
        </div>
        <p className="sidebar-icons-note">
          {iconCounts.lucide} 个 Lucide
          <br />
          {iconCounts.custom} 个 SVG 扩展
        </p>
      </nav>
    );
  const blocks = path.startsWith("/blocks");
  const groups = blocks ? blockGroups : componentGroups;
  const root = blocks ? "/blocks" : "/components";
  return (
    <nav
      aria-label={blocks ? "场景导航" : "Registry navigation"}
      lang={blocks ? "zh-CN" : undefined}
      className="sidebar-nav"
    >
      <a
        data-slot="navigation-link"
        className="sidebar-overview"
        href={`#${root}`}
        aria-current={path === root ? "page" : undefined}
        onClick={onNavigate}
      >
        {blocks ? "所有业务场景" : "所有组件"}
        <span>
          {
            catalog.filter(
              (item) => item.kind === (blocks ? "block" : "component"),
            ).length
          }
        </span>
      </a>
      {groups.map((group) => (
        <div className="sidebar-group" key={group.id}>
          <a
            data-slot="navigation-link"
            className="sidebar-group-title"
            href={`#${root}/category/${group.id}`}
            aria-current={
              path === `${root}/category/${group.id}` ? "page" : undefined
            }
            onClick={onNavigate}
          >
            {group.title}
            <span>
              {catalog.filter((item) => item.group === group.id).length}
            </span>
          </a>
          {catalog
            .filter((item) => item.group === group.id)
            .map((item) => (
              <a
                data-slot="navigation-link"
                key={item.name}
                href={itemHref(item)}
                aria-current={
                  `#${path}` === itemHref(item) ? "page" : undefined
                }
                onClick={onNavigate}
              >
                {blocks ? item.caption : item.title}
                {item.status === "planned" && (
                  <span className="sidebar-planned">规划</span>
                )}
              </a>
            ))}
        </div>
      ))}
      <div className="sidebar-resources">
        <p>Resources</p>
        <a
          data-slot="navigation-link"
          href="#/components/button"
          aria-current={path === "/components/button" ? "page" : undefined}
          onClick={onNavigate}
        >
          shadcn/ui foundation
        </a>
        <a
          data-slot="navigation-link"
          href="#/docs"
          aria-current={path === "/docs" ? "page" : undefined}
          onClick={onNavigate}
        >
          Introduction
        </a>
        <a
          data-slot="navigation-link"
          href="#/theme"
          aria-current={path === "/theme" ? "page" : undefined}
          onClick={onNavigate}
        >
          Theme Studio
        </a>
      </div>
    </nav>
  );
}

export default function App() {
  const [requestedPath, search] = useRoute().split("?", 2);
  const path =
    requestedPath.startsWith("/components/category/") &&
    ["sensors", "visualization"].includes(requestedPath.split("/")[3])
      ? "/components/category/data"
      : requestedPath.startsWith("/components/")
        ? (componentRedirects[requestedPath.split("/")[2]] ?? requestedPath)
        : requestedPath;
  useEffect(() => {
    if (path !== requestedPath)
      window.location.replace("#" + path + (search ? "?" + search : ""));
  }, [path, requestedPath, search]);
  useEffect(() => {
    if (
      path === "/components/panel-header" ||
      path === "/components/category/foundations"
    ) {
      window.location.replace("#/components");
    }
  }, [path]);
  const { settings, updateSettings, storageAvailable } = useThemeSettings();
  const dark = settings.mode === "dark";
  const [panelOpen, setPanelOpen] = useState(true);
  const themePage = path === "/theme" || path === "/materials";
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    setMenuOpen(false);
    document.title = `Immortal UI — ${path === "/" ? "Interfaces for the physical world" : (catalog.find((item) => path.endsWith(`/${item.name}`))?.title ?? (path.startsWith("/blocks") ? "Blocks" : path.startsWith("/components") ? "Components" : path.startsWith("/icons") ? "Icons" : "IoT registry"))}`;
  }, [path]);
  const home = path === "/";
  let page;
  if (home) page = <HomePage />;
  else if (path === "/icons" || path.startsWith("/icons/category/"))
    page = <IconsPage category={path.split("/")[3]} />;
  else if (path === "/components" || path.startsWith("/components/category/"))
    page = (
      <CatalogPage key={path} kind="component" category={path.split("/")[3]} />
    );
  else if (path === "/blocks" || path.startsWith("/blocks/category/"))
    page = (
      <CatalogPage key="blocks" kind="block" category={path.split("/")[3]} />
    );
  else if (path.startsWith("/components/") || path.startsWith("/blocks/"))
    page = (
      <ItemPage
        key={path}
        name={path.split("/")[2]}
        search={search}
        kind={path.startsWith("/blocks/") ? "block" : "component"}
      />
    );
  else if (themePage)
    page = (
      <ThemePage
        settings={settings}
        panelOpen={panelOpen}
        onOpen={() => {
          setPanelOpen(true);
          requestAnimationFrame(() =>
            document
              .querySelector<HTMLInputElement>(".theme-search-bar input")
              ?.focus(),
          );
        }}
      />
    );
  else if (path.startsWith("/docs")) page = <DocsPage />;
  else
    page = (
      <div className="page-heading">
        <h1>Page not found</h1>
        <a href="#/">Return to Immortal UI</a>
      </div>
    );
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a href="#/" className="brand">
            <img src="./immortal-mark.svg" alt="" width="32" height="32" />
            <span>Immortal UI</span>
            <small data-slot="badge" data-variant="outline">
              IoT
            </small>
          </a>
          <nav className="top-nav" aria-label="Main navigation">
            {nav.map((item) => (
              <a
                data-slot="navigation-link"
                key={item.name}
                href={`#${item.path}`}
                aria-current={path.startsWith(item.path) ? "page" : undefined}
              >
                {item.name}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <a
              className="github-link"
              href="https://github.com/fre2d0m/immortal-ui"
              aria-label="GitHub repository"
              target="_blank"
              rel="noreferrer"
            >
              <CodeXml className="size-4" />
            </a>
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                dark ? "Switch to light theme" : "Switch to dark theme"
              }
              onClick={() => updateSettings({ mode: dark ? "light" : "dark" })}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              className="mobile-menu"
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </Button>
          </div>
        </div>
      </header>
      <div className="theme-workspace" data-panel-open={themePage && panelOpen}>
        <div className={home ? "site-home" : "site-layout"}>
          {!home && (
            <aside className="site-sidebar">
              <Sidebar path={path} />
            </aside>
          )}
          <main
            id="main"
            tabIndex={-1}
            className={home ? "home-main" : "docs-main"}
          >
            <Suspense
              fallback={
                <p className="doc-copy" role="status">
                  正在加载预览…
                </p>
              }
            >
              {page}
            </Suspense>
          </main>
        </div>
        {themePage && panelOpen && (
          <Suspense
            fallback={
              <aside className="theme-editor" aria-busy="true">
                正在加载样式配置…
              </aside>
            }
          >
            <ThemePanel
              settings={settings}
              onChange={updateSettings}
              storageAvailable={storageAvailable}
              onClose={() => {
                setPanelOpen(false);
                document.getElementById("open-theme-editor")?.focus();
              }}
            />
          </Suspense>
        )}
      </div>
      <footer className="site-footer">
        <a href="#/" className="brand">
          <img src="./immortal-mark.svg" alt="" width="24" height="24" />
          <span>Immortal UI</span>
        </a>
        <span>shadcn/ui + material + IoT</span>
        <a
          href="https://github.com/fre2d0m/immortal-ui"
          target="_blank"
          rel="noreferrer"
        >
          Source on GitHub
        </a>
      </footer>
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogTitle>Immortal UI</DialogTitle>
          <DialogDescription>
            Components and blocks for connected products.
          </DialogDescription>
          <div className="flex flex-wrap gap-2 text-sm">
            {nav.map((item) => (
              <a
                data-slot="navigation-link"
                aria-current={path.startsWith(item.path) ? "page" : undefined}
                key={item.path}
                href={`#${item.path}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </div>
          <Sidebar path={path} onNavigate={() => setMenuOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
