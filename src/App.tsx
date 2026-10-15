import React, { useState } from 'react';
import {
  TactileButton,
  TactileInput,
  TactileTextarea,
  TactileSwitch,
  TactileCheckbox,
  TactileRadioGroup,
  TactileSlider,
  TactileSelect,
  TactileTabs,
  TactileBadge,
  TactileCard,
} from './components/TactileComponents';
import { HeroEmblem } from './components/HeroEmblem';
import { LightingLab } from './components/LightingLab';
import { LiquidChromeLab } from './components/LiquidChromeLab';
import { ComponentDocs } from './components/ComponentDocs';
import {
  ShadcnCardsExample,
  ShadcnDashboardExample,
  ShadcnPlaygroundExample,
} from './components/ShadcnExamplesGrid';
import { ToastProvider, useToast } from './components/TactileToast';
import { TactileModal } from './components/TactileModal';
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
  const { material, setMaterial, resetDefaults } = useMetalConfig();
  const activePreset = METAL_MATERIALS[material] || METAL_MATERIALS.classic;
  const isClassic = !activePreset.isWebGLMetal;

  // Main shadcn-style navigation tab (defaults to shadcn's signature 'Cards' example grid)
  const [activeTab, setActiveTab] = useState<MainTabId>('examples-cards');

  // Toggle for expanded Optical & Shader Customizer drawer
  const [showCustomizer, setShowCustomizer] = useState(false);

  // CLI copy state
  const [copiedCli, setCopiedCli] = useState(false);

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
  const [formName, setFormName] = useState('Tactile-Worker-01');
  const [formEngine, setFormEngine] = useState('linear');
  const [formMaxTokens, setFormMaxTokens] = useState(4096);
  const [formCache, setFormCache] = useState(true);

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playClick('metal');
    toast({
      title: '配置已持久化保存',
      description: `服务节点 [${formName}] 的拟物配置参数已同步至本地环境`,
      type: 'success',
    });
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npx tactile-ui@latest init');
    setCopiedCli(true);
    audioEngine.playClick('button');
    toast({
      title: 'CLI 初始化命令已复制',
      description: 'npx tactile-ui@latest init',
      type: 'success',
    });
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleQuickMaterialSwitch = (matId: MetalMaterialId) => {
    const mat = METAL_MATERIALS[matId];
    audioEngine.playClick(matId === 'classic' ? 'button' : 'metal');
    setMaterial(matId);
    toast({
      title: `已切换全局风格：${mat.name}`,
      description:
        matId === 'classic'
          ? '已恢复默认纯 CSS 135° 对角双高光暗色轻拟物风格'
          : `全站所有组件已实时应用 WebGL ${mat.enName} 金属材质`,
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
                  tactile/ui
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
                Examples (场景示例)
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
                Components (基础组件)
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
                <span>Metals (流光金属)</span>
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
                Docs & Code (源码)
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
              title="展开/收起光学与材质定制器"
            >
              <span
                style={{ background: activePreset.swatchGradient }}
                className="w-3 h-3 rounded-full border border-white/30"
              />
              <span className="hidden sm:inline">风格：</span>
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
                title="一键切回默认经典暗色轻拟物风格"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">恢复默认轻拟物</span>
              </button>
            )}

            <TactileButton
              variant="metallic"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="hidden sm:inline-flex"
            >
              Modal 弹窗
            </TactileButton>
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
                <span>默认采用经典暗色轻拟物 (135° 对角双高光)</span>
                <span className="text-zinc-600">|</span>
                <span style={{ color: activePreset.accentHex }} className="font-medium flex items-center gap-1">
                  可随时切换 6 种 WebGL 物理金属 <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400 leading-[1.15]">
                Build your tactile component library.
              </h1>

              <p className="text-sm sm:text-base text-zinc-400 mt-4 max-w-2xl leading-relaxed">
                一套如同 <span className="text-zinc-200 font-medium">shadcn/ui</span> 般可直接复制源码的交互组件库。
                默认呈现最纯粹的<span className="text-zinc-100 font-medium">经典暗色轻拟物（135° 对角双高光微倒角 + 凸起/凹陷立体阴影）</span>；
                同时内置 <span className="text-amber-300 font-medium">方案 C (WebGL GLSL 物理金属着色器)</span>，点击下方材质按钮即可将全站实时切换为黄金、铂银、黑钛、钴蓝等金属。
              </p>

              {/* Hero CTA Buttons + CLI Snippet */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <TactileButton
                  variant="metallic"
                  onClick={() => setActiveTab('docs')}
                >
                  浏览源码与复制 (Get Started)
                </TactileButton>

                <TactileButton
                  variant="default"
                  onClick={() => setActiveTab('components')}
                >
                  查看基础组件库 (Components)
                </TactileButton>

                <button
                  type="button"
                  onClick={handleCopyCli}
                  style={{
                    backgroundImage: `var(--bg-concave), var(--border-rim-subtle)`,
                    backgroundOrigin: 'padding-box, border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: `var(--shadow-concave)`,
                  }}
                  className="h-10 px-3.5 rounded-xl border border-transparent font-mono text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                  <span>npx tactile-ui@latest init</span>
                  {copiedCli ? (
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
                <span className="font-medium text-zinc-200">一键切换全站材质风格：</span>
                <span className="hidden sm:inline text-zinc-500">
                  （默认保留最早的暗色轻拟物，点击金属即可切换）
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomizer(!showCustomizer)}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showCustomizer ? '收起高级光学参数 ▲' : '展开高级光学控制台 (Customize) ▼'}</span>
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
                        默认
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
              { id: 'examples-cards', label: 'Examples · Cards (综合卡片墙)', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
              { id: 'examples-dashboard', label: 'Dashboard (算力仪表盘)', icon: <Activity className="w-3.5 h-3.5" /> },
              { id: 'examples-playground', label: 'Playground (AI 推理台)', icon: <Play className="w-3.5 h-3.5" /> },
              { id: 'components', label: 'Components (基础组件总览)', icon: <Layers className="w-3.5 h-3.5" /> },
              { id: 'metal-lab', label: 'Metal Lab (流光金属图鉴)', icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: 'docs', label: 'Code & Docs (复制源码)', icon: <Code2 className="w-3.5 h-3.5" /> },
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
            <span>当前渲染模式：</span>
            <span style={{ color: activePreset.accentHex }} className="font-semibold">
              {isClassic ? 'Pure CSS Dark Tactile (Default)' : `WebGL GLSL (${activePreset.enName})`}
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
              {/* Card 1: 按钮体系 */}
              <TactileCard
                title="按钮与微交互 (Buttons)"
                description="凸起弧面、135° 对角高光边与按压内陷反馈"
                badge={<TactileBadge dotColor="white">Tactile</TactileBadge>}
              >
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400">
                    主要变体 (跟随当前全局风格：{activePreset.name})
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <TactileButton variant="default">默认高光边</TactileButton>
                    <TactileButton variant="metallic">高光主按钮</TactileButton>
                    <TactileButton variant="recessed">凹陷次级</TactileButton>
                    <TactileButton variant="danger">危险操作</TactileButton>
                  </div>
                </div>

                {/* Multi-Style / Multi-Metal Material Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400 flex items-center justify-between">
                    <span>单按钮独立指定材质 (material 属性)</span>
                    <span className="text-[10px] font-mono text-zinc-500">支持混排</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <TactileButton size="sm" material="classic">
                      经典轻拟物
                    </TactileButton>
                    <TactileButton size="sm" material="gold">
                      24K 黄金
                    </TactileButton>
                    <TactileButton size="sm" material="platinum">
                      镜面铂银
                    </TactileButton>
                    <TactileButton size="sm" material="obsidian">
                      曜石黑钛
                    </TactileButton>
                    <TactileButton size="sm" material="cobalt">
                      深海钴蓝
                    </TactileButton>
                    <TactileButton size="sm" material="rosegold">
                      玫瑰金
                    </TactileButton>
                  </div>
                </div>

                {/* Per-Button Sweep Angle Comparison */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400 flex items-center justify-between">
                    <span>按需开启 Hover 高光旋转 (sweepDeg)</span>
                    <span className="text-[10px] font-mono text-zinc-500">鼠标滑入对比</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <TactileButton variant="default" size="sm" sweepDeg={90}>
                      转 90°
                    </TactileButton>
                    <TactileButton variant="default" size="sm" sweepDeg={180}>
                      转 180°
                    </TactileButton>
                    <TactileButton variant="default" size="sm" sweepDeg={360}>
                      转 360°
                    </TactileButton>
                  </div>
                </div>

                {/* Sizes and Icons */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400">图标按钮与尺寸 (Icon & Sizes)</div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <TactileButton
                      variant="default"
                      size="icon"
                      aria-label="X Emblem"
                      title="X Emblem Icon Button"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </TactileButton>

                    <TactileButton variant="default" size="icon" aria-label="Settings">
                      <Settings className="w-4 h-4 text-zinc-300" />
                    </TactileButton>

                    <TactileButton variant="recessed" size="sm">
                      小号 (Sm)
                    </TactileButton>

                    <TactileButton
                      variant="default"
                      size="sm"
                      loading={btnLoading}
                      onClick={() => {
                        setBtnLoading(true);
                        setTimeout(() => setBtnLoading(false), 1200);
                      }}
                    >
                      {btnLoading ? '处理中' : '动态加载'}
                    </TactileButton>
                  </div>
                </div>

                {/* Segmented Tabs */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400">分段控制器 (Segmented Tabs)</div>
                  <TactileTabs
                    activeId={activeSegmentTab}
                    onChange={setActiveSegmentTab}
                    tabs={[
                      { id: 'overview', label: '概览视图' },
                      { id: 'nodes', label: '节点监控' },
                      { id: 'keys', label: '密钥管理' },
                    ]}
                  />
                </div>
              </TactileCard>

              {/* Card 2: 凹陷式输入组件 */}
              <TactileCard
                title="凹陷式输入组件 (Inputs & Select)"
                description="深槽内阴影 + 聚焦态对角高光环"
                badge={<TactileBadge dotColor="amber">Form</TactileBadge>}
              >
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400">
                    命令搜索框 (Search Input)
                  </label>
                  <TactileInput
                    placeholder="搜索组件、指令或文档..."
                    kbd="⌘K"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <TactileSelect
                    label="下拉选择器 (Custom Select)"
                    value={selectedEngine}
                    onChange={setSelectedEngine}
                    options={[
                      {
                        value: 'grok',
                        label: 'Grok-3 金属推理引擎',
                        description: '极速响应、实时光线倒角着色',
                      },
                      {
                        value: 'linear',
                        label: 'Linear 极速渲染内核',
                        description: '毫秒级同步、键盘优先交互',
                      },
                      {
                        value: 'raycast',
                        label: 'Raycast 本地工作流',
                        description: '系统级快捷键集成与扩展',
                      },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400">带遮罩凭证输入</label>
                  <div className="relative">
                    <TactileInput
                      type={showPassword ? 'text' : 'password'}
                      defaultValue="tactile_live_token_7709"
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
                  <label className="text-xs font-medium text-zinc-400">多行文本域 (Textarea)</label>
                  <TactileTextarea placeholder="输入系统提示词或自定义微质感 CSS 规则..." />
                </div>
              </TactileCard>

              {/* Card 3: 选框与物理拨杆 */}
              <TactileCard
                title="选框与物理拨杆 (Controls)"
                description="凹槽轨道配合高光凸起滑块的真实触感"
                badge={<TactileBadge dotColor="green">Interactive</TactileBadge>}
              >
                <div className="flex flex-col gap-3">
                  <TactileSwitch
                    id="sw-rt"
                    checked={enableRayTracing}
                    onChange={setEnableRayTracing}
                    label="硬件光线追踪高光"
                    hint="启用 135° 对角边缘实时反光渲染"
                  />

                  <TactileSwitch
                    id="sw-lp"
                    checked={enableLowPower}
                    onChange={setEnableLowPower}
                    label="静默低功耗模式"
                    hint="减弱背景点阵对比度与阴影扩散"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <TactileSlider
                    label="边缘高光强度 (Specular Intensity)"
                    value={specularStrength}
                    onChange={setSpecularStrength}
                  />
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <div className="text-xs font-medium text-zinc-400">
                    复选框与单选框 (Checkbox & Radio)
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <TactileCheckbox
                      checked={saveTokenCheck}
                      onChange={setSaveTokenCheck}
                      label="自动保存令牌"
                    />
                    <TactileCheckbox
                      checked={hapticCheck}
                      onChange={setHapticCheck}
                      label="开启触觉反馈"
                    />
                  </div>

                  <div className="pt-2 border-t border-white/[0.04]">
                    <TactileRadioGroup
                      name="themeModeGroup"
                      value={themeMode}
                      onChange={setThemeMode}
                      options={[
                        { value: 'obsidian', label: '曜石黑 (Obsidian)' },
                        { value: 'titanium', label: '钛金属 (Titanium)' },
                      ]}
                    />
                  </div>
                </div>
              </TactileCard>
            </div>

            {/* Composite Real-World Form Card */}
            <TactileCard
              title="实战配置案例：AI 算力节点管理 (Complete Composite Card)"
              description="展示按钮、输入框、滑块与拨杆在真实业务卡片中的统一协同质感"
              badge={<TactileBadge dotColor="white">Production Ready</TactileBadge>}
              headerAction={
                <TactileButton
                  variant="recessed"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  高级参数配置
                </TactileButton>
              }
            >
              <form onSubmit={handleSaveForm} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-zinc-400">节点服务标识 (Node ID)</label>
                    <TactileInput
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="worker-tactile-instance"
                      icon={<Cpu className="w-4 h-4" />}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <TactileSelect
                      label="调度算法与内核 (Scheduling Engine)"
                      value={formEngine}
                      onChange={setFormEngine}
                      options={[
                        { value: 'linear', label: 'Linear-Cluster 极致性能' },
                        { value: 'distributed', label: '分布式低功耗调度' },
                        { value: 'failover', label: '双活灾备冗余阵列' },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <TactileSlider
                    label="上下文最大令牌数 (Context Tokens)"
                    value={formMaxTokens}
                    min={1024}
                    max={8192}
                    step={512}
                    unit=" T"
                    onChange={setFormMaxTokens}
                  />

                  <TactileSwitch
                    checked={formCache}
                    onChange={setFormCache}
                    label="高速 KV 缓存预热"
                    hint="减少首字生成延迟至 15ms"
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>系统状态就绪 · 待部署变更: 1 项</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <TactileButton
                      type="button"
                      variant="recessed"
                      size="sm"
                      onClick={() => {
                        setFormName('Tactile-Worker-01');
                        setFormEngine('linear');
                        setFormMaxTokens(4096);
                        setFormCache(true);
                        toast({
                          title: '表单已重置',
                          type: 'info',
                        });
                      }}
                    >
                      重置修改
                    </TactileButton>
                    <TactileButton type="submit" variant="metallic" size="sm">
                      保存并应用配置
                    </TactileButton>
                  </div>
                </div>
              </form>
            </TactileCard>
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

      {/* Tactile Modal Component */}
      <TactileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="高级轻拟物参数微调 (Advanced Optics)"
        description="针对高分屏与不同光照环境调整对角高光锐度及倒角曲率"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">自定义环境变量配置</label>
            <TactileInput defaultValue="DARK_SKEUOMORPHIC_SPECULAR_ENABLE=true" />
          </div>

          <TactileSwitch
            checked={true}
            onChange={() => {}}
            label="启用次级对角反光 (Secondary Ambient Bounce)"
            hint="在右下角模拟自然环境光反射"
          />

          <TactileSlider label="表面微弧光深度 (Convex Depth)" value={74} onChange={() => {}} />
        </div>
      </TactileModal>
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
