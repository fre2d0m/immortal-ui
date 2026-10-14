import React, { useState } from 'react';
import { Copy, Check, Code2, Sparkles, Search } from 'lucide-react';
import {
  TactileButton,
  TactileBadge,
  TactileInput,
  TactileSwitch,
} from './TactileComponents';
import {
  METAL_MATERIALS,
  MetalMaterialId,
  useMetalConfig,
  WebGLBezelCanvas,
} from './WebGLMetalEngine';
import { audioEngine } from './AudioEngine';
import { useToast } from './TactileToast';

/* =========================================================================
   Large Showcase Button for a Specific Metal Material (Squircle or Circle)
   Uses the shared Solution C WebGL Shader Engine
   ========================================================================= */
const MetalEmblemShowcaseButton: React.FC<{
  materialId: MetalMaterialId;
  shape: 'squircle' | 'circle';
  theme: 'dark' | 'light';
  onSelect: () => void;
}> = ({ materialId, shape, theme, onSelect }) => {
  const { bezelWidth } = useMetalConfig();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const mat = METAL_MATERIALS[materialId];
  const isCircle = shape === 'circle';
  const isLight = theme === 'light';

  return (
    <div
      style={{
        background: isLight
          ? 'linear-gradient(145deg, #e4e4e7 0%, #d4d4d8 100%)'
          : 'linear-gradient(145deg, #050507 0%, #101014 100%)',
        boxShadow: isLight
          ? 'inset 0 2px 6px rgba(0,0,0,0.18), 0 4px 14px rgba(0,0,0,0.5)'
          : 'inset 0 4px 10px rgba(0,0,0,0.95), 0 1px 0 rgba(255,255,255,0.08)',
        padding: isCircle ? '8px' : '6px',
      }}
      className={`inline-flex items-center justify-center ${
        isCircle ? 'rounded-full' : 'rounded-[32px]'
      }`}
    >
      <button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onClick={() => {
          audioEngine.playClick('metal');
          onSelect();
        }}
        style={{
          padding: `${bezelWidth}px`,
          boxShadow: isLight
            ? '0 10px 22px rgba(0,0,0,0.28), 0 2px 5px rgba(0,0,0,0.2)'
            : '0 14px 30px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.85)',
          transform: pressed ? 'scale(0.97)' : 'scale(1)',
        }}
        className={`relative ${
          isCircle ? 'w-20 h-20 rounded-full' : 'w-24 h-24 rounded-[26px]'
        } flex items-center justify-center overflow-hidden cursor-pointer select-none transition-transform duration-150 focus:outline-none`}
      >
        <WebGLBezelCanvas
          material={materialId}
          hovered={hovered}
          canvasWidth={192}
          canvasHeight={192}
        />

        <div
          style={{
            background: isLight
              ? 'linear-gradient(160deg, #fafafa 0%, #e4e4e7 100%)'
              : mat.capGradient,
            boxShadow: isLight
              ? 'inset 0 2px 2px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(0,0,0,0.08)'
              : `inset 0 1.5px 1px ${mat.bevelHighlight}, inset 0 -3px 6px rgba(0,0,0,0.9)`,
          }}
          className={`relative z-10 w-full h-full flex items-center justify-center ${
            isCircle ? 'rounded-full' : 'rounded-[23px]'
          }`}
        >
          {isCircle ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="#27272a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke={mat.accentHex}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="9" rx="2" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="2" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
};

export const LiquidChromeLab: React.FC = () => {
  const { toast } = useToast();
  const { material: activeMaterial, setMaterial } = useMetalConfig();
  const [copied, setCopied] = useState(false);
  const [previewSwitch, setPreviewSwitch] = useState(true);
  const [previewText, setPreviewText] = useState('');

  const activePreset = METAL_MATERIALS[activeMaterial] || METAL_MATERIALS.gold;

  const webglShaderCode = `// =========================================================================
// 方案 C · WebGL GLSL 多金属材质对角双高光着色器 (Physical Metallic Spectrum Shader)
// 默认保持干净的 135° 对角双高光，Hover 滑入时原地提亮金属高光（也可按需配置旋转）
// 支持通过 uniform 传入不同金属的物理反射率三元组 (u_highColor, u_midColor, u_darkColor)：
// - 24K 黄金 (Gold):     High(1.0, 0.93, 0.55), Mid(0.92, 0.66, 0.10), Dark(0.22, 0.13, 0.02)
// - 镜面铂银 (Platinum): High(1.0, 1.0, 1.0),   Mid(0.76, 0.79, 0.85), Dark(0.08, 0.08, 0.10)
// - 曜石黑钛 (Obsidian): High(0.72, 0.74, 0.78), Mid(0.30, 0.32, 0.36), Dark(0.04, 0.04, 0.05)
// - 深海钴蓝 (Cobalt):   High(0.68, 0.90, 1.0),  Mid(0.18, 0.52, 0.96), Dark(0.04, 0.11, 0.26)
// =========================================================================
precision highp float;
varying vec2 v_uv;
uniform float u_baseRad;
uniform float u_hoverRad;
uniform float u_hoverIntensity;
uniform float u_aspect;
uniform vec3 u_highColor;
uniform vec3 u_midColor;
uniform vec3 u_darkColor;

vec3 sampleMetallicSpectrum(float angle, float rotOffset, float hoverBoost, vec3 cHigh, vec3 cMid, vec3 cDark) {
  float theta = angle - rotOffset;
  float w = cos(theta * 2.0) + 0.18 * cos(theta);
  float t = clamp((w + 0.85) / 1.95 + hoverBoost * 0.18, 0.0, 1.0);

  vec3 lowerMetal = mix(cDark, cMid, smoothstep(0.0, 0.52, t));
  vec3 baseMetal = mix(lowerMetal, cHigh, smoothstep(0.58, 1.0, t));
  float peakGleam = smoothstep(0.72, 1.15, w + hoverBoost * 0.25);
  return mix(baseMetal, cHigh, peakGleam * (0.45 + hoverBoost * 0.25));
}

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  vec2 pAspect = vec2(p.x * pow(max(u_aspect, 0.25), 0.35), p.y);
  float angle = atan(pAspect.y, pAspect.x);
  vec3 col = sampleMetallicSpectrum(angle, u_baseRad + u_hoverRad, u_hoverIntensity, u_highColor, u_midColor, u_darkColor);
  gl_FragColor = vec4(col, 1.0);
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webglShaderCode);
    setCopied(true);
    toast({
      title: '方案 C (WebGL GLSL) 源码已复制',
      description: '包含黄金、铂银、黑钛、钴蓝等六种物理金属的 GLSL 着色器已复制到剪贴板',
      type: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectGlobalMaterial = (matId: MetalMaterialId) => {
    const mat = METAL_MATERIALS[matId];
    audioEngine.playClick('metal');
    setMaterial(matId);
    toast({
      title: `已设为全局材质：${mat.name}`,
      description: `全站按钮、输入框、开关、徽章及卡片边框已实时切换为 ${mat.enName}`,
      type: 'success',
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      <div
        style={{
          backgroundImage: `var(--bg-card), ${activePreset.cssBorderRim}`,
          backgroundOrigin: 'padding-box, border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: `var(--shadow-convex)`,
        }}
        className="p-6 sm:p-7 rounded-3xl border border-transparent flex flex-col gap-6 transition-all duration-200"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <TactileBadge dotColor="amber">
                方案 C · WebGL 物理金属材质系统
              </TactileBadge>
              <span className="text-xs font-mono text-zinc-400">
                当前全局材质：
                <strong style={{ color: activePreset.accentHex }} className="ml-1">
                  {activePreset.name} ({activePreset.enName})
                </strong>
              </span>
            </div>
            <h2
              style={{ color: activePreset.accentHex }}
              className="text-lg sm:text-xl font-bold tracking-tight mt-2"
            >
              物理金属材质图鉴（点击下方任意卡片「设为全局材质」即可实时改变全站组件）
            </h2>
          </div>
        </div>

        {/* Live Global Material Interactive Preview Bar right inside LiquidChromeLab */}
        <div
          style={{
            backgroundImage: `var(--bg-subcard), ${activePreset.cssBorderRimSubtle}`,
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',
          }}
          className="p-4 rounded-2xl border border-transparent flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2.5 shrink-0">
            <span
              style={{ background: activePreset.swatchGradient }}
              className="w-4 h-4 rounded-full border border-white/30 shrink-0"
            />
            <div>
              <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color: activePreset.accentHex }} />
                <span>当前全局材质实时生效预览：{activePreset.name}</span>
              </div>
              <div className="text-[11px] text-zinc-400">
                未单独指定 <code className="text-zinc-300">material</code> 属性的所有组件均自动同步此材质，默认保持干净的 135° 对角双高光
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <TactileButton variant="default" size="sm">
              全局默认按钮
            </TactileButton>
            <TactileButton variant="metallic" size="sm">
              纯金属实心盖
            </TactileButton>
            <TactileButton variant="recessed" size="sm">
              凹陷次级按钮
            </TactileButton>
            <div className="w-44">
              <TactileInput
                placeholder="全局金属输入框..."
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                icon={<Search className="w-3.5 h-3.5" />}
              />
            </div>
            <TactileSwitch
              checked={previewSwitch}
              onChange={setPreviewSwitch}
            />
          </div>
        </div>

        {/* 6 Metal Material Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(Object.keys(METAL_MATERIALS) as MetalMaterialId[]).map((matId) => {
            const mat = METAL_MATERIALS[matId];
            const isSelected = activeMaterial === matId;
            return (
              <div
                key={matId}
                onClick={() => handleSelectGlobalMaterial(matId)}
                style={{
                  backgroundImage: `var(--bg-subcard), ${
                    isSelected ? mat.cssBorderRim : 'var(--border-rim-subtle)'
                  }`,
                  backgroundOrigin: 'padding-box, border-box',
                  backgroundClip: 'padding-box, border-box',
                }}
                className={`p-4 rounded-2xl border border-transparent transition-all flex flex-col justify-between gap-4 cursor-pointer ${
                  isSelected
                    ? 'shadow-[0_0_28px_rgba(255,255,255,0.08)]'
                    : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        style={{ background: mat.swatchGradient }}
                        className="w-3.5 h-3.5 rounded-full border border-white/30 inline-block"
                      />
                      <h3
                        style={{ color: mat.accentHex }}
                        className="text-sm font-semibold tracking-tight"
                      >
                        {mat.name} ({mat.enName})
                      </h3>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">{mat.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectGlobalMaterial(matId);
                    }}
                    style={
                      isSelected
                        ? {
                            background: mat.swatchGradient,
                            color: matId === 'obsidian' || matId === 'cobalt' ? '#ffffff' : '#09090b',
                          }
                        : {}
                    }
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer transition-all shrink-0 ${
                      isSelected
                        ? 'font-bold shadow-sm'
                        : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-white/15'
                    }`}
                  >
                    {isSelected ? '✓ 已设为全局' : '设为全局材质'}
                  </button>
                </div>

                {/* Dark Squircle + Light Circle in this Metal */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-around py-3 px-2 rounded-xl bg-[#050507] border border-white/[0.04]"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <MetalEmblemShowcaseButton
                      materialId={matId}
                      shape="squircle"
                      theme="dark"
                      onSelect={() => handleSelectGlobalMaterial(matId)}
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">暗色金属方钮</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <MetalEmblemShowcaseButton
                      materialId={matId}
                      shape="circle"
                      theme="light"
                      onSelect={() => handleSelectGlobalMaterial(matId)}
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">亮色金属圆钮</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* WebGL GLSL Source Code Exporter */}
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#050507]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-zinc-950/80">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
              <Code2 className="w-4 h-4" style={{ color: activePreset.accentHex }} />
              <span>方案 C · 多金属材质 WebGL GLSL 片元着色器源码</span>
            </div>
            <TactileButton variant="recessed" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? '已复制 GLSL 源码' : '复制 WebGL 着色器源码'}</span>
            </TactileButton>
          </div>
          <div className="p-4 overflow-x-auto text-xs font-mono text-zinc-300 leading-relaxed max-h-[280px]">
            <pre>
              <code>{webglShaderCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
