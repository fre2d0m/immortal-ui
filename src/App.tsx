import { useEffect, useState } from "react";
import { Moon, Sun, CodeXml, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HomePage } from "@/pages/HomePage";
import { CatalogPage } from "@/pages/CatalogPage";
import { ItemPage } from "@/pages/ItemPage";
import { DocsPage } from "@/pages/DocsPage";
import { ThemePage } from "@/pages/ThemePage";
import { useRoute } from "@/lib/navigation";
import { catalog } from "@/content/catalog";
import "./site.css";

const nav = [
  { name: "Components", path: "/components" },
  { name: "Blocks", path: "/blocks" },
  { name: "Theme", path: "/theme" },
  { name: "Docs", path: "/docs" },
];
function Sidebar({
  path,
  onNavigate,
}: {
  path: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Registry navigation" className="sidebar-nav">
      <p>Start here</p>
      {[
        { name: "Introduction", path: "/docs" },
        { name: "Graphite theme", path: "/theme" },
        { name: "shadcn/ui foundation", path: "/components/button" },
      ].map((item) => (
        <a
          key={item.path}
          href={`#${item.path}`}
          aria-current={path === item.path ? "page" : undefined}
          onClick={onNavigate}
        >
          {item.name}
        </a>
      ))}
      {(["component", "block"] as const).map((kind) => (
        <div key={kind}>
          <p>{kind === "component" ? "IoT components" : "IoT Blocks"}</p>
          {catalog
            .filter((item) => item.kind === kind)
            .map((item) => {
              const href = `/${kind === "component" ? "components" : "blocks"}/${item.name}`;
              return (
                <a
                  key={item.name}
                  href={`#${href}`}
                  aria-current={path === href ? "page" : undefined}
                  onClick={onNavigate}
                >
                  {item.title}
                </a>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
export default function App() {
  const path = useRoute();
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("immortal-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);
  useEffect(() => {
    setMenuOpen(false);
    document.title = `Immortal UI — ${path === "/" ? "Interfaces for the physical world" : (catalog.find((item) => path.endsWith(item.name))?.title ?? "IoT registry")}`;
  }, [path]);
  const home = path === "/";
  let page;
  if (home) page = <HomePage />;
  else if (path === "/components")
    page = <CatalogPage key="components" kind="component" />;
  else if (path === "/blocks") page = <CatalogPage key="blocks" kind="block" />;
  else if (path.startsWith("/components/") || path.startsWith("/blocks/"))
    page = <ItemPage key={path} name={path.split("/")[2]} />;
  else if (path === "/theme" || path === "/materials") page = <ThemePage />;
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
            <small>IoT</small>
          </a>
          <nav className="top-nav" aria-label="Main navigation">
            {nav.map((item) => (
              <a
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
              onClick={() => setDark(!dark)}
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
          {page}
        </main>
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
          <div className="flex flex-wrap gap-4 text-sm">
            {nav.map((item) => (
              <a
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
