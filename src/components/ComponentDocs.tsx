import React, { useState } from 'react';
import { Copy, Check, Code2, Layers, Play } from 'lucide-react';
import {
  TactileButton,
  TactileInput,
  TactileSwitch,
  TactileCheckbox,
  TactileRadioGroup,
  TactileSlider,
  TactileSelect,
  TactileTabs,
  TactileBadge,
} from './TactileComponents';
import { useToast } from './TactileToast';

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
      name: '按钮 (Tactile Button + Hover 流光旋转)',
      category: 'buttons',
      description: '采用凸起微弧度背景与 135° 对角双高光边框；利用 CSS @property 在 Hover 滑入时让对角高光旋转指定角度（如 90°、180°、360°）。',
      preview: (
        <div className="flex flex-wrap items-center gap-3">
          <TactileButton variant="default">默认流光 (+180°)</TactileButton>
          <TactileButton variant="default" sweepDeg={360}>整圈流光 (+360°)</TactileButton>
          <TactileButton variant="metallic">银钛高光 (Metallic)</TactileButton>
          <TactileButton variant="recessed">凹陷次级 (Recessed)</TactileButton>
          <TactileButton variant="danger">危险操作 (Danger)</TactileButton>
          <TactileButton
            variant="default"
            loading={btnLoading}
            onClick={() => {
              setBtnLoading(true);
              setTimeout(() => setBtnLoading(false), 1500);
            }}
          >
            {btnLoading ? '加载中...' : '点击测加载'}
          </TactileButton>
        </div>
      ),
      reactSnippet: `// React / TSX 引入使用 (支持 sweepDeg 独立指定 Hover 旋转度数)
import { TactileButton } from "@/components/TactileComponents";

export function ButtonDemo() {
  return (
    <div className="flex gap-3">
      {/* 默认跟随全局 --hover-sweep (180° 对角互换) */}
      <TactileButton variant="default">对角高光互换</TactileButton>

      {/* 独立指定 Hover 滑入时高光旋转整整一圈 (360°) */}
      <TactileButton variant="default" sweepDeg={360}>Hover 转一圈 (360°)</TactileButton>

      {/* 独立指定 Hover 滑入时微转 90° */}
      <TactileButton variant="default" sweepDeg={90}>Hover 转 90°</TactileButton>
      
      {/* 银钛镜面主按钮 */}
      <TactileButton variant="metallic">立即部署</TactileButton>
    </div>
  );
}`,
      htmlSnippet: `<!-- 原生 HTML & CSS 写法 (利用 CSS @property 实现对角高光在 Hover 时平滑旋转指定度数) -->
<button class="skeuo-btn">默认旋转 180° (对角互换)</button>
<button class="skeuo-btn" style="--hover-sweep: 360deg;">Hover 旋转整圈 (360°)</button>
<button class="skeuo-btn" style="--hover-sweep: 90deg;">Hover 微转 90°</button>

<style>
/* 1. 注册 CSS Houdini 角度属性，使 linear-gradient 内部的度数支持丝滑 transition 动画 */
@property --local-rim-angle {
  syntax: '<angle>';
  inherits: true;
  initial-value: 135deg;
}

:root {
  --rim-angle: 135deg;       /* 默认静息对角高光角度 */
  --hover-sweep: 180deg;     /* Hover 滑入时旋转的角距离 (可改为 90deg / 180deg / 360deg) */
  --sweep-duration: 600ms;   /* 高光旋转过渡时长 */
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
      rgba(255,255,255,0.48) 0%,
      rgba(255,255,255,0.06) 40%,
      rgba(255,255,255,0.03) 60%,
      rgba(255,255,255,0.26) 100%
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

/* 2. 鼠标滑入时，高光角度累加 --hover-sweep，沿圆角边框平滑旋转（无位移弹跳） */
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
      name: '输入框 (Tactile Input)',
      category: 'inputs',
      description: '深凹槽内阴影营造物理嵌槽感，聚焦态对角高光环绕，支持快捷键标签与自定义前置图标。',
      preview: (
        <div className="flex flex-col gap-3 max-w-md w-full">
          <TactileInput
            placeholder="搜索节点或执行指令..."
            kbd="⌘K"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            }
          />
          <TactileInput
            type="password"
            placeholder="输入加密密钥..."
            defaultValue="sk-production-tactile-key"
          />
        </div>
      ),
      reactSnippet: `// React / TSX 引入使用
import { TactileInput } from "@/components/TactileComponents";
import { Search } from "lucide-react";

export function InputDemo() {
  return (
    <TactileInput
      placeholder="搜索或输入全局指令..."
      icon={<Search className="w-4 h-4" />}
      kbd="⌘K"
    />
  );
}`,
      htmlSnippet: `<!-- 原生 HTML & CSS 写法 -->
<div class="input-wrapper">
  <input type="text" class="input-field" placeholder="搜索或输入指令..." />
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
      name: '开关拨杆 (Tactile Switch)',
      category: 'controls',
      description: '修复了灰色叠加问题：内部使用纯净曜石黑不透明渐变，中央带有发光状态宝石指示灯。',
      preview: (
        <div className="flex flex-col gap-3 max-w-md w-full">
          <TactileSwitch
            checked={switchVal}
            onChange={setSwitchVal}
            label="135° 拟物光线追踪渲染"
            hint="开启实时材质边缘反光与内高光"
          />
        </div>
      ),
      reactSnippet: `import { TactileSwitch } from "@/components/TactileComponents";
import { useState } from "react";

export function SwitchDemo() {
  const [enabled, setEnabled] = useState(true);

  return (
    <TactileSwitch
      checked={enabled}
      onChange={setEnabled}
      label="硬件加速渲染模式"
      hint="开启后启用全动态高光计算"
    />
  );
}`,
      htmlSnippet: `<!-- 原生 HTML & CSS 写法 (已修复灰色透光问题) -->
<div class="control-row">
  <div class="control-label">
    <span class="control-title">硬件加速渲染模式</span>
    <span class="control-hint">开启后启用全动态高光计算</span>
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
  /* 关键：不透明深色渐变杜绝底框高光透出产生灰雾 */
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
      name: '下拉选择 (Tactile Select)',
      category: 'inputs',
      description: '带有浮动倒角边框、高深度投影及流畅展开收起动画的暗色轻拟物下拉菜单。',
      preview: (
        <div className="max-w-md w-full">
          <TactileSelect
            label="渲染内核选择 (Engine Kernel)"
            value={selectVal}
            onChange={setSelectVal}
            options={[
              { value: 'v1', label: 'Grok-3 极速推理金属引擎', description: '低延迟、硬件光栅加速' },
              { value: 'v2', label: 'Linear 本地极速管线', description: '毫秒级响应、本地离线就绪' },
              { value: 'v3', label: 'Raycast 桌面原生引擎', description: '全局快捷唤醒与热键' },
            ]}
          />
        </div>
      ),
      reactSnippet: `import { TactileSelect } from "@/components/TactileComponents";
import { useState } from "react";

export function SelectDemo() {
  const [model, setModel] = useState("v1");

  return (
    <TactileSelect
      label="选择处理引擎"
      value={model}
      onChange={setModel}
      options={[
        { value: "v1", label: "Grok-3 极速推理引擎" },
        { value: "v2", label: "Linear 极速工作流" }
      ]}
    />
  );
}`,
      htmlSnippet: `<!-- 参见 TactileSelect 完整实现 -->`,
    },
    {
      id: 'controls',
      name: '复选框与单选框 (Checkbox & Radio)',
      category: 'controls',
      description: '凹陷物理底座，勾选后呈现高对比度明亮微银反光与圆润单选点。',
      preview: (
        <div className="flex flex-col gap-4 max-w-md w-full">
          <div className="flex gap-4">
            <TactileCheckbox
              checked={checkVal}
              onChange={setCheckVal}
              label="持久化存储状态"
              hint="本地存储偏好设定"
            />
          </div>
          <TactileRadioGroup
            name="demo-radio"
            value={radioVal}
            onChange={setRadioVal}
            options={[
              { value: 'raycast', label: '曜石黑 (Obsidian)' },
              { value: 'titanium', label: '钛金属 (Titanium)' },
            ]}
          />
        </div>
      ),
      reactSnippet: `import { TactileCheckbox, TactileRadioGroup } from "@/components/TactileComponents";
import { useState } from "react";

export function ControlsDemo() {
  const [remember, setRemember] = useState(true);
  const [theme, setTheme] = useState("dark");

  return (
    <>
      <TactileCheckbox checked={remember} onChange={setRemember} label="记住设定" />
      <TactileRadioGroup
        name="theme"
        value={theme}
        onChange={setTheme}
        options={[
          { value: "dark", label: "曜石黑" },
          { value: "metal", label: "钛金属" }
        ]}
      />
    </>
  );
}`,
      htmlSnippet: `<!-- 复选框 HTML -->
<label class="check-item">
  <input type="checkbox" checked />
  <span class="check-box">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
  <span>自动保存</span>
</label>`,
    },
    {
      id: 'slider',
      name: '滑块 (Tactile Slider)',
      category: 'controls',
      description: '内凹滑轨配合凸起球体旋钮，拖动时带有平滑的金属高光位移与实时数值显示。',
      preview: (
        <div className="max-w-md w-full">
          <TactileSlider
            label="高光反射阻尼 (Specular Damping)"
            value={sliderVal}
            onChange={setSliderVal}
          />
        </div>
      ),
      reactSnippet: `import { TactileSlider } from "@/components/TactileComponents";
import { useState } from "react";

export function SliderDemo() {
  const [val, setVal] = useState(65);
  return (
    <TactileSlider label="反射率" value={val} onChange={setVal} />
  );
}`,
      htmlSnippet: `<!-- 滑块 HTML -->
<input type="range" min="0" max="100" value="65" class="range-slider" />`,
    },
    {
      id: 'tabs',
      name: '分段标签页 (Tactile Tabs)',
      category: 'controls',
      description: '沉浸凹陷轨道底盘 + 凸起激活滑块，提供极高辨识度的切换体验。',
      preview: (
        <div className="max-w-md w-full">
          <TactileTabs
            activeId={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'code', label: '源码视图' },
              { id: 'preview', label: '实时预览' },
              { id: 'logs', label: '终端日志' },
            ]}
          />
        </div>
      ),
      reactSnippet: `import { TactileTabs } from "@/components/TactileComponents";
import { useState } from "react";

export function TabsDemo() {
  const [tab, setTab] = useState("overview");

  return (
    <TactileTabs
      activeId={tab}
      onChange={setTab}
      tabs={[
        { id: "overview", label: "概览视图" },
        { id: "metrics", label: "实时指标" },
        { id: "settings", label: "系统配置" }
      ]}
    />
  );
}`,
      htmlSnippet: `<!-- 分段控制器 HTML -->
<div class="tabs-bar">
  <button class="tab-btn active">概览视图</button>
  <button class="tab-btn">实时指标</button>
</div>`,
    },
    {
      id: 'badge',
      name: '徽章与状态 (Tactile Badges)',
      category: 'surfaces',
      description: '轻微凸起的胶囊底座配合发光宝石指示灯，用于表示系统就绪、警示或版本号。',
      preview: (
        <div className="flex flex-wrap items-center gap-3">
          <TactileBadge dotColor="white">Tactile v2.4</TactileBadge>
          <TactileBadge dotColor="green">节点在线 (99.98%)</TactileBadge>
          <TactileBadge dotColor="amber">延迟波动 (42ms)</TactileBadge>
          <TactileBadge dotColor="crimson">熔断告警</TactileBadge>
        </div>
      ),
      reactSnippet: `import { TactileBadge } from "@/components/TactileComponents";

export function BadgeDemo() {
  return (
    <div className="flex gap-2">
      <TactileBadge dotColor="green">集群正常</TactileBadge>
      <TactileBadge dotColor="amber">高负载</TactileBadge>
    </div>
  );
}`,
      htmlSnippet: `<!-- 徽章 HTML -->
<span class="badge"><span class="status-dot green"></span>集群正常</span>`,
    },
  ];

  const currentItem = components.find((c) => c.id === activeComponent) || components[0];

  const copyCode = () => {
    const code = codeTab === 'react' ? currentItem.reactSnippet : currentItem.htmlSnippet;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: '代码已复制到剪贴板',
      description: `${currentItem.name} 的 ${codeTab.toUpperCase()} 代码随时可粘贴使用`,
      type: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-300">
            shadcn/ui 风格组件文档与代码生成器
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            选择组件查看实时交互效果，并一键获取生产可用的 React TSX 与标准 HTML/CSS 代码
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

              <TactileButton variant="recessed" size="sm" onClick={copyCode} className="h-7 text-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制' : '复制组件代码'}</span>
              </TactileButton>
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
