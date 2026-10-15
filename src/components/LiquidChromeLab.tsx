import React, { useState } from 'react';
import { Copy, Check, Code2, Sparkles, Search, RotateCcw } from 'lucide-react';
import {
  TactileButton,
  TactileBadge,
  TactileInput,
  TactileSwitch,
} from './TactileComponents';
import {
  METAL_MATERIALS,
  MetalMaterialId,
  WEBGL_METAL_IDS,
  useMetalConfig,
  WebGLBezelCanvas,
} from './WebGLMetalEngine';
import { audioEngine } from './AudioEngine';
import { useToast } from './TactileToast';

/* =========================================================================
   Large Showcase Button for a Specific Metal Material (Squircle or Circle)
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
          padding: `${Math.max(1.25, bezelWidth)}px`,
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
              : 'inset 0 -3px 6px rgba(0,0,0,0.9)',
          }}
          className={`relative z-10 w-full h-full flex items-center justify-center ${
            isCircle ? 'rounded-full' : 'rounded-[24.5px]'
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

  const activePreset = METAL_MATERIALS[activeMaterial] || METAL_MATERIALS.classic;

  const webglShaderCode = `// =========================================================================
// Solution C · WebGL GLSL 1px Micro-Bezel Multi-Metal Fragment Shader
// Uses asymmetric dual-specular falloff (pow 3.2 / pow 3.8):
// Top-left primary peak (0.62) & bottom-right secondary bounce (0.28),
// naturally fading into dark side edges without harsh overexposure.
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
  float primaryLobe = pow(max(0.0, cos(theta)), 3.2);
  float secondaryLobe = pow(max(0.0, -cos(theta)), 3.8) * 0.42;
  float ambientRim = 0.08 + 0.06 * pow(cos(theta * 2.0) * 0.5 + 0.5, 2.0);
  float t = clamp(ambientRim + primaryLobe * (0.62 + hoverBoost * 0.26) + secondaryLobe * (0.65 + hoverBoost * 0.20), 0.0, 1.0);

  vec3 lowerMetal = mix(cDark, cMid, smoothstep(0.04, 0.52, t));
  vec3 baseMetal = mix(lowerMetal, cHigh, smoothstep(0.50, 0.96, t));
  float apexGleam = pow(primaryLobe, 2.5) * (0.25 + hoverBoost * 0.35);
  return mix(baseMetal, cHigh, clamp(apexGleam, 0.0, 1.0));
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
      title: 'WebGL GLSL Shader Copied',
      description: 'Multi-metal physical reflectance GLSL fragment shader copied to clipboard',
      type: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectGlobalMaterial = (matId: MetalMaterialId) => {
    const mat = METAL_MATERIALS[matId];
    audioEngine.playClick(matId === 'classic' ? 'button' : 'metal');
    setMaterial(matId);
    toast({
      title: `Global Style: ${mat.name}`,
      description:
        matId === 'classic'
          ? 'Restored default Pure CSS Classic Dark Tactile style'
          : `All buttons, inputs, switches, badges, and cards updated to ${mat.enName}`,
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
                Solution C · WebGL Physical Metal System
              </TactileBadge>
              <span className="text-xs font-mono text-zinc-400">
                Active Global Style:
                <strong style={{ color: activePreset.accentHex }} className="ml-1">
                  {activePreset.name}
                </strong>
              </span>
            </div>
            <h2
              style={{ color: activePreset.accentHex }}
              className="text-lg sm:text-xl font-bold tracking-tight mt-2"
            >
              Classic Dark Tactile (Default) & 6 Physical Metal Materials
            </h2>
          </div>

          <TactileButton
            variant={activeMaterial === 'classic' ? 'metallic' : 'default'}
            size="sm"
            material="classic"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => handleSelectGlobalMaterial('classic')}
          >
            {activeMaterial === 'classic'
              ? '✓ Active: Classic Dark Tactile (Default)'
              : 'Restore Classic Dark Tactile (Default)'}
          </TactileButton>
        </div>

        {/* Live Global Material Interactive Preview Bar */}
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
                <span>Live Global Style Preview: {activePreset.name}</span>
              </div>
              <div className="text-[11px] text-zinc-400">
                All components across the application sync with this style using a clean 1px 135° dual-specular rim
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <TactileButton variant="default" size="sm">
              Default Button
            </TactileButton>
            <TactileButton variant="metallic" size="sm">
              Metallic Primary
            </TactileButton>
            <TactileButton variant="recessed" size="sm">
              Recessed Secondary
            </TactileButton>
            <div className="w-44">
              <TactileInput
                placeholder="Live global input..."
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
          {WEBGL_METAL_IDS.map((matId) => {
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
                        {mat.name}
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
                    {isSelected ? '✓ Active Global' : 'Apply Globally'}
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
                    <span className="text-[10px] text-zinc-500 font-mono">Dark Squircle</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <MetalEmblemShowcaseButton
                      materialId={matId}
                      shape="circle"
                      theme="light"
                      onSelect={() => handleSelectGlobalMaterial(matId)}
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">Light Orb</span>
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
              <span>Solution C · Multi-Metal WebGL GLSL Fragment Shader Source</span>
            </div>
            <TactileButton variant="recessed" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied GLSL' : 'Copy Shader Source'}</span>
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
