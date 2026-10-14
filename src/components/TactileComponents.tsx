import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { audioEngine } from './AudioEngine';
import { Loader2 } from 'lucide-react';
import {
  MetalMaterialId,
  METAL_MATERIALS,
  useMetalConfig,
  WebGLBezelCanvas,
} from './WebGLMetalEngine';

/* =========================================================================
   1. TactileButton (Powered by Solution C WebGL GLSL Flowing Metal Shader)
   Supports global metal material or per-button `material` prop override
   ('platinum' | 'gold' | 'obsidian' | 'cobalt' | 'rosegold' | 'emerald')
   ========================================================================= */
export interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'metallic' | 'recessed' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  material?: MetalMaterialId;
  loading?: boolean;
  soundType?: 'button' | 'metal' | 'switch' | 'select';
  icon?: ReactNode;
  sweepDeg?: number;
  bezelPx?: number;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  material,
  loading = false,
  soundType = 'metal',
  icon,
  sweepDeg,
  bezelPx,
  className = '',
  onClick,
  disabled,
  style,
  ...props
}) => {
  const { material: globalMaterial, bezelWidth: globalBezel } = useMetalConfig();
  const [hovered, setHovered] = useState(false);

  const effectiveMaterial: MetalMaterialId =
    material || (variant === 'danger' ? 'rosegold' : globalMaterial);
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.gold;

  const effectiveBezel =
    bezelPx !== undefined
      ? bezelPx
      : variant === 'recessed'
      ? Math.max(1.25, globalBezel * 0.75)
      : globalBezel;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    audioEngine.playClick(soundType);
    if (onClick) onClick(e);
  };

  const getOuterSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 rounded-[10px] text-xs';
      case 'lg':
        return 'h-12 rounded-[15px] text-sm font-medium';
      case 'icon':
        return 'w-10 h-10 rounded-[13px]';
      case 'md':
      default:
        return 'h-10 rounded-[13px] text-xs sm:text-sm';
    }
  };

  const getInnerPadClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 rounded-[8.5px]';
      case 'lg':
        return 'px-6 rounded-[13px]';
      case 'icon':
        return 'p-0 rounded-[11px] justify-center';
      case 'md':
      default:
        return 'px-4 rounded-[11px]';
    }
  };

  // Inner cap background depending on variant & metal material
  const getCapStyle = (): React.CSSProperties => {
    if (variant === 'metallic') {
      return {
        background: matPreset.swatchGradient,
        color: effectiveMaterial === 'obsidian' || effectiveMaterial === 'cobalt' ? '#ffffff' : '#09090b',
        fontWeight: 600,
        boxShadow:
          'inset 0 1px 1px rgba(255,255,255,0.65), inset 0 -1px 2px rgba(0,0,0,0.45)',
      };
    }
    if (variant === 'danger') {
      return {
        background: 'linear-gradient(155deg, #281014 0%, #110608 65%, #1d0b0e 100%)',
        color: '#fda4af',
        boxShadow:
          'inset 0 1px 0.5px rgba(253,164,175,0.28), inset 0 -2px 4px rgba(0,0,0,0.9)',
      };
    }
    if (variant === 'recessed') {
      return {
        background: 'linear-gradient(180deg, #050507 0%, #0b0b0e 100%)',
        color: hovered ? matPreset.accentHex : '#d4d4d8',
        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.92)',
      };
    }
    return {
      background: matPreset.capGradient,
      color: hovered ? matPreset.accentHex : '#f4f4f6',
      boxShadow: `inset 0 1px 0.5px ${matPreset.bevelHighlight}, inset 0 -2px 4px rgba(0,0,0,0.9)`,
    };
  };

  if (variant === 'ghost') {
    return (
      <button
        {...props}
        disabled={disabled || loading}
        onClick={handleClick}
        className={`h-10 px-4 rounded-xl border border-white/10 text-xs sm:text-sm text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer transition-colors ${className}`}
      >
        {children}
      </button>
    );
  }

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
            : '0 8px 20px -4px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(0, 0, 0, 0.8)',
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
      {/* Solution C: WebGL GLSL Flowing Metal Shader Bezel */}
      <WebGLBezelCanvas
        material={effectiveMaterial}
        dimmed={variant === 'recessed' && !hovered}
        hovered={hovered}
        sweepDeg={sweepDeg}
        canvasWidth={size === 'icon' ? 96 : 220}
        canvasHeight={80}
      />

      {/* Inner Tactile Button Cap */}
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
   2. TactileInput (Powered by Solution C WebGL Metal Bezel)
   ========================================================================= */
export interface TactileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  kbd?: string;
  material?: MetalMaterialId;
  onClear?: () => void;
}

export const TactileInput: React.FC<TactileInputProps> = ({
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
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.gold;
  const pad = Math.max(1.5, Math.min(3.5, bezelWidth * 0.85));

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `${pad}px`,
        boxShadow: '0 6px 16px rgba(0,0,0,0.8)',
        ...style,
      }}
      className={`group relative flex items-center w-full rounded-[13px] overflow-hidden ${className}`}
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
   3. TactileTextarea (Powered by Solution C WebGL Metal Bezel)
   ========================================================================= */
export interface TactileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  material?: MetalMaterialId;
}

export const TactileTextarea: React.FC<TactileTextareaProps> = ({
  material,
  className = '',
  style,
  ...props
}) => {
  const { material: globalMaterial, bezelWidth } = useMetalConfig();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const effectiveMaterial = material || globalMaterial;
  const pad = Math.max(1.5, Math.min(3.5, bezelWidth * 0.85));

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `${pad}px`,
        boxShadow: '0 6px 16px rgba(0,0,0,0.8)',
        ...style,
      }}
      className={`relative w-full rounded-[13px] overflow-hidden ${className}`}
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
   4. TactileSwitch (WebGL Metal Thumb + Recessed Obsidian Track)
   ========================================================================= */
export interface TactileSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  material?: MetalMaterialId;
  className?: string;
}

export const TactileSwitch: React.FC<TactileSwitchProps> = ({
  id,
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
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.gold;

  const toggle = () => {
    audioEngine.playClick('switch');
    onChange(!checked);
  };

  const content = (
    <div
      onClick={toggle}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      }}
      style={{
        padding: `${Math.max(1.5, bezelWidth * 0.75)}px`,
      }}
      className="relative inline-flex items-center w-12 h-7 cursor-pointer shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-full overflow-hidden"
    >
      {/* WebGL Metal Bezel around the Switch Track */}
      <WebGLBezelCanvas
        material={effectiveMaterial}
        dimmed={!checked && !hovered}
        hovered={hovered}
        sweepDeg={0}
        canvasWidth={96}
        canvasHeight={56}
      />

      {/* Inner Concave Track */}
      <div
        style={{
          background: checked
            ? matPreset.capGradient
            : 'linear-gradient(180deg, #040406 0%, #0b0b0e 100%)',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.95)',
        }}
        className="relative z-10 w-full h-full rounded-full flex items-center transition-colors duration-300"
      >
        {/* Metallic Thumb */}
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
   5. TactileCheckbox (WebGL Metal Bezel + Metallic Checkmark)
   ========================================================================= */
export interface TactileCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  material?: MetalMaterialId;
  disabled?: boolean;
}

export const TactileCheckbox: React.FC<TactileCheckboxProps> = ({
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
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.gold;

  const toggle = () => {
    if (disabled) return;
    audioEngine.playClick('button');
    onChange(!checked);
  };

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
        style={{ padding: '1.5px' }}
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
            stroke={effectiveMaterial === 'obsidian' || effectiveMaterial === 'cobalt' ? '#ffffff' : '#09090b'}
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
   6. TactileRadioGroup (WebGL Metal Ring & Core)
   ========================================================================= */
export interface TactileRadioOption {
  value: string;
  label: string;
  hint?: string;
}

export const TactileRadioGroup: React.FC<{
  name: string;
  options: TactileRadioOption[];
  value: string;
  onChange: (val: string) => void;
  material?: MetalMaterialId;
  direction?: 'row' | 'column';
}> = ({ options, value, onChange, material, direction = 'row' }) => {
  const { material: globalMaterial } = useMetalConfig();
  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.gold;

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
              style={{ padding: '1.5px' }}
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
   7. TactileSlider (Metallic Track Fill)
   ========================================================================= */
export interface TactileSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
  material?: MetalMaterialId;
}

export const TactileSlider: React.FC<TactileSliderProps> = ({
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
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.gold;
  const percentage = Math.round(((value - min) / (max - min)) * 100);

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
          <span>{label}</span>
          <span
            style={{ color: matPreset.accentHex }}
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
            background: `linear-gradient(90deg, ${matPreset.accentHex} 0%, ${matPreset.accentHex}99 ${percentage}%, #050507 ${percentage}%, #09090b 100%)`,
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
   8. TactileSelect (Powered by Solution C WebGL Metal Bezel)
   ========================================================================= */
export interface TactileSelectOption {
  value: string;
  label: string;
  description?: string;
}

export const TactileSelect: React.FC<{
  options: TactileSelectOption[];
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  material?: MetalMaterialId;
}> = ({ options, value, onChange, label, placeholder = '选择一个选项...', material }) => {
  const { material: globalMaterial, bezelWidth } = useMetalConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.gold;
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
          padding: `${bezelWidth}px`,
          boxShadow: '0 6px 16px rgba(0,0,0,0.8)',
        }}
        className="relative w-full h-10 rounded-[13px] overflow-hidden cursor-pointer select-none focus:outline-none"
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
            padding: `${Math.max(1.5, bezelWidth * 0.75)}px`,
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
   9. TactileTabs (Segmented Control with WebGL Metal Active Tab)
   ========================================================================= */
export interface TactileTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export const TactileTabs: React.FC<{
  tabs: TactileTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  material?: MetalMaterialId;
  className?: string;
}> = ({ tabs, activeId, onChange, material, className = '' }) => {
  const { material: globalMaterial, bezelWidth } = useMetalConfig();
  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.gold;

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
              padding: isActive ? `${Math.max(1.5, bezelWidth * 0.75)}px` : '0px',
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
   10. TactileBadge (WebGL Metal Capsule)
   ========================================================================= */
export const TactileBadge: React.FC<{
  children: ReactNode;
  dotColor?: 'white' | 'green' | 'amber' | 'crimson';
  material?: MetalMaterialId;
  className?: string;
}> = ({ children, dotColor = 'white', material, className = '' }) => {
  const { material: globalMaterial } = useMetalConfig();
  const effectiveMaterial = material || globalMaterial;
  const matPreset = METAL_MATERIALS[effectiveMaterial] || METAL_MATERIALS.gold;

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

  return (
    <span
      style={{ padding: '1.5px' }}
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
   11. TactileCard
   ========================================================================= */
export const TactileCard: React.FC<{
  title?: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}> = ({ title, description, badge, children, className = '', headerAction }) => {
  const { material } = useMetalConfig();
  const matPreset = METAL_MATERIALS[material] || METAL_MATERIALS.gold;

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
                style={{ color: matPreset.accentHex }}
                className="text-sm sm:text-base font-semibold tracking-tight"
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
