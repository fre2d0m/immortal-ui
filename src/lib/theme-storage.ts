import {
  defaultSettings,
  parseSettings,
  settingsKey,
  themeOverrides,
  type ThemeSettings,
} from "./theme-settings";

export function readSettings(): ThemeSettings {
  try {
    const saved = localStorage.getItem(settingsKey);
    if (saved) {
      const settings = parseSettings(JSON.parse(saved));
      if (settings) return settings;
    }
    return {
      ...defaultSettings,
      mode:
        localStorage.getItem("immortal-theme") === "light" ? "light" : "dark",
    };
  } catch {
    return { ...defaultSettings };
  }
}

export function applySettings(settings: ThemeSettings) {
  document.documentElement.classList.toggle("dark", settings.mode === "dark");
  let style = document.getElementById("immortal-theme-overrides");
  if (!style) {
    style = document.createElement("style");
    style.id = "immortal-theme-overrides";
    document.head.append(style);
  }
  style.textContent = themeOverrides(settings);
}
