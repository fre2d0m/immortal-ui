import {
  colorLabels,
  fontChoices,
  geometryTokens,
  isShadow,
  isTokenColor,
  shadowLabels,
  type FontChoice,
  type GeometryKey,
  type Mode,
} from "./theme-catalog.ts";

export const layoutNumberSettings = {
  fontSize: { label: "正文字号", min: 14, max: 20, step: 1, unit: "px" },
  controlHeight: { label: "控件高度", min: 16, max: 56, step: 2, unit: "px" },
  spacing: { label: "间距基准", min: 0, max: 6, step: 0.25, unit: "px" },
  cardPadding: { label: "面板内边距", min: 0, max: 40, step: 2, unit: "px" },
  radius: { label: "基础圆角", min: 0, max: 20, step: 1, unit: "px" },
  contentWidth: {
    label: "内容最大宽度",
    min: 240,
    max: 1800,
    step: 40,
    unit: "px",
  },
} as const;

export const tabNumberSettings = {
  tabRadius: { label: "Tab 圆角", min: 0, max: 40, step: 1, unit: "px" },
  tabPaddingX: {
    label: "Tab 左右内边距",
    min: 0,
    max: 48,
    step: 1,
    unit: "px",
  },
  tabPaddingY: {
    label: "Tab 上下内边距",
    min: 0,
    max: 24,
    step: 1,
    unit: "px",
  },
  tabListPadding: { label: "轨道内边距", min: 0, max: 16, step: 1, unit: "px" },
} as const;

export const numberSettings = { ...layoutNumberSettings, ...tabNumberSettings };

export type NumberSetting = keyof typeof numberSettings;
export type ThemeSettings = Record<NumberSetting, number> & {
  mode: "dark" | "light";
  primary: string | null;
  pillButtons: boolean;
  tabWidth: "content" | "fill";
  fontFamily: FontChoice;
  headingFont: FontChoice | "inherit";
  colors: Record<Mode, Record<string, string>>;
  shadows: Record<Mode, Record<string, string>>;
  geometry: Partial<Record<GeometryKey, number>>;
};

export const defaultSettings: ThemeSettings = {
  mode: "dark",
  primary: null,
  fontSize: 16,
  controlHeight: 32,
  spacing: 4,
  cardPadding: 24,
  radius: 8,
  contentWidth: 1440,
  pillButtons: false,
  tabWidth: "content",
  tabRadius: 15,
  tabPaddingX: 14,
  tabPaddingY: 5,
  tabListPadding: 2,
  fontFamily: "geist",
  headingFont: "inherit",
  colors: { light: {}, dark: {} },
  shadows: { light: {}, dark: {} },
  geometry: {},
};
export const settingsKey = "immortal-theme-studio-v1";
export const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

export function parseSettings(value: unknown): ThemeSettings | null {
  if (!value || typeof value !== "object") return null;
  const envelope = value as Record<string, unknown>;
  if (
    envelope.version !== 1 ||
    !envelope.settings ||
    typeof envelope.settings !== "object"
  )
    return null;
  const settings = envelope.settings as Record<string, unknown>;
  if (settings.mode !== "dark" && settings.mode !== "light") return null;
  if (settings.primary !== null && !isHexColor(settings.primary)) return null;
  if (typeof settings.pillButtons !== "boolean") return null;
  const tabWidth =
    settings.tabWidth === undefined
      ? defaultSettings.tabWidth
      : settings.tabWidth;
  if (tabWidth !== "content" && tabWidth !== "fill") return null;
  const fontFamily =
    settings.fontFamily === undefined ? "geist" : settings.fontFamily;
  const headingFont =
    settings.headingFont === undefined ? "inherit" : settings.headingFont;
  if (typeof fontFamily !== "string" || !Object.hasOwn(fontChoices, fontFamily))
    return null;
  if (
    typeof headingFont !== "string" ||
    (headingFont !== "inherit" && !Object.hasOwn(fontChoices, headingFont))
  )
    return null;
  const colors = parseModeTokens(settings.colors, colorLabels, isTokenColor);
  const shadows = parseModeTokens(settings.shadows, shadowLabels, isShadow);
  if (!colors || !shadows) return null;
  const geometry: Partial<Record<GeometryKey, number>> = {};
  if (settings.geometry !== undefined) {
    if (!isRecord(settings.geometry)) return null;
    for (const [key, value] of Object.entries(settings.geometry)) {
      if (!Object.hasOwn(geometryTokens, key)) return null;
      const spec = geometryTokens[key as GeometryKey];
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < spec.min ||
        value > spec.max
      )
        return null;
      geometry[key as GeometryKey] = value;
    }
  }
  const numbers = {} as Record<NumberSetting, number>;
  for (const key of Object.keys(numberSettings) as NumberSetting[]) {
    // Existing saved themes predate the independent Tab settings.
    const value =
      settings[key] === undefined && key in tabNumberSettings
        ? defaultSettings[key]
        : settings[key];
    const { min, max } = numberSettings[key];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < min ||
      value > max
    )
      return null;
    numbers[key] = value;
  }
  return {
    ...numbers,
    mode: settings.mode,
    primary: settings.primary,
    pillButtons: settings.pillButtons,
    tabWidth,
    fontFamily: fontFamily as FontChoice,
    headingFont: headingFont as FontChoice | "inherit",
    colors,
    shadows,
    geometry,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function parseModeTokens(
  value: unknown,
  labels: object,
  validate: (value: unknown) => boolean,
): Record<Mode, Record<string, string>> | null {
  const result: Record<Mode, Record<string, string>> = { light: {}, dark: {} };
  if (value === undefined) return result;
  if (
    !isRecord(value) ||
    Object.keys(value).some((key) => key !== "light" && key !== "dark")
  )
    return null;
  for (const mode of ["light", "dark"] as const) {
    if (!isRecord(value[mode])) return null;
    for (const [key, item] of Object.entries(value[mode])) {
      if (!Object.hasOwn(labels, key) || !validate(item)) return null;
      result[mode][key] = item as string;
    }
  }
  return result;
}

export function serializeSettings(settings: ThemeSettings) {
  return JSON.stringify({ version: 1, settings }, null, 2);
}

export function effectivePrimary(settings: ThemeSettings) {
  return (
    settings.colors[settings.mode].primary ??
    settings.primary ??
    (settings.mode === "dark" ? "#dededc" : "#303030")
  );
}

function rgb(hex: string) {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}
function mix(hex: string, target: number, amount: number) {
  return (
    "#" +
    rgb(hex)
      .map((channel) =>
        Math.round(channel * (1 - amount) + target * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("") +
    (hex.length === 9 ? hex.slice(7) : "")
  );
}
function luminance(hex: string) {
  const channels = rgb(hex).map((value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
export function primaryColors(primary: string) {
  const top = mix(primary, 255, 0.08);
  const bottom = mix(primary, 0, 0.06);
  const candidates = ["#18181b", "#ffffff"];
  const ink = candidates.sort(
    (a, b) =>
      Math.min(contrast(b, top), contrast(b, bottom)) -
      Math.min(contrast(a, top), contrast(a, bottom)),
  )[0];
  return { primary, top, bottom, ink };
}

// The preview and downloaded CSS use this same function, so exported values match the screen.
export function commonVariables(settings: ThemeSettings) {
  const radius = settings.radius;
  const scaledRadius = (scale: number) =>
    `${Number((radius * scale).toFixed(2))}px`;
  const variables: Record<string, string> = {
    "--lab-font-sans": fontChoices[settings.fontFamily].css,
    "--lab-font-heading":
      settings.headingFont === "inherit"
        ? "var(--lab-font-sans)"
        : fontChoices[settings.headingFont].css,
    "--font-size-base": "14px",
    "--body-font-size": `${settings.fontSize}px`,
    "--support-font-size": `${Math.max(14, settings.fontSize - 2)}px`,
    "--control-height": `${settings.controlHeight}px`,
    "--spacing": `${settings.spacing}px`,
    "--card-padding": `${settings.cardPadding}px`,
    "--radius": `${radius}px`,
    "--small-radius": scaledRadius(0.4),
    "--field-radius": `${radius}px`,
    "--well-radius": scaledRadius(1.6),
    "--popup-radius": scaledRadius(2),
    "--surface-radius": scaledRadius(2.8),
    "--menu-padding": scaledRadius(0.6),
    "--button-radius": settings.pillButtons
      ? "var(--pill-radius)"
      : `${radius}px`,
    "--content-width": `${settings.contentWidth}px`,
    "--tab-list-width": settings.tabWidth === "fill" ? "100%" : "max-content",
    "--tab-flex": settings.tabWidth === "fill" ? "1 0 0px" : "0 0 auto",
    "--tab-radius": `${settings.tabRadius}px`,
    "--tab-padding-x": `${settings.tabPaddingX}px`,
    "--tab-padding-y": `${settings.tabPaddingY}px`,
    "--tab-list-padding": `${settings.tabListPadding}px`,
  };
  if (settings.primary) {
    const colors = primaryColors(settings.primary);
    Object.assign(variables, {
      "--primary": colors.primary,
      "--primary-top": colors.top,
      "--primary-bottom": colors.bottom,
      "--primary-foreground": colors.ink,
      "--sidebar-primary": colors.primary,
      "--sidebar-primary-foreground": colors.ink,
      "--ring": colors.primary,
      "--sidebar-ring": colors.primary,
    });
  }
  for (const [key, value] of Object.entries(settings.geometry)) {
    const unit = geometryTokens[key as GeometryKey].unit;
    variables[`--${key}`] =
      `${value}${unit === "px" || unit === "ms" ? unit : ""}`;
  }
  return variables;
}

export function modeVariables(settings: ThemeSettings, mode: Mode) {
  const colors = settings.colors[mode];
  const variables: Record<string, string> = {};
  // Semantic colors drive the material surfaces too; explicit gradient tokens take precedence.
  const gradient = (value: string | undefined, top: string, bottom: string) => {
    if (!value) return;
    variables[`--${top}`] = mix(value, 255, 0.04);
    variables[`--${bottom}`] = mix(value, 0, 0.06);
  };
  gradient(colors.card, "surface-top", "surface-bottom");
  gradient(colors.popover, "popover-top", "popover-bottom");
  gradient(colors.secondary, "control-top", "control-bottom");
  gradient(colors.accent, "hover-top", "hover-bottom");
  gradient(colors.muted, "well-top", "well-bottom");
  gradient(colors.sidebar, "sidebar-top", "sidebar-bottom");
  if (colors.primary) {
    const primary = primaryColors(colors.primary);
    Object.assign(variables, {
      "--primary-top": primary.top,
      "--primary-bottom": primary.bottom,
      "--primary-foreground": primary.ink,
    });
  }
  if (colors.border)
    Object.assign(variables, {
      "--surface-edge": colors.border,
      "--control-edge": colors.border,
    });
  if (colors["accent-foreground"])
    variables["--hover-foreground"] = colors["accent-foreground"];
  if (colors["sidebar-accent"])
    variables["--sidebar-hover-background"] = colors["sidebar-accent"];
  if (colors["sidebar-accent-foreground"])
    variables["--sidebar-hover-foreground"] =
      colors["sidebar-accent-foreground"];
  if (colors["sidebar-primary"])
    variables["--sidebar-active-background"] = colors["sidebar-primary"];
  if (colors["sidebar-primary-foreground"])
    variables["--sidebar-active-foreground"] =
      colors["sidebar-primary-foreground"];
  for (const [key, value] of Object.entries(colors))
    variables[`--${key}`] = value;
  for (const [key, value] of Object.entries(settings.shadows[mode]))
    variables[`--${key}`] = value;
  return variables;
}

export function themeOverrides(settings: ThemeSettings) {
  const block = (selector: string, variables: Record<string, string>) =>
    `${selector} {\n${Object.entries(variables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join("\n")}\n}\n`;
  return (
    `/* Immortal UI theme settings. Use class="${settings.mode === "dark" ? "dark" : ""}" on <html>. */\n` +
    block(":root, .dark", commonVariables(settings)) +
    block(":root:not(.dark)", modeVariables(settings, "light")) +
    block(".dark", modeVariables(settings, "dark"))
  );
}

export function effectiveVariables(
  settings: ThemeSettings,
  defaults: Record<string, string>,
) {
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries({
        ...commonVariables(settings),
        ...modeVariables(settings, settings.mode),
      }).map(([key, value]) => [key.slice(2), value]),
    ),
  };
}
