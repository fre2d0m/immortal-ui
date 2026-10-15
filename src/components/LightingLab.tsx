import React, { useState } from 'react';
import { Volume2, VolumeX, RotateCcw, Sparkles, Orbit, Gem, Layers } from 'lucide-react';
import { audioEngine } from './AudioEngine';
import {
  METAL_MATERIALS,
  MetalMaterialId,
  useMetalConfig,
  WebGLBezelCanvas,
} from './WebGLMetalEngine';
import { useToast } from './TactileToast';

export const LightingLab: React.FC = () => {
  const { toast } = useToast();
  const {
    material,
    setMaterial,
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

  const [soundOn, setSoundOn] = useState(true);
  const activePreset = METAL_MATERIALS[material] || METAL_MATERIALS.classic;
  const isClassic = !activePreset.isWebGLMetal;

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audioEngine.enabled = next;
    if (next) audioEngine.playClick('switch');
  };

  const handleReset = () => {
    resetDefaults();
    setSoundOn(true);
    audioEngine.enabled = true;
    audioEngine.playClick('button');
    toast({
      title: '已恢复初始默认风格：经典暗色轻拟物',
      description: '1px 135° 对角双高光 · 凸起与凹陷曜石黑立体质感',
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
      className="w-full max-w-6xl mx-auto p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-transparent mb-8 select-none flex flex-col gap-5 transition-all duration-200"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div
            style={{ color: activePreset.accentHex }}
            className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center"
          >
            {isClassic ? <Layers className="w-4 h-4" /> : <Gem className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 flex items-center gap-2">
              全局风格与金属材质切换引擎 (Style & Metal Customizer)
              <span
                style={{ color: activePreset.accentHex }}
                className="text-[10px] font-normal font-mono bg-zinc-900 px-2 py-0.5 rounded border border-white/10"
              >
                当前：{activePreset.name}
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              默认采用最初的「经典暗色轻拟物 (Pure CSS 135° 对角双高光)」，点击任意金属材质即可一键切换至 WebGL 物理流光金属
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={toggleSound}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
            title="音效开关"
          >
            {soundOn ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span>{soundOn ? '触感音效开启' : '音效静音'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all flex items-center gap-1"
            title="恢复默认经典暗色轻拟物风格"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认轻拟物</span>
          </button>
        </div>
      </div>

      {/* Section 1: Classic Default + 6 Physical Metal Materials Selector */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: activePreset.accentHex }} />
            选择全局渲染风格：经典暗色轻拟物 (默认) 或 6 种 WebGL 物理金属材质
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
                  audioEngine.playClick(isMatClassic ? 'button' : 'metal');
                  setMaterial(mat.id as MetalMaterialId);
                  toast({
                    title: `已切换全局风格：${mat.name}`,
                    description: isMatClassic
                      ? '已恢复初始纯 CSS 135° 对角双高光暗色轻拟物风格'
                      : `已启用方案 C WebGL ${mat.enName} 物理金属材质`,
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
                        padding: isSelected ? '2px' : '1.5px',
                      }
                }
                className={`relative h-14 rounded-xl overflow-hidden cursor-pointer transition-all text-left focus:outline-none ${
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
                    hovered={isSelected}
                    sweepDeg={0}
                    canvasWidth={150}
                    canvasHeight={64}
                  />
                )}
                <div
                  style={!isMatClassic ? { background: mat.capGradient } : undefined}
                  className={
                    isMatClassic
                      ? 'w-full h-full flex items-center gap-2'
                      : 'relative z-10 w-full h-full px-2.5 py-2 rounded-[10px] flex items-center gap-2'
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
                      {isSelected ? '✓ 当前生效' : isMatClassic ? 'Default CSS' : mat.enName}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: 4 Core WebGL Shader Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-black/45 border border-white/[0.06]">
        {/* 1. Dispersion */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-zinc-300 font-medium">
            <span>棱镜色散强度 (Dispersion)</span>
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
            0% 呈现纯粹金属本色；调高激发彩虹色散边
          </span>
        </div>

        {/* 2. Liquid Warp */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-zinc-300 font-medium">
            <span>液态水银扭曲 (Liquid Warp)</span>
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
            0% 为锐利镜面高光；调高产生液态水银波纹
          </span>
        </div>

        {/* 3. Bezel Width */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-zinc-300 font-medium">
            <span>金属倒角厚度 (Bezel Width)</span>
            <span className="font-mono text-zinc-200">{bezelWidth}px</span>
          </div>
          <input
            type="range"
            min={1}
            max={6}
            step={0.5}
            value={bezelWidth}
            onChange={(e) => setBezelWidth(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-900 border border-white/10"
          />
          <span className="text-[10px] text-zinc-500">
            推荐 2px 精致金属边，或 4px 重工宽体金属圈
          </span>
        </div>

        {/* 4. Fluid Animation Mode */}
        <div className="flex flex-col justify-between gap-1.5">
          <span className="text-xs text-zinc-300 font-medium">默认流光模式</span>
          <button
            type="button"
            onClick={() => {
              audioEngine.playClick('switch');
              setAutoFlow(!autoFlow);
            }}
            className={`h-9 px-3 rounded-xl border text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
              autoFlow
                ? 'bg-zinc-800/90 border-white/25 text-white'
                : 'bg-zinc-950 border-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            <span>{autoFlow ? '已开启持续旋转流光' : '静态 135° 对角双高光 (默认)'}</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                autoFlow
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                  : 'bg-zinc-600'
              }`}
            />
          </button>
          <span className="text-[10px] text-zinc-500">
            默认关闭自动流转，保持界面克制干净
          </span>
        </div>
      </div>

      {/* Section 3: Hover Sweep Distance Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <Orbit className="w-3.5 h-3.5 text-zinc-300" />
          <span>全局按钮 Hover 表现（默认不旋转，仅原地提亮）：</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: '0° 不旋转·仅原地提亮 (默认)', deg: 0 },
            { label: '+90° 微转四分之一圈', deg: 90 },
            { label: '+180° 对角高光互换', deg: 180 },
            { label: '+360° 完整转一圈', deg: 360 },
            { label: '-180° 逆向旋转', deg: -180 },
          ].map((p) => (
            <button
              key={p.deg}
              type="button"
              onClick={() => {
                audioEngine.playClick('select');
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
