import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  colorLabels,
  geometryTokens,
  isShadow,
  isTokenColor,
  readThemeDefaults,
  shadowLabels,
} from "../src/lib/theme-catalog.ts";
import {
  defaultSettings,
  parseSettings,
  serializeSettings,
  themeOverrides,
  primaryColors,
  contrast,
  tabNumberSettings,
  commonVariables,
} from "../src/lib/theme-settings.ts";

test("default settings preserve the published theme and separate layout from text sizes", () => {
  const css = readFileSync(
    new URL("../registry/immortal/styles/graphite.css", import.meta.url),
    "utf8",
  );
  const defaults = readThemeDefaults(css);
  for (const mode of ["light", "dark"]) {
    for (const [key, value] of Object.entries(
      commonVariables(defaultSettings),
    )) {
      assert.equal(defaults[mode][key.slice(2)], value, `${mode}: ${key}`);
    }
  }
  const enlarged = commonVariables({ ...defaultSettings, fontSize: 20 });
  assert.equal(enlarged["--body-font-size"], "20px");
  assert.equal(enlarged["--support-font-size"], "18px");
  assert.equal(enlarged["--font-size-base"], "14px");
  assert.equal(
    commonVariables({ ...defaultSettings, fontSize: 14 })[
      "--support-font-size"
    ],
    "14px",
  );
});

test("exported settings round-trip with compact dimensions, zero spacing and light mode", () => {
  const settings = {
    ...defaultSettings,
    mode: "light",
    fontSize: 14,
    controlHeight: 16,
    spacing: 0,
    cardPadding: 0,
    contentWidth: 240,
    radius: 0,
    primary: "#2563eb",
    pillButtons: false,
    tabWidth: "fill",
    tabRadius: 0,
    tabPaddingX: 0,
    tabPaddingY: 0,
    tabListPadding: 0,
  };
  assert.deepEqual(
    parseSettings(JSON.parse(serializeSettings(settings))),
    settings,
  );
});
test("invalid and incompatible files cannot inject CSS or invalid dimensions", () => {
  for (const patch of [
    { primary: "red; } body { display:none" },
    { radius: -1 },
    { fontSize: Infinity },
    { fontSize: 13 },
    { controlHeight: 1 },
    { mode: "system" },
    { tabWidth: "invalid" },
    { tabRadius: -1 },
    { tabPaddingX: "10px; color:red" },
    { tabPaddingY: null },
    { tabListPadding: 100 },
  ]) {
    assert.equal(
      parseSettings({ version: 1, settings: { ...defaultSettings, ...patch } }),
      null,
    );
  }
  assert.equal(parseSettings({ version: 2, settings: defaultSettings }), null);
  assert.equal(parseSettings({ version: 1, settings: {} }), null);
});
test("older saved themes gain Tab defaults without losing existing choices", () => {
  const legacy = {
    ...defaultSettings,
    primary: "#2563eb",
    fontSize: 14,
    controlHeight: 24,
  };
  delete legacy.tabWidth;
  for (const key of [
    "fontFamily",
    "headingFont",
    "colors",
    "shadows",
    "geometry",
  ])
    delete legacy[key];
  for (const key of Object.keys(tabNumberSettings)) delete legacy[key];
  assert.deepEqual(parseSettings({ version: 1, settings: legacy }), {
    ...defaultSettings,
    ...legacy,
  });
});
test("Tab export retains content width and independent padding and radii", () => {
  const css = themeOverrides({
    ...defaultSettings,
    tabRadius: 8,
    tabPaddingX: 18,
    tabPaddingY: 5,
    tabListPadding: 3,
  });
  for (const value of [
    "--tab-list-width: max-content",
    "--tab-flex: 0 0 auto",
    "--tab-radius: 8px",
    "--tab-padding-x: 18px",
    "--tab-padding-y: 5px",
    "--tab-list-padding: 3px",
  ])
    assert.ok(css.includes(value), value);
  const fill = themeOverrides({ ...defaultSettings, tabWidth: "fill" });
  assert.ok(fill.includes("--tab-list-width: 100%"));
  assert.ok(fill.includes("--tab-flex: 1 0 0px"));
});
test("theme export changes actual geometry and keeps nested menu radii concentric", () => {
  const css = themeOverrides({
    ...defaultSettings,
    radius: 15,
    controlHeight: 48,
    cardPadding: 32,
    spacing: 5,
    pillButtons: false,
  });
  for (const value of [
    "--field-radius: 15px",
    "--well-radius: 24px",
    "--menu-padding: 9px",
    "--button-radius: 15px",
    "--control-height: 48px",
    "--card-padding: 32px",
    "--spacing: 5px",
  ])
    assert.ok(css.includes(value), value);
  assert.ok(
    !themeOverrides(defaultSettings).includes("--primary:"),
    "default palettes remain intact",
  );
});
test("custom primary colors choose readable text for both gradient endpoints", () => {
  for (const primary of [
    "#000000",
    "#ffffff",
    "#2563eb",
    "#eead21",
    "#777777",
  ]) {
    const colors = primaryColors(primary);
    const other = colors.ink === "#ffffff" ? "#18181b" : "#ffffff";
    assert.ok(
      Math.min(
        contrast(colors.ink, colors.top),
        contrast(colors.ink, colors.bottom),
      ) >=
        Math.min(contrast(other, colors.top), contrast(other, colors.bottom)),
    );
  }
});

test("full themes preserve separate palettes, transparency, typography and geometry", () => {
  const settings = {
    ...defaultSettings,
    pillButtons: true,
    fontFamily: "serif",
    headingFont: "mono",
    colors: {
      light: { card: "#ffeedd", border: "#33333380" },
      dark: { card: "#102030", primary: "#2563eb", "surface-top": "#112233" },
    },
    shadows: {
      light: { "shadow-surface": "none" },
      dark: { "shadow-field": "inset 0 1px 2px #00000080" },
    },
    geometry: {
      "field-radius": 0,
      "pill-radius": 6,
      "press-scale": 1,
      "body-line-height": 1.8,
      "lab-sidebar-width": 320,
    },
  };
  assert.deepEqual(
    parseSettings(JSON.parse(serializeSettings(settings))),
    settings,
  );
  const css = themeOverrides(settings);
  assert.match(css, /:root:not\(\.dark\) \{[^}]*--card: #ffeedd;/s);
  assert.match(
    css,
    /\.dark \{[^}]*--surface-top: #112233;[^}]*--card: #102030;/s,
  );
  assert.ok(css.includes("--shadow-surface: none"));
  assert.ok(css.includes("--field-radius: 0px"));
  assert.ok(css.includes("--button-radius: var(--pill-radius)"));
  assert.ok(css.includes("--pill-radius: 6px"));
  assert.ok(css.includes("--body-line-height: 1.8;"));
  assert.ok(css.includes("--lab-sidebar-width: 320px"));
});

test("catalog covers all official color tokens and every control has a CSS target", () => {
  const css = readFileSync(
    new URL("../registry/immortal/styles/graphite.css", import.meta.url),
    "utf8",
  );
  const defaults = readThemeDefaults(css);
  const official = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "border",
    "input",
    "ring",
    "chart-1",
    "chart-2",
    "chart-3",
    "chart-4",
    "chart-5",
    "sidebar",
    "sidebar-foreground",
    "sidebar-primary",
    "sidebar-primary-foreground",
    "sidebar-accent",
    "sidebar-accent-foreground",
    "sidebar-border",
    "sidebar-ring",
  ];
  for (const token of official)
    assert.ok(Object.hasOwn(colorLabels, token), token);
  for (const mode of ["light", "dark"]) {
    for (const token of Object.keys(colorLabels))
      assert.ok(defaults[mode][token], `${mode} ${token}`);
    for (const token of Object.keys(shadowLabels))
      assert.ok(isShadow(defaults[mode][token]), `${mode} ${token}`);
  }
  for (const token of Object.keys(geometryTokens).filter(
    (token) => !token.startsWith("lab-sidebar-"),
  ))
    assert.ok(css.includes(`var(--${token}`), token);
});

test("advanced imports reject unknown tokens, declarations, URLs and invalid values", () => {
  for (const patch of [
    {
      colors: { light: {}, dark: { background: "red; } body { display:none" } },
    },
    { colors: { light: {}, dark: { unknown: "#ffffff" } } },
    { colors: { light: [], dark: {} } },
    {
      shadows: {
        light: {},
        dark: { "shadow-field": "url(https://example.com)" },
      },
    },
    {
      shadows: {
        light: {},
        dark: { "shadow-field": "0 0 2px red; color:red" },
      },
    },
    { geometry: { "field-radius": -1 } },
    { geometry: { "transition-duration": Infinity } },
    { fontFamily: "custom; color:red" },
  ])
    assert.equal(
      parseSettings({ version: 1, settings: { ...defaultSettings, ...patch } }),
      null,
    );
  assert.ok(isTokenColor("#12345678"));
  assert.ok(!isTokenColor("#12345"));
});
