import React, { useState } from 'react';
import { Copy, Check, Code2, Layers } from 'lucide-react';
import {
  ImmortalButton,
  ImmortalInput,
  ImmortalSwitch,
  ImmortalCheckbox,
  ImmortalRadioGroup,
  ImmortalSlider,
  ImmortalSelect,
  ImmortalTabs,
  ImmortalBadge,
} from './ImmortalComponents';
import { useToast } from './ImmortalToast';

interface DocItem {
  id: string;
  name: string;
  description: string;
  category: 'buttons' | 'inputs' | 'controls' | 'surfaces';
  preview: React.ReactNode;
  reactSnippet: string;
  htmlSnippet: string;
}

export const ComponentDocs: React.FC = () => {
  const { toast } = useToast();
  const [activeComponent, setActiveComponent] = useState<string>('button');
  const [codeTab, setCodeTab] = useState<'react' | 'html'>('react');
  const [copied, setCopied] = useState(false);

  // Demo states for previews
  const [btnLoading, setBtnLoading] = useState(false);
  const [switchVal, setSwitchVal] = useState(true);
  const [checkVal, setCheckVal] = useState(true);
  const [radioVal, setRadioVal] = useState('raycast');
  const [sliderVal, setSliderVal] = useState(65);
  const [selectVal, setSelectVal] = useState('v1');
  const [activeTab, setActiveTab] = useState('code');

  const components: DocItem[] = [
    {
      id: 'button',
      name: 'Immortal Button',
      category: 'buttons',
      description:
        'Convex micro-curved surface with a 1px 135° dual-specular rim. Supports optional hover angular sweep (90°, 180°, 360°) and physical metal shaders.',
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
            {btnLoading ? 'Processing...' : 'Test Loading'}
          </ImmortalButton>
        </div>
      ),
      reactSnippet: `// React / TSX Usage (supports per-button material and sweepDeg props)
import { ImmortalButton } from "@/components/ImmortalComponents";

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
      id: 'input',
      name: 'Immortal Input',
      category: 'inputs',
      description:
        'Deep recessed inner shadow creates a carved physical slot with a focused diagonal specular rim, leading icon, and keyboard shortcut badge.',
      preview: (
        <div className="flex flex-col gap-3 max-w-md w-full">
          <ImmortalInput
            placeholder="Search nodes or run a command..."
            kbd="⌘K"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      reactSnippet: `import { ImmortalInput } from "@/components/ImmortalComponents";
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
      id: 'switch',
      name: 'Immortal Switch',
      category: 'controls',
      description:
        'Pure opaque obsidian subcard backing prevents grey bleed-through, paired with a recessed track and an illuminated jewel indicator thumb.',
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
      reactSnippet: `import { ImmortalSwitch } from "@/components/ImmortalComponents";
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
      id: 'select',
      name: 'Immortal Select',
      category: 'inputs',
      description:
        'Custom dark skeuomorphic dropdown with a floating beveled popover, deep ambient shadow, and option descriptions.',
      preview: (
        <div className="max-w-md w-full">
          <ImmortalSelect
            label="Engine Kernel"
            value={selectVal}
            onChange={setSelectVal}
            options={[
              {
                value: 'v1',
                label: 'Grok-3 Metal Reasoning Engine',
                description: 'Low-latency hardware raster acceleration',
              },
              {
                value: 'v2',
                label: 'Linear Instant Pipeline',
                description: 'Sub-millisecond local-first sync',
              },
              {
                value: 'v3',
                label: 'Raycast Native Runtime',
                description: 'Global hotkey launcher & extensions',
              },
            ]}
          />
        </div>
      ),
      reactSnippet: `import { ImmortalSelect } from "@/components/ImmortalComponents";
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
      id: 'controls',
      name: 'Checkbox & Radio Group',
      category: 'controls',
      description:
        'Recessed physical sockets that illuminate with high-contrast metallic silver or active alloy accents when checked.',
      preview: (
        <div className="flex flex-col gap-4 max-w-md w-full">
          <div className="flex gap-4">
            <ImmortalCheckbox
              checked={checkVal}
              onChange={setCheckVal}
              label="Persist session state"
              hint="Save preferences in local storage"
            />
          </div>
          <ImmortalRadioGroup
            name="demo-radio"
            value={radioVal}
            onChange={setRadioVal}
            options={[
              { value: 'raycast', label: 'Obsidian Dark' },
              { value: 'titanium', label: 'Brushed Titanium' },
            ]}
          />
        </div>
      ),
      reactSnippet: `import { ImmortalCheckbox, ImmortalRadioGroup } from "@/components/ImmortalComponents";
import { useState } from "react";

export function ControlsDemo() {
  const [remember, setRemember] = useState(true);
  const [theme, setTheme] = useState("dark");

  return (
    <>
      <ImmortalCheckbox checked={remember} onChange={setRemember} label="Remember settings" />
      <ImmortalRadioGroup
        name="theme"
        value={theme}
        onChange={setTheme}
        options={[
          { value: "dark", label: "Obsidian Dark" },
          { value: "metal", label: "Brushed Titanium" }
        ]}
      />
    </>
  );
}`,
      htmlSnippet: `<!-- Checkbox HTML -->
<label class="check-item">
  <input type="checkbox" checked />
  <span class="check-box">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
  <span>Auto-save configuration</span>
</label>`,
    },
    {
      id: 'slider',
      name: 'Immortal Slider',
      category: 'controls',
      description:
        'Recessed groove track paired with a spherical metallic thumb knob and real-time monospace value readout.',
      preview: (
        <div className="max-w-md w-full">
          <ImmortalSlider
            label="Specular Damping"
            value={sliderVal}
            onChange={setSliderVal}
          />
        </div>
      ),
      reactSnippet: `import { ImmortalSlider } from "@/components/ImmortalComponents";
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
      id: 'tabs',
      name: 'Immortal Tabs (Segmented)',
      category: 'controls',
      description:
        'Carved concave pill tray with an elevated convex active indicator tab.',
      preview: (
        <div className="max-w-md w-full">
          <ImmortalTabs
            activeId={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'code', label: 'Source Code' },
              { id: 'preview', label: 'Live Preview' },
              { id: 'logs', label: 'Terminal Logs' },
            ]}
          />
        </div>
      ),
      reactSnippet: `import { ImmortalTabs } from "@/components/ImmortalComponents";
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
      id: 'badge',
      name: 'Immortal Badges',
      category: 'surfaces',
      description:
        'Subtly elevated capsule pill with a glowing LED status dot for system health, alerts, or version tags.',
      preview: (
        <div className="flex flex-wrap items-center gap-3">
          <ImmortalBadge dotColor="white">Immortal v3.0</ImmortalBadge>
          <ImmortalBadge dotColor="green">Node Online (99.98%)</ImmortalBadge>
          <ImmortalBadge dotColor="amber">Latency Spike (42ms)</ImmortalBadge>
          <ImmortalBadge dotColor="crimson">Circuit Open</ImmortalBadge>
        </div>
      ),
      reactSnippet: `import { ImmortalBadge } from "@/components/ImmortalComponents";

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
  ];

  const currentItem = components.find((c) => c.id === activeComponent) || components[0];

  const copyCode = () => {
    const code = codeTab === 'react' ? currentItem.reactSnippet : currentItem.htmlSnippet;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: 'Code Copied to Clipboard',
      description: `${currentItem.name} (${codeTab.toUpperCase()}) snippet is ready to paste`,
      type: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-300">
            Component Documentation & Code Generator
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Inspect interactive previews and copy production-ready React (TSX) or vanilla HTML/CSS code.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Component Navigation Sidebar */}
        <div className="lg:col-span-3 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
          {components.map((comp) => {
            const isSelected = comp.id === activeComponent;
            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => setActiveComponent(comp.id)}
                style={
                  isSelected
                    ? {
                        backgroundImage: `var(--bg-subcard), var(--border-rim)`,
                        backgroundOrigin: 'padding-box, border-box',
                        backgroundClip: 'padding-box, border-box',
                        boxShadow: `0 4px 12px rgba(0,0,0,0.65)`,
                      }
                    : {}
                }
                className={`
                  px-3.5 py-2.5 rounded-xl border border-transparent text-left text-xs sm:text-sm font-medium
                  transition-all duration-150 whitespace-nowrap cursor-pointer flex items-center justify-between
                  ${
                    isSelected
                      ? 'text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }
                `}
              >
                <span>{comp.name}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white/80 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Right Preview and Code Area */}
        <div className="lg:col-span-9 flex flex-col gap-5">
          {/* Component Live Stage */}
          <div
            style={{
              backgroundImage: `var(--bg-card), var(--border-rim-subtle)`,
              backgroundOrigin: 'padding-box, border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: `var(--shadow-convex)`,
            }}
            className="p-6 rounded-2xl sm:rounded-3xl border border-transparent flex flex-col gap-4"
          >
            <div className="flex items-start justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">{currentItem.name}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{currentItem.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                  Live Preview
                </span>
              </div>
            </div>

            {/* Stage Box */}
            <div
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%), var(--bg-concave)`,
                boxShadow: `var(--shadow-concave)`,
              }}
              className="min-h-[160px] p-8 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden"
            >
              {currentItem.preview}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div
            style={{
              backgroundImage: `var(--bg-subcard), var(--border-rim-subtle)`,
              backgroundOrigin: 'padding-box, border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: `0 8px 24px rgba(0,0,0,0.8)`,
            }}
            className="rounded-2xl border border-transparent overflow-hidden"
          >
            {/* Header / Tabs */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCodeTab('react')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    codeTab === 'react'
                      ? 'bg-zinc-800 text-white font-medium border border-white/10'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  React (TSX)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab('html')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    codeTab === 'html'
                      ? 'bg-zinc-800 text-white font-medium border border-white/10'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  HTML / CSS
                </button>
              </div>

              <ImmortalButton variant="recessed" size="sm" onClick={copyCode} className="h-7 text-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </ImmortalButton>
            </div>

            {/* Code Block */}
            <div className="p-4 bg-[#050507] overflow-x-auto text-xs font-mono text-zinc-300 leading-relaxed max-h-[360px] scrollbar-thin">
              <pre>
                <code>{codeTab === 'react' ? currentItem.reactSnippet : currentItem.htmlSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
