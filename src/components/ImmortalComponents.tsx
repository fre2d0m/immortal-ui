import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { audioEngine } from './AudioEngine';
import { Loader2 } from 'lucide-react';
import {
  MetalMaterialId,
  METAL_MATERIALS,
  useMetalConfig,
  getMetalSurfaceGradient,
  WebGLBezelCanvas,
} from './WebGLMetalEngine';

/* =========================================================================
   Dynamic CSS Specular Rim Helpers (for 'classic' Classic Dark Mode)
   ========================================================================= */
const CLASSIC_RIM_DEFAULT = `linear-gradient(
  var(--local-rim-angle, var(--rim-angle, 135deg)),
  rgba(255, 255, 255, 0.45) 0%,
  rgba(255, 255, 255, 0.06) 40%,
  rgba(255, 255, 255, 0.03) 60%,
  rgba(255, 255, 255, 0.24) 100%
)`;

const CLASSIC_RIM_SUBTLE = `linear-gradient(
  var(--local-rim-angle, var(--rim-angle, 135deg)),
  rgba(255, 255, 255, 0.22) 0%,
  rgba(255, 255, 255, 0.04) 42%,
  rgba(255, 255, 255, 0.02) 62%,
  rgba(255, 255, 255, 0.12) 100%
)`;

const CLASSIC_RIM_METALLIC = `linear-gradient(
  var(--local-rim-angle, var(--rim-angle, 135deg)),
  #ffffff 0%,
  #a1a1aa 50%,
  #e4e4e7 100%
)`;

const CLASSIC_RIM_DANGER = `linear-gradient(
  var(--local-rim-angle, var(--rim-angle, 135deg)),
  rgba(251, 113, 133, 0.55) 0%,
  rgba(251, 113, 133, 0.08) 50%,
  rgba(251, 113, 133, 0.28) 100%
)`;

/* =========================================================================
   1. ImmortalButton
   - Default ('classic'): Earliest pure CSS Dark Light-Skeuomorphism
   - Metal selected ('gold', 'platinum', 'obsidian', 'cobalt', 'rosegold', 'emerald'):
     Solution C WebGL GLSL Flowing Metal Shader
   ========================================================================= */
export interface ImmortalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'metallic' | 'recessed' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  material?: MetalMaterialId;
  loading?: boolean;
  soundType?: 'button' | 'metal' | 'switch' | 'select';
  icon?: ReactNode;
  sweepDeg?: number;
  bezelPx?: number;
}

export const ImmortalButton: React.FC<ImmortalButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  material,
  loading = false,
  soundType = 'button',
  icon,
  sweepDeg,
  bezelPx,
  className = '',
  onClick,
  disabled,
  style,
  ...props
}) => {
  const {
    material: globalMaterial,
    bezelWidth: globalBezel,
    hoverSweepDeg: globalHoverSweep,
    surfaceGradientAmplitude,
  } = useMetalConfig();
  const [hovered, setHovered] = useState(false);

  const effectiveMaterial: MetalMaterialId = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    audioEngine.playClick(variant === 'metallic' || !isClassic ? 'metal' : soundType);
    if (onClick) onClick(e);
  };

  if (variant === 'ghost') {
    return (
      <button
        {...props}
        disabled={disabled || loading}
        onClick={handleClick}
        className={`h-10 px-4 rounded-xl border border-white/10 text-xs sm:text-sm text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer transition-colors inline-flex items-center justify-center gap-2 ${className}`}
      >
        {icon}
        {children}
      </button>
    );
  }

  /* -----------------------------------------------------------------------
     MODE A: Classic Pure CSS Classic Dark Skeuomorphic Button (Default)
     ----------------------------------------------------------------------- */
  if (isClassic) {
    const getClassicVariantStyle = (): React.CSSProperties => {
      const effectiveSweep = sweepDeg !== undefined ? sweepDeg : globalHoverSweep;
      const customVars = {
        '--hover-sweep': `${effectiveSweep}deg`,
      } as React.CSSProperties;

      switch (variant) {
        case 'metallic':
          return {
            ...customVars,
            backgroundImage: `linear-gradient(160deg, #ffffff 0%, #d4d4d8 60%, #a1a1aa 100%), ${CLASSIC_RIM_METALLIC}`,
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: `0 8px 20px -2px rgba(255, 255, 255, 0.14), 0 4px 10px rgba(0, 0, 0, 0.85), inset 0 1px 1px #ffffff, inset 0 -1px 1px rgba(0, 0, 0, 0.25)`,
            color: '#09090b',
            fontWeight: 600,
          };
        case 'recessed':
          return {
            ...customVars,
            backgroundImage: `var(--bg-concave), ${CLASSIC_RIM_SUBTLE}`,
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: `var(--shadow-concave)`,
            color: hovered ? '#f4f4f6' : '#a1a1aa',
          };
        case 'danger':
          return {
            ...customVars,
            backgroundImage: `linear-gradient(145deg, #2a1216 0%, #13080a 60%, #1f0d10 100%), ${CLASSIC_RIM_DANGER}`,
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: `var(--shadow-convex-sm)`,
            color: '#fda4af',
          };
        case 'default':
        default:
          return {
            ...customVars,
            backgroundImage: `${hovered ? 'var(--bg-convex-hover)' : 'var(--bg-convex)'}, ${CLASSIC_RIM_DEFAULT}`,
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: `var(--shadow-convex-sm)`,
            color: hovered ? '#ffffff' : '#f4f4f6',
          };
      }
    };

    const getClassicSizeClasses = () => {
      switch (size) {
        case 'sm':
          return 'h-8 px-3 text-xs rounded-lg gap-1.5';
        case 'lg':
          return 'h-12 px-6 text-sm rounded-2xl gap-2.5 font-medium';
        case 'icon':
          return 'w-10 h-10 p-0 rounded-xl justify-center';
        case 'md':
        default:
          return 'h-10 px-4 text-xs sm:text-sm rounded-xl gap-2';
      }
    };

    return (
      <button
        {...props}
        disabled={disabled || loading}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...getClassicVariantStyle(),
          ...style,
        }}
        className={`
          immortal-rim-sweep relative inline-flex items-center justify-center border border-transparent
          font-medium select-none cursor-pointer
          active:translate-y-[1px] active:scale-[0.985]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
          disabled:opacity-50 disabled:pointer-events-none
          ${getClassicSizeClasses()}
          ${className}
        `}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>
        )}
        {children}
      </button>
    );
  }

  /* -----------------------------------------------------------------------
     MODE B: Solution C WebGL Flowing Metal Button (1px hairline micro-bezel)
     ----------------------------------------------------------------------- */
  const effectiveBezel = bezelPx !== undefined ? bezelPx : globalBezel;

  const getOuterSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 rounded-lg text-xs';
      case 'lg':
        return 'h-12 rounded-2xl text-sm font-medium';
      case 'icon':
        return 'w-10 h-10 rounded-xl';
      case 'md':
      default:
        return 'h-10 rounded-xl text-xs sm:text-sm';
    }
  };

  const getInnerPadClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 rounded-[7px] gap-1.5';
      case 'lg':
        return 'px-6 rounded-[15px] gap-2.5';
      case 'icon':
        return 'p-0 rounded-[11px] justify-center';
      case 'md':
      default:
        return 'px-4 rounded-[11px] gap-2';
    }
  };

  const getCapStyle = (): React.CSSProperties => {
    if (variant === 'metallic') {
      return {
        background: getMetalSurfaceGradient(matPreset, surfaceGradientAmplitude),
        color:
          effectiveMaterial === 'obsidian' || effectiveMaterial === 'cobalt'
            ? '#ffffff'
            : '#09090b',
        fontWeight: 600,
        boxShadow:
          'inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -1px 2px rgba(0,0,0,0.45)',
      };
    }
    if (variant === 'danger') {
      return {
        background: 'linear-gradient(145deg, #2a1216 0%, #13080a 60%, #1f0d10 100%)',
        color: '#fda4af',
        boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.85)',
      };
    }
    if (variant === 'recessed') {
      return {
        background: 'linear-gradient(180deg, #040405 0%, #0b0b0d 100%)',
        color: hovered ? matPreset.accentHex : '#a1a1aa',
        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.92)',
      };
    }
    return {
      background: matPreset.capGradient,
      color: hovered ? matPreset.accentHex : '#f4f4f6',
      boxShadow: 'inset 0 -1px 1.5px rgba(0,0,0,0.85)',
    };
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `${effectiveBezel}px`,
        boxShadow:
          variant === 'recessed'
            ? 'inset 0 2px 5px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.05)'
            : '0 4px 10px rgba(0, 0, 0, 0.75), 0 1px 2px rgba(0, 0, 0, 0.8)',
        ...style,
      }}
      className={`
        relative inline-flex items-center justify-center overflow-hidden font-medium
        cursor-pointer select-none active:scale-[0.98] transition-transform duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
        disabled:opacity-50 disabled:pointer-events-none
        ${getOuterSizeClasses()}
        ${className}
      `}
    >
      <WebGLBezelCanvas
        material={variant === 'danger' && !material ? 'rosegold' : effectiveMaterial}
        dimmed={variant === 'recessed' && !hovered}
        hovered={hovered}
        sweepDeg={sweepDeg}
        canvasWidth={size === 'icon' ? 96 : 220}
        canvasHeight={80}
      />

      <span
        style={getCapStyle()}
        className={`relative z-10 w-full h-full inline-flex items-center justify-center gap-2 transition-colors duration-150 ${getInnerPadClasses()}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          icon && (
            <span
              style={{ color: variant === 'metallic' ? 'currentColor' : matPreset.accentHex }}
              className="inline-flex shrink-0 items-center justify-center"
            >
              {icon}
            </span>
          )
        )}
        {children}
      </span>
    </button>
  );
};

/* =========================================================================
   2. ImmortalInput
   ========================================================================= */
export interface ImmortalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  kbd?: string;
  material?: MetalMaterialId;
  onClear?: () => void;
}

export const ImmortalInput: React.FC<ImmortalInputProps> = ({
  icon,
  kbd,
  material,
  className = '',
  value,
  style,
  ...props
}) => {
  const { material: globalMaterial, bezelWidth } = useMetalConfig();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

  if (isClassic) {
    return (
      <div
        style={{
          backgroundImage: `var(--bg-concave), ${
            focused ? 'var(--border-rim-focus)' : 'var(--border-rim-subtle)'
          }`,
          backgroundOrigin: 'padding-box, border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: focused
            ? `inset 0 2px 6px rgba(0, 0, 0, 0.95), 0 0 0 3px rgba(255, 255, 255, 0.06)`
            : `var(--shadow-concave)`,
          ...style,
        }}
        className={`group relative flex items-center w-full rounded-xl border border-transparent transition-all duration-200 ${className}`}
      >
        {icon && (
          <span
            className={`pl-3.5 transition-colors pointer-events-none flex items-center justify-center ${
              focused ? 'text-zinc-200' : 'text-zinc-500'
            }`}
          >
            {icon}
          </span>
        )}
        <input
          {...props}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
          className="w-full h-10 px-3.5 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600 text-xs sm:text-sm font-normal"
        />
        {kbd && (
          <span
            style={{
              backgroundImage: `var(--bg-convex), var(--border-rim-subtle)`,
              backgroundOrigin: 'padding-box, border-box',
              backgroundClip: 'padding-box, border-box',
            }}
            className="mr-2.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 rounded-md border border-transparent shadow-sm select-none"
          >
            {kbd}
          </span>
        )}
      </div>
    );
  }

  const pad = Math.max(1, bezelWidth);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `${pad}px`,
        boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.92), 0 1px 0 rgba(255, 255, 255, 0.05)',
        ...style,
      }}
      className={`group relative flex items-center w-full rounded-xl overflow-hidden ${className}`}
    >
      <WebGLBezelCanvas
        material={effectiveMaterial}
        dimmed={!focused && !hovered}
        hovered={hovered}
        focused={focused}
        sweepDeg={0}
        canvasWidth={320}
        canvasHeight={64}
      />

      <div
        style={{
          background: 'linear-gradient(180deg, #050507 0%, #0b0b0e 100%)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.95)',
        }}
        className="relative z-10 flex items-center w-full rounded-[11px]"
      >
        {icon && (
          <span
            style={{ color: focused || hovered ? matPreset.accentHex : '#a1a1aa' }}
            className="pl-3.5 transition-colors pointer-events-none flex items-center justify-center"
          >
            {icon}
          </span>
        )}
        <input
          {...props}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
          className="w-full h-10 px-3.5 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-500 text-xs sm:text-sm font-normal"
        />
        {kbd && (
          <span
            style={{
              background: matPreset.capGradient,
              color: matPreset.accentHex,
            }}
            className="mr-2.5 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-md border border-white/15 shadow-sm select-none"
          >
            {kbd}
          </span>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   3. ImmortalTextarea
   ========================================================================= */
export interface ImmortalTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  material?: MetalMaterialId;
}

export const ImmortalTextarea: React.FC<ImmortalTextareaProps> = ({
  material,
  className = '',
  style,
  ...props
}) => {
  const { material: globalMaterial, bezelWidth } = useMetalConfig();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

  if (isClassic) {
    return (
      <textarea
        {...props}
        onFocus={(e) => {
          setFocused(true);
          if (props.onFocus) props.onFocus(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          if (props.onBlur) props.onBlur(e);
        }}
        style={{
          backgroundImage: `var(--bg-concave), ${
            focused ? 'var(--border-rim-focus)' : 'var(--border-rim-subtle)'
          }`,
          backgroundOrigin: 'padding-box, border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: focused
            ? `inset 0 2px 6px rgba(0, 0, 0, 0.95), 0 0 0 3px rgba(255, 255, 255, 0.06)`
            : `var(--shadow-concave)`,
          ...style,
        }}
        className={`w-full min-h-[86px] p-3.5 rounded-xl border border-transparent outline-none text-zinc-100 placeholder:text-zinc-600 text-xs sm:text-sm font-normal resize-y transition-all duration-200 leading-relaxed ${className}`}
      />
    );
  }

  const pad = Math.max(1, bezelWidth);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `${pad}px`,
        boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.92), 0 1px 0 rgba(255, 255, 255, 0.05)',
        ...style,
      }}
      className={`relative w-full rounded-xl overflow-hidden ${className}`}
    >
      <WebGLBezelCanvas
        material={effectiveMaterial}
        dimmed={!focused && !hovered}
        hovered={hovered}
        focused={focused}
        sweepDeg={0}
        canvasWidth={320}
        canvasHeight={120}
      />
      <div
        style={{
          background: 'linear-gradient(180deg, #050507 0%, #0b0b0e 100%)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.95)',
        }}
        className="relative z-10 w-full rounded-[11px]"
      >
        <textarea
          {...props}
          onFocus={(e) => {
            setFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
          className="w-full min-h-[86px] p-3.5 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-500 text-xs sm:text-sm font-normal resize-y leading-relaxed"
        />
      </div>
    </div>
  );
};

/* =========================================================================
   4. ImmortalSwitch
   ========================================================================= */
export interface ImmortalSwitchProps {
  id?: string;
  ariaLabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  material?: MetalMaterialId;
  className?: string;
}

export const ImmortalSwitch: React.FC<ImmortalSwitchProps> = ({
  id,
  ariaLabel,
  checked,
  onChange,
  label,
  hint,
  material,
  className = '',
}) => {
  const { material: globalMaterial, bezelWidth } = useMetalConfig();
  const [hovered, setHovered] = useState(false);
  const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;

  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

  const toggle = () => {
    audioEngine.playClick('switch');
    onChange(!checked);
  };

  if (isClassic) {
    const classicTrack = (
      <div
        onClick={toggle}
        role="switch"
        aria-label={ariaLabel || label}
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggle();
          }
        }}
        style={{
          backgroundImage: `${
            checked
              ? 'linear-gradient(180deg, #121216 0%, #1c1c22 100%)'
              : 'var(--bg-concave)'
          }, var(--border-rim-subtle)`,
          backgroundOrigin: 'padding-box, border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: `var(--shadow-concave)`,
        }}
        className="relative inline-flex items-center w-12 h-7 rounded-full border border-transparent cursor-pointer shrink-0 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <div
          style={{
            backgroundImage: `${
              checked
                ? 'linear-gradient(145deg, #ffffff 0%, #d4d4d8 100%)'
                : 'linear-gradient(145deg, #27272a 0%, #121215 100%)'
            }, var(--border-rim)`,
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: checked
              ? '0 0 12px rgba(255, 255, 255, 0.35), 0 2px 5px rgba(0, 0, 0, 0.9)'
              : '0 2px 4px rgba(0, 0, 0, 0.9), inset 0 1px 0.5px rgba(255, 255, 255, 0.25)',
            transform: checked ? 'translateX(22px)' : 'translateX(3px)',
          }}
          className="w-5 h-5 rounded-full border border-transparent transition-all duration-300 flex items-center justify-center"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              checked
                ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]'
                : 'bg-zinc-600'
            }`}
          />
        </div>
      </div>
    );

    if (!label) return classicTrack;

    return (
      <div
        style={{
          backgroundImage: `var(--bg-subcard), var(--border-rim-subtle)`,
          backgroundOrigin: 'padding-box, border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 12px rgba(0, 0, 0, 0.6)`,
        }}
        className={`flex items-center justify-between p-3.5 rounded-xl border border-transparent transition-all duration-200 select-none ${className}`}
      >
        <label htmlFor={switchId} onClick={toggle} className="cursor-pointer pr-4 flex-1">
          <div className="text-xs sm:text-sm font-medium text-zinc-100">{label}</div>
          {hint && <div className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">{hint}</div>}
        </label>
        {classicTrack}
      </div>
    );
  }

  /* WebGL Metal Mode */
  const content = (
    <div
      onClick={toggle}
      role="switch"
        aria-label={ariaLabel || label}
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      }}
      style={{
        padding: `${Math.max(1, bezelWidth)}px`,
      }}
      className="relative inline-flex items-center w-12 h-7 cursor-pointer shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-full overflow-hidden"
    >
      <WebGLBezelCanvas
        material={effectiveMaterial}
        dimmed={!checked && !hovered}
        hovered={hovered}
        sweepDeg={0}
        canvasWidth={96}
        canvasHeight={56}
      />

      <div
        style={{
          background: checked
            ? matPreset.capGradient
            : 'linear-gradient(180deg, #040406 0%, #0b0b0e 100%)',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.95)',
        }}
        className="relative z-10 w-full h-full rounded-full flex items-center transition-colors duration-300"
      >
        <div
          style={{
            background: checked
              ? matPreset.swatchGradient
              : 'linear-gradient(145deg, #27272a 0%, #121215 100%)',
            boxShadow: checked
              ? `0 0 10px ${matPreset.accentHex}55, 0 2px 5px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255,255,255,0.8)`
              : '0 2px 4px rgba(0, 0, 0, 0.9), inset 0 1px 0.5px rgba(255, 255, 255, 0.25)',
            transform: checked ? 'translateX(20px)' : 'translateX(2px)',
          }}
          className="w-5 h-5 rounded-full transition-transform duration-300 flex items-center justify-center"
        >
          <span
            style={{
              backgroundColor: checked ? '#09090b' : matPreset.accentHex,
              opacity: checked ? 1 : 0.6,
            }}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
          />
        </div>
      </div>
    </div>
  );

  if (!label) return content;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `${Math.max(1, bezelWidth * 0.65)}px`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.65)',
      }}
      className={`relative rounded-xl overflow-hidden select-none ${className}`}
    >
      <WebGLBezelCanvas
        material={effectiveMaterial}
        dimmed={!checked && !hovered}
        hovered={hovered}
        sweepDeg={0}
        canvasWidth={280}
        canvasHeight={72}
      />
      <div
        style={{
          background: matPreset.capGradient,
        }}
        className="relative z-10 flex items-center justify-between p-3.5 rounded-[10.5px]"
      >
        <label htmlFor={switchId} onClick={toggle} className="cursor-pointer pr-4 flex-1">
          <div className="text-xs sm:text-sm font-medium text-zinc-100">{label}</div>
          {hint && <div className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">{hint}</div>}
        </label>
        {content}
      </div>
    </div>
  );
};

/* =========================================================================
   5. ImmortalCheckbox
   ========================================================================= */
export interface ImmortalCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  material?: MetalMaterialId;
  disabled?: boolean;
}

export const ImmortalCheckbox: React.FC<ImmortalCheckboxProps> = ({
  checked,
  onChange,
  label,
  hint,
  material,
  disabled = false,
}) => {
  const { material: globalMaterial } = useMetalConfig();
  const [hovered, setHovered] = useState(false);
  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

  const toggle = () => {
    if (disabled) return;
    audioEngine.playClick('button');
    onChange(!checked);
  };

  if (isClassic) {
    return (
      <div
        onClick={toggle}
        className={`inline-flex items-start gap-3 cursor-pointer select-none group ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <div
          style={{
            backgroundImage: checked
              ? `linear-gradient(145deg, #f4f4f6 0%, #a1a1aa 100%), var(--border-rim)`
              : `var(--bg-concave), var(--border-rim-subtle)`,
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: checked
              ? `0 3px 8px rgba(0, 0, 0, 0.8), inset 0 1px 0.5px #ffffff`
              : `var(--shadow-concave)`,
          }}
          className="w-5 h-5 rounded-md border border-transparent flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#09090b"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-3.5 h-3.5 transition-all duration-200 ${
              checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        {label && (
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
              {label}
            </span>
            {hint && <span className="text-[11px] text-zinc-500">{hint}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-flex items-start gap-3 cursor-pointer select-none group ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div
        style={{ padding: '1px' }}
        className="relative w-5 h-5 rounded-md overflow-hidden shrink-0 mt-0.5"
      >
        <WebGLBezelCanvas
          material={effectiveMaterial}
          dimmed={!checked && !hovered}
          hovered={hovered}
          sweepDeg={0}
          canvasWidth={48}
          canvasHeight={48}
        />
        <div
          style={{
            background: checked
              ? matPreset.swatchGradient
              : 'linear-gradient(180deg, #050507 0%, #0b0b0d 100%)',
          }}
          className="relative z-10 w-full h-full rounded-[4.5px] flex items-center justify-center"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={
              effectiveMaterial === 'obsidian' || effectiveMaterial === 'cobalt'
                ? '#ffffff'
                : '#09090b'
            }
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-3 h-3 transition-all duration-200 ${
              checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      {label && (
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
            {label}
          </span>
          {hint && <span className="text-[11px] text-zinc-500">{hint}</span>}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   6. ImmortalRadioGroup
   ========================================================================= */
export interface ImmortalRadioOption {
  value: string;
  label: string;
  hint?: string;
}

export const ImmortalRadioGroup: React.FC<{
  name: string;
  options: ImmortalRadioOption[];
  value: string;
  onChange: (val: string) => void;
  material?: MetalMaterialId;
  direction?: 'row' | 'column';
}> = ({ options, value, onChange, material, direction = 'row' }) => {
  const { material: globalMaterial } = useMetalConfig();
  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

  if (isClassic) {
    return (
      <div className={`flex ${direction === 'row' ? 'flex-wrap gap-4' : 'flex-col gap-2.5'}`}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <div
              key={opt.value}
              onClick={() => {
                audioEngine.playClick('select');
                onChange(opt.value);
              }}
              className="inline-flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div
                style={{
                  backgroundImage: `var(--bg-concave), ${
                    isSelected ? 'var(--border-rim)' : 'var(--border-rim-subtle)'
                  }`,
                  backgroundOrigin: 'padding-box, border-box',
                  backgroundClip: 'padding-box, border-box',
                  boxShadow: `var(--shadow-concave)`,
                }}
                className="w-5 h-5 rounded-full border border-transparent flex items-center justify-center shrink-0 transition-all duration-200"
              >
                <div
                  style={{
                    transform: isSelected ? 'scale(1)' : 'scale(0.3)',
                    opacity: isSelected ? 1 : 0,
                    background: 'radial-gradient(circle at 35% 35%, #ffffff, #a1a1aa)',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
                  }}
                  className="w-2.5 h-2.5 rounded-full transition-all duration-200"
                />
              </div>
              <div className="text-xs sm:text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                {opt.label}
                {opt.hint && <span className="text-zinc-500 ml-1.5 text-xs">({opt.hint})</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex ${direction === 'row' ? 'flex-wrap gap-4' : 'flex-col gap-2.5'}`}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <div
            key={opt.value}
            onClick={() => {
              audioEngine.playClick('select');
              onChange(opt.value);
            }}
            className="inline-flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div
              style={{ padding: '1px' }}
              className="relative w-5 h-5 rounded-full overflow-hidden shrink-0"
            >
              <WebGLBezelCanvas
                material={effectiveMaterial}
                dimmed={!isSelected}
                sweepDeg={0}
                canvasWidth={48}
                canvasHeight={48}
              />
              <div
                style={{
                  background: 'linear-gradient(180deg, #050507 0%, #0b0b0d 100%)',
                }}
                className="relative z-10 w-full h-full rounded-full flex items-center justify-center"
              >
                <div
                  style={{
                    transform: isSelected ? 'scale(1)' : 'scale(0.3)',
                    opacity: isSelected ? 1 : 0,
                    background: matPreset.swatchGradient,
                    boxShadow: `0 0 6px ${matPreset.accentHex}88`,
                  }}
                  className="w-2.5 h-2.5 rounded-full transition-all duration-200"
                />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
              {opt.label}
              {opt.hint && <span className="text-zinc-500 ml-1.5 text-xs">({opt.hint})</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* =========================================================================
   7. ImmortalSlider
   ========================================================================= */
export interface ImmortalSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
  material?: MetalMaterialId;
}

export const ImmortalSlider: React.FC<ImmortalSliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  unit = '%',
  material,
}) => {
  const { material: globalMaterial } = useMetalConfig();
  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;
  const percentage = Math.round(((value - min) / (max - min)) * 100);

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
          <span>{label}</span>
          <span
            style={{ color: isClassic ? '#e4e4e7' : matPreset.accentHex }}
            className="font-mono bg-zinc-900/80 px-2 py-0.5 rounded border border-white/10"
          >
            {value}
            {unit}
          </span>
        </div>
      )}
      <div className="relative flex items-center h-6 w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            onChange(Number(e.target.value));
          }}
          onMouseDown={() => audioEngine.playClick('select')}
          style={{
            background: isClassic
              ? `linear-gradient(90deg, #e4e4e7 0%, #71717a ${percentage}%, #050507 ${percentage}%, #09090b 100%)`
              : `linear-gradient(90deg, ${matPreset.accentHex} 0%, ${matPreset.accentHex}99 ${percentage}%, #050507 ${percentage}%, #09090b 100%)`,
            boxShadow: `var(--shadow-concave)`,
          }}
          className="
            w-full h-2 rounded-full appearance-none cursor-pointer border border-white/10 outline-none
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[1.5px] [&::-webkit-slider-thumb]:border-white/80
            [&::-webkit-slider-thumb]:bg-[radial-gradient(circle_at_35%_35%,_#3f3f46,_#09090b)]
            [&::-webkit-slider-thumb]:shadow-[0_3px_8px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.4)]
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150
            active:[&::-webkit-slider-thumb]:scale-95
          "
        />
      </div>
    </div>
  );
};

/* =========================================================================
   8. ImmortalSelect
   ========================================================================= */
export interface ImmortalSelectOption {
  value: string;
  label: string;
  description?: string;
}

export const ImmortalSelect: React.FC<{
  options: ImmortalSelectOption[];
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  material?: MetalMaterialId;
}> = ({ options, value, onChange, label, placeholder = 'Select an option...', material }) => {
  const { material: globalMaterial, bezelWidth } = useMetalConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;
  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  if (isClassic) {
    return (
      <div ref={containerRef} className="relative w-full flex flex-col gap-1.5">
        {label && <label className="text-xs font-medium text-zinc-400">{label}</label>}
        <button
          type="button"
          onClick={() => {
            audioEngine.playClick('select');
            setIsOpen(!isOpen);
          }}
          style={{
            backgroundImage: `var(--bg-convex), ${
              isOpen ? 'var(--border-rim-focus)' : 'var(--border-rim)'
            }`,
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: `var(--shadow-convex-sm)`,
          }}
          className="w-full h-10 px-3.5 rounded-xl border border-transparent flex items-center justify-between text-xs sm:text-sm text-zinc-100 cursor-pointer select-none transition-all duration-200 focus:outline-none"
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ml-2 ${
              isOpen ? 'rotate-180 text-zinc-100' : ''
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <div
            style={{
              backgroundImage: `linear-gradient(160deg, #16161a 0%, #09090b 100%), var(--border-rim)`,
              backgroundOrigin: 'padding-box, border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: `0 20px 40px rgba(0, 0, 0, 0.95), inset 0 1px 0.5px rgba(255, 255, 255, 0.2)`,
            }}
            className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-1.5 rounded-xl border border-transparent flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    audioEngine.playClick('select');
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={
                    isSelected
                      ? {
                          backgroundImage: `var(--bg-convex), var(--border-rim-subtle)`,
                          backgroundOrigin: 'padding-box, border-box',
                          backgroundClip: 'padding-box, border-box',
                        }
                      : {}
                  }
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border border-transparent text-xs sm:text-sm cursor-pointer transition-all ${
                    isSelected
                      ? 'text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <div>
                    <div>{opt.label}</div>
                    {opt.description && (
                      <div className="text-[10px] text-zinc-500 font-normal">{opt.description}</div>
                    )}
                  </div>
                  {isSelected && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="w-3.5 h-3.5 text-zinc-100 shrink-0 ml-2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-zinc-400">{label}</label>}
      <button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          audioEngine.playClick('select');
          setIsOpen(!isOpen);
        }}
        style={{
          padding: `${Math.max(1, bezelWidth)}px`,
          boxShadow: '0 4px 10px rgba(0,0,0,0.75)',
        }}
        className="relative w-full h-10 rounded-xl overflow-hidden cursor-pointer select-none focus:outline-none"
      >
        <WebGLBezelCanvas
          material={effectiveMaterial}
          hovered={hovered || isOpen}
          sweepDeg={0}
          canvasWidth={300}
          canvasHeight={64}
        />
        <span
          style={{
            background: matPreset.capGradient,
          }}
          className="relative z-10 w-full h-full px-3.5 rounded-[11px] flex items-center justify-between text-xs sm:text-sm text-zinc-100"
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={matPreset.accentHex}
            strokeWidth="2"
            className={`w-4 h-4 transition-transform duration-200 shrink-0 ml-2 ${
              isOpen ? 'rotate-180' : ''
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            padding: `${Math.max(1, bezelWidth)}px`,
            boxShadow: `0 20px 40px rgba(0, 0, 0, 0.96)`,
          }}
          className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <WebGLBezelCanvas
            material={effectiveMaterial}
            hovered={false}
            sweepDeg={0}
            canvasWidth={300}
            canvasHeight={180}
          />
          <div className="relative z-10 p-1.5 rounded-[10.5px] bg-[#0c0c10] flex flex-col gap-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    audioEngine.playClick('select');
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? 'text-zinc-100 bg-white/10 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <div>
                    <div>{opt.label}</div>
                    {opt.description && (
                      <div className="text-[10px] text-zinc-500 font-normal">{opt.description}</div>
                    )}
                  </div>
                  {isSelected && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={matPreset.accentHex}
                      strokeWidth="3"
                      className="w-3.5 h-3.5 shrink-0 ml-2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   9. ImmortalTabs (Segmented Control)
   ========================================================================= */
export interface ImmortalTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export const ImmortalTabs: React.FC<{
  tabs: ImmortalTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  material?: MetalMaterialId;
  className?: string;
}> = ({ tabs, activeId, onChange, material, className = '' }) => {
  const { material: globalMaterial, bezelWidth } = useMetalConfig();
  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

  if (isClassic) {
    return (
      <div
        style={{
          backgroundImage: `var(--bg-concave), var(--border-rim-subtle)`,
          backgroundOrigin: 'padding-box, border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: `var(--shadow-concave)`,
        }}
        className={`p-1 rounded-xl border border-transparent flex gap-1 ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                audioEngine.playClick('button');
                onChange(tab.id);
              }}
              style={
                isActive
                  ? {
                      backgroundImage: `var(--bg-convex), var(--border-rim)`,
                      backgroundOrigin: 'padding-box, border-box',
                      backgroundClip: 'padding-box, border-box',
                      boxShadow: `var(--shadow-convex-sm)`,
                    }
                  : {}
              }
              className={`
                flex-1 h-8 sm:h-9 px-3 rounded-lg border border-transparent text-xs sm:text-sm font-medium
                flex items-center justify-center gap-1.5 transition-all duration-200 select-none cursor-pointer
                ${
                  isActive
                    ? 'text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }
              `}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundImage: `var(--bg-concave), var(--border-rim-subtle)`,
        backgroundOrigin: 'padding-box, border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: `var(--shadow-concave)`,
      }}
      className={`p-1 rounded-xl border border-transparent flex gap-1 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              audioEngine.playClick('button');
              onChange(tab.id);
            }}
            style={{
              padding: isActive ? `${Math.max(1, bezelWidth)}px` : '0px',
            }}
            className={`
              relative flex-1 h-8 sm:h-9 rounded-lg overflow-hidden text-xs sm:text-sm font-medium
              flex items-center justify-center select-none cursor-pointer
              ${isActive ? 'text-zinc-100 font-semibold shadow-md' : 'text-zinc-400 hover:text-zinc-200'}
            `}
          >
            {isActive && (
              <WebGLBezelCanvas
                material={effectiveMaterial}
                hovered={false}
                sweepDeg={0}
                canvasWidth={140}
                canvasHeight={48}
              />
            )}
            <span
              style={
                isActive
                  ? {
                      background: matPreset.capGradient,
                      color: matPreset.accentHex,
                    }
                  : {}
              }
              className="relative z-10 w-full h-full px-3 rounded-[6.5px] flex items-center justify-center gap-1.5"
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              <span>{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* =========================================================================
   10. ImmortalBadge
   ========================================================================= */
export const ImmortalBadge: React.FC<{
  children: ReactNode;
  dotColor?: 'white' | 'green' | 'amber' | 'crimson';
  material?: MetalMaterialId;
  className?: string;
}> = ({ children, dotColor = 'white', material, className = '' }) => {
  const { material: globalMaterial } = useMetalConfig();
  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

  const getDotStyle = () => {
    switch (dotColor) {
      case 'green':
        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]';
      case 'amber':
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]';
      case 'crimson':
        return 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.85)]';
      case 'white':
      default:
        return 'bg-zinc-200 shadow-[0_0_8px_rgba(255,255,255,0.7)]';
    }
  };

  if (isClassic) {
    return (
      <span
        style={{
          backgroundImage: `var(--bg-convex), var(--border-rim-subtle)`,
          backgroundOrigin: 'padding-box, border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: `var(--shadow-convex-sm)`,
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300 rounded-full border border-transparent select-none ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${getDotStyle()}`} />
        {children}
      </span>
    );
  }

  return (
    <span
      style={{ padding: '1px' }}
      className={`relative inline-flex items-center rounded-full overflow-hidden select-none shadow-sm ${className}`}
    >
      <WebGLBezelCanvas
        material={effectiveMaterial}
        sweepDeg={0}
        canvasWidth={120}
        canvasHeight={40}
      />
      <span
        style={{ background: matPreset.capGradient, color: matPreset.accentHex }}
        className="relative z-10 inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${getDotStyle()}`} />
        {children}
      </span>
    </span>
  );
};

/* =========================================================================
   11. ImmortalCard
   ========================================================================= */
export const ImmortalCard: React.FC<{
  title?: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}> = ({ title, description, badge, children, className = '', headerAction }) => {
  const { material } = useMetalConfig();
  const matPreset = METAL_MATERIALS[material] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

  return (
    <div
      style={{
        backgroundImage: `var(--bg-card), ${matPreset.cssBorderRimSubtle}`,
        backgroundOrigin: 'padding-box, border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: `var(--shadow-convex)`,
      }}
      className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-transparent flex flex-col gap-5 transition-colors duration-200 ${className}`}
    >
      {(title || badge || headerAction) && (
        <div className="flex items-start justify-between border-b border-white/[0.06] pb-3.5">
          <div>
            {title && (
              <h3
                style={!isClassic ? { color: matPreset.accentHex } : undefined}
                className={`text-sm sm:text-base font-semibold tracking-tight ${
                  isClassic
                    ? 'text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400'
                    : ''
                }`}
              >
                {title}
              </h3>
            )}
            {description && <p className="text-xs text-zinc-400 mt-0.5">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {headerAction}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
