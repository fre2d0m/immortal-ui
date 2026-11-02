import { Button } from "@/components/ui/button";
import { FoundationsPreview } from "@/components/RegistryPreview";
import { TelemetryCard } from "@/components/iot/telemetry-card";
import { CodeSnippet, installCommand } from "@/components/CodeSnippet";
import { demoTemperature } from "@/lib/demo-data";

import { themeOverrides, type ThemeSettings } from "@/lib/theme-settings";

export function ThemePage({
  settings,
  panelOpen,
  onOpen,
}: {
  settings: ThemeSettings;
  panelOpen: boolean;
  onOpen: () => void;
}) {
  const overrides = themeOverrides(settings);
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Material / 01</p>
        <h1>Graphite Instrument</h1>
        <p>
          One light source. Three layers of depth. A quiet, tactile theme for
          interfaces that work with the physical world.
        </p>
      </div>
      <div className="mb-6">
        <Button
          id="open-theme-editor"
          onClick={onOpen}
          aria-expanded={panelOpen}
          aria-controls="theme-editor"
        >
          样式配置
        </Button>
      </div>
      <div className="material-swatches">
        {[
          {
            name: "Raised surface",
            cls: "surface-raised",
            description: "Panels and dialogs",
          },
          {
            name: "Recessed well",
            cls: "surface-inset",
            description: "Content and measurements",
          },
          {
            name: "Tactile control",
            cls: "surface-control",
            description: "Actions and selected states",
          },
        ].map((swatch) => (
          <div key={swatch.name}>
            <div className={`${swatch.cls} swatch`} />
            <h2>{swatch.name}</h2>
            <p>{swatch.description}</p>
          </div>
        ))}
      </div>
      <div className="theme-preview">
        <div className="preview-shell">
          <div className="preview-label">
            <span>Theme preview</span>
            <span>Live preview · changes saved in this browser</span>
          </div>
          <div className="p-5 sm:p-7">
            <FoundationsPreview />
          </div>
        </div>
        <div className="mt-6">
          <TelemetryCard
            label="Ambient temperature"
            value={23.8}
            unit="°C"
            description="Demo sensor · fixed snapshot"
            data={demoTemperature}
          />
        </div>
      </div>
      <h2 className="doc-heading">Install the full theme</h2>
      <CodeSnippet code={installCommand("graphite")} />
      <p className="doc-copy">
        The CLI installs the tokens and shared state rules together. For manual
        integration,{" "}
        <a href="./themes/graphite.css" download>
          download the full stylesheet
        </a>{" "}
        and use it as your Tailwind v4 global CSS. It imports Tailwind,
        tw-animate-css, and shadcn/tailwind.css; install those packages first.
      </p>
      <h2 className="doc-heading">Your overrides</h2>
      <CodeSnippet code={overrides} label="theme overrides" />
    </>
  );
}
