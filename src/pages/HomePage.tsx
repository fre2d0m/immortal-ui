import React from "react";
import { ArrowRight } from "lucide-react";
import { ImmortalButton } from "../components/ImmortalComponents";
import { HeroMark3D } from "../components/HeroMark3D";
import { HeroWorkspace } from "../components/HeroWorkspace";
import { ShadcnCardsExample } from "../components/ShadcnExamplesGrid";

export function HomePage() {
  return (
    <>
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="hero-intro">
          <div className="hero-title-lockup"><HeroMark3D /><h1 id="hero-title">Immortal UI</h1></div>
          <p>React components with a physical feel.</p>
          <div className="hero-actions">
            <ImmortalButton variant="metallic" onClick={() => { window.location.hash = "/docs/getting-started"; }}>
              Get Started <ArrowRight size={15} />
            </ImmortalButton>
            <ImmortalButton variant="default" onClick={() => { window.location.hash = "/components"; }}>
              Browse Components
            </ImmortalButton>
          </div>
        </div>
        <HeroWorkspace />
      </section>
      <section className="site-container py-12 sm:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="site-eyebrow">COMPOSE WITH CONFIDENCE</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Small details. Complete interfaces.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-400">
              Explore the same components in everyday product flows, from a
              simple form to a complete dashboard.
            </p>
          </div>
          <a className="site-text-link" href="#/examples/cards">
            Explore examples <ArrowRight size={14} />
          </a>
        </div>
        <ShadcnCardsExample />
      </section>
      <section className="immortal-container site-container border-t border-white/[0.07] py-12 sm:py-16">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="site-eyebrow">YOUR FIRST COMPONENT</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Bring Immortal UI into your project.
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Source files, shared styles, and a small provider. Follow the
              setup guide.
            </p>
          </div>
          <ImmortalButton
            variant="metallic"
            onClick={() => {
              window.location.hash = "/docs/getting-started";
            }}
          >
            Start building <ArrowRight size={15} />
          </ImmortalButton>
        </div>
      </section>
    </>
  );
}
