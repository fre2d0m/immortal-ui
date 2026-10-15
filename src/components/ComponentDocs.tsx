import React, { useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { componentCatalog, componentById } from "../content/components";
import { ImmortalModal } from "./ImmortalModal";
import {
  ImmortalButton,
  ImmortalInput,
  ImmortalTextarea,
  ImmortalCard,
  ImmortalSwitch,
  ImmortalCheckbox,
  ImmortalRadioGroup,
  ImmortalSlider,
  ImmortalSelect,
  ImmortalTabs,
  ImmortalBadge,
} from "./ImmortalComponents";
import { useToast } from "./ImmortalToast";

interface DocItem {
  id: string;
  name: string;
  description: string;
  category: "buttons" | "inputs" | "controls" | "surfaces";
  preview: React.ReactNode;
  reactSnippet: string;
  htmlSnippet: string;
}

export const ComponentDocs: React.FC<{ componentId: string }> = ({
  componentId,
}) => {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  // Demo states for previews
  const [btnLoading, setBtnLoading] = useState(false);
  const [switchVal, setSwitchVal] = useState(true);
  const [checkVal, setCheckVal] = useState(true);
  const [radioVal, setRadioVal] = useState("raycast");
  const [sliderVal, setSliderVal] = useState(65);
  const [selectVal, setSelectVal] = useState("v1");
  const [activeTab, setActiveTab] = useState("code");

  const components: DocItem[] = [
    {
      id: "button",
      name: "Immortal Button",
      category: "buttons",
      description:
        "Convex micro-curved surface with a 1px 135° dual-specular rim. Supports optional hover angular sweep (90°, 180°, 360°) and physical metal shaders.",
      preview: (
        <div className="flex flex-wrap items-center gap-3">
          <ImmortalButton variant="default">Default Rim</ImmortalButton>
          <ImmortalButton variant="default" sweepDeg={360}>
            Orbit Sweep (+360°)
          </ImmortalButton>
          <ImmortalButton variant="metallic">Metallic Primary</ImmortalButton>
          <ImmortalButton variant="recessed">Recessed Secondary</ImmortalButton>
          <ImmortalButton variant="danger">Danger Action</ImmortalButton>
          <ImmortalButton
            variant="default"
            loading={btnLoading}
            onClick={() => {
              setBtnLoading(true);
              setTimeout(() => setBtnLoading(false), 1500);
            }}
          >
            {btnLoading ? "Processing..." : "Test Loading"}
          </ImmortalButton>
        </div>
      ),
      reactSnippet: `// React / TSX Usage (supports per-button material and sweepDeg props)
import { ImmortalButton } from "./components/ImmortalComponents";

export function ButtonDemo() {
  return (
    <div className="flex gap-3">
      {/* Default 135° static dual-specular rim */}
      <ImmortalButton variant="default">Default Button</ImmortalButton>

      {/* Optional 360° angular specular sweep on hover */}
      <ImmortalButton variant="default" sweepDeg={360}>Hover Orbit (360°)</ImmortalButton>

      {/* Specific WebGL physical metal override */}
      <ImmortalButton variant="default" material="gold">24K Gold</ImmortalButton>

      {/* High-contrast metallic primary button */}
      <ImmortalButton variant="metallic">Deploy Now</ImmortalButton>
    </div>
  );
}`,
      htmlSnippet: `<!-- Vanilla HTML & CSS (uses CSS @property for smooth angular specular sweep) -->
<button class="skeuo-btn">Default 135° Rim</button>
<button class="skeuo-btn" style="--hover-sweep: 360deg;">Hover Orbit (360°)</button>
<button class="skeuo-btn" style="--hover-sweep: 90deg;">Hover Sweep (90°)</button>

<style>
/* 1. Register CSS Houdini angle property for smooth gradient rotation */
@property --local-rim-angle {
  syntax: '<angle>';
  inherits: true;
  initial-value: 135deg;
}

:root {
  --rim-angle: 135deg;       /* Resting diagonal specular angle */
  --hover-sweep: 0deg;       /* Optional angular sweep on hover (0deg / 90deg / 180deg / 360deg) */
  --sweep-duration: 600ms;   /* Transition duration */
}

.skeuo-btn {
  --local-rim-angle: var(--rim-angle);
  height: 40px;
  padding: 0 16px;
  font-size: 13px;
  border-radius: 12px;
  color: #f4f4f6;
  border: 1px solid transparent;
  background-image:
    linear-gradient(145deg, #1b1b1f 0%, #09090b 55%, #141418 100%),
    linear-gradient(
      var(--local-rim-angle),
      rgba(255,255,255,0.42) 0%,
      rgba(255,255,255,0.06) 38%,
      rgba(255,255,255,0.03) 62%,
      rgba(255,255,255,0.22) 100%
    );
  background-origin: padding-box, border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 4px 10px rgba(0,0,0,0.75), inset 0 1px 0.5px rgba(255,255,255,0.16);
  cursor: pointer;
  transition:
    --local-rim-angle var(--sweep-duration) cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.2s ease;
}

.skeuo-btn:hover {
  --local-rim-angle: calc(var(--rim-angle) + var(--hover-sweep));
  box-shadow: 0 8px 18px rgba(0,0,0,0.85), inset 0 1px 0.5px rgba(255,255,255,0.28);
}

.skeuo-btn:active {
  transform: translateY(1px);
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.92);
}
</style>`,
    },
    {
      id: "input",
      name: "Immortal Input",
      category: "inputs",
      description:
        "Deep recessed inner shadow creates a carved physical slot with a focused diagonal specular rim, leading icon, and keyboard shortcut badge.",
      preview: (
        <div className="flex flex-col gap-3 max-w-md w-full">
          <ImmortalInput
            placeholder="Search nodes or run a command..."
            kbd="⌘K"
            icon={
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            }
          />
          <ImmortalInput
            type="password"
            placeholder="Enter secret token..."
            defaultValue="sk-production-immortal-key"
          />
        </div>
      ),
      reactSnippet: `import { ImmortalInput } from "./components/ImmortalComponents";
import { Search } from "lucide-react";

export function InputDemo() {
  return (
    <ImmortalInput
      placeholder="Search or enter global command..."
      icon={<Search className="w-4 h-4" />}
      kbd="⌘K"
    />
  );
}`,
      htmlSnippet: `<!-- Vanilla HTML & CSS -->
<div class="input-wrapper">
  <input type="text" class="input-field" placeholder="Search or enter command..." />
  <span class="kbd-badge">⌘K</span>
</div>

<style>
.input-wrapper {
  display: flex;
  align-items: center;
  border-radius: 12px;
  border: 1px solid transparent;
  background-image:
    linear-gradient(180deg, #040405 0%, #0b0b0d 100%),
    linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.12) 100%);
  background-origin: padding-box, border-box;
  background-clip: padding-box, border-box;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.92);
}
.input-field {
  width: 100%;
  height: 40px;
  padding: 0 14px;
  background: transparent;
  border: none;
  color: #f4f4f6;
  outline: none;
}
</style>`,
    },
    {
      id: "switch",
      name: "Immortal Switch",
      category: "controls",
      description:
        "Pure opaque obsidian subcard backing prevents grey bleed-through, paired with a recessed track and an illuminated jewel indicator thumb.",
      preview: (
        <div className="flex flex-col gap-3 max-w-md w-full">
          <ImmortalSwitch
            checked={switchVal}
            onChange={setSwitchVal}
            label="135° Specular Ray-Traced Rim"
            hint="Enable real-time edge reflections and inner highlights"
          />
        </div>
      ),
      reactSnippet: `import { ImmortalSwitch } from "./components/ImmortalComponents";
import { useState } from "react";

export function SwitchDemo() {
  const [enabled, setEnabled] = useState(true);

  return (
    <ImmortalSwitch
      checked={enabled}
      onChange={setEnabled}
      label="Hardware Accelerated Shading"
      hint="Enable dynamic diagonal specular rim reflections"
    />
  );
}`,
      htmlSnippet: `<!-- Vanilla HTML & CSS -->
<div class="control-row">
  <div class="control-label">
    <span class="control-title">Hardware Accelerated Shading</span>
    <span class="control-hint">Enable dynamic diagonal specular rim reflections</span>
  </div>
  <label class="switch">
    <input type="checkbox" checked />
    <span class="switch-track"><span class="switch-thumb"></span></span>
  </label>
</div>

<style>
.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  /* Opaque dark gradient prevents border-box highlight bleed-through */
  background-image:
    linear-gradient(145deg, #101013 0%, #070709 60%, #0c0c0f 100%),
    linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.12) 100%);
  background-origin: padding-box, border-box;
  background-clip: padding-box, border-box;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.65);
}
</style>`,
    },
    {
      id: "select",
      name: "Immortal Select",
      category: "inputs",
      description:
        "Custom dark skeuomorphic dropdown with a floating beveled popover, deep ambient shadow, and option descriptions.",
      preview: (
        <div className="max-w-md w-full">
          <ImmortalSelect
            label="Engine Kernel"
            value={selectVal}
            onChange={setSelectVal}
            options={[
              {
                value: "v1",
                label: "Grok-3 Metal Reasoning Engine",
                description: "Low-latency hardware raster acceleration",
              },
              {
                value: "v2",
                label: "Linear Instant Pipeline",
                description: "Sub-millisecond local-first sync",
              },
              {
                value: "v3",
                label: "Raycast Native Runtime",
                description: "Global hotkey launcher & extensions",
              },
            ]}
          />
        </div>
      ),
      reactSnippet: `import { ImmortalSelect } from "./components/ImmortalComponents";
import { useState } from "react";

export function SelectDemo() {
  const [model, setModel] = useState("v1");

  return (
    <ImmortalSelect
      label="Processing Engine"
      value={model}
      onChange={setModel}
      options={[
        { value: "v1", label: "Grok-3 Metal Reasoning Engine" },
        { value: "v2", label: "Linear Instant Pipeline" }
      ]}
    />
  );
}`,
      htmlSnippet: `<!-- See ImmortalSelect component source for full accessible dropdown implementation -->`,
    },
    {
      id: "checkbox",
      name: "Immortal Checkbox",
      category: "controls",
      description:
        "An independent selection with a recessed socket and an illuminated check.",
      preview: (
        <ImmortalCheckbox
          checked={checkVal}
          onChange={setCheckVal}
          label="Remember my preferences"
          hint="A controlled checkbox"
        />
      ),
      reactSnippet: `import { useState } from 'react';
import { ImmortalCheckbox } from './components/ImmortalComponents';

export function CheckboxDemo() {
  const [checked, setChecked] = useState(true);
  return <ImmortalCheckbox checked={checked} onChange={setChecked} label="Remember my preferences" />;
}`,
      htmlSnippet: "",
    },
    {
      id: "radio-group",
      name: "Immortal Radio Group",
      category: "controls",
      description: "Select one option from a controlled group.",
      preview: (
        <ImmortalRadioGroup
          name="docs-theme"
          value={radioVal}
          onChange={setRadioVal}
          options={[
            { value: "raycast", label: "Obsidian Dark" },
            { value: "titanium", label: "Brushed Titanium" },
          ]}
        />
      ),
      reactSnippet: `import { useState } from 'react';
import { ImmortalRadioGroup } from './components/ImmortalComponents';

export function RadioDemo() {
  const [value, setValue] = useState('dark');
  return <ImmortalRadioGroup name="theme" value={value} onChange={setValue}
    options={[{ value: 'dark', label: 'Obsidian Dark' }, { value: 'metal', label: 'Brushed Titanium' }]} />;
}`,
      htmlSnippet: "",
    },
    {
      id: "slider",
      name: "Immortal Slider",
      category: "controls",
      description:
        "Recessed groove track paired with a spherical metallic thumb knob and real-time monospace value readout.",
      preview: (
        <div className="max-w-md w-full">
          <ImmortalSlider
            label="Specular Damping"
            value={sliderVal}
            onChange={setSliderVal}
          />
        </div>
      ),
      reactSnippet: `import { ImmortalSlider } from "./components/ImmortalComponents";
import { useState } from "react";

export function SliderDemo() {
  const [val, setVal] = useState(65);
  return (
    <ImmortalSlider label="Reflectance" value={val} onChange={setVal} />
  );
}`,
      htmlSnippet: `<!-- Range Slider HTML -->
<input type="range" min="0" max="100" value="65" class="range-slider" />`,
    },
    {
      id: "tabs",
      name: "Immortal Tabs (Segmented)",
      category: "controls",
      description:
        "Carved concave pill tray with an elevated convex active indicator tab.",
      preview: (
        <div className="max-w-md w-full">
          <ImmortalTabs
            activeId={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: "code", label: "Source Code" },
              { id: "preview", label: "Live Preview" },
              { id: "logs", label: "Terminal Logs" },
            ]}
          />
        </div>
      ),
      reactSnippet: `import { ImmortalTabs } from "./components/ImmortalComponents";
import { useState } from "react";

export function TabsDemo() {
  const [tab, setTab] = useState("overview");

  return (
    <ImmortalTabs
      activeId={tab}
      onChange={setTab}
      tabs={[
        { id: "overview", label: "Overview" },
        { id: "metrics", label: "Live Metrics" },
        { id: "settings", label: "Settings" }
      ]}
    />
  );
}`,
      htmlSnippet: `<!-- Segmented Control HTML -->
<div class="tabs-bar">
  <button class="tab-btn active">Overview</button>
  <button class="tab-btn">Live Metrics</button>
</div>`,
    },
    {
      id: "badge",
      name: "Immortal Badges",
      category: "surfaces",
      description:
        "Subtly elevated capsule pill with a glowing LED status dot for system health, alerts, or version tags.",
      preview: (
        <div className="flex flex-wrap items-center gap-3">
          <ImmortalBadge dotColor="white">Immortal v3.0</ImmortalBadge>
          <ImmortalBadge dotColor="green">Node Online (99.98%)</ImmortalBadge>
          <ImmortalBadge dotColor="amber">Latency Spike (42ms)</ImmortalBadge>
          <ImmortalBadge dotColor="crimson">Circuit Open</ImmortalBadge>
        </div>
      ),
      reactSnippet: `import { ImmortalBadge } from "./components/ImmortalComponents";

export function BadgeDemo() {
  return (
    <div className="flex gap-2">
      <ImmortalBadge dotColor="green">Cluster Healthy</ImmortalBadge>
      <ImmortalBadge dotColor="amber">High Load</ImmortalBadge>
    </div>
  );
}`,
      htmlSnippet: `<!-- Badge HTML -->
<span class="badge"><span class="status-dot green"></span>Cluster Healthy</span>`,
    },
    {
      id: "textarea",
      name: "Immortal Textarea",
      category: "inputs",
      description:
        "A recessed multi-line field using the same shared surface and material system.",
      preview: (
        <div className="w-full max-w-md">
          <ImmortalTextarea
            aria-label="Message"
            rows={4}
            placeholder="Write a message to your team…"
          />
        </div>
      ),
      reactSnippet: `import { ImmortalTextarea } from './components/ImmortalComponents';

export function TextareaDemo() {
  return <ImmortalTextarea aria-label="Message" rows={4} placeholder="Write a message…" />;
}`,
      htmlSnippet: "",
    },
    {
      id: "card",
      name: "Immortal Card",
      category: "surfaces",
      description:
        "Compose headings, badges, content, and actions on the original elevated surface.",
      preview: (
        <div className="w-full max-w-md">
          <ImmortalCard
            title="Project overview"
            description="Your workspace is ready."
            badge={<ImmortalBadge dotColor="green">Active</ImmortalBadge>}
          >
            <p className="text-sm leading-7 text-zinc-400">
              A shared surface for content and controls.
            </p>
            <div>
              <ImmortalButton size="sm">Open workspace</ImmortalButton>
            </div>
          </ImmortalCard>
        </div>
      ),
      reactSnippet: `import { ImmortalCard, ImmortalBadge, ImmortalButton } from './components/ImmortalComponents';

export function CardDemo() {
  return (
    <ImmortalCard title="Project overview" description="Your workspace is ready."
      badge={<ImmortalBadge dotColor="green">Active</ImmortalBadge>}>
      <p>A shared surface for content and controls.</p>
      <ImmortalButton size="sm">Open workspace</ImmortalButton>
    </ImmortalCard>
  );
}`,
      htmlSnippet: "",
    },
    {
      id: "modal",
      name: "Immortal Modal",
      category: "surfaces",
      description:
        "A focused dialog with the existing beveled frame and standard footer actions.",
      preview: (
        <>
          <ImmortalButton onClick={() => setModalOpen(true)}>
            Open modal
          </ImmortalButton>
          <ImmortalModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Project settings"
            description="A focused space for your next action."
          >
            <p>Your modal content goes here.</p>
          </ImmortalModal>
        </>
      ),
      reactSnippet: `import { useState } from 'react';
import { ImmortalButton } from './components/ImmortalComponents';
import { ImmortalModal } from './components/ImmortalModal';

export function ModalDemo() {
  const [open, setOpen] = useState(false);
  return <>
    <ImmortalButton onClick={() => setOpen(true)}>Open modal</ImmortalButton>
    <ImmortalModal isOpen={open} onClose={() => setOpen(false)} title="Project settings">
      <p>Your modal content goes here.</p>
    </ImmortalModal>
  </>;
}`,
      htmlSnippet: "",
    },
    {
      id: "toast",
      name: "Toast notifications",
      category: "surfaces",
      description:
        "Use the existing ToastProvider to show brief feedback after an action.",
      preview: (
        <div className="flex flex-wrap gap-3">
          <ImmortalButton
            onClick={() =>
              toast({
                title: "Changes saved",
                description: "Your workspace is up to date.",
                type: "success",
              })
            }
          >
            Show success
          </ImmortalButton>
          <ImmortalButton
            variant="recessed"
            onClick={() =>
              toast({ title: "Something needs attention", type: "warning" })
            }
          >
            Show warning
          </ImmortalButton>
        </div>
      ),
      reactSnippet: `import { ImmortalButton } from './components/ImmortalComponents';
import { useToast } from './components/ImmortalToast';

// Render this component inside ToastProvider.
export function ToastDemo() {
  const { toast } = useToast();
  return <ImmortalButton onClick={() => toast({
    title: 'Changes saved',
    description: 'Your workspace is up to date.',
    type: 'success',
  })}>Save changes</ImmortalButton>;
}`,
      htmlSnippet: "",
    },
  ];

  const currentItem = components.find((c) => c.id === componentId)!;
  const info = componentById(componentId)!;
  const index = componentCatalog.findIndex((c) => c.id === componentId);
  const previous = componentCatalog[index - 1];
  const next = componentCatalog[index + 1];

  return (
    <article className="doc-article min-w-0">
      <header className="mb-8">
        <p className="site-eyebrow">
          <a href="#/components" className="hover:text-zinc-200">
            COMPONENTS
          </a>{" "}
          / {info.category.toUpperCase()}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="site-page-title">{info.name}</h1>
          <a
            href={`https://github.com/fre2d0m/immortal-ui/blob/main/${info.source}`}
            target="_blank"
            rel="noreferrer"
            className="site-text-link text-xs"
          >
            View source <ExternalLink size={13} />
          </a>
        </div>
        <p className="site-page-description">{info.summary}</p>
      </header>
      <section id="preview" className="scroll-mt-24">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-300">Preview</h2>
          <span className="site-eyebrow">INTERACTIVE</span>
        </div>
        <div
          style={{
            backgroundImage: "var(--bg-card), var(--border-rim-subtle)",
            backgroundOrigin: "padding-box, border-box",
            backgroundClip: "padding-box, border-box",
            boxShadow: "var(--shadow-convex)",
          }}
          className="flex min-h-[230px] items-center justify-center rounded-2xl border border-transparent px-5 py-9 sm:px-8"
        >
          {currentItem.preview}
        </div>
        <p className="mt-3 text-xs leading-6 text-zinc-500">
          {currentItem.description}
        </p>
      </section>
      <section id="usage" className="doc-section">
        <h2>Usage</h2>
        <p>
          Import from your copied component files. The paths below assume this
          example lives in <code>src/App.tsx</code>.
        </p>
        <CodeBlock
          code={currentItem.reactSnippet}
          label={`React / TSX · ${info.exportName}`}
        />
        {currentItem.htmlSnippet && (
          <details className="mt-4 rounded-xl border border-white/[0.08] p-4">
            <summary className="cursor-pointer text-xs text-zinc-400">
              HTML / CSS style reference
            </summary>
            <p className="my-3 text-xs leading-6 text-zinc-500">
              A visual reference from the original showcase. Use the React
              implementation for interactive behavior and the full material
              system.
            </p>
            <CodeBlock
              code={currentItem.htmlSnippet}
              label="HTML / CSS reference"
            />
          </details>
        )}
      </section>
      <section id="setup" className="doc-section">
        <h2>Setup & dependencies</h2>
        <p>
          Copy <code>{info.source}</code> together with{" "}
          <code>AudioEngine.ts</code> and <code>WebGLMetalEngine.tsx</code>.
          Modal also uses <code>ImmortalComponents.tsx</code>; Toast requires{" "}
          <code>ToastProvider</code> around your interface.
        </p>
        <p>
          Use React, <code>lucide-react</code>, Tailwind CSS 4, and the shared
          stylesheet. Wrap previews in <code>MetalConfigProvider</code> to
          choose the global material.
        </p>
        <a href="#/docs/getting-started" className="site-text-link">
          Follow the complete setup guide <ArrowRight size={14} />
        </a>
      </section>
      <section id="api" className="doc-section">
        <h2>API reference</h2>
        <p>
          {componentId === "toast" ? (
            <>
              Options passed to the <code>toast()</code> function returned by{" "}
              <code>useToast()</code>.
            </>
          ) : (
            <>
              Component-specific props for <code>{info.exportName}</code>.
              Input, Textarea, and Button also accept their native HTML
              attributes.
            </>
          )}
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="doc-api-table">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              {info.props.map(([name, type, defaultValue]) => (
                <tr key={name}>
                  <td>
                    <code>{name}</code>
                  </td>
                  <td>{type}</td>
                  <td>{defaultValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section id="related" className="doc-section">
        <h2>Explore further</h2>
        <p>
          See components together in a complete layout, or continue with a
          related component.
        </p>
        <a href="#/examples/cards" className="site-text-link">
          View card examples <ArrowRight size={14} />
        </a>
        <div className="mt-5 flex flex-wrap gap-2">
          {info.related.map((id) => (
            <a
              key={id}
              href={`#/components/${id}`}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-white/[0.04]"
            >
              {componentById(id)?.name}
            </a>
          ))}
        </div>
      </section>
      <nav
        aria-label="Previous and next component"
        className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-7"
      >
        {previous ? (
          <a href={`#/components/${previous.id}`} className="site-text-link">
            <ArrowLeft size={14} />
            {previous.name}
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a
            href={`#/components/${next.id}`}
            className="site-text-link justify-self-end"
          >
            {next.name}
            <ArrowRight size={14} />
          </a>
        )}
      </nav>
    </article>
  );
};
