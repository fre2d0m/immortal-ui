import React, { useState } from 'react';
import { audioEngine } from './AudioEngine';
import { METAL_MATERIALS, useMetalConfig, WebGLBezelCanvas } from './WebGLMetalEngine';

export const HeroEmblem: React.FC = () => {
  const { material, bezelWidth } = useMetalConfig();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const matPreset = METAL_MATERIALS[material] || METAL_MATERIALS.gold;

  const handlePress = () => {
    audioEngine.playClick('metal');
    setClickCount((prev) => prev + 1);
  };

  const toHex = (rgb: [number, number, number]) =>
    '#' +
    rgb
      .map((v) =>
        Math.round(Math.min(1, Math.max(0, v)) * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('');

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-7 sm:py-10">
      {/* Background glowing horizontal rail line */}
      <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent top-1/2 -translate-y-6 pointer-events-none" />

      {/* 1:1 Hero WebGL Metal Button */}
      <div className="relative z-10 flex flex-col items-center gap-3.5">
        <div
          style={{
            background: 'linear-gradient(145deg, #040406 0%, #101014 100%)',
            boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.95), 0 1px 0 rgba(255,255,255,0.08)',
            padding: '7px',
          }}
          className="rounded-[35px] inline-flex"
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
            onClick={handlePress}
            style={{
              padding: `${Math.max(2, bezelWidth * 1.15)}px`,
              boxShadow: '0 22px 48px rgba(0, 0, 0, 0.96), 0 4px 12px rgba(0, 0, 0, 0.85)',
              transform: pressed ? 'scale(0.97)' : 'scale(1)',
            }}
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] overflow-hidden cursor-pointer flex items-center justify-center transition-transform duration-150 select-none focus:outline-none"
            title="WebGL GLSL 物理金属按钮 · 切换下方金属材质体验天然黄金/黑钛/钴蓝光泽"
          >
            {/* Solution C WebGL Shader Bezel */}
            <WebGLBezelCanvas
              material={material}
              hovered={hovered}
              canvasWidth={224}
              canvasHeight={224}
            />

            {/* Inner Obsidian Metallic Cap */}
            <div
              style={{
                background: matPreset.capGradient,
                boxShadow: `inset 0 1.5px 1px ${matPreset.bevelHighlight}, inset 0 -3px 6px rgba(0,0,0,0.9)`,
              }}
              className="relative z-10 w-full h-full rounded-[24px] flex items-center justify-center"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-11 h-11 sm:w-13 sm:h-13 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              >
                <defs>
                  <linearGradient id="emblemMetalDynamic" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={toHex(matPreset.highRGB)} />
                    <stop offset="55%" stopColor={toHex(matPreset.midRGB)} />
                    <stop offset="100%" stopColor="#52525b" />
                  </linearGradient>
                </defs>
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  fill="url(#emblemMetalDynamic)"
                />
              </svg>
            </div>
          </button>
        </div>

        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-3 py-0.5 rounded-full border border-white/10">
          当前全局金属材质：
          <strong style={{ color: matPreset.accentHex }} className="ml-1">
            {matPreset.name} ({matPreset.enName})
          </strong>
          {clickCount > 0 && ` · 按压 × ${clickCount}`}
        </span>
      </div>

      <div className="text-center mt-4 max-w-2xl px-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400">
          WebGL Physical Metal UI System
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
          全面采用 <span className="text-zinc-100 font-medium">方案 C (WebGL GLSL 物理着色器)</span> 构建的暗色金属组件体系。
          默认保持克制干净的 <span className="text-zinc-100 font-medium">135° 静态对角双高光</span>，支持一键将{' '}
          <span className="text-amber-300 font-medium">24K 黄金</span>、
          <span className="text-zinc-200 font-medium">镜面铂银</span>、
          <span className="text-zinc-400 font-medium">曜石黑钛</span>、
          <span className="text-sky-300 font-medium">深海钴蓝钛</span>、
          <span className="text-rose-300 font-medium">玫瑰金</span> 或{' '}
          <span className="text-emerald-300 font-medium">祖母绿钛</span> 设为全局交互材质。
        </p>
      </div>
    </div>
  );
};
