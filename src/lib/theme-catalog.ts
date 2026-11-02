export const colorGroups = [
  {
    label: "页面与容器",
    tokens: {
      background: "页面背景",
      foreground: "正文颜色",
      card: "卡片背景",
      "card-foreground": "卡片文字",
      popover: "浮层背景",
      "popover-foreground": "浮层文字",
    },
  },
  {
    label: "交互与状态",
    tokens: {
      primary: "主色",
      "primary-foreground": "主色文字",
      secondary: "次要背景",
      "secondary-foreground": "次要文字",
      muted: "弱化背景",
      "muted-foreground": "辅助文字",
      accent: "强调背景",
      "accent-foreground": "强调文字",
      destructive: "危险与错误",
      border: "默认边框",
      input: "输入框边框",
      ring: "焦点轮廓",
      success: "成功状态",
      warning: "警告状态",
    },
  },
  {
    label: "图表配色",
    tokens: {
      "chart-1": "图表颜色 1",
      "chart-2": "图表颜色 2",
      "chart-3": "图表颜色 3",
      "chart-4": "图表颜色 4",
      "chart-5": "图表颜色 5",
    },
  },
  {
    label: "侧栏配色",
    tokens: {
      sidebar: "侧栏背景",
      "sidebar-foreground": "侧栏文字",
      "sidebar-primary": "侧栏主色",
      "sidebar-primary-foreground": "侧栏主色文字",
      "sidebar-accent": "侧栏强调背景",
      "sidebar-accent-foreground": "侧栏强调文字",
      "sidebar-border": "侧栏边框",
      "sidebar-ring": "侧栏焦点",
    },
  },
  {
    label: "材质与渐变",
    tokens: {
      "surface-top": "面板渐变起点",
      "surface-bottom": "面板渐变终点",
      "surface-edge": "面板边缘",
      "well-top": "凹槽渐变起点",
      "well-bottom": "凹槽渐变终点",
      "field-background": "输入框底色",
      "hover-top": "悬停渐变起点",
      "hover-bottom": "悬停渐变终点",
      "control-top": "次要按钮渐变起点",
      "control-bottom": "次要按钮渐变终点",
      "control-edge": "按钮边缘",
      "control-hover-edge": "按钮悬停边缘",
      "primary-top": "主按钮渐变起点",
      "primary-bottom": "主按钮渐变终点",
      "thumb-top": "滑块渐变起点",
      "thumb-bottom": "滑块渐变终点",
      "popover-top": "浮层渐变起点",
      "popover-bottom": "浮层渐变终点",
      "sidebar-top": "侧栏渐变起点",
      "sidebar-bottom": "侧栏渐变终点",
    },
  },
] as const;

export const colorLabels = Object.assign(
  {},
  ...colorGroups.map((group) => group.tokens),
) as Record<string, string>;

export const shadowLabels = {
  "shadow-surface": "浮起面板阴影",
  "shadow-well": "凹槽阴影",
  "shadow-field": "输入框阴影",
  "shadow-hover": "悬停阴影",
  "shadow-control": "次要按钮阴影",
  "shadow-primary": "主按钮阴影",
  "shadow-pressed": "按下阴影",
  "shadow-overlay": "浮层外部阴影",
} as const;

export const fontChoices = {
  geist: {
    label: "Geist 与系统回退",
    css: '"Geist Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  system: {
    label: "系统无衬线",
    css: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  serif: {
    label: "衬线字体",
    css: 'Georgia, "Noto Serif CJK SC", "Songti SC", serif',
  },
  mono: {
    label: "等宽字体",
    css: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
  },
} as const;
export type FontChoice = keyof typeof fontChoices;

export const geometryGroups = [
  {
    label: "文字与排版",
    keys: [
      "body-weight",
      "body-line-height",
      "body-letter-spacing",
      "heading-weight",
      "icon-stroke-width",
    ],
  },
  {
    label: "独立圆角",
    keys: [
      "small-radius",
      "field-radius",
      "well-radius",
      "popup-radius",
      "surface-radius",
      "pill-radius",
      "radius-3xl-value",
      "radius-4xl-value",
    ],
  },
  {
    label: "按钮与输入框",
    keys: [
      "button-padding-x",
      "field-padding-x",
      "textarea-padding-y",
      "textarea-min-height",
      "control-border-width",
    ],
  },
  {
    label: "菜单与浮层",
    keys: [
      "menu-padding",
      "menu-min-width",
      "menu-item-padding-x",
      "popup-padding",
      "dialog-width",
    ],
  },
  {
    label: "选择控件与进度",
    keys: [
      "checkbox-size",
      "switch-thumb-size",
      "switch-thumb-size-sm",
      "progress-height",
    ],
  },
  {
    label: "交互反馈",
    keys: [
      "focus-width",
      "transition-duration",
      "press-scale",
      "disabled-opacity",
    ],
  },
] as const;

type GeometrySpec = {
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  fallback: string;
};
export const geometryTokens = {
  "body-weight": {
    label: "正文字重",
    min: 100,
    max: 900,
    step: 100,
    unit: "",
    fallback: "400",
  },
  "body-line-height": {
    label: "正文行高",
    min: 0.8,
    max: 3,
    step: 0.05,
    unit: "倍",
    fallback: "1.5",
  },
  "body-letter-spacing": {
    label: "正文字距",
    min: -2,
    max: 8,
    step: 0.1,
    unit: "px",
    fallback: "0px",
  },
  "heading-weight": {
    label: "标题字重",
    min: 100,
    max: 900,
    step: 100,
    unit: "",
    fallback: "600",
  },
  "icon-stroke-width": {
    label: "图标线条粗细",
    min: 0.5,
    max: 4,
    step: 0.25,
    unit: "",
    fallback: "2",
  },
  "small-radius": {
    label: "复选框圆角",
    min: 0,
    max: 40,
    step: 1,
    unit: "px",
    fallback: "4px",
  },
  "field-radius": {
    label: "输入框与菜单项圆角",
    min: 0,
    max: 80,
    step: 1,
    unit: "px",
    fallback: "10px",
  },
  "well-radius": {
    label: "凹槽与菜单圆角",
    min: 0,
    max: 80,
    step: 1,
    unit: "px",
    fallback: "16px",
  },
  "popup-radius": {
    label: "弹窗圆角",
    min: 0,
    max: 80,
    step: 1,
    unit: "px",
    fallback: "20px",
  },
  "surface-radius": {
    label: "面板圆角",
    min: 0,
    max: 120,
    step: 1,
    unit: "px",
    fallback: "28px",
  },
  "pill-radius": {
    label: "胶囊与圆形圆角",
    min: 0,
    max: 999,
    step: 1,
    unit: "px",
    fallback: "999px",
  },
  "radius-3xl-value": {
    label: "3XL 圆角档位",
    min: 0,
    max: 120,
    step: 1,
    unit: "px",
    fallback: "2rem",
  },
  "radius-4xl-value": {
    label: "4XL 圆角档位",
    min: 0,
    max: 160,
    step: 1,
    unit: "px",
    fallback: "2.5rem",
  },
  "button-padding-x": {
    label: "按钮左右内边距",
    min: 0,
    max: 64,
    step: 1,
    unit: "px",
    fallback: "1rem",
  },
  "field-padding-x": {
    label: "输入框左右内边距",
    min: 0,
    max: 64,
    step: 1,
    unit: "px",
    fallback: "0.875rem",
  },
  "textarea-padding-y": {
    label: "多行输入框上下内边距",
    min: 0,
    max: 40,
    step: 1,
    unit: "px",
    fallback: "8px",
  },
  "textarea-min-height": {
    label: "多行输入框最小高度",
    min: 16,
    max: 400,
    step: 4,
    unit: "px",
    fallback: "4rem",
  },
  "control-border-width": {
    label: "按钮与输入框边框粗细",
    min: 0,
    max: 6,
    step: 0.5,
    unit: "px",
    fallback: "1px",
  },
  "menu-padding": {
    label: "菜单内边距",
    min: 0,
    max: 32,
    step: 1,
    unit: "px",
    fallback: "6px",
  },
  "menu-min-width": {
    label: "菜单最小宽度",
    min: 80,
    max: 600,
    step: 4,
    unit: "px",
    fallback: "12.5rem",
  },
  "menu-item-padding-x": {
    label: "菜单项左右内边距",
    min: 0,
    max: 48,
    step: 1,
    unit: "px",
    fallback: "10px",
  },
  "popup-padding": {
    label: "弹窗内边距",
    min: 0,
    max: 80,
    step: 1,
    unit: "px",
    fallback: "1rem",
  },
  "dialog-width": {
    label: "弹窗最大宽度",
    min: 160,
    max: 1200,
    step: 8,
    unit: "px",
    fallback: "24rem",
  },
  "lab-sidebar-width": {
    label: "桌面侧栏宽度",
    min: 80,
    max: 600,
    step: 4,
    unit: "px",
    fallback: "16rem",
  },
  "lab-sidebar-mobile-width": {
    label: "手机侧栏宽度",
    min: 80,
    max: 600,
    step: 4,
    unit: "px",
    fallback: "18rem",
  },
  "lab-sidebar-icon-width": {
    label: "折叠侧栏宽度",
    min: 24,
    max: 160,
    step: 2,
    unit: "px",
    fallback: "3rem",
  },
  "checkbox-size": {
    label: "单选与复选框尺寸",
    min: 8,
    max: 40,
    step: 1,
    unit: "px",
    fallback: "1.125rem",
  },
  "switch-thumb-size": {
    label: "开关滑块尺寸",
    min: 8,
    max: 40,
    step: 1,
    unit: "px",
    fallback: "1.25rem",
  },
  "switch-thumb-size-sm": {
    label: "小号开关滑块尺寸",
    min: 8,
    max: 32,
    step: 1,
    unit: "px",
    fallback: "1rem",
  },
  "progress-height": {
    label: "进度条高度",
    min: 1,
    max: 32,
    step: 1,
    unit: "px",
    fallback: "0.375rem",
  },
  "focus-width": {
    label: "焦点轮廓粗细",
    min: 0,
    max: 6,
    step: 0.5,
    unit: "px",
    fallback: "1px",
  },
  "transition-duration": {
    label: "过渡时长",
    min: 0,
    max: 1000,
    step: 10,
    unit: "ms",
    fallback: "140ms",
  },
  "press-scale": {
    label: "按下缩放比例",
    min: 0.8,
    max: 1,
    step: 0.01,
    unit: "倍",
    fallback: "0.96",
  },
  "disabled-opacity": {
    label: "禁用状态不透明度",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "倍",
    fallback: "0.4",
  },
} satisfies Record<string, GeometrySpec>;
export type GeometryKey = keyof typeof geometryTokens;
export type Mode = "light" | "dark";

// Read defaults from the exportable theme, keeping the panel and actual CSS in sync.
export function readThemeDefaults(source: string) {
  const defaults = { light: {}, dark: {} } as Record<
    Mode,
    Record<string, string>
  >;
  // Include the saved overrides at the end of the stylesheet, in cascade order.
  for (const [, selector, body] of source.matchAll(
    /^(:root(?:,\s*\.dark|:not\(\.dark\))?|\.dark)\s*\{([^}]+)\}/gm,
  )) {
    const variables = Object.fromEntries(
      [...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, key, value]) => [
        key,
        value.replace(/\s+/g, " ").trim(),
      ]),
    );
    if (selector !== ".dark") Object.assign(defaults.light, variables);
    if (selector !== ":root:not(.dark)")
      Object.assign(defaults.dark, variables);
  }
  return defaults;
}

export const isTokenColor = (value: unknown): boolean =>
  typeof value === "string" && /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value);

export function isShadow(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2000) return false;
  if (value.trim() === "none") return true;
  // Only literal shadow layers: no URLs, variables, or CSS declarations.
  const normalized = value
    .trim()
    .replace(
      /(?:rgba?|hsla?|oklch|oklab)\([\d\s.,%/+-]+\)|#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\b|\btransparent\b/gi,
      "color",
    );
  return normalized
    .split(",")
    .every((layer) =>
      /^(?:inset\s+)?(?:-?(?:\d*\.)?\d+(?:px|rem|em)?\s+){1,3}-?(?:\d*\.)?\d+(?:px|rem|em)?(?:\s+color)?$/.test(
        layer.trim(),
      ),
    );
}

export function colorToHex(value: string): string {
  if (isTokenColor(value)) return value;
  const channels = value.match(/[\d.]+/g)?.map(Number);
  if (!value.startsWith("rgb") || !channels || channels.length < 3)
    return "#000000";
  return (
    "#" +
    channels
      .slice(0, 3)
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("") +
    (channels[3] === undefined
      ? ""
      : Math.round(channels[3] * 255)
          .toString(16)
          .padStart(2, "0"))
  );
}
