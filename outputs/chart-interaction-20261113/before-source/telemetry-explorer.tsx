"use client";

import { Panel } from "@/components/iot/internal/panel";

import { useId, useMemo, useState, type FormEvent } from "react";
import { ChartLine, Download, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TelemetryChart,
  type TrendSeries,
} from "@/components/iot/telemetry-chart";

import {
  normalizeTelemetry,
  validTimestamp,
  formatTelemetrySample,
  sampleState,
  qualityLabel,
  telemetryWindowLabel,
  type TelemetryPoint,
} from "@/lib/telemetry";

export type TelemetryMetric = { id: string; label: string; unit: string };
export type TelemetryQuery = { metricIds: string[]; from: number; to: number };
export type TelemetryQueryResult = {
  series: TrendSeries[];
  events?: { id: string; at: number; label: string }[];
  maxGapMs?: number;
};
export type TelemetryExportRow = {
  timestamp: number;
  metricId: string;
  label: string;
  unit: string;
  value: number | null;
  precision?: number;
  quality?: TelemetryPoint["quality"];
  qualityReason?: string;
  state: ReturnType<typeof sampleState>;
};

const hour = 60 * 60 * 1000;
const presets = [
  { label: "24 小时", hours: 24 },
  { label: "3 天", hours: 72 },
  { label: "7 天", hours: 168 },
];
function utcText(timestamp: number) {
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime())
    ? date
        .toISOString()
        .slice(0, -1)
        .replace(/\.000$/, "")
    : "";
}
const utcInput = (timestamp: number) => utcText(timestamp).replace(/:00$/, "");
const utcLabel = (timestamp: number) =>
  utcText(timestamp).replace("T", " ") || "时间未知";

export function TelemetryExplorer({
  title = "遥测历史",
  subtitle,
  metrics,
  now,
  initialQuery,
  initialResult,
  onQuery,
  onExport,
}: {
  title?: string;
  subtitle?: string;
  metrics: TelemetryMetric[];
  now: number;
  initialQuery: TelemetryQuery;
  initialResult?: TelemetryQueryResult;
  onQuery: (query: TelemetryQuery) => Promise<TelemetryQueryResult>;
  onExport?: (rows: TelemetryExportRow[], query: TelemetryQuery) => void;
}) {
  const fromId = useId();
  const toId = useId();
  const [metricIds, setMetricIds] = useState(initialQuery.metricIds);
  const [from, setFrom] = useState(() => utcInput(initialQuery.from));
  const [to, setTo] = useState(() => utcInput(initialQuery.to));
  const [applied, setApplied] = useState(() =>
    initialResult ? { query: initialQuery, result: initialResult } : null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{
    field: "metrics" | "dates" | "request";
    message: string;
  } | null>(null);
  const [view, setView] = useState("chart");
  const [filtersOpen, setFiltersOpen] = useState(!initialResult);
  const ids = metrics
    .filter((metric) => metricIds.includes(metric.id))
    .map((metric) => metric.id);
  const draftStart = Date.parse(from + "Z");
  const draftEnd = Date.parse(to + "Z");
  const unapplied =
    !!applied &&
    (draftStart !== applied.query.from ||
      draftEnd !== applied.query.to ||
      ids.length !== applied.query.metricIds.length ||
      ids.some((id) => !applied.query.metricIds.includes(id)));

  const series = useMemo(() => {
    if (!applied) return [];
    const { query, result } = applied;
    return result.series
      .filter((item) => query.metricIds.includes(item.id))
      .map((item) => ({
        ...item,
        data: normalizeTelemetry(item.data, query.from, query.to),
      }));
  }, [applied]);
  const invalidTimes =
    applied?.result.series
      .filter((item) => applied.query.metricIds.includes(item.id))
      .reduce(
        (count, item) =>
          count +
          item.data.filter((point) => !validTimestamp(point.timestamp)).length,
        0,
      ) ?? 0;
  const rows = useMemo(
    () =>
      series
        .flatMap((item) =>
          item.data.map((point): TelemetryExportRow => ({
            timestamp: point.timestamp,
            metricId: item.id,
            label: item.label,
            unit: item.unit,
            value: point.value,
            precision: item.precision,
            quality: point.quality,
            qualityReason: point.qualityReason,
            state: sampleState(point),
          })),
        )
        .sort((a, b) => b.timestamp - a.timestamp),
    [series],
  );

  function usePreset(hours: number) {
    setTo(utcInput(now));
    setFrom(utcInput(now - hours * hour));
    setError(null);
  }

  async function query(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const start = draftStart;
    const end = draftEnd;
    if (!ids.length) {
      setError({ field: "metrics", message: "请至少选择一项指标。" });
      return;
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
      setError({
        field: "dates",
        message: "请填写有效的时间范围，结束时间应晚于开始时间。",
      });
      return;
    }
    const requested = { metricIds: ids, from: start, to: end };
    setPending(true);
    setError(null);
    try {
      const result = await onQuery(requested);
      setApplied({ query: requested, result });
      setFiltersOpen(false);
    } catch {
      setError({
        field: "request",
        message: applied
          ? "查询失败，已保留上次结果。请重试。"
          : "查询失败，请重试。",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel
      as="h2"
      icon={<ChartLine />}
      title={title}
      description={subtitle}
      className="@container min-w-0"
      contentClassName="space-y-4"
    >
      <details
        open={filtersOpen}
        onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
        className="min-w-0 rounded-lg border border-border"
        data-slot="telemetry-filters"
      >
        <summary className="flex min-h-12 cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 font-medium">
            <SlidersHorizontal className="size-4" />
            查询条件{" "}
            <span className="font-normal text-muted-foreground">
              {ids.length} 项指标 · UTC
            </span>
          </span>
          <span className="text-muted-foreground">
            {filtersOpen ? "收起" : "调整条件"}
          </span>
        </summary>
        <form
          noValidate
          onSubmit={query}
          className="grid min-w-0 items-start gap-4 border-t border-border p-3 @md:p-4 @4xl:grid-cols-[minmax(15rem,0.75fr)_minmax(0,1fr)]"
        >
          <fieldset className="min-w-0">
            <legend className="mb-1.5 text-sm font-medium">指标</legend>
            <div className="flex flex-wrap gap-1.5">
              {metrics.map((metric) => {
                const selected = metricIds.includes(metric.id);
                return (
                  <button
                    key={metric.id}
                    type="button"
                    data-slot="filter-chip"
                    className="gap-2 text-left"
                    aria-pressed={selected}
                    onClick={() => {
                      setMetricIds(
                        selected
                          ? metricIds.filter((id) => id !== metric.id)
                          : [...metricIds, metric.id],
                      );
                      setError(null);
                    }}
                  >
                    <span>{metric.label}</span>
                    <span aria-hidden="true" className="text-muted-foreground">
                      {metric.unit}
                    </span>
                  </button>
                );
              })}
            </div>
            {!metrics.length && (
              <p className="text-sm text-muted-foreground">
                此设备暂无可查询的指标
              </p>
            )}
          </fieldset>

          <div className="min-w-0 space-y-2 border-t border-border/60 pt-3 @4xl:border-t-0 @4xl:border-l @4xl:pt-0 @4xl:pl-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-sm font-medium">
                时间范围{" "}
                <span className="font-normal text-muted-foreground">UTC</span>
              </p>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label="快捷时间范围"
              >
                {presets.map((preset) => (
                  <button
                    key={preset.hours}
                    type="button"
                    data-slot="filter-chip"
                    aria-pressed={
                      draftEnd === now &&
                      draftStart === now - preset.hours * hour
                    }
                    onClick={() => usePreset(preset.hours)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid items-end gap-3 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @5xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <label
                htmlFor={fromId}
                className="grid min-w-0 gap-1.5 text-sm text-muted-foreground"
              >
                开始时间
                <Input
                  id={fromId}
                  type="datetime-local"
                  step="any"
                  className="min-h-10 min-w-0 text-sm! text-foreground tabular-nums [color-scheme:light] @sm:text-base! dark:[color-scheme:dark]"
                  value={from}
                  aria-invalid={error?.field === "dates" || undefined}
                  onChange={(event) => {
                    setFrom(event.target.value);
                    setError(null);
                  }}
                />
              </label>
              <label
                htmlFor={toId}
                className="grid min-w-0 gap-1.5 text-sm text-muted-foreground"
              >
                结束时间
                <Input
                  id={toId}
                  type="datetime-local"
                  step="any"
                  className="min-h-10 min-w-0 text-sm! text-foreground tabular-nums [color-scheme:light] @sm:text-base! dark:[color-scheme:dark]"
                  value={to}
                  aria-invalid={error?.field === "dates" || undefined}
                  onChange={(event) => {
                    setTo(event.target.value);
                    setError(null);
                  }}
                />
              </label>
              <Button
                type="submit"
                disabled={pending || !metrics.length}
                className="min-h-10 w-fit"
              >
                <Search aria-hidden="true" /> {pending ? "查询中…" : "查询"}
              </Button>
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="text-sm text-destructive @4xl:col-span-2"
            >
              {error.message}
            </p>
          )}
          {!error && unapplied && !pending && (
            <p className="text-sm text-muted-foreground @4xl:col-span-2">
              查询条件已更改，结果区仍显示上次查询。
            </p>
          )}
        </form>
      </details>

      <div className="min-w-0">
        {!applied ? (
          <p
            className="py-6 text-center text-sm text-muted-foreground"
            role="status"
          >
            {pending ? "正在读取遥测…" : "选择指标和时间范围后查询。"}
          </p>
        ) : (
          <Tabs value={view} onValueChange={setView} className="min-w-0 gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                data-slot="control-row"
                className="flex w-full flex-wrap items-center justify-between gap-2"
              >
                <TabsList className="h-auto!" aria-label="结果视图">
                  <TabsTrigger className="min-h-10" value="chart">
                    趋势图
                  </TabsTrigger>
                  <TabsTrigger className="min-h-10" value="table">
                    数据表
                  </TabsTrigger>
                </TabsList>
                {onExport && rows.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-10"
                    onClick={() => onExport(rows, applied.query)}
                  >
                    <Download aria-hidden="true" /> 导出 CSV
                  </Button>
                )}
              </div>
            </div>
            <p
              role="status"
              className={
                view === "chart" && !pending
                  ? "sr-only"
                  : "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm leading-relaxed text-muted-foreground tabular-nums"
              }
            >
              {view === "table" && (
                <span>
                  {telemetryWindowLabel(applied.query.from, applied.query.to)}
                </span>
              )}
              <span className="block">
                {pending
                  ? "正在查询 · 保留上次结果"
                  : rows.length + " 条采样记录"}
              </span>
            </p>
            {invalidTimes > 0 && (
              <p className="text-sm text-warning-text">
                {invalidTimes} 条记录的时间无效，未进入图表、数据表或导出。
              </p>
            )}
            <TabsContent value="chart" aria-busy={pending}>
              {rows.length > 0 ? (
                <TelemetryChart
                  embedded
                  showHeading={false}
                  key={JSON.stringify(applied.query)}
                  label="传感器趋势"
                  series={series}
                  window={applied.query}
                  events={applied.result.events}
                  maxGapMs={applied.result.maxGapMs}
                  showTable={false}
                />
              ) : (
                <p className="surface-inset p-5 text-muted-foreground">
                  {rows.length
                    ? "此时间范围内的采样读数均缺测"
                    : "此时间范围内没有采样"}
                </p>
              )}
            </TabsContent>
            <TabsContent value="table" aria-busy={pending}>
              {rows.length ? (
                <div
                  className="surface-inset max-h-96 overflow-auto px-3 focus-visible:outline-2 focus-visible:outline-ring"
                  tabIndex={0}
                  role="region"
                  aria-label="采样数据表"
                >
                  <table className="w-full text-left text-sm tabular-nums">
                    <caption className="sr-only">原始采样 · UTC</caption>
                    <thead className="sticky top-0 bg-muted">
                      <tr className="border-b border-border text-foreground">
                        <th scope="col" className="p-2 font-normal">
                          采样时间（UTC）
                        </th>
                        <th scope="col" className="p-2 font-normal">
                          指标
                        </th>
                        <th scope="col" className="p-2 text-right font-normal">
                          读数
                        </th>
                        <th scope="col" className="p-2 font-normal">
                          质量
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.metricId + ":" + row.timestamp}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="whitespace-nowrap p-2">
                            {utcLabel(row.timestamp)}
                          </td>
                          <td className="p-2 wrap-break-word">{row.label}</td>
                          <td className="whitespace-nowrap p-2 text-right">
                            {formatTelemetrySample(row, row.precision)}
                            {row.state === "valid" && " " + row.unit}
                          </td>
                          <td className="p-2">{qualityLabel(row)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="surface-inset p-5 text-muted-foreground">
                  此时间范围内没有采样
                </p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Panel>
  );
}
