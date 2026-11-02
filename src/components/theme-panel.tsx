import { useRef, useState } from "react";
import { X } from "lucide-react";
import themeSource from "../../registry/immortal/styles/graphite.css?raw";
import {
  AdvancedThemeControls,
  ConfigGroup,
  matchesSetting,
  NumberControl,
} from "@/components/theme-controls";
import { isTokenColor } from "@/lib/theme-catalog";
import {
  defaultSettings,
  effectivePrimary,
  layoutNumberSettings,
  numberSettings,
  tabNumberSettings,
  parseSettings,
  serializeSettings,
  themeOverrides,
  type NumberSetting,
  type ThemeSettings,
} from "@/lib/theme-settings";

function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ThemePanel({
  settings,
  onChange,
  onClose,
  storageAvailable,
}: {
  settings: ThemeSettings;
  onChange: (patch: Partial<ThemeSettings>) => void;
  onClose: () => void;
  storageAvailable: boolean;
}) {
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [editingColor, setEditingColor] = useState(false);
  const [colorDraft, setColorDraft] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const color = effectivePrimary(settings);
  const invalidColor = editingColor && !isTokenColor(colorDraft);
  const css = `${themeSource}\n\n${themeOverrides(settings)}`;

  async function importFile(file?: File) {
    if (!file) return;
    try {
      const next = parseSettings(JSON.parse(await file.text()));
      if (!next) throw new Error("Invalid theme settings");
      onChange(next);
      setMessage("参数已导入并应用到预览。");
    } catch {
      setMessage(
        "无法导入：请选择有效的主题 JSON 参数文件，正文字号需在 14–20px 之间。",
      );
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  function renderRange(key: NumberSetting) {
    const item = numberSettings[key];
    return (
      <NumberControl
        key={key}
        id={`theme-${key}`}
        {...item}
        value={settings[key]}
        onChange={(value) => onChange({ [key]: value })}
      />
    );
  }

  function changePrimary(primary: string) {
    onChange({
      colors: {
        ...settings.colors,
        [settings.mode]: { ...settings.colors[settings.mode], primary },
      },
    });
  }

  return (
    <aside
      className="theme-editor"
      id="theme-editor"
      lang="zh-CN"
      aria-label="样式配置"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="theme-editor-toolbar">
        <div className="theme-editor-heading">
          <div>
            <p className="theme-editor-kicker">THEME STUDIO</p>
            <h2>样式配置</h2>
          </div>
          <button
            className="theme-editor-icon"
            type="button"
            aria-label="收起样式配置"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="theme-search-bar">
          <input
            type="search"
            aria-label="搜索主题配置"
            placeholder="搜索颜色、圆角、阴影…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              type="button"
              aria-label="清除配置搜索"
              onClick={() => setQuery("")}
            >
              清除
            </button>
          )}
        </div>
      </div>
      <p className="theme-editor-description">
        调整即时应用到本站并自动保存在此浏览器。深浅配色分别保存，尺寸共用；可导出完整主题继续使用。
      </p>
      {!storageAvailable && (
        <p role="status" className="theme-editor-warning">
          浏览器无法保存设置；本次调整仍然有效，请导出参数保留。
        </p>
      )}
      <fieldset>
        <legend>颜色与外观</legend>
        <div className="theme-mode" aria-label="外观模式" role="group">
          <button
            type="button"
            aria-pressed={settings.mode === "dark"}
            onClick={() => onChange({ mode: "dark" })}
          >
            深色
          </button>
          <button
            type="button"
            aria-pressed={settings.mode === "light"}
            onClick={() => onChange({ mode: "light" })}
          >
            浅色
          </button>
        </div>
        <label htmlFor="theme-primary">主颜色</label>
        <div className="theme-color-row">
          <input
            id="theme-primary"
            type="color"
            value={color.slice(0, 7)}
            onChange={(event) =>
              changePrimary(event.target.value + color.slice(7))
            }
            aria-label="选择主颜色"
          />
          <input
            type="text"
            aria-label="主色 HEX"
            aria-invalid={invalidColor}
            value={editingColor ? colorDraft : color}
            maxLength={9}
            spellCheck={false}
            onFocus={() => {
              setColorDraft(color);
              setEditingColor(true);
            }}
            onChange={(event) => {
              setColorDraft(event.target.value);
              if (isTokenColor(event.target.value))
                changePrimary(event.target.value);
            }}
            onBlur={() => setEditingColor(false)}
          />
        </div>
        <p className="theme-editor-hint">
          {invalidColor
            ? "请输入完整色值，例如 #2563eb。"
            : "主按钮和选中项同步变化；文字颜色也可单独调整。"}
        </p>
        <button
          className="theme-editor-text"
          type="button"
          onClick={() =>
            onChange({
              primary: null,
              colors: { ...settings.colors, [settings.mode]: {} },
            })
          }
        >
          恢复当前模式配色
        </button>
      </fieldset>
      {(Object.keys(layoutNumberSettings) as NumberSetting[]).some((key) =>
        matchesSetting(
          query,
          "尺寸 间距",
          key,
          numberSettings[key].label,
          "胶囊形按钮",
        ),
      ) && (
        <ConfigGroup title="基础尺寸与间距" query={query}>
          {(Object.keys(layoutNumberSettings) as NumberSetting[])
            .filter((key) =>
              matchesSetting(
                query,
                "尺寸 间距",
                key,
                numberSettings[key].label,
              ),
            )
            .map(renderRange)}
          <p className="theme-editor-hint">
            基础圆角联动面板、输入框与菜单；间距基准统一调整布局疏密。正文字号独立调整，辅助文字不低于
            14px。
          </p>
          <label className="theme-check">
            <input
              type="checkbox"
              checked={settings.pillButtons}
              onChange={(event) =>
                onChange({ pillButtons: event.target.checked })
              }
            />
            胶囊形按钮
          </label>
        </ConfigGroup>
      )}
      {matchesSetting(query, "Tab 标签页 宽度 圆角 内边距 内容 铺满") && (
        <ConfigGroup title="Tab 标签页" query={query}>
          <p className="theme-editor-hint">宽度方式</p>
          <div className="theme-mode" aria-label="Tab 宽度方式" role="group">
            <button
              type="button"
              aria-pressed={settings.tabWidth === "content"}
              onClick={() => onChange({ tabWidth: "content" })}
            >
              按内容
            </button>
            <button
              type="button"
              aria-pressed={settings.tabWidth === "fill"}
              onClick={() => onChange({ tabWidth: "fill" })}
            >
              铺满
            </button>
          </div>
          {(Object.keys(tabNumberSettings) as NumberSetting[]).map(renderRange)}
          <p className="theme-editor-hint">
            标签按文字与内边距决定大小；轨道圆角随标签圆角和轨道内边距联动。
          </p>
        </ConfigGroup>
      )}
      <AdvancedThemeControls
        settings={settings}
        onChange={onChange}
        query={query}
      />
      <fieldset>
        <legend>保存与复用</legend>
        <div className="theme-export-grid">
          <button
            type="button"
            onClick={() => {
              download(css, "immortal-theme.css", "text/css");
              setMessage("已生成主题 CSS，包含完整材质规则和当前参数。");
            }}
          >
            下载主题 CSS
          </button>
          <button
            type="button"
            onClick={() => {
              download(
                serializeSettings(settings),
                "immortal-theme.json",
                "application/json",
              );
              setMessage("已生成参数文件，可再次导入继续调整。");
            }}
          >
            导出参数
          </button>
          <button type="button" onClick={() => fileInput.current?.click()}>
            导入参数
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(css);
                setMessage("完整主题 CSS 已复制。");
              } catch {
                setMessage("浏览器不允许复制，请使用下载主题 CSS。");
              }
            }}
          >
            复制 CSS
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(event) => void importFile(event.target.files?.[0])}
        />
        <p className="theme-editor-hint">
          主题 CSS 面向 Tailwind v4 与 shadcn/ui；参数文件用于保存和继续探索。
        </p>
        <button
          className="theme-editor-reset"
          type="button"
          onClick={() => {
            onChange({ ...defaultSettings });
            setMessage("已恢复初始石墨风格。");
          }}
        >
          恢复全部默认值
        </button>
        <p className="theme-editor-message" role="status">
          {message}
        </p>
      </fieldset>
    </aside>
  );
}
