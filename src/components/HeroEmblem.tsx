import React, { useState } from 'react';
import { audioEngine } from './AudioEngine';
import { METAL_MATERIALS, useMetalConfig, WebGLBezelCanvas } from './WebGLMetalEngine';

export const HeroEmblem: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { material, bezelWidth } = useMetalConfig();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const matPreset = METAL_MATERIALS[material] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

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
    <div
      className={`relative flex flex-col items-center justify-center w-full ${
        compact ? 'py-3' : 'py-6 sm:py-8'
      }`}
    >
      {/* Background glowing horizontal rail line */}
      <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent top-1/2 -translate-y-4 pointer-events-none" />

      {/* 1:1 Hero Button (Classic Dark by default, or WebGL Metal when selected) */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        {isClassic ? (
          /* Original 1:1 Pure CSS Dark Light-Skeuomorphic X Button */
          <button
            type="button"
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            onClick={handlePress}
            style={{
              backgroundImage: `
                linear-gradient(145deg, #1b1b20 0%, #060608 55%, #121216 100%),
                linear-gradient(
                  var(--rim-angle, 135deg),
                  rgba(255, 255, 255, 0.52) 0%,
                  rgba(255, 255, 255, 0.06) 38%,
                  rgba(255, 255, 255, 0.03) 62%,
                  rgba(255, 255, 255, 0.28) 100%
                )
              `,
              backgroundOrigin: 'padding-box, border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: pressed
                ? `0 8px 20px rgba(0, 0, 0, 0.9), inset 0 3px 8px rgba(0, 0, 0, 0.95)`
                : `0 22px 48px rgba(0, 0, 0, 0.95), 0 4px 12px rgba(0, 0, 0, 0.8), inset 0 1.5px 1px rgba(255, 255, 255, 0.22), inset 0 -3px 6px rgba(0, 0, 0, 0.9)`,
              transform: pressed ? 'translateY(1px) scale(0.97)' : 'translateY(0) scale(1)',
            }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] border-[1.5px] border-transparent cursor-pointer flex items-center justify-center transition-all duration-150 select-none focus:outline-none"
            title="1:1 Reference Classic Dark Button · Click to feel physical switch feedback"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-11 h-11 sm:w-13 sm:h-13 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
            >
              <defs>
                <linearGradient id="emblemMetalClassic" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#e4e4e7" />
                  <stop offset="100%" stopColor="#71717a" />
                </linearGradient>
              </defs>
              <path
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                fill="url(#emblemMetalClassic)"
              />
            </svg>
          </button>
        ) : (
          /* WebGL Flowing Metal Mode */
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
                padding: `${Math.max(1.5, bezelWidth * 1.5)}px`,
                boxShadow: '0 22px 48px rgba(0, 0, 0, 0.96), 0 4px 12px rgba(0, 0, 0, 0.85)',
                transform: pressed ? 'scale(0.97)' : 'scale(1)',
              }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] overflow-hidden cursor-pointer flex items-center justify-center transition-transform duration-150 select-none focus:outline-none"
              title="WebGL GLSL Physical Metal Button"
            >
              <WebGLBezelCanvas
                material={material}
                hovered={hovered}
                canvasWidth={224}
                canvasHeight={224}
              />

              <div
                style={{
                  background: matPreset.capGradient,
                  boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.9)',
                }}
                className="relative z-10 w-full h-full rounded-[26.5px] flex items-center justify-center"
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
        )}

        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-3 py-0.5 rounded-full border border-white/10">
          Active Style:
          <strong style={{ color: matPreset.accentHex }} className="ml-1">
            {matPreset.name}
          </strong>
          {clickCount > 0 && ` · Pressed × ${clickCount}`}
        </span>
      </div>
    </div>
  );
};
