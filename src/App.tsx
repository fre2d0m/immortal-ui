import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, Menu, X } from "lucide-react";
import { ToastProvider } from "./components/ImmortalToast";
import {
  MetalConfigProvider,
  METAL_MATERIALS,
  useMetalConfig,
} from "./components/WebGLMetalEngine";
import { LightingLab } from "./components/LightingLab";
import { LiquidChromeLab } from "./components/LiquidChromeLab";
import {
  ShadcnCardsExample,
  ShadcnDashboardExample,
  ShadcnPlaygroundExample,
} from "./components/ShadcnExamplesGrid";
import { NodeConfigExample } from "./components/NodeConfigExample";
import { DocumentationLayout } from "./components/DocumentationLayout";
import { ImmortalMark } from "./components/ImmortalMark";
import { HomePage } from "./pages/HomePage";
import { useSiteRoute } from "./lib/navigation";
import "./site.css";

const navItems = [
  { name: "Components", path: "/components", section: "components" },
  { name: "Examples", path: "/examples/cards", section: "examples" },
  { name: "Materials", path: "/materials", section: "materials" },
  { name: "Docs", path: "/docs/getting-started", section: "docs" },
];
const examplePages = {
  cards: {
    name: "Cards",
    description:
      "Everyday product flows, composed from the same building blocks.",
    content: ShadcnCardsExample,
  },
  dashboard: {
    name: "Dashboard",
    description:
      "Metrics, activity, and workspace controls in a complete layout.",
    content: ShadcnDashboardExample,
  },
  playground: {
    name: "Playground",
    description: "A prompt workspace with model and parameter controls.",
    content: ShadcnPlaygroundExample,
  },
  forms: {
    name: "Forms",
    description:
      "The original composite configuration form, with controls and a modal working together.",
    content: NodeConfigExample,
  },
};

function AppContent() {
  const route = useSiteRoute();
  const { material, setMaterial } = useMetalConfig();
  const preset = METAL_MATERIALS[material];
  const [menuOpen, setMenuOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMenuOpen(false);
    setStyleOpen(false);
  }, [route.path]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!styleRef.current?.contains(event.target as Node))
        setStyleOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setStyleOpen(false);
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const isDocumentation =
    route.section === "components" || route.section === "docs";
  return (
    <div className="min-h-screen text-zinc-100">
      <a
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
          document.getElementById("main-content")?.scrollIntoView();
        }}
        className="skip-link"
      >
        Skip to content
      </a>
      <header className="site-header sticky top-0 z-40 border-b border-white/[0.07] bg-[#070708]/95 backdrop-blur-md">
        <div className="site-container flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-8">
            <a
              href="#/"
              aria-label="Immortal UI home"
              className="flex shrink-0 items-center gap-2.5"
            >
              <span
                style={{
                  backgroundImage: "var(--bg-convex), var(--border-rim)",
                  backgroundOrigin: "padding-box, border-box",
                  backgroundClip: "padding-box, border-box",
                  boxShadow: "var(--shadow-convex-sm)",
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent"
              >
                <ImmortalMark className="h-8 w-8" />
              </span>
              <span className="whitespace-nowrap text-sm font-bold tracking-tight">
                Immortal UI
              </span>
            </a>
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-6 md:flex"
            >
              {navItems.map((item) => (
                <a
                  key={item.section}
                  href={`#${item.path}`}
                  aria-current={
                    route.section === item.section ? "page" : undefined
                  }
                  className={`site-nav-link ${route.section === item.section ? "is-active" : ""}`}
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div ref={styleRef} className="relative">
              <button
                type="button"
                aria-label="Choose material"
                aria-expanded={styleOpen}
                aria-controls="material-menu"
                onClick={() => setStyleOpen((v) => !v)}
                className="flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 text-xs text-zinc-300 transition-colors hover:border-white/20"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-white/20"
                  style={{ background: preset.swatchGradient }}
                />
                <span className="hidden lg:inline">{preset.name}</span>
                <ChevronDown size={12} />
              </button>
              {styleOpen && (
                <div
                  id="material-menu"
                  className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-white/15 bg-[#0d0d10] p-2 shadow-2xl"
                >
                  <p className="px-3 py-2 text-[10px] font-medium tracking-wider text-zinc-600">
                    GLOBAL MATERIAL
                  </p>
                  {Object.values(METAL_MATERIALS).map((mat) => (
                    <button
                      key={mat.id}
                      type="button"
                      aria-pressed={mat.id === material}
                      onClick={() => {
                        setMaterial(mat.id);
                        setStyleOpen(false);
                      }}
                      className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-xs text-zinc-300 hover:bg-white/[0.05]"
                    >
                      <span
                        style={{ background: mat.swatchGradient }}
                        className="h-3 w-3 rounded-full border border-white/20"
                      />
                      {mat.name}
                      {mat.id === material && (
                        <Check size={13} className="ml-auto" />
                      )}
                    </button>
                  ))}
                  <a
                    href="#/materials"
                    className="mt-2 flex min-h-10 items-center justify-between border-t border-white/10 px-3 text-xs text-zinc-500 hover:text-white"
                  >
                    Open material lab <ArrowRight size={13} />
                  </a>
                </div>
              )}
            </div>
            <a
              href="https://github.com/fre2d0m/immortal-ui"
              target="_blank"
              rel="noreferrer"
              aria-label="Immortal UI on GitHub"
              className="hidden h-10 items-center justify-center px-2 text-xs text-zinc-400 transition-colors hover:text-white sm:flex"
            >
              GitHub
            </a>
            <button
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center text-zinc-300 md:hidden"
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="site-container grid gap-1 border-t border-white/[0.07] py-4 md:hidden"
          >
            {navItems.map((item) => (
              <a
                key={item.section}
                href={`#${item.path}`}
                className="rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-white/5"
              >
                {item.name}
              </a>
            ))}
            <a
              href="https://github.com/fre2d0m/immortal-ui"
              className="px-3 py-3 text-sm text-zinc-500"
            >
              GitHub
            </a>
          </nav>
        )}
      </header>

      {route.section === "home" && (
        <main id="main-content" tabIndex={-1}>
          <HomePage />
        </main>
      )}
      {isDocumentation && <DocumentationLayout route={route} />}
      {route.section === "examples" && (
        <main
          id="main-content"
          tabIndex={-1}
          className="site-container py-10 sm:py-12"
        >
          <header className="mb-8">
            <p className="site-eyebrow">EXAMPLES</p>
            <h1 className="site-page-title mt-4">
              {examplePages[route.exampleId].name}
            </h1>
            <p className="site-page-description">
              {examplePages[route.exampleId].description}
            </p>
          </header>
          <nav
            aria-label="Example navigation"
            className="mb-8 flex gap-6 border-b border-white/10"
          >
            {Object.entries(examplePages).map(([id, item]) => (
              <a
                key={id}
                href={`#/examples/${id}`}
                aria-current={route.exampleId === id ? "page" : undefined}
                className={`pb-4 text-sm transition-colors ${route.exampleId === id ? "border-b border-zinc-300 text-white" : "text-zinc-500 hover:text-zinc-200"}`}
              >
                {item.name}
              </a>
            ))}
          </nav>
          {React.createElement(examplePages[route.exampleId].content)}
          <p className="mt-8 text-xs leading-6 text-zinc-600">
            Example data and interactions. Authentication, payment, and model
            controls are UI demonstrations.
          </p>
        </main>
      )}
      {route.section === "materials" && (
        <main
          id="main-content"
          tabIndex={-1}
          className="site-container py-10 sm:py-12"
        >
          <header className="mb-8">
            <p className="site-eyebrow">THE MATERIAL LAB</p>
            <h1 className="site-page-title mt-4">
              One system. Seven finishes.
            </h1>
            <p className="site-page-description">
              Classic Dark and six physical metals. Explore the original
              materials and tune the same shared optical settings.
            </p>
          </header>
          <LightingLab />
          <LiquidChromeLab />
        </main>
      )}
      {route.section === "not-found" && (
        <main id="main-content" tabIndex={-1} className="site-container py-24">
          <p className="site-eyebrow">404</p>
          <h1 className="site-page-title mt-4">Page not found</h1>
          <p className="site-page-description">
            This page is not part of the library. Browse the component directory
            or return home.
          </p>
          <div className="mt-8 flex gap-4">
            <a href="#/components" className="site-cta-primary">
              Browse components
            </a>
            <a href="#/" className="site-cta-secondary">
              Back home
            </a>
          </div>
        </main>
      )}
      <footer className="border-t border-white/[0.07]">
        <div className="site-container flex flex-wrap items-center justify-between gap-4 py-7 text-[11px] text-zinc-600">
          <span>Immortal UI · React components, sculpted with light.</span>
          <div className="flex gap-5">
            <a className="hover:text-zinc-300" href="#/docs/getting-started">
              Documentation
            </a>
            <a
              className="hover:text-zinc-300"
              href="https://github.com/fre2d0m/immortal-ui"
            >
              Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <MetalConfigProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </MetalConfigProvider>
  );
}
