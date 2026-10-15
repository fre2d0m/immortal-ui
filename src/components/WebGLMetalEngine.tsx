import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';

/* =========================================================================
   1. Style & Physical Metal Material Definitions
   - 'classic' (DEFAULT): Earliest pure CSS Dark Light-Skeuomorphism
     (1px 135° diagonal dual-specular rim, convex/concave obsidian surfaces)
   - 'gold' | 'platinum' | 'obsidian' | 'cobalt' | 'rosegold' | 'emerald':
     Solution C WebGL GLSL Physical Flowing Metal Shaders (1px refined micro-bezel)
   ========================================================================= */
export type MetalMaterialId =
  | 'classic'
  | 'platinum'
  | 'gold'
  | 'obsidian'
  | 'cobalt'
  | 'rosegold'
  | 'emerald';

export interface MetalMaterialPreset {
  id: MetalMaterialId;
  name: string;
  enName: string;
  description: string;
  isWebGLMetal: boolean;
  /** Specular peak highlight color (RGB 0..1) */
  highRGB: [number, number, number];
  /** Primary metallic body reflection color (RGB 0..1) */
  midRGB: [number, number, number];
  /** Deep horizon shadow color (RGB 0..1) */
  darkRGB: [number, number, number];
  /** UI preview swatch CSS gradient */
  swatchGradient: string;
  /** Subtle inner cap background gradient */
  capGradient: string;
  /** Inner top bevel specular highlight CSS color */
  bevelHighlight: string;
  /** Accent text/icon color on dark cap */
  accentHex: string;
  /** CSS border-rim gradient for cards & containers */
  cssBorderRim: string;
  /** Subtle CSS border-rim gradient for subcards & containers */
  cssBorderRimSubtle: string;
}

export const METAL_MATERIALS: Record<MetalMaterialId, MetalMaterialPreset> = {
  classic: {
    id: 'classic',
    name: 'Classic Dark Tactile',
    enName: 'Classic CSS',
    description: 'Default style · 1px 135° dual-specular micro-bevel with convex & concave obsidian surfaces',
    isWebGLMetal: false,
    highRGB: [1.0, 1.0, 1.0],
    midRGB: [0.75, 0.75, 0.78],
    darkRGB: [0.06, 0.06, 0.08],
    swatchGradient:
      'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, #27272a 45%, #09090b 75%, rgba(255,255,255,0.45) 100%)',
    capGradient: 'linear-gradient(145deg, #1b1b1f 0%, #09090b 55%, #141418 100%)',
    bevelHighlight: 'rgba(255, 255, 255, 0.16)',
    accentHex: '#f4f4f6',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.03) 60%, rgba(255,255,255,0.24) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0.02) 62%, rgba(255,255,255,0.12) 100%)',
  },
  gold: {
    id: 'gold',
    name: '24K Royal Gold',
    enName: '24K Royal Gold',
    description: 'Warm champagne gold specular peaks woven with deep antique bronze shadows',
    isWebGLMetal: true,
    highRGB: [0.98, 0.88, 0.48],
    midRGB: [0.82, 0.58, 0.10],
    darkRGB: [0.12, 0.08, 0.02],
    swatchGradient: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #422006 100%)',
    capGradient: 'linear-gradient(145deg, #1c1810 0%, #090806 55%, #14110b 100%)',
    bevelHighlight: 'rgba(253, 224, 71, 0.16)',
    accentHex: '#fde047',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(253,224,71,0.48) 0%, rgba(234,179,8,0.08) 40%, rgba(161,98,7,0.04) 60%, rgba(250,204,21,0.25) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(253,224,71,0.25) 0%, rgba(234,179,8,0.05) 42%, rgba(161,98,7,0.02) 62%, rgba(250,204,21,0.14) 100%)',
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum Chrome',
    enName: 'Platinum Chrome',
    description: 'High-purity cool mirror silver with high-contrast polished chrome gleam',
    isWebGLMetal: true,
    highRGB: [0.95, 0.96, 0.98],
    midRGB: [0.64, 0.67, 0.73],
    darkRGB: [0.06, 0.06, 0.08],
    swatchGradient: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 50%, #18181b 100%)',
    capGradient: 'linear-gradient(145deg, #1b1b1f 0%, #09090b 55%, #141418 100%)',
    bevelHighlight: 'rgba(255, 255, 255, 0.16)',
    accentHex: '#f4f4f6',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(255,255,255,0.48) 0%, rgba(161,161,170,0.07) 40%, rgba(161,161,170,0.03) 60%, rgba(255,255,255,0.25) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0.02) 62%, rgba(255,255,255,0.13) 100%)',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Titanium',
    enName: 'Obsidian Titanium',
    description: 'Anodized stealth gunmetal titanium with understated razor-sharp edge reflections',
    isWebGLMetal: true,
    highRGB: [0.66, 0.68, 0.72],
    midRGB: [0.28, 0.30, 0.34],
    darkRGB: [0.04, 0.04, 0.05],
    swatchGradient: 'linear-gradient(135deg, #a1a1aa 0%, #3f3f46 45%, #09090b 100%)',
    capGradient: 'linear-gradient(145deg, #141418 0%, #070709 55%, #0e0e12 100%)',
    bevelHighlight: 'rgba(161, 161, 170, 0.14)',
    accentHex: '#d4d4d8',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(161,161,170,0.38) 0%, rgba(63,63,70,0.07) 40%, rgba(39,39,42,0.03) 60%, rgba(161,161,170,0.20) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(161,161,170,0.20) 0%, rgba(63,63,70,0.04) 42%, rgba(39,39,42,0.02) 62%, rgba(161,161,170,0.11) 100%)',
  },
  cobalt: {
    id: 'cobalt',
    name: 'Cobalt Blue Metal',
    enName: 'Cobalt Blue Metal',
    description: 'Electroplated sapphire metallic finish with ice-cyan peaks and deep ocean shadows',
    isWebGLMetal: true,
    highRGB: [0.62, 0.86, 1.0],
    midRGB: [0.18, 0.48, 0.90],
    darkRGB: [0.03, 0.07, 0.16],
    swatchGradient: 'linear-gradient(135deg, #bae6fd 0%, #2563eb 50%, #08142c 100%)',
    capGradient: 'linear-gradient(145deg, #111827 0%, #070a10 55%, #0c121e 100%)',
    bevelHighlight: 'rgba(125, 211, 252, 0.16)',
    accentHex: '#7dd3fc',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(125,211,252,0.48) 0%, rgba(37,99,235,0.08) 40%, rgba(29,78,216,0.04) 60%, rgba(96,165,250,0.25) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(125,211,252,0.25) 0%, rgba(37,99,235,0.05) 42%, rgba(29,78,216,0.02) 62%, rgba(96,165,250,0.14) 100%)',
  },
  rosegold: {
    id: 'rosegold',
    name: 'Rose Gold Copper',
    enName: 'Rose Gold Copper',
    description: 'Warm blush champagne rose gold with rich burnished copper undertones',
    isWebGLMetal: true,
    highRGB: [0.98, 0.76, 0.75],
    midRGB: [0.82, 0.38, 0.38],
    darkRGB: [0.14, 0.04, 0.06],
    swatchGradient: 'linear-gradient(135deg, #ffe4e6 0%, #fb7185 50%, #3b0813 100%)',
    capGradient: 'linear-gradient(145deg, #1d1215 0%, #0a0608 55%, #150d10 100%)',
    bevelHighlight: 'rgba(253, 164, 175, 0.16)',
    accentHex: '#fda4af',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(253,164,175,0.48) 0%, rgba(244,63,94,0.08) 40%, rgba(159,18,57,0.04) 60%, rgba(251,113,133,0.25) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(253,164,175,0.25) 0%, rgba(244,63,94,0.05) 42%, rgba(159,18,57,0.02) 62%, rgba(251,113,133,0.14) 100%)',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Titanium',
    enName: 'Emerald Titanium',
    description: 'Precision-grade emerald anodized alloy with cyber-mint specular highlights',
    isWebGLMetal: true,
    highRGB: [0.60, 0.96, 0.80],
    midRGB: [0.10, 0.66, 0.44],
    darkRGB: [0.02, 0.11, 0.07],
    swatchGradient: 'linear-gradient(135deg, #a7f3d0 0%, #10b981 50%, #032217 100%)',
    capGradient: 'linear-gradient(145deg, #0f1d17 0%, #060b09 55%, #0b1511 100%)',
    bevelHighlight: 'rgba(110, 231, 183, 0.16)',
    accentHex: '#6ee7b7',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(110,231,183,0.48) 0%, rgba(16,185,129,0.08) 40%, rgba(5,150,105,0.04) 60%, rgba(52,211,153,0.25) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(110,231,183,0.25) 0%, rgba(16,185,129,0.05) 42%, rgba(5,150,105,0.02) 62%, rgba(52,211,153,0.14) 100%)',
  },
};

/** Helper list of only the 6 WebGL physical metals */
export const WEBGL_METAL_IDS: MetalMaterialId[] = [
  'gold',
  'platinum',
  'obsidian',
  'cobalt',
  'rosegold',
  'emerald',
];

/* =========================================================================
   2. Global Style & Metal Configuration Context
   Default bezelWidth is 1px to match the refined hairline of Classic CSS mode!
   ========================================================================= */
export interface MetalConfigContextType {
  material: MetalMaterialId;
  setMaterial: (m: MetalMaterialId) => void;
  dispersion: number;
  setDispersion: (d: number) => void;
  liquidWarp: number;
  setLiquidWarp: (w: number) => void;
  bezelWidth: number;
  setBezelWidth: (b: number) => void;
  autoFlow: boolean;
  setAutoFlow: (a: boolean) => void;
  flowSpeed: number;
  setFlowSpeed: (s: number) => void;
  hoverSweepDeg: number;
  setHoverSweepDeg: (deg: number) => void;
  baseAngleDeg: number;
  setBaseAngleDeg: (deg: number) => void;
  resetDefaults: () => void;
}

const DEFAULT_METAL_CONFIG: MetalConfigContextType = {
  material: 'classic',
  setMaterial: () => {},
  dispersion: 0,
  setDispersion: () => {},
  liquidWarp: 0,
  setLiquidWarp: () => {},
  bezelWidth: 1,
  setBezelWidth: () => {},
  autoFlow: false,
  setAutoFlow: () => {},
  flowSpeed: 1.0,
  setFlowSpeed: () => {},
  hoverSweepDeg: 0,
  setHoverSweepDeg: () => {},
  baseAngleDeg: 135,
  setBaseAngleDeg: () => {},
  resetDefaults: () => {},
};

const MetalConfigContext = createContext<MetalConfigContextType>(DEFAULT_METAL_CONFIG);

export const useMetalConfig = () => {
  return useContext(MetalConfigContext);
};

/* =========================================================================
   3. Shared Singleton WebGL Shader Engine (Solution C Core)
   Calibrated to match the delicate 135° diagonal dual-specular falloff of
   the classic CSS mode (top-left primary ~50% luminance, middle ~6% quiet
   dark edge, bottom-right secondary ~26% bounce, brightening on hover).
   ========================================================================= */
const VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision highp float;
  varying vec2 v_uv;

  uniform float u_time;
  uniform float u_hoverRad;
  uniform float u_hoverIntensity;
  uniform float u_baseRad;
  uniform float u_dispersion;
  uniform float u_warp;
  uniform float u_aspect;
  uniform vec3 u_highColor;
  uniform vec3 u_midColor;
  uniform vec3 u_darkColor;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += amp * noise(p);
      p = rot * p * 2.02 + vec2(1.7, 9.2);
      amp *= 0.5;
    }
    return v;
  }

  vec3 sampleMetallicSpectrum(float angle, float rotOffset, float hoverBoost, float disp, vec3 cHigh, vec3 cMid, vec3 cDark) {
    float theta = angle - rotOffset;

    // Asymmetric 135-deg Diagonal Dual Specular Distribution
    // Matches CSS: rgba(255,255,255,0.45) 0% -> 0.06 40% -> 0.03 60% -> 0.24 100%
    float cosT = cos(theta);
    float primaryLobe = pow(max(0.0, cosT), 2.1);
    float secondaryLobe = pow(max(0.0, -cosT), 2.3) * 0.52;
    float dw = -sin(theta * 2.0);

    // Normalized specular weight [0.05 = quiet dark edge, 0.92 = top-left peak]
    float t = clamp(0.05 + primaryLobe * 0.86 + secondaryLobe * 0.86 + hoverBoost * 0.16, 0.0, 1.0);

    // 3-stop physical metal interpolation
    vec3 lowerMetal = mix(cDark, cMid, smoothstep(0.04, 0.56, t));
    vec3 baseMetal = mix(lowerMetal, cHigh, smoothstep(0.55, 0.98, t));

    // Restrained luminance envelope so resting state is never glaring,
    // matching the subtle sophistication of Classic Dark Tactile CSS mode
    float restingExposure = mix(0.66, 0.90, hoverBoost);
    baseMetal *= restingExposure;

    if (disp <= 0.005) {
      return baseMetal;
    }

    float fringeBell = pow(sin(t * 3.14159265), 1.6);
    vec3 warmFringe = mix(vec3(0.94, 0.30, 0.04), vec3(0.99, 0.84, 0.12), smoothstep(0.2, 0.78, t));
    vec3 coldFringe = mix(vec3(0.10, 0.30, 0.90), vec3(0.50, 0.86, 1.00), smoothstep(0.2, 0.78, t));
    vec3 prismColor = (dw < 0.0) ? warmFringe : coldFringe;

    return mix(baseMetal, prismColor * restingExposure, fringeBell * disp * 0.85);
  }

  void main() {
    vec2 p = v_uv * 2.0 - 1.0;

    // Gentle aspect correction so rectangular buttons have natural corner-focused highlights
    vec2 pAspect = vec2(p.x * pow(max(u_aspect, 0.25), 0.22), p.y);
    float angle = atan(pAspect.y, pAspect.x);
    float len = length(p);

    float warpPhase = 0.0;
    if (u_warp > 0.005) {
      float cornerFactor = smoothstep(0.3, 1.15, abs(p.x) * abs(p.y) * 2.4 + len * 0.35);
      vec2 flowCoord = p * 2.1 + vec2(cos(u_time * 0.35), sin(u_time * 0.3)) * 0.4;
      float n1 = fbm(flowCoord);
      float n2 = fbm(flowCoord * 1.6 + vec2(n1 * 1.8) - u_time * 0.2);
      float contourWave = sin((len * 14.0 + n2 * 5.5) * u_warp) * 0.4 * u_warp * cornerFactor;
      warpPhase = (n2 - 0.5) * 1.6 * u_warp * cornerFactor + contourWave;
    }

    float rotOffset = u_baseRad + u_time + u_hoverRad + warpPhase;

    vec3 col = sampleMetallicSpectrum(
      angle,
      rotOffset,
      u_hoverIntensity,
      u_dispersion,
      u_highColor,
      u_midColor,
      u_darkColor
    );

    gl_FragColor = vec4(col, 1.0);
  }
`;

interface RegisteredSurface {
  id: string;
  canvas: HTMLCanvasElement;
  ctx2d: CanvasRenderingContext2D;
  getState: () => {
    hovered: boolean;
    focused: boolean;
    mouseX: number;
    mouseY: number;
    materialOverride?: MetalMaterialId;
    sweepDegOverride?: number;
    autoFlowOverride?: boolean;
    dimmed?: boolean;
  };
  currentHoverRad: number;
  currentHoverIntensity: number;
}

class SharedWebGLShaderEngine {
  private glCanvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private surfaces = new Map<string, RegisteredSurface>();
  private animId: number | null = null;
  private lastTime = 0;
  private globalTime = 0;

  public globalConfig = {
    material: 'classic' as MetalMaterialId,
    dispersion: 0,
    liquidWarp: 0,
    bezelWidth: 1,
    autoFlow: false,
    flowSpeed: 1.0,
    hoverSweepDeg: 0,
    baseAngleDeg: 135,
  };

  private initGL() {
    if (this.gl || typeof document === 'undefined') return;
    this.glCanvas = document.createElement('canvas');
    this.glCanvas.width = 256;
    this.glCanvas.height = 256;

    const gl = this.glCanvas.getContext('webgl', {
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) return;
    this.gl = gl;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    this.program = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uNames = [
      'u_time',
      'u_hoverRad',
      'u_hoverIntensity',
      'u_baseRad',
      'u_dispersion',
      'u_warp',
      'u_aspect',
      'u_highColor',
      'u_midColor',
      'u_darkColor',
    ];
    uNames.forEach((name) => {
      this.uniforms[name] = gl.getUniformLocation(prog, name);
    });
  }

  public register(surface: RegisteredSurface) {
    this.initGL();
    this.surfaces.set(surface.id, surface);
    if (this.animId === null) {
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame(this.tick);
    }
  }

  public unregister(id: string) {
    this.surfaces.delete(id);
    if (this.surfaces.size === 0 && this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.lastTime) * 0.001);
    this.lastTime = now;

    const cfg = this.globalConfig;
    if (cfg.autoFlow) {
      this.globalTime += dt * 1.1 * cfg.flowSpeed;
    }

    const gl = this.gl;
    const glCanvas = this.glCanvas;

    if (gl && glCanvas && this.program) {
      const baseRad = ((cfg.baseAngleDeg - 135) * Math.PI) / 180 + (3 * Math.PI) / 4;

      this.surfaces.forEach((surf) => {
        const st = surf.getState();
        const isActive = st.hovered || st.focused;

        const sweepDeg =
          st.sweepDegOverride !== undefined ? st.sweepDegOverride : cfg.hoverSweepDeg;
        const targetHoverRad = isActive ? (sweepDeg * Math.PI) / 180 : 0.0;
        const targetHoverIntensity = isActive ? 1.0 : 0.0;

        surf.currentHoverRad +=
          (targetHoverRad - surf.currentHoverRad) * Math.min(1, dt * 8.0);
        surf.currentHoverIntensity +=
          (targetHoverIntensity - surf.currentHoverIntensity) * Math.min(1, dt * 10.0);

        const matId = st.materialOverride || cfg.material;
        const mat = METAL_MATERIALS[matId] || METAL_MATERIALS.classic;

        const dimFactor = st.dimmed ? 0.55 : 1.0;
        const highColor: [number, number, number] = [
          mat.highRGB[0] * dimFactor,
          mat.highRGB[1] * dimFactor,
          mat.highRGB[2] * dimFactor,
        ];
        const midColor: [number, number, number] = [
          mat.midRGB[0] * dimFactor,
          mat.midRGB[1] * dimFactor,
          mat.midRGB[2] * dimFactor,
        ];

        const w = surf.canvas.width || 160;
        const h = surf.canvas.height || 60;
        const aspect = w / Math.max(1, h);

        const useAutoFlow =
          st.autoFlowOverride !== undefined ? st.autoFlowOverride : cfg.autoFlow;
        const tVal = useAutoFlow ? this.globalTime : 0.0;

        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
        gl.uniform1f(this.uniforms.u_time, tVal);
        gl.uniform1f(this.uniforms.u_hoverRad, surf.currentHoverRad);
        gl.uniform1f(this.uniforms.u_hoverIntensity, surf.currentHoverIntensity);
        gl.uniform1f(this.uniforms.u_baseRad, baseRad);
        gl.uniform1f(this.uniforms.u_dispersion, cfg.dispersion / 100);
        gl.uniform1f(this.uniforms.u_warp, cfg.liquidWarp / 100);
        gl.uniform1f(this.uniforms.u_aspect, aspect);
        gl.uniform3fv(this.uniforms.u_highColor, highColor);
        gl.uniform3fv(this.uniforms.u_midColor, midColor);
        gl.uniform3fv(this.uniforms.u_darkColor, mat.darkRGB);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        surf.ctx2d.clearRect(0, 0, w, h);
        surf.ctx2d.drawImage(glCanvas, 0, 0, w, h);
      });
    }

    if (this.surfaces.size > 0) {
      this.animId = requestAnimationFrame(this.tick);
    } else {
      this.animId = null;
    }
  };
}

export const sharedMetalEngine = new SharedWebGLShaderEngine();

/* =========================================================================
   4. MetalConfigProvider Component
   Defaults to 'classic' with bezelWidth = 1px (matching Classic CSS mode)
   ========================================================================= */
export const MetalConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [material, setMaterial] = useState<MetalMaterialId>('classic');
  const [dispersion, setDispersion] = useState<number>(0);
  const [liquidWarp, setLiquidWarp] = useState<number>(0);
  const [bezelWidth, setBezelWidth] = useState<number>(1);
  const [autoFlow, setAutoFlow] = useState<boolean>(false);
  const [flowSpeed, setFlowSpeed] = useState<number>(1.0);
  const [hoverSweepDeg, setHoverSweepDeg] = useState<number>(0);
  const [baseAngleDeg, setBaseAngleDeg] = useState<number>(135);

  sharedMetalEngine.globalConfig = {
    material,
    dispersion,
    liquidWarp,
    bezelWidth,
    autoFlow,
    flowSpeed,
    hoverSweepDeg,
    baseAngleDeg,
  };

  useEffect(() => {
    const preset = METAL_MATERIALS[material] || METAL_MATERIALS.classic;
    const root = document.documentElement;
    root.style.setProperty('--rim-angle', `${baseAngleDeg}deg`);
    root.style.setProperty('--hover-sweep', `${hoverSweepDeg}deg`);
    root.style.setProperty('--border-rim', preset.cssBorderRim);
    root.style.setProperty('--border-rim-subtle', preset.cssBorderRimSubtle);
    root.style.setProperty('--metal-accent', preset.accentHex);
  }, [material, baseAngleDeg, hoverSweepDeg]);

  const resetDefaults = () => {
    setMaterial('classic');
    setDispersion(0);
    setLiquidWarp(0);
    setBezelWidth(1);
    setAutoFlow(false);
    setFlowSpeed(1.0);
    setHoverSweepDeg(0);
    setBaseAngleDeg(135);
  };

  return (
    <MetalConfigContext.Provider
      value={{
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
        flowSpeed,
        setFlowSpeed,
        hoverSweepDeg,
        setHoverSweepDeg,
        baseAngleDeg,
        setBaseAngleDeg,
        resetDefaults,
      }}
    >
      {children}
    </MetalConfigContext.Provider>
  );
};

/* =========================================================================
   5. Reusable <WebGLBezelCanvas /> Component
   ========================================================================= */
export interface WebGLBezelSurfaceProps {
  material?: MetalMaterialId;
  sweepDeg?: number;
  bezelPx?: number;
  autoFlow?: boolean;
  dimmed?: boolean;
  hovered?: boolean;
  focused?: boolean;
  mouseX?: number;
  mouseY?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  className?: string;
}

export const WebGLBezelCanvas: React.FC<WebGLBezelSurfaceProps> = ({
  material,
  sweepDeg,
  autoFlow,
  dimmed = false,
  hovered = false,
  focused = false,
  mouseX = 0,
  mouseY = 0,
  canvasWidth = 200,
  canvasHeight = 80,
  className = '',
}) => {
  const { material: globalMaterial } = useMetalConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const idRef = useRef(`webgl-surf-${Math.random().toString(36).substring(2, 9)}`);

  const effectiveMaterial = material || globalMaterial;

  const stateRef = useRef({
    hovered,
    focused,
    mouseX,
    mouseY,
    materialOverride: effectiveMaterial,
    sweepDegOverride: sweepDeg,
    autoFlowOverride: autoFlow,
    dimmed,
  });

  stateRef.current = {
    hovered,
    focused,
    mouseX,
    mouseY,
    materialOverride: effectiveMaterial,
    sweepDegOverride: sweepDeg,
    autoFlowOverride: autoFlow,
    dimmed,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const id = idRef.current;
    sharedMetalEngine.register({
      id,
      canvas,
      ctx2d,
      getState: () => stateRef.current,
      currentHoverRad: 0,
      currentHoverIntensity: 0,
    });

    return () => {
      sharedMetalEngine.unregister(id);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
};
