import React, { useState } from 'react';
import {
  ImmortalButton,
  ImmortalInput,
  ImmortalTextarea,
  ImmortalSwitch,
  ImmortalCheckbox,
  ImmortalRadioGroup,
  ImmortalSlider,
  ImmortalSelect,
  ImmortalTabs,
  ImmortalBadge,
  ImmortalCard,
} from './components/ImmortalComponents';
import { HeroEmblem } from './components/HeroEmblem';
import { LightingLab } from './components/LightingLab';
import { LiquidChromeLab } from './components/LiquidChromeLab';
import { ComponentDocs } from './components/ComponentDocs';
import {
  ShadcnCardsExample,
  ShadcnDashboardExample,
  ShadcnPlaygroundExample,
} from './components/ShadcnExamplesGrid';
import { ToastProvider, useToast } from './components/ImmortalToast';
import { ImmortalModal } from './components/ImmortalModal';
import { audioEngine } from './components/AudioEngine';
import {
  MetalConfigProvider,
  METAL_MATERIALS,
  MetalMaterialId,
  useMetalConfig,
} from './components/WebGLMetalEngine';
import {
  LayoutGrid,
  Code2,
  SlidersHorizontal,
  Search,
  Sparkles,
  Zap,
  Terminal,
  Settings,
  Cpu,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowRight,
  Layers,
  Activity,
  Play,
  RotateCcw,
} from 'lucide-react';

type MainTabId =
  | 'examples-cards'
  | 'examples-dashboard'
  | 'examples-playground'
  | 'components'
  | 'metal-lab'
  | 'docs';

function AppContent() {
  const { toast } = useToast();
  const { material, setMaterial } = useMetalConfig();
  const activePreset = METAL_MATERIALS[material] || METAL_MATERIALS.classic;
  const isClassic = !activePreset.isWebGLMetal;

  // Main shadcn-style navigation tab (defaults to shadcn's signature 'Cards' example grid)
  const [activeTab, setActiveTab] = useState<MainTabId>('examples-cards');

  // Toggle for expanded Optical & Shader Customizer drawer
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Development command copy state
  const [copiedCommand, setCopiedCommand] = useState(false);

  // Modal demo state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Foundational Components tab state
  const [btnLoading, setBtnLoading] = useState(false);
  const [activeSegmentTab, setActiveSegmentTab] = useState('overview');
  const [searchVal, setSearchVal] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('grok');
  const [showPassword, setShowPassword] = useState(false);
  const [enableRayTracing, setEnableRayTracing] = useState(true);
  const [enableLowPower, setEnableLowPower] = useState(false);
  const [specularStrength, setSpecularStrength] = useState(68);
  const [saveTokenCheck, setSaveTokenCheck] = useState(true);
  const [hapticCheck, setHapticCheck] = useState(true);
  const [themeMode, setThemeMode] = useState('obsidian');

  // Composite Form example state
  const [formName, setFormName] = useState('Immortal-Worker-01');
  const [formEngine, setFormEngine] = useState('linear');
  const [formMaxTokens, setFormMaxTokens] = useState(4096);
  const [formCache, setFormCache] = useState(true);

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playClick('metal');
    toast({
      title: 'Configuration Saved',
      description: `Node [${formName}] tactile parameters synced to local environment`,
      type: 'success',
    });
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText('npm run dev');
    setCopiedCommand(true);
    audioEngine.playClick('button');
    toast({
      title: 'Development Command Copied',
      description: 'npm run dev',
      type: 'success',
    });
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleQuickMaterialSwitch = (matId: MetalMaterialId) => {
    const mat = METAL_MATERIALS[matId];
    audioEngine.playClick(matId === 'classic' ? 'button' : 'metal');
    setMaterial(matId);
    toast({
      title: `Global Style: ${mat.name}`,
      description:
        matId === 'classic'
          ? 'Restored default Pure CSS 135° dual-specular Classic Dark style'
          : `Applied WebGL ${mat.enName} physical metal shader across all components`,
      type: 'success',
    });
  };

  const materialList = Object.values(METAL_MATERIALS);

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col pb-24">
      {/* =====================================================================
          1. Top Sticky Navbar (ui.shadcn.com style)
         ===================================================================== */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#070708]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Brand & Nav Links */}
          <div className="flex items-center gap-6">
            <div
              onClick={() => {
                audioEngine.playClick('button');
                setActiveTab('examples-cards');
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div
                style={{
                  backgroundImage: `var(--bg-convex), var(--border-rim)`,
                  backgroundOrigin: 'padding-box, border-box',
                  backgroundClip: 'padding-box, border-box',
                  boxShadow: `var(--shadow-convex-sm)`,
                }}
                className="w-8 h-8 rounded-lg border border-transparent flex items-center justify-center shrink-0"
              >
                <Zap className="w-4 h-4" style={{ color: activePreset.accentHex }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-zinc-100 tracking-tight">
                  Immortal UI
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-white/10 hidden sm:inline-block">
                  v3.0
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('examples-cards')}
                className={`cursor-pointer transition-colors ${
                  activeTab.startsWith('examples-')
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Examples
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('components')}
                className={`cursor-pointer transition-colors ${
                  activeTab === 'components'
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Components
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('metal-lab')}
                className={`cursor-pointer transition-colors flex items-center gap-1 ${
                  activeTab === 'metal-lab'
                    ? 'text-amber-300 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Metals</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('docs')}
                className={`cursor-pointer transition-colors ${
                  activeTab === 'docs'
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Docs & Code
              </button>
            </nav>
          </div>

          {/* Right: Current Style Indicator + Customize Toggle + Modal Test */}
          <div className="flex items-center gap-2">
            {/* Active Style Indicator Pill */}
            <button
              type="button"
              onClick={() => setShowCustomizer(!showCustomizer)}
              style={{
                backgroundImage: `var(--bg-convex), var(--border-rim-subtle)`,
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',
              }}
              className="h-8 px-3 rounded-lg border border-transparent text-xs font-medium flex items-center gap-2 cursor-pointer text-zinc-200 hover:text-white transition-all"
              title="Toggle Optical & Metal Shader Customizer"
            >
              <span
                style={{ background: activePreset.swatchGradient }}
                className="w-3 h-3 rounded-full border border-white/30"
              />
              <span className="hidden sm:inline">Style:</span>
              <span style={{ color: activePreset.accentHex }} className="font-semibold">
                {activePreset.name}
              </span>
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
            </button>

            {!isClassic && (
              <button
                type="button"
                onClick={() => handleQuickMaterialSwitch('classic')}
                className="h-8 px-2.5 rounded-lg bg-zinc-900 border border-white/10 text-[11px] text-zinc-300 hover:text-white cursor-pointer flex items-center gap-1 transition-colors"
                title="Switch back to default Classic Dark style"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset Default</span>
              </button>
            )}

            <ImmortalButton
              variant="metallic"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="hidden sm:inline-flex"
            >
              Modal Demo
            </ImmortalButton>
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. shadcn/ui Hero Section + 1:1 Reference Emblem + Instant Style Bar
         ===================================================================== */}
      <section className="relative border-b border-white/[0.06] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-7 sm:pt-12 sm:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 8 Cols: shadcn/ui Hero Typography & Actions */}
            <div className="lg:col-span-8 flex flex-col items-start text-left">
              {/* Announcement Pill */}
              <button
                type="button"
                onClick={() => setActiveTab('metal-lab')}
                style={{
                  backgroundImage: `var(--bg-convex), var(--border-rim-subtle)`,
                  backgroundOrigin: 'padding-box, border-box',
                  backgroundClip: 'padding-box, border-box',
                }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-transparent text-xs text-zinc-300 hover:text-white mb-5 cursor-pointer transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Default Classic Dark (1px 135° Dual-Specular Rim)</span>
                <span className="text-zinc-600">|</span>
                <span style={{ color: activePreset.accentHex }} className="font-medium flex items-center gap-1">
                  Switchable to 6 WebGL Physical Metals <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400 leading-[1.15]">
                Build with Immortal UI.
              </h1>

              <p className="text-sm sm:text-base text-zinc-400 mt-4 max-w-2xl leading-relaxed">
                Beautifully crafted, copy-and-paste dark skeuomorphic components inspired by{' '}
                <span className="text-zinc-200 font-medium">shadcn/ui</span>, Linear, and X.
                Defaults to <span className="text-zinc-100 font-medium">Classic Dark (1px 135° dual-specular micro-bevels + convex/concave obsidian depth)</span>,
                with built-in <span className="text-amber-300 font-medium">WebGL GLSL physical metal shaders</span> for 24K Gold, Platinum, Obsidian Titanium, and Cobalt Blue.
              </p>

              {/* Hero CTA Buttons + Development Command */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <ImmortalButton
                  variant="metallic"
                  onClick={() => setActiveTab('docs')}
                >
                  Get Started
                </ImmortalButton>

                <ImmortalButton
                  variant="default"
                  onClick={() => setActiveTab('components')}
                >
                  Browse Components
                </ImmortalButton>

                <button
                  type="button"
                  onClick={handleCopyCommand}
                  style={{
                    backgroundImage: `var(--bg-concave), var(--border-rim-subtle)`,
                    backgroundOrigin: 'padding-box, border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: `var(--shadow-concave)`,
                  }}
                  className="h-10 px-3.5 rounded-xl border border-transparent font-mono text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                  <span>npm run dev</span>
                  {copiedCommand ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Right 4 Cols: 1:1 Reference X Emblem Interactive Showcase */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center">
              <HeroEmblem compact />
            </div>
          </div>

          {/* ===============================================================
              Theme & Metal Switcher Strip (Like ui.shadcn.com Theme Bar)
             =============================================================== */}
          <div className="mt-8 pt-5 border-t border-white/[0.06] flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Sparkles className="w-3.5 h-3.5" style={{ color: activePreset.accentHex }} />
                <span className="font-medium text-zinc-200">Global Style & Material Preset:</span>
                <span className="hidden sm:inline text-zinc-500">
                  (Classic Dark by default — click any metal to switch live)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomizer(!showCustomizer)}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showCustomizer ? 'Hide Optical Customizer ▲' : 'Customize Optics & Shaders ▼'}</span>
              </button>
            </div>

            {/* 7 Style Pills: Classic Default + 6 WebGL Metals */}
            <div className="flex flex-wrap items-center gap-2">
              {materialList.map((mat) => {
                const isSelected = mat.id === material;
                const isMatClassic = !mat.isWebGLMetal;
                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => handleQuickMaterialSwitch(mat.id as MetalMaterialId)}
                    style={{
                      backgroundImage: `${
                        isSelected ? 'var(--bg-convex-hover)' : 'var(--bg-subcard)'
                      }, ${isSelected ? mat.cssBorderRim : 'var(--border-rim-subtle)'}`,
                      backgroundOrigin: 'padding-box, border-box',
                      backgroundClip: 'padding-box, border-box',
                      boxShadow: isSelected ? 'var(--shadow-convex-sm)' : 'none',
                    }}
                    className={`h-9 px-3.5 rounded-xl border border-transparent text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'text-white font-semibold scale-[1.01]'
                        : 'text-zinc-400 hover:text-zinc-200 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <span
                      style={{ background: mat.swatchGradient }}
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                    />
                    <span style={isSelected ? { color: mat.accentHex } : undefined}>
                      {mat.name}
                    </span>
                    {isMatClassic && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-zinc-200">
                        Default
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. Collapsible Optical & Shader Customizer Panel
         ===================================================================== */}
      {showCustomizer && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 w-full animate-in fade-in duration-200">
          <LightingLab />
        </div>
      )}

      {/* =====================================================================
          4. shadcn/ui Examples Navigation Bar + Main Workspace
         ===================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 w-full flex-1 flex flex-col gap-6">
        {/* Horizontal Tab Bar (Identical to ui.shadcn.com) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'examples-cards', label: 'Examples · Cards', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
              { id: 'examples-dashboard', label: 'Dashboard', icon: <Activity className="w-3.5 h-3.5" /> },
              { id: 'examples-playground', label: 'Playground', icon: <Play className="w-3.5 h-3.5" /> },
              { id: 'components', label: 'Components', icon: <Layers className="w-3.5 h-3.5" /> },
              { id: 'metal-lab', label: 'Metal Lab', icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: 'docs', label: 'Code & Docs', icon: <Code2 className="w-3.5 h-3.5" /> },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    audioEngine.playClick('button');
                    setActiveTab(tab.id as MainTabId);
                  }}
                  style={
                    active
                      ? {
                          backgroundImage: `var(--bg-convex), var(--border-rim)`,
                          backgroundOrigin: 'padding-box, border-box',
                          backgroundClip: 'padding-box, border-box',
                          boxShadow: `var(--shadow-convex-sm)`,
                          color: activePreset.accentHex,
                        }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-xl border border-transparent text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                    active
                      ? 'font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <span>Renderer:</span>
            <span style={{ color: activePreset.accentHex }} className="font-semibold">
              {isClassic ? 'Pure CSS Classic Dark (Default)' : `WebGL GLSL (${activePreset.enName})`}
            </span>
          </div>
        </div>

        {/* =================================================================
            VIEW 1: shadcn/ui Cards Grid (Default Landing Page View)
           ================================================================= */}
        {activeTab === 'examples-cards' && <ShadcnCardsExample />}

        {/* =================================================================
            VIEW 2: shadcn/ui Dashboard Example
           ================================================================= */}
        {activeTab === 'examples-dashboard' && <ShadcnDashboardExample />}

        {/* =================================================================
            VIEW 3: shadcn/ui Playground Example
           ================================================================= */}
        {activeTab === 'examples-playground' && <ShadcnPlaygroundExample />}

        {/* =================================================================
            VIEW 4: Foundational Components Catalog (Buttons, Inputs, Controls)
           ================================================================= */}
        {activeTab === 'components' && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Buttons */}
              <ImmortalCard
                title="Buttons & Micro-Interactions"
                description="Convex surfaces, 1px 135° dual-specular rims, and tactile press feedback"
                badge={<ImmortalBadge dotColor="white">Immortal</ImmortalBadge>}
              >
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400">
                    Primary Variants (Active Style: {activePreset.name})
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <ImmortalButton variant="default">Default Rim</ImmortalButton>
                    <ImmortalButton variant="metallic">Metallic Primary</ImmortalButton>
                    <ImmortalButton variant="recessed">Recessed</ImmortalButton>
                    <ImmortalButton variant="danger">Danger</ImmortalButton>
                  </div>
                </div>

                {/* Multi-Style / Multi-Metal Material Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400 flex items-center justify-between">
                    <span>Per-Button Material Overrides (material prop)</span>
                    <span className="text-[10px] font-mono text-zinc-500">Mixable</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ImmortalButton size="sm" material="classic">
                      Classic CSS
                    </ImmortalButton>
                    <ImmortalButton size="sm" material="gold">
                      24K Gold
                    </ImmortalButton>
                    <ImmortalButton size="sm" material="platinum">
                      Platinum
                    </ImmortalButton>
                    <ImmortalButton size="sm" material="obsidian">
                      Obsidian
                    </ImmortalButton>
                    <ImmortalButton size="sm" material="cobalt">
                      Cobalt Blue
                    </ImmortalButton>
                    <ImmortalButton size="sm" material="rosegold">
                      Rose Gold
                    </ImmortalButton>
                  </div>
                </div>

                {/* Per-Button Sweep Angle Comparison */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400 flex items-center justify-between">
                    <span>Optional Hover Specular Sweep (sweepDeg)</span>
                    <span className="text-[10px] font-mono text-zinc-500">Hover to test</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ImmortalButton variant="default" size="sm" sweepDeg={90}>
                      Sweep 90°
                    </ImmortalButton>
                    <ImmortalButton variant="default" size="sm" sweepDeg={180}>
                      Sweep 180°
                    </ImmortalButton>
                    <ImmortalButton variant="default" size="sm" sweepDeg={360}>
                      Sweep 360°
                    </ImmortalButton>
                  </div>
                </div>

                {/* Sizes and Icons */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400">Icon Buttons & Sizes</div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <ImmortalButton
                      variant="default"
                      size="icon"
                      aria-label="X Emblem"
                      title="X Emblem Icon Button"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </ImmortalButton>

                    <ImmortalButton variant="default" size="icon" aria-label="Settings">
                      <Settings className="w-4 h-4 text-zinc-300" />
                    </ImmortalButton>

                    <ImmortalButton variant="recessed" size="sm">
                      Small (Sm)
                    </ImmortalButton>

                    <ImmortalButton
                      variant="default"
                      size="sm"
                      loading={btnLoading}
                      onClick={() => {
                        setBtnLoading(true);
                        setTimeout(() => setBtnLoading(false), 1200);
                      }}
                    >
                      {btnLoading ? 'Loading' : 'Async Action'}
                    </ImmortalButton>
                  </div>
                </div>

                {/* Segmented Tabs */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400">Segmented Tabs</div>
                  <ImmortalTabs
                    activeId={activeSegmentTab}
                    onChange={setActiveSegmentTab}
                    tabs={[
                      { id: 'overview', label: 'Overview' },
                      { id: 'nodes', label: 'Nodes' },
                      { id: 'keys', label: 'API Keys' },
                    ]}
                  />
                </div>
              </ImmortalCard>

              {/* Card 2: Recessed Inputs */}
              <ImmortalCard
                title="Recessed Inputs & Select"
                description="Carved inner shadow slots with focused diagonal specular rims"
                badge={<ImmortalBadge dotColor="amber">Form</ImmortalBadge>}
              >
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400">
                    Command Search Input
                  </label>
                  <ImmortalInput
                    placeholder="Search components, commands, or docs..."
                    kbd="⌘K"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <ImmortalSelect
                    label="Custom Select Dropdown"
                    value={selectedEngine}
                    onChange={setSelectedEngine}
                    options={[
                      {
                        value: 'grok',
                        label: 'Grok-3 Metal Reasoning Engine',
                        description: 'Ultra-low latency with real-time bevel shading',
                      },
                      {
                        value: 'linear',
                        label: 'Linear Instant Render Kernel',
                        description: 'Sub-millisecond sync & keyboard-first navigation',
                      },
                      {
                        value: 'raycast',
                        label: 'Raycast Local Workflow',
                        description: 'System-level hotkeys and native extensions',
                      },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400">Masked Secret Input</label>
                  <div className="relative">
                    <ImmortalInput
                      type={showPassword ? 'text' : 'password'}
                      defaultValue="immortal_live_token_7709"
                      icon={<Terminal className="w-4 h-4" />}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400">Multi-line Textarea</label>
                  <ImmortalTextarea placeholder="Enter system prompt or custom micro-tactile CSS rules..." />
                </div>
              </ImmortalCard>

              {/* Card 3: Controls */}
              <ImmortalCard
                title="Switches, Sliders & Checks"
                description="Recessed tracks paired with illuminated metallic thumbs"
                badge={<ImmortalBadge dotColor="green">Interactive</ImmortalBadge>}
              >
                <div className="flex flex-col gap-3">
                  <ImmortalSwitch
                    id="sw-rt"
                    checked={enableRayTracing}
                    onChange={setEnableRayTracing}
                    label="Hardware Ray-Traced Specular"
                    hint="Enable real-time 135° diagonal edge reflections"
                  />

                  <ImmortalSwitch
                    id="sw-lp"
                    checked={enableLowPower}
                    onChange={setEnableLowPower}
                    label="Low-Power Eco Mode"
                    hint="Reduce ambient shadow spread and dot-matrix contrast"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <ImmortalSlider
                    label="Edge Specular Intensity"
                    value={specularStrength}
                    onChange={setSpecularStrength}
                  />
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <div className="text-xs font-medium text-zinc-400">
                    Checkboxes & Radio Group
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <ImmortalCheckbox
                      checked={saveTokenCheck}
                      onChange={setSaveTokenCheck}
                      label="Auto-save tokens"
                    />
                    <ImmortalCheckbox
                      checked={hapticCheck}
                      onChange={setHapticCheck}
                      label="Acoustic feedback"
                    />
                  </div>

                  <div className="pt-2 border-t border-white/[0.04]">
                    <ImmortalRadioGroup
                      name="themeModeGroup"
                      value={themeMode}
                      onChange={setThemeMode}
                      options={[
                        { value: 'obsidian', label: 'Obsidian Dark' },
                        { value: 'titanium', label: 'Brushed Titanium' },
                      ]}
                    />
                  </div>
                </div>
              </ImmortalCard>
            </div>

            {/* Composite Real-World Form Card */}
            <ImmortalCard
              title="Composite Example: AI Compute Node Configuration"
              description="Showcasing buttons, recessed inputs, sliders, and switches working together in a production form"
              badge={<ImmortalBadge dotColor="white">Production Ready</ImmortalBadge>}
              headerAction={
                <ImmortalButton
                  variant="recessed"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  Advanced Optics
                </ImmortalButton>
              }
            >
              <form onSubmit={handleSaveForm} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-zinc-400">Node Service Identifier</label>
                    <ImmortalInput
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="worker-immortal-instance"
                      icon={<Cpu className="w-4 h-4" />}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <ImmortalSelect
                      label="Scheduling Engine"
                      value={formEngine}
                      onChange={setFormEngine}
                      options={[
                        { value: 'linear', label: 'Linear-Cluster Ultra Performance' },
                        { value: 'distributed', label: 'Distributed Low-Power Scheduler' },
                        { value: 'failover', label: 'Active-Active Redundant Array' },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <ImmortalSlider
                    label="Max Context Tokens"
                    value={formMaxTokens}
                    min={1024}
                    max={8192}
                    step={512}
                    unit=" T"
                    onChange={setFormMaxTokens}
                  />

                  <ImmortalSwitch
                    checked={formCache}
                    onChange={setFormCache}
                    label="High-Speed KV Cache Warmup"
                    hint="Reduces time-to-first-token latency to 15ms"
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>System Ready · 1 pending change</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <ImmortalButton
                      type="button"
                      variant="recessed"
                      size="sm"
                      onClick={() => {
                        setFormName('Immortal-Worker-01');
                        setFormEngine('linear');
                        setFormMaxTokens(4096);
                        setFormCache(true);
                        toast({
                          title: 'Form Reset',
                          type: 'info',
                        });
                      }}
                    >
                      Reset
                    </ImmortalButton>
                    <ImmortalButton type="submit" variant="metallic" size="sm">
                      Save & Deploy
                    </ImmortalButton>
                  </div>
                </div>
              </form>
            </ImmortalCard>
          </div>
        )}

        {/* =================================================================
            VIEW 5: Liquid Chrome & Physical Metal Lab
           ================================================================= */}
        {activeTab === 'metal-lab' && <LiquidChromeLab />}

        {/* =================================================================
            VIEW 6: Component Docs & Copyable Code Generator
           ================================================================= */}
        {activeTab === 'docs' && <ComponentDocs />}
      </main>

      {/* Immortal Modal Component */}
      <ImmortalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Advanced Immortal Optics"
        description="Fine-tune diagonal specular sharpness and bevel curvature for high-DPI displays."
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Environment Configuration</label>
            <ImmortalInput defaultValue="DARK_SKEUOMORPHIC_SPECULAR_ENABLE=true" />
          </div>

          <ImmortalSwitch
            checked={true}
            onChange={() => {}}
            label="Secondary Ambient Bounce"
            hint="Simulate natural bottom-right bounce light across beveled rims"
          />

          <ImmortalSlider label="Convex Surface Depth" value={74} onChange={() => {}} />
        </div>
      </ImmortalModal>
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
