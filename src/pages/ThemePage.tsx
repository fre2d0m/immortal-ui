import { useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FoundationsPreview } from "@/components/RegistryPreview";
import { TelemetryCard } from "@/components/iot/telemetry-card";
import { CodeSnippet, installCommand } from "@/components/CodeSnippet";
import { demoTemperature } from "@/lib/demo-data";

export function ThemePage() {
  const [radius, setRadius] = useState(22.4);
  const [height, setHeight] = useState(32);
  const [status, setStatus] = useState("");
  const overrides = `:root, .dark {\n  --surface-radius: ${radius}px;\n  --control-height: ${height}px;\n}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(overrides);
      setStatus("Overrides copied.");
    } catch {
      setStatus("Select and copy the CSS below.");
    }
  }
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
      <div
        className="theme-preview"
        style={
          {
            "--surface-radius": `${radius}px`,
            "--control-height": `${height}px`,
          } as CSSProperties
        }
      >
        <div className="preview-shell">
          <div className="preview-label">
            <span>Theme preview</span>
            <span>Use the header to switch light / dark</span>
          </div>
          <div className="p-5 sm:p-7">
            <FoundationsPreview />
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <TelemetryCard
            label="Ambient temperature"
            value={23.8}
            unit="°C"
            description="Demo sensor · fixed snapshot"
            data={demoTemperature}
          />
          <div className="surface-inset space-y-6 p-6">
            <h2 className="font-medium">Tune the material</h2>
            <div className="space-y-2">
              <Label htmlFor="theme-radius">Panel radius · {radius}px</Label>
              <Input
                id="theme-radius"
                type="range"
                min="32"
                max="36"
                step="0.1"
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme-height">Control height · {height}px</Label>
              <Input
                id="theme-height"
                type="range"
                min="32"
                max="48"
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setRadius(22.4);
                  setHeight(32);
                  setStatus("");
                }}
              >
                Reset
              </Button>
              <Button onClick={copy}>Copy overrides</Button>
            </div>
            <p className="min-h-4 text-xs text-muted-foreground" role="status">
              {status || "Adjustments apply to this preview only."}
            </p>
          </div>
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
