import {
  defaultSettings,
  parseSettings,
  settingsKey,
  themeOverrides,
  type ThemeSettings,
} from "./theme-settings";

const previousSettingsKey = "immortal-theme-studio-v1";
const previousDefaults: ThemeSettings = {
  ...defaultSettings,
  fontSize: 16,
  controlHeight: 32,
  radius: 8,
  tabRadius: 15,
  tabPaddingY: 5,
  tabListPadding: 2,
  geometry: {},
};

export function readSettings(): ThemeSettings {
  try {
    const saved = localStorage.getItem(settingsKey);
    const stored = saved ?? localStorage.getItem(previousSettingsKey);
    if (stored) {
      const settings = parseSettings(JSON.parse(stored));
      if (settings) {
        // The old editor saved untouched defaults on every visit.
        const usesPreviousDefaults =
          saved === null &&
          Object.entries(previousDefaults).every(
            ([key, value]) =>
              key === "mode" ||
              JSON.stringify(settings[key as keyof ThemeSettings]) ===
                JSON.stringify(value),
          );
        return usesPreviousDefaults
          ? { ...defaultSettings, mode: settings.mode }
          : settings;
      }
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
