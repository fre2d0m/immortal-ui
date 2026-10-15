import React, { useState } from 'react';
import { ImmortalMark } from './ImmortalMark';
import { METAL_MATERIALS, useMetalConfig, useMaterialSound, WebGLBezelCanvas } from './WebGLMetalEngine';

export const HeroEmblem: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { material, bezelWidth } = useMetalConfig();
  const playSound = useMaterialSound();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const matPreset = METAL_MATERIALS[material] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

  const handlePress = () => {
    playSound('metal');
    setClickCount((prev) => prev + 1);
  };

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
          /* Classic Dark emblem with the shared Immortal UI mark */
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
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] border border-transparent cursor-pointer flex items-center justify-center transition-[color,box-shadow,transform] duration-150 select-none focus:outline-none"
            aria-label="Immortal UI emblem"
            title="Immortal UI · Click to feel physical switch feedback"
          >
            <ImmortalMark className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]" />
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
                padding: `${Math.max(1, bezelWidth)}px`,
                boxShadow: '0 22px 48px rgba(0, 0, 0, 0.96), 0 4px 12px rgba(0, 0, 0, 0.85)',
                transform: pressed ? 'scale(0.97)' : 'scale(1)',
              }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] overflow-hidden cursor-pointer flex items-center justify-center transition-transform duration-150 select-none focus:outline-none"
              aria-label="Immortal UI emblem"
              title="Immortal UI · WebGL physical metal emblem"
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
                <ImmortalMark className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" />
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
