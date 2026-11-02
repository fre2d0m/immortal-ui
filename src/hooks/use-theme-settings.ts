import { useEffect, useState } from "react";
import { applySettings, readSettings } from "@/lib/theme-storage";
import {
  serializeSettings,
  settingsKey,
  type ThemeSettings,
} from "@/lib/theme-settings";

export function useThemeSettings() {
  const [settings, setSettings] = useState(readSettings);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    applySettings(settings);
    try {
      localStorage.setItem(settingsKey, serializeSettings(settings));
      localStorage.setItem("immortal-theme", settings.mode);
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [settings]);

  function updateSettings(patch: Partial<ThemeSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  return { settings, updateSettings, storageAvailable };
}
