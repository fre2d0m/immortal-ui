import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';

/* =========================================================================
   1. Physical Metal Material Definitions (RGB Reflectance Curves)
   ========================================================================= */
export type MetalMaterialId =
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
  platinum: {
    id: 'platinum',
    name: '镜面铂银',
    enName: 'Platinum Chrome',
    description: '高纯度冷调镜面银白，经典高反差镀铬光泽',
    highRGB: [1.0, 1.0, 1.0],
    midRGB: [0.76, 0.79, 0.85],
    darkRGB: [0.08, 0.08, 0.10],
    swatchGradient: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 50%, #18181b 100%)',
    capGradient: 'linear-gradient(155deg, #17171c 0%, #09090b 60%, #121216 100%)',
    bevelHighlight: 'rgba(255, 255, 255, 0.24)',
    accentHex: '#f4f4f6',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(255,255,255,0.52) 0%, rgba(161,161,170,0.10) 42%, rgba(161,161,170,0.05) 60%, rgba(255,255,255,0.28) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.03) 65%, rgba(255,255,255,0.16) 100%)',
  },
  gold: {
    id: 'gold',
    name: '24K 皇家黄金',
    enName: '24K Royal Gold',
    description: '天然暖金香槟高光与深邃古铜金暗部交织',
    highRGB: [1.0, 0.93, 0.55],
    midRGB: [0.92, 0.66, 0.10],
    darkRGB: [0.22, 0.13, 0.02],
    swatchGradient: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #422006 100%)',
    capGradient: 'linear-gradient(155deg, #1f190d 0%, #0c0905 60%, #171208 100%)',
    bevelHighlight: 'rgba(253, 224, 71, 0.32)',
    accentHex: '#fde047',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(254,240,138,0.62) 0%, rgba(234,179,8,0.16) 42%, rgba(161,98,7,0.08) 60%, rgba(250,204,21,0.36) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(253,224,71,0.36) 0%, rgba(234,179,8,0.08) 45%, rgba(161,98,7,0.04) 65%, rgba(250,204,21,0.20) 100%)',
  },
  obsidian: {
    id: 'obsidian',
    name: '曜石黑钛',
    enName: 'Obsidian Titanium',
    description: '阳极氧化暗黑枪色钛金属，低调冷峻的锋利折光',
    highRGB: [0.72, 0.74, 0.78],
    midRGB: [0.30, 0.32, 0.36],
    darkRGB: [0.04, 0.04, 0.05],
    swatchGradient: 'linear-gradient(135deg, #a1a1aa 0%, #3f3f46 45%, #09090b 100%)',
    capGradient: 'linear-gradient(155deg, #121215 0%, #070709 60%, #0d0d10 100%)',
    bevelHighlight: 'rgba(161, 161, 170, 0.22)',
    accentHex: '#d4d4d8',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(161,161,170,0.42) 0%, rgba(63,63,70,0.12) 42%, rgba(39,39,42,0.06) 60%, rgba(161,161,170,0.22) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(161,161,170,0.22) 0%, rgba(63,63,70,0.06) 45%, rgba(39,39,42,0.03) 65%, rgba(161,161,170,0.12) 100%)',
  },
  cobalt: {
    id: 'cobalt',
    name: '深海钴蓝钛',
    enName: 'Cobalt Blue Metal',
    description: '电镀蓝宝石金属光泽，冰青高光与深海蓝底色',
    highRGB: [0.68, 0.90, 1.0],
    midRGB: [0.18, 0.52, 0.96],
    darkRGB: [0.04, 0.11, 0.26],
    swatchGradient: 'linear-gradient(135deg, #bae6fd 0%, #2563eb 50%, #08142c 100%)',
    capGradient: 'linear-gradient(155deg, #0f192d 0%, #060a12 60%, #0b1322 100%)',
    bevelHighlight: 'rgba(125, 211, 252, 0.32)',
    accentHex: '#7dd3fc',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(125,211,252,0.62) 0%, rgba(37,99,235,0.18) 42%, rgba(29,78,216,0.08) 60%, rgba(96,165,250,0.36) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(125,211,252,0.36) 0%, rgba(37,99,235,0.08) 45%, rgba(29,78,216,0.04) 65%, rgba(96,165,250,0.20) 100%)',
  },
  rosegold: {
    id: 'rosegold',
    name: '大马士革玫瑰金',
    enName: 'Rose Gold Copper',
    description: '温暖柔和的香槟粉金与紫铜暗部反光',
    highRGB: [1.0, 0.82, 0.80],
    midRGB: [0.90, 0.44, 0.42],
    darkRGB: [0.22, 0.06, 0.08],
    swatchGradient: 'linear-gradient(135deg, #ffe4e6 0%, #fb7185 50%, #3b0813 100%)',
    capGradient: 'linear-gradient(155deg, #211216 0%, #0c0608 60%, #190d11 100%)',
    bevelHighlight: 'rgba(253, 164, 175, 0.32)',
    accentHex: '#fda4af',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(254,205,211,0.62) 0%, rgba(244,63,94,0.16) 42%, rgba(159,18,57,0.08) 60%, rgba(251,113,133,0.36) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(253,164,175,0.36) 0%, rgba(244,63,94,0.08) 45%, rgba(159,18,57,0.04) 65%, rgba(251,113,133,0.20) 100%)',
  },
  emerald: {
    id: 'emerald',
    name: '极光祖母绿钛',
    enName: 'Emerald Titanium',
    description: '赛博精密仪器级翠绿阳极氧化金属',
    highRGB: [0.68, 1.0, 0.86],
    midRGB: [0.10, 0.74, 0.48],
    darkRGB: [0.02, 0.18, 0.11],
    swatchGradient: 'linear-gradient(135deg, #a7f3d0 0%, #10b981 50%, #032217 100%)',
    capGradient: 'linear-gradient(155deg, #0d2019 0%, #050c09 60%, #0a1813 100%)',
    bevelHighlight: 'rgba(110, 231, 183, 0.32)',
    accentHex: '#6ee7b7',
    cssBorderRim:
      'linear-gradient(var(--rim-angle, 135deg), rgba(167,243,208,0.62) 0%, rgba(16,185,129,0.16) 42%, rgba(5,150,105,0.08) 60%, rgba(52,211,153,0.36) 100%)',
    cssBorderRimSubtle:
      'linear-gradient(var(--rim-angle, 135deg), rgba(110,231,183,0.36) 0%, rgba(16,185,129,0.08) 45%, rgba(5,150,105,0.04) 65%, rgba(52,211,153,0.20) 100%)',
  },
};

/* =========================================================================
   2. Global WebGL Metal Configuration Context
   Defaults:
   - Static 135° diagonal dual-specular metal rim (autoFlow = false)
   - Default hoverSweepDeg = 0 (clean static angle on hover, only brightens,
     avoiding cluttered spinning across the UI unless user enables it or
     a button specifies sweepDeg)
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
  material: 'gold',
  setMaterial: () => {},
  dispersion: 0,
  setDispersion: () => {},
  liquidWarp: 0,
  setLiquidWarp: () => {},
  bezelWidth: 2,
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
   Renders all registered UI components using a single shared WebGL context
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

  // Clean Dual-Specular Physical Metallic Reflectance
  // Produces two crisp opposing diagonal highlights (top-left primary + bottom-right secondary)
  // without cluttered multi-stripe ripples
  vec3 sampleMetallicSpectrum(float angle, float rotOffset, float hoverBoost, float disp, vec3 cHigh, vec3 cMid, vec3 cDark) {
    float theta = angle - rotOffset;

    // Primary diagonal axis: 2 opposing specular lobes (cos(2*theta))
    // Plus subtle asymmetry (cos(theta)) so top-left is primary and bottom-right is secondary
    float dualLobe = cos(theta * 2.0);
    float asymmetry = 0.18 * cos(theta);
    float w = dualLobe + asymmetry;
    float dw = -2.0 * sin(theta * 2.0);

    // Normalized transition [0.0 = dark metallic body, 1.0 = specular highlight]
    float t = clamp((w + 0.85) / 1.95, 0.0, 1.0);

    // Hover boosts metallic reflection brightness smoothly in-place
    t = clamp(t + hoverBoost * 0.18, 0.0, 1.0);

    // Rich 3-stop physical metal gradient: Dark Horizon -> Natural Metal Body -> Specular Peak
    vec3 lowerMetal = mix(cDark, cMid, smoothstep(0.0, 0.52, t));
    vec3 baseMetal = mix(lowerMetal, cHigh, smoothstep(0.58, 1.0, t));

    // Crisp specular gleam at the diagonal corners
    float peakGleam = smoothstep(0.72, 1.15, w + hoverBoost * 0.25);
    baseMetal = mix(baseMetal, cHigh, peakGleam * (0.45 + hoverBoost * 0.25));

    if (disp <= 0.005) {
      return baseMetal;
    }

    // Optional Thin-Film Prismatic Dispersion at the dark/bright horizon boundary
    float fringeBell = pow(sin(t * 3.14159265), 1.6);
    vec3 warmFringe = mix(vec3(0.94, 0.30, 0.04), vec3(0.99, 0.84, 0.12), smoothstep(0.2, 0.78, t));
    vec3 coldFringe = mix(vec3(0.10, 0.30, 0.90), vec3(0.50, 0.86, 1.00), smoothstep(0.2, 0.78, t));
    vec3 prismColor = (dw < 0.0) ? warmFringe : coldFringe;

    return mix(baseMetal, prismColor, fringeBell * disp * 0.85);
  }

  void main() {
    vec2 p = v_uv * 2.0 - 1.0;

    // Aspect-corrected angle so wide rectangular buttons & inputs have balanced corner highlights
    vec2 pAspect = vec2(p.x * pow(max(u_aspect, 0.25), 0.35), p.y);
    float angle = atan(pAspect.y, pAspect.x);
    float len = length(p);

    // Optional liquid mercury warp (active only when u_warp > 0)
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

  // Global config snapshot updated by MetalConfigProvider
  public globalConfig = {
    material: 'gold' as MetalMaterialId,
    dispersion: 0,
    liquidWarp: 0,
    bezelWidth: 2,
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
      // 135deg corresponds to top-left (-3*PI/4 in screen UV where Y is up)
      const baseRad = ((cfg.baseAngleDeg - 135) * Math.PI) / 180 + (3 * Math.PI) / 4;

      this.surfaces.forEach((surf) => {
        const st = surf.getState();
        const isActive = st.hovered || st.focused;

        // Only rotate on hover if explicitly configured via sweepDegOverride or global hoverSweepDeg
        const sweepDeg =
          st.sweepDegOverride !== undefined ? st.sweepDegOverride : cfg.hoverSweepDeg;
        const targetHoverRad = isActive ? (sweepDeg * Math.PI) / 180 : 0.0;
        const targetHoverIntensity = isActive ? 1.0 : 0.0;

        surf.currentHoverRad +=
          (targetHoverRad - surf.currentHoverRad) * Math.min(1, dt * 8.0);
        surf.currentHoverIntensity +=
          (targetHoverIntensity - surf.currentHoverIntensity) * Math.min(1, dt * 10.0);

        const matId = st.materialOverride || cfg.material;
        const mat = METAL_MATERIALS[matId] || METAL_MATERIALS.gold;

        // Dimmed state for inactive/unchecked controls while still preserving the global metal hue
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
   Syncs global metal material to both the WebGL singleton engine AND
   document :root CSS variables so all cards, dividers, and surfaces update!
   ========================================================================= */
export const MetalConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [material, setMaterial] = useState<MetalMaterialId>('gold');
  const [dispersion, setDispersion] = useState<number>(0);
  const [liquidWarp, setLiquidWarp] = useState<number>(0);
  const [bezelWidth, setBezelWidth] = useState<number>(2);
  const [autoFlow, setAutoFlow] = useState<boolean>(false);
  const [flowSpeed, setFlowSpeed] = useState<number>(1.0);
  const [hoverSweepDeg, setHoverSweepDeg] = useState<number>(0);
  const [baseAngleDeg, setBaseAngleDeg] = useState<number>(135);

  // Sync React state into the 60fps singleton engine
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

  // Sync global CSS custom properties so cards, subcards, navbar, and modals reflect the chosen metal
  useEffect(() => {
    const preset = METAL_MATERIALS[material] || METAL_MATERIALS.gold;
    const root = document.documentElement;
    root.style.setProperty('--rim-angle', `${baseAngleDeg}deg`);
    root.style.setProperty('--hover-sweep', `${hoverSweepDeg}deg`);
    root.style.setProperty('--border-rim', preset.cssBorderRim);
    root.style.setProperty('--border-rim-subtle', preset.cssBorderRimSubtle);
    root.style.setProperty('--metal-accent', preset.accentHex);
  }, [material, baseAngleDeg, hoverSweepDeg]);

  const resetDefaults = () => {
    setMaterial('gold');
    setDispersion(0);
    setLiquidWarp(0);
    setBezelWidth(2);
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
  // Subscribe to context so any global material change triggers immediate re-render of stateRef
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
