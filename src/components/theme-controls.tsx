import { useState, type ReactNode } from "react";
import themeSource from "../../registry/immortal/styles/graphite.css?raw";
import {
  colorGroups,
  colorToHex,
  fontChoices,
  geometryGroups,
  geometryTokens,
  isShadow,
  isTokenColor,
  readThemeDefaults,
  shadowLabels,
  type FontChoice,
  type GeometryKey,
} from "@/lib/theme-catalog";
import { effectiveVariables, type ThemeSettings } from "@/lib/theme-settings";

const defaults = readThemeDefaults(themeSource);
export const matchesSetting = (query: string, ...text: string[]) =>
  !query.trim() ||
  text.join(" ").toLowerCase().includes(query.trim().toLowerCase());

export function ConfigGroup({
  title,
  query,
  count,
  children,
}: {
  title: string;
  query: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <details className="theme-config-group" open={query ? true : undefined}>
      <summary>
        {title}
        {count !== undefined && <span>{count} 项</span>}
      </summary>
      <div className="theme-config-body">{children}</div>
    </details>
  );
}

export function NumberControl({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  onReset,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  onReset?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const valid =
    draft !== "" &&
    Number.isFinite(Number(draft)) &&
    Number(draft) >= min &&
    Number(draft) <= max;
  return (
    <div className="theme-range">
      <div>
        <label htmlFor={`${id}-number`}>{label}</label>
        {onReset && (
          <button
            className="theme-token-reset"
            type="button"
            aria-label={`恢复${label}自动值`}
            onClick={onReset}
          >
            自动
          </button>
        )}
      </div>
      <div className="theme-number-row">
        <input
          id={id}
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={`${value} ${unit}`}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input
          id={`${id}-number`}
          type="number"
          min={min}
          max={max}
          step={step}
          value={editing ? draft : value}
          aria-invalid={editing && !valid}
          onFocus={() => {
            setDraft(String(value));
            setEditing(true);
          }}
          onChange={(event) => {
            const raw = event.target.value;
            setDraft(raw);
            const next = Number(raw);
            if (
              raw !== "" &&
              Number.isFinite(next) &&
              next >= min &&
              next <= max
            )
              onChange(next);
          }}
          onBlur={() => setEditing(false)}
        />
        <span>{unit}</span>
      </div>
      {editing && !valid && (
        <p className="theme-editor-hint">
          可输入 {min}–{max} {unit}。
        </p>
      )}
    </div>
  );
}

function ColorControl({
  name,
  label,
  value,
  custom,
  onChange,
  onReset,
}: {
  name: string;
  label: string;
  value: string;
  custom: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const opacity =
    value.length === 9
      ? Math.round((parseInt(value.slice(7), 16) / 255) * 1000) / 10
      : 100;
  return (
    <div className="theme-token-color">
      <div className="theme-token-heading">
        <label htmlFor={`color-${name}`}>{label}</label>
        <button
          type="button"
          className="theme-token-reset"
          disabled={!custom}
          aria-label={`恢复${label}默认值`}
          onClick={onReset}
        >
          恢复
        </button>
      </div>
      <div className="theme-color-row">
        <input
          type="color"
          aria-label={`${label}颜色`}
          value={value.slice(0, 7)}
          onChange={(event) => onChange(event.target.value + value.slice(7))}
        />
        <input
          id={`color-${name}`}
          aria-label={`${label}色值`}
          type="text"
          spellCheck={false}
          maxLength={9}
          value={editing ? draft : value}
          aria-invalid={editing && !isTokenColor(draft)}
          onFocus={() => {
            setDraft(value);
            setEditing(true);
          }}
          onBlur={() => setEditing(false)}
          onChange={(event) => {
            setDraft(event.target.value);
            if (isTokenColor(event.target.value)) onChange(event.target.value);
          }}
        />
      </div>
      <div className="theme-alpha-row">
        <label htmlFor={`alpha-${name}`}>不透明度</label>
        <input
          id={`alpha-${name}`}
          aria-label={`${label}不透明度`}
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={opacity}
          onChange={(event) =>
            onChange(
              value.slice(0, 7) +
                (Number(event.target.value) === 100
                  ? ""
                  : Math.round((Number(event.target.value) / 100) * 255)
                      .toString(16)
                      .padStart(2, "0")),
            )
          }
        />
        <output>{opacity}%</output>
      </div>
      {editing && !isTokenColor(draft) && (
        <p className="theme-editor-hint">
          输入 #RRGGBB 或带透明度的 #RRGGBBAA。
        </p>
      )}
    </div>
  );
}

function ShadowControl({
  name,
  label,
  value,
  custom,
  onChange,
  onReset,
}: {
  name: string;
  label: string;
  value: string;
  custom: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const valid = isShadow(draft) && CSS.supports("box-shadow", draft);
  return (
    <div className="theme-shadow-control">
      <div className="theme-token-heading">
        <label htmlFor={`shadow-${name}`}>{label}</label>
        <button
          type="button"
          className="theme-token-reset"
          disabled={!custom}
          aria-label={`恢复${label}默认值`}
          onClick={onReset}
        >
          恢复
        </button>
      </div>
      <textarea
        id={`shadow-${name}`}
        rows={3}
        spellCheck={false}
        value={editing ? draft : value}
        aria-invalid={editing && !valid}
        onFocus={() => {
          setDraft(value);
          setEditing(true);
        }}
        onBlur={() => setEditing(false)}
        onChange={(event) => {
          setDraft(event.target.value);
          if (
            isShadow(event.target.value) &&
            CSS.supports("box-shadow", event.target.value)
          )
            onChange(event.target.value);
        }}
      />
      <button
        type="button"
        className="theme-editor-text"
        onClick={() => onChange("none")}
      >
        关闭{label}
      </button>
      {editing && !valid && (
        <p className="theme-editor-hint">请输入有效的 CSS 阴影，或填 none。</p>
      )}
    </div>
  );
}

export function AdvancedThemeControls({
  settings,
  onChange,
  query,
}: {
  settings: ThemeSettings;
  onChange: (patch: Partial<ThemeSettings>) => void;
  query: string;
}) {
  const variables = effectiveVariables(settings, defaults[settings.mode]);
  const modeLabel = settings.mode === "dark" ? "深色" : "浅色";
  const resolve = (key: string): string => {
    const value = variables[key] ?? "#000000";
    const alias = /^var\(--([\w-]+)\)$/.exec(value);
    return alias ? (variables[alias[1]] ?? value) : value;
  };
  function setColor(key: string, value?: string) {
    const next = { ...settings.colors[settings.mode] };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange({ colors: { ...settings.colors, [settings.mode]: next } });
  }
  function setGeometry(key: GeometryKey, value?: number) {
    const next = { ...settings.geometry };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange({ geometry: next });
  }
  function setShadow(key: string, value?: string) {
    const next = { ...settings.shadows[settings.mode] };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange({ shadows: { ...settings.shadows, [settings.mode]: next } });
  }
  return (
    <>
      {colorGroups.map((group) => {
        const entries = Object.entries(group.tokens).filter(([key, label]) =>
          matchesSetting(query, group.label, key, label),
        );
        if (!entries.length) return null;
        return (
          <ConfigGroup
            key={group.label}
            title={`${group.label} · ${modeLabel}`}
            query={query}
            count={entries.length}
          >
            {entries.map(([key, label]) => (
              <ColorControl
                key={`${settings.mode}-${key}`}
                name={key}
                label={label}
                value={colorToHex(resolve(key))}
                custom={settings.colors[settings.mode][key] !== undefined}
                onChange={(value) => setColor(key, value)}
                onReset={() => setColor(key)}
              />
            ))}
          </ConfigGroup>
        );
      })}
      {matchesSetting(query, "字体 font 正文 标题") && (
        <ConfigGroup title="字体" query={query}>
          <label className="theme-select-label" htmlFor="theme-font-family">
            正文字体
          </label>
          <select
            id="theme-font-family"
            value={settings.fontFamily}
            onChange={(event) =>
              onChange({ fontFamily: event.target.value as FontChoice })
            }
          >
            {Object.entries(fontChoices).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
          <label className="theme-select-label" htmlFor="theme-heading-font">
            标题字体
          </label>
          <select
            id="theme-heading-font"
            value={settings.headingFont}
            onChange={(event) =>
              onChange({
                headingFont: event.target.value as ThemeSettings["headingFont"],
              })
            }
          >
            <option value="inherit">跟随正文</option>
            {Object.entries(fontChoices).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </ConfigGroup>
      )}
      {geometryGroups.map((group) => {
        const keys = group.keys.filter((key) =>
          matchesSetting(query, group.label, key, geometryTokens[key].label),
        );
        if (!keys.length) return null;
        return (
          <ConfigGroup
            key={group.label}
            title={group.label}
            query={query}
            count={keys.length}
          >
            <p className="theme-editor-hint">
              未单独设置时跟随基础主题；点击“自动”恢复跟随。
            </p>
            {keys.map((key) => {
              const spec = geometryTokens[key];
              const raw = variables[key] ?? spec.fallback;
              const value =
                settings.geometry[key] ??
                Number(
                  (
                    parseFloat(raw) *
                    (raw.endsWith("rem")
                      ? parseFloat(variables["font-size-base"])
                      : 1)
                  ).toFixed(2),
                );
              return (
                <NumberControl
                  key={key}
                  id={`geometry-${key}`}
                  {...spec}
                  value={value}
                  onChange={(value) => setGeometry(key, value)}
                  onReset={
                    settings.geometry[key] === undefined
                      ? undefined
                      : () => setGeometry(key)
                  }
                />
              );
            })}
          </ConfigGroup>
        );
      })}
      {Object.entries(shadowLabels).some(([key, label]) =>
        matchesSetting(query, "阴影", key, label),
      ) && (
        <ConfigGroup title={`阴影 · ${modeLabel}`} query={query}>
          <p className="theme-editor-hint">
            支持多层 CSS 阴影。可单独关闭，或恢复原始材质。
          </p>
          {Object.entries(shadowLabels)
            .filter(([key, label]) => matchesSetting(query, "阴影", key, label))
            .map(([key, label]) => (
              <ShadowControl
                key={`${settings.mode}-${key}`}
                name={key}
                label={label}
                value={resolve(key)}
                custom={settings.shadows[settings.mode][key] !== undefined}
                onChange={(value) => setShadow(key, value)}
                onReset={() => setShadow(key)}
              />
            ))}
        </ConfigGroup>
      )}
    </>
  );
}
