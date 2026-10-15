import React, { useId } from 'react';
import { Volume2, VolumeX, RotateCcw, Sparkles, Orbit, Gem, Layers } from 'lucide-react';
import { audioEngine } from './AudioEngine';
import {
  METAL_MATERIALS,
  MetalMaterialId,
  useMetalConfig,
  useMaterialSound,
  useSoundEnabled,
  WebGLBezelCanvas,
} from './WebGLMetalEngine';
import { useToast } from './ImmortalToast';
import { ImmortalButton } from './ImmortalComponents';

export const LightingLab: React.FC = () => {
  const { toast } = useToast();
  const {
    material,
    setMaterial,
    surfaceGradientAmplitude,
    setSurfaceGradientAmplitude,
    dispersion,
    setDispersion,
    liquidWarp,
    setLiquidWarp,
    bezelWidth,
    setBezelWidth,
    autoFlow,
    setAutoFlow,
    hoverSweepDeg,
    setHoverSweepDeg,
    resetDefaults,
  } = useMetalConfig();

  const surfaceGradientId = useId();
  const soundOn = useSoundEnabled();
  const playSound = useMaterialSound();
  const activePreset = METAL_MATERIALS[material] || METAL_MATERIALS.classic;
  const isClassic = !activePreset.isWebGLMetal;

  const toggleSound = () => {
    const next = !soundOn;
    audioEngine.enabled = next;
    if (next) playSound('switch');
  };

  const handleReset = () => {
    resetDefaults();
    toast({
      title: 'Restored Default Style: Classic Dark',
      description: '1px 135° dual-specular micro-bevel with convex & concave obsidian surfaces',
      type: 'info',
    });
  };

  const materialList = Object.values(METAL_MATERIALS);

  return (
    <div
      style={{
        backgroundImage: `var(--bg-subcard), ${activePreset.cssBorderRimSubtle}`,
        backgroundOrigin: 'padding-box, border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 8px 24px rgba(0, 0, 0, 0.75)`,
      }}
      className="immortal-container w-full max-w-6xl mx-auto p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-transparent mb-8 select-none flex flex-col gap-5 transition-[color,box-shadow,opacity,transform] duration-200"
    >
      {/* Top Header */}
      <div className="immortal-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div
            style={{ color: activePreset.accentHex }}
            className="immortal-container w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center"
          >
            {isClassic ? <Layers className="w-4 h-4" /> : <Gem className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Style & Physical Metal Customizer
              <span
                style={{ color: activePreset.accentHex }}
                className="text-[10px] font-normal font-mono bg-zinc-900 px-2 py-0.5 rounded border border-white/10"
              >
                Active: {activePreset.name}
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Defaults to Classic Dark (Pure CSS 135° dual-specular rim). Select any metal to switch to WebGL physical shaders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={toggleSound}
            disabled={isClassic}
            aria-pressed={!isClassic && soundOn}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer disabled:cursor-default disabled:opacity-60 transition-[color,box-shadow,opacity,transform]"
            title={isClassic ? 'Classic Dark is always silent. Select a metal to hear its tone.' : 'Mute or enable all metal interaction sounds'}
          >
            {!isClassic && soundOn ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span>{isClassic ? 'Silent · Classic' : soundOn ? 'Sound On' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-[color,box-shadow,opacity,transform] flex items-center gap-1"
            title="Reset to default Classic Dark style"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* Section 1: Classic Default + 6 Physical Metal Materials Selector */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: activePreset.accentHex }} />
            Global Rendering Style: Classic Dark (Default) or 6 WebGL Physical Metals
          </span>
          <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
            {activePreset.name} · {activePreset.description}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {materialList.map((mat) => {
            const isSelected = mat.id === material;
            const isMatClassic = !mat.isWebGLMetal;
            return (
              <button
                key={mat.id}
                type="button"
                onClick={() => {
                  audioEngine.playClick('metal', mat.id as MetalMaterialId);
                  setMaterial(mat.id as MetalMaterialId);
                  toast({
                    title: `Global Style: ${mat.name}`,
                    description: isMatClassic
                      ? 'Switched to default Pure CSS 135° dual-specular Classic Dark style'
                      : `Enabled Solution C WebGL ${mat.enName} physical metal shader`,
                    type: 'success',
                  });
                }}
                style={
                  isMatClassic
                    ? {
                        backgroundImage: `var(--bg-convex), ${
                          isSelected ? 'var(--border-rim-focus)' : 'var(--border-rim)'
                        }`,
                        backgroundOrigin: 'padding-box, border-box',
                        backgroundClip: 'padding-box, border-box',
                        boxShadow: `var(--shadow-convex-sm)`,
                      }
                    : {
                        padding: '1px',
                      }
                }
                className={`relative h-14 rounded-xl overflow-hidden cursor-pointer transition-[color,box-shadow,opacity,transform] text-left focus:outline-none ${
                  isMatClassic ? 'border border-transparent px-2.5 py-2 flex items-center gap-2' : ''
                } ${
                  isSelected
                    ? 'shadow-[0_6px_20px_rgba(0,0,0,0.9)] ring-1 ring-white/30'
                    : 'opacity-80 hover:opacity-100'
                }`}
              >
                {!isMatClassic && (
                  <WebGLBezelCanvas
                    material={mat.id as MetalMaterialId}
                    hovered={false}
                    canvasWidth={150}
                    canvasHeight={64}
                  />
                )}
                <div
                  style={!isMatClassic ? { background: mat.capGradient } : undefined}
                  className={
                    isMatClassic
                      ? 'w-full h-full flex items-center gap-2'
                      : 'relative z-10 w-full h-full px-2.5 py-2 rounded-[10.5px] flex items-center gap-2'
                  }
                >
                  <span
                    style={{
                      background: mat.swatchGradient,
                      boxShadow:
                        'inset 0 1px 1px rgba(255,255,255,0.8), 0 2px 5px rgba(0,0,0,0.8)',
                    }}
                    className="w-5 h-5 rounded-full shrink-0 border border-white/25"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      style={{ color: isSelected ? mat.accentHex : '#e4e4e7' }}
                      className="text-[11px] font-semibold truncate"
                    >
                      {mat.name}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono truncate">
                      {isSelected ? '✓ Active' : isMatClassic ? 'Default CSS' : mat.enName}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filled metal faces have their own contrast, independent of the diagonal rim. */}
      <div className="immortal-container grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-center gap-6 p-4 rounded-2xl bg-black/45 border border-white/[0.06]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-4 text-xs font-medium text-zinc-300">
            <label htmlFor={surfaceGradientId}>Surface Gradient Amplitude</label>
            <output htmlFor={surfaceGradientId} className="font-mono text-zinc-200">{surfaceGradientAmplitude}%</output>
          </div>
          <input
            id={surfaceGradientId}
            aria-describedby={`${surfaceGradientId}-hint`}
            type="range"
            min={0}
            max={100}
            step={5}
            value={surfaceGradientAmplitude}
            onChange={(event) => setSurfaceGradientAmplitude(Number(event.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-900 border border-white/10"
          />
          <div className="flex justify-between text-[10px] text-zinc-500"><span>0% · Flat finish</span><span>100% · Full contrast</span></div>
          <p id={`${surfaceGradientId}-hint`} className="text-[10px] leading-relaxed text-zinc-500">
            Soften bright-to-dark transitions on filled metal buttons. Defaults to 35%; diagonal rim highlights stay unchanged.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 px-3">
          <span className="text-[10px] text-zinc-500">Live surface preview{isClassic ? ' · Gold' : ''}</span>
          <ImmortalButton variant="metallic" size="sm" material={isClassic ? 'gold' : undefined} aria-label="Metallic surface preview">Metallic Primary</ImmortalButton>
        </div>
      </div>

      {/* Section 2: 4 Core WebGL Shader Controls */}
      <div className="immortal-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-black/45 border border-white/[0.06]">
        {/* 1. Dispersion */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-zinc-300 font-medium">
            <span>Prismatic Dispersion</span>
            <span className="font-mono text-amber-300">{dispersion}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={dispersion}
            onChange={(e) => setDispersion(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-900 border border-white/10"
          />
          <span className="text-[10px] text-zinc-500">
            0% preserves pure metal reflectance; higher values add iridescent dispersion
          </span>
        </div>

        {/* 2. Liquid Warp */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-zinc-300 font-medium">
            <span>Liquid Mercury Warp</span>
            <span className="font-mono text-sky-300">{liquidWarp}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={liquidWarp}
            onChange={(e) => setLiquidWarp(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-900 border border-white/10"
          />
          <span className="text-[10px] text-zinc-500">
            0% keeps crisp mirror reflections; higher values create liquid ripples
          </span>
        </div>

        {/* 3. Bezel Width */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-zinc-300 font-medium">
            <span>Metallic Bezel Width</span>
            <span className="font-mono text-zinc-200">{bezelWidth}px</span>
          </div>
          <input
            type="range"
            min={0.75}
            max={4}
            step={0.25}
            value={bezelWidth}
            onChange={(e) => setBezelWidth(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-900 border border-white/10"
          />
          <span className="text-[10px] text-zinc-500">
            Defaults to 1px hairline matching Classic CSS; increase for heavier bezels
          </span>
        </div>

        {/* 4. Fluid Animation Mode */}
        <div className="flex flex-col justify-between gap-1.5">
          <span className="text-xs text-zinc-300 font-medium">Ambient Rim Motion</span>
          <button
            type="button"
            onClick={() => {
              playSound('switch');
              setAutoFlow(!autoFlow);
            }}
            className={`h-9 px-3 rounded-xl border text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
              autoFlow
                ? 'bg-zinc-800/90 border-white/25 text-white'
                : 'bg-zinc-950 border-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            <span>{autoFlow ? 'Continuous Flow Enabled' : 'Static 135° Dual Rim (Default)'}</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                autoFlow
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                  : 'bg-zinc-600'
              }`}
            />
          </button>
          <span className="text-[10px] text-zinc-500">
            Auto-rotation is off by default for a clean, distraction-free interface
          </span>
        </div>
      </div>

      {/* Section 3: Hover Sweep Distance Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <Orbit className="w-3.5 h-3.5 text-zinc-300" />
          <span>Global Hover Behavior (+90° Quarter Turn by default):</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: '0° Static · In-Place Boost', deg: 0 },
            { label: '+90° Quarter Turn (Default)', deg: 90 },
            { label: '+180° Diagonal Swap', deg: 180 },
            { label: '+360° Full Orbit', deg: 360 },
            { label: '-180° Reverse Sweep', deg: -180 },
          ].map((p) => (
            <button
              key={p.deg}
              type="button"
              aria-pressed={hoverSweepDeg === p.deg}
              onClick={() => {
                playSound('select');
                setHoverSweepDeg(p.deg);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer transition-colors ${
                hoverSweepDeg === p.deg
                  ? 'bg-zinc-800 text-white font-medium border border-white/20'
                  : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
