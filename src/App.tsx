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
import { ToastProvider, useToast } from './components/TactileToast';
import { TactileModal } from './components/TactileModal';
import { audioEngine } from './components/AudioEngine';
import { MetalConfigProvider } from './components/WebGLMetalEngine';
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
  Layers,
  Eye,
  EyeOff,
  Bell,
} from 'lucide-react';

function AppContent() {
  const { toast } = useToast();

  // Navigation tab
  const [currentNav, setCurrentNav] = useState<'showcase' | 'chrome' | 'docs' | 'studio'>('showcase');

  // Modal demo state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Card 1: Buttons demo state
  const [btnLoading, setBtnLoading] = useState(false);
  const [activeSegmentTab, setActiveSegmentTab] = useState('overview');

  // Card 2: Inputs demo state
  const [searchVal, setSearchVal] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('grok');
  const [showPassword, setShowPassword] = useState(false);

  // Card 3: Controls demo state
  const [enableRayTracing, setEnableRayTracing] = useState(true);
  const [enableLowPower, setEnableLowPower] = useState(false);
  const [specularStrength, setSpecularStrength] = useState(68);
  const [saveTokenCheck, setSaveTokenCheck] = useState(true);
  const [hapticCheck, setHapticCheck] = useState(true);
  const [themeMode, setThemeMode] = useState('obsidian');

  // Card 4: Form example state
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

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#070708]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundImage: `var(--bg-convex), var(--border-rim)`,
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',
                boxShadow: `var(--shadow-convex-sm)`,
              }}
              className="w-9 h-9 rounded-xl border border-transparent flex items-center justify-center shrink-0 cursor-pointer"
              onClick={() => audioEngine.playClick('metal')}
            >
              <Zap className="w-4 h-4" style={{ color: 'var(--metal-accent, #fde047)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base text-zinc-100 tracking-tight">
                  Dark Tactile UI
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10 hidden sm:inline-block">
                  v2.5 Chrome
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden sm:block">
                暗色轻拟物 · 对角双高光 & 色散流光金属系统
              </p>
            </div>
          </div>

          {/* Navigation Mode Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              style={{
                backgroundImage: `var(--bg-concave), var(--border-rim-subtle)`,
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',
                boxShadow: `var(--shadow-concave)`,
              }}
              className="p-1 rounded-xl border border-transparent flex gap-1"
            >
              <button
                type="button"
                onClick={() => {
                  audioEngine.playClick('button');
                  setCurrentNav('showcase');
                }}
                style={
                  currentNav === 'showcase'
                    ? {
                        backgroundImage: `var(--bg-convex), var(--border-rim)`,
                        backgroundOrigin: 'padding-box, border-box',
                        backgroundClip: 'padding-box, border-box',
                        boxShadow: `var(--shadow-convex-sm)`,
                      }
                    : {}
                }
                className={`px-3 py-1.5 rounded-lg border border-transparent text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentNav === 'showcase'
                    ? 'text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>全景陈列馆</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audioEngine.playClick('metal');
                  setCurrentNav('chrome');
                }}
                style={
                  currentNav === 'chrome'
                    ? {
                        backgroundImage: `var(--bg-convex), var(--border-rim)`,
                        backgroundOrigin: 'padding-box, border-box',
                        backgroundClip: 'padding-box, border-box',
                        boxShadow: `var(--shadow-convex-sm)`,
                      }
                    : {}
                }
                className={`px-3 py-1.5 rounded-lg border border-transparent text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentNav === 'chrome'
                    ? 'text-amber-300 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>流光金属实验室 (CSS/SVG/WebGL)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audioEngine.playClick('button');
                  setCurrentNav('docs');
                }}
                style={
                  currentNav === 'docs'
                    ? {
                        backgroundImage: `var(--bg-convex), var(--border-rim)`,
                        backgroundOrigin: 'padding-box, border-box',
                        backgroundClip: 'padding-box, border-box',
                        boxShadow: `var(--shadow-convex-sm)`,
                      }
                    : {}
                }
                className={`px-3 py-1.5 rounded-lg border border-transparent text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentNav === 'docs'
                    ? 'text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>代码生成器 (shadcn)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audioEngine.playClick('button');
                  setCurrentNav('studio');
                }}
                style={
                  currentNav === 'studio'
                    ? {
                        backgroundImage: `var(--bg-convex), var(--border-rim)`,
                        backgroundOrigin: 'padding-box, border-box',
                        backgroundClip: 'padding-box, border-box',
                        boxShadow: `var(--shadow-convex-sm)`,
                      }
                    : {}
                }
                className={`px-3 py-1.5 rounded-lg border border-transparent text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer hidden md:flex ${
                  currentNav === 'studio'
                    ? 'text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>实战控制台</span>
              </button>
            </div>

            {/* Modal Trigger */}
            <TactileButton
              variant="metallic"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="hidden sm:inline-flex"
            >
              弹窗测试 (Modal)
            </TactileButton>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex-1">
        {/* 1:1 Hero Section & Tactile Emblem */}
        <HeroEmblem />

        {/* Real-time Optical Lab for Dynamic Specular Angles & Sound Controls */}
        <LightingLab />

        <div className="glow-divider mb-10" />

        {/* Dedicated Liquid Chrome Tab View */}
        {currentNav === 'chrome' && <LiquidChromeLab />}

        {/* View 1: Showcase Gallery (includes Liquid Chrome Lab at top + full component cards below) */}
        {currentNav === 'showcase' && (
          <div className="flex flex-col gap-10">
            {/* Featured Liquid Chrome & WebGL Exploration Lab */}
            <LiquidChromeLab />

            <div className="glow-divider" />

            {/* Grid Layout of the 3 Key Cards + 1 Composite Form Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: 按钮体系 (Buttons & Micro-interactions) */}
              <TactileCard
                title="按钮与微交互 (Buttons)"
                description="凸起弧面、对角金属高光边与按压内陷反馈"
                badge={<TactileBadge dotColor="white">Tactile</TactileBadge>}
              >
                {/* Variants */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400">主要变体 (跟随当前全局金属材质)</div>
                  <div className="flex flex-wrap gap-2.5">
                    <TactileButton variant="default">默认流光边</TactileButton>
                    <TactileButton variant="metallic">纯金属实心盖</TactileButton>
                    <TactileButton variant="recessed">凹陷次级</TactileButton>
                    <TactileButton variant="danger">危险操作</TactileButton>
                  </div>
                </div>

                {/* Multi-Metal Material Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400 flex items-center justify-between">
                    <span>多金属材质按钮 (material 属性独立指定)</span>
                    <span className="text-[10px] font-mono text-amber-300">WebGL Shader</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                    <TactileButton size="sm" material="emerald">
                      祖母绿钛
                    </TactileButton>
                  </div>
                </div>

                {/* Per-Button Sweep Angle Comparison */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-zinc-400 flex items-center justify-between">
                    <span>独立配置 Hover 高光旋转距离 (sweepDeg)</span>
                    <span className="text-[10px] font-mono text-zinc-500">鼠标滑入对比</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <TactileButton variant="default" size="sm" sweepDeg={90}>
                      转 90° (四分之一)
                    </TactileButton>
                    <TactileButton variant="default" size="sm" sweepDeg={180}>
                      转 180° (对角互换)
                    </TactileButton>
                    <TactileButton variant="default" size="sm" sweepDeg={360}>
                      转 360° (整圈流光)
                    </TactileButton>
                    <TactileButton variant="default" size="sm" sweepDeg={-180}>
                      逆转 -180°
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

              {/* Card 2: 凹陷式输入组件 (Inputs & Select) */}
              <TactileCard
                title="凹陷式输入组件 (Inputs & Select)"
                description="深槽内阴影 + 聚焦态对角银白高光环"
                badge={<TactileBadge dotColor="amber">Form</TactileBadge>}
              >
                {/* Search Input */}
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

                {/* Custom Select */}
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

                {/* Password field with toggle */}
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

                {/* Textarea */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400">多行文本域 (Textarea)</label>
                  <TactileTextarea placeholder="输入系统提示词或自定义微质感 CSS 规则..." />
                </div>
              </TactileCard>

              {/* Card 3: 选框与物理拨杆 (Controls, Switches, Slider) - No Gray Haze! */}
              <TactileCard
                title="选框与物理拨杆 (Controls)"
                description="凹槽轨道配合高光凸起滑块的真实触感"
                badge={<TactileBadge dotColor="green">Interactive</TactileBadge>}
              >
                {/* Switches (Fixed no gray haze) */}
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

                {/* Slider */}
                <div className="flex flex-col gap-2 pt-1">
                  <TactileSlider
                    label="边缘高光强度 (Specular Intensity)"
                    value={specularStrength}
                    onChange={setSpecularStrength}
                  />
                </div>

                {/* Checkboxes & Radios */}
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

        {/* View 2: shadcn/ui Component Docs & Code Generator */}
        {currentNav === 'docs' && <ComponentDocs />}

        {/* View 3: Studio Interactive Hardware Control Room */}
        {currentNav === 'studio' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TactileCard
                title="算力阵列 Alpha"
                description="物理核数：64 Cores / 128 Threads"
                badge={<TactileBadge dotColor="green">运行中</TactileBadge>}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>负载利用率</span>
                    <span className="text-zinc-200 font-mono">42.8%</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-950 border border-white/10 overflow-hidden p-0.5">
                    <div className="h-full bg-gradient-to-r from-zinc-400 to-white rounded-full w-[42.8%]" />
                  </div>
                  <TactileSwitch
                    checked={true}
                    onChange={() => {}}
                    label="自动扩缩容保护"
                    hint="超过 85% 自动调度冗余节点"
                  />
                </div>
              </TactileCard>

              <TactileCard
                title="算力阵列 Beta"
                description="物理核数：32 Cores / 64 Threads"
                badge={<TactileBadge dotColor="amber">高负载</TactileBadge>}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>负载利用率</span>
                    <span className="text-zinc-200 font-mono">88.4%</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-950 border border-white/10 overflow-hidden p-0.5">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-200 rounded-full w-[88.4%]" />
                  </div>
                  <TactileSwitch
                    checked={false}
                    onChange={() => {}}
                    label="安全阻尼降频"
                    hint="当前处于全速超频状态"
                  />
                </div>
              </TactileCard>

              <TactileCard
                title="边缘中继网关"
                description="在全球 18 个区域部署 CDN 节点"
                badge={<TactileBadge dotColor="white">在线 18/18</TactileBadge>}
              >
                <div className="flex flex-col gap-3">
                  <TactileButton
                    variant="metallic"
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: '开始边缘节点探活',
                        description: '正在向 18 个边缘中继发送 ping 指令...',
                        type: 'info',
                      });
                    }}
                  >
                    即刻探活全局节点
                  </TactileButton>
                  <TactileButton
                    variant="recessed"
                    className="w-full"
                    onClick={() => setIsModalOpen(true)}
                  >
                    配置路由策略
                  </TactileButton>
                </div>
              </TactileCard>
            </div>
          </div>
        )}
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
