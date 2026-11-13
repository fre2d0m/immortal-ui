"use client";
import { Panel } from "@/components/iot/internal/panel";
import { useId, useMemo, useState, lazy, Suspense } from "react";
import { ChartLine, Info } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Popover as PopoverPrimitive } from "radix-ui";
import {
  normalizeTelemetry,
  numericScale,
  validDomain,
  formatAxisNumber,
  formatTelemetryNumber,
  formatTelemetrySample,
  sampleState,
  qualityLabel,
  telemetryTime,
  telemetryWindowLabel,
  validTimestamp,
  type NumericDomain,
  type TelemetryPoint,
  type TelemetryWindow,
} from "@/lib/telemetry";
export type { TelemetryPoint } from "@/lib/telemetry";
export type TrendSeries = {
  id: string;
  label: string;
  unit: string;
  data: TelemetryPoint[];
  target?: { low: number; high: number };
  /** Reference display range. Outliers extend the scale and are labelled. */
  domain?: NumericDomain;
  color?: string;
  /** Stable palette and dash index across different query selections. */
  styleIndex?: number;
  precision?: number;
  kind?: "observation" | "aggregate" | "estimate" | "prediction";
};
import {
  traceColor,
  traceStyles,
  seriesStyleIndex as styleIndex,
} from "@/components/iot/internal/telemetry-series-style";
const TelemetryPlot = lazy(() =>
  import("@/components/iot/internal/telemetry-plot").then((module) => ({
    default: module.TelemetryPlot,
  })),
);
const kindLabels = {
  observation: "原始观测",
  aggregate: "聚合结果",
  estimate: "估算",
  prediction: "预测",
};
const validTarget = (s: TrendSeries) =>
  s.target && validDomain({ min: s.target.low, max: s.target.high });

export function TelemetryChart({
  data = [],
  label,
  unit = "",
  precision = 2,
  series,
  className,
  showTable = true,
  embedded = false,
  showHeading = true,
  mode = "history",
  timeZone = "UTC",
  aggregation = "原始采样",
  window,
  maxGapMs,
  events = [],
}: {
  data?: TelemetryPoint[];
  label: string;
  unit?: string;
  precision?: number;
  series?: TrendSeries[];
  className?: string;
  showTable?: boolean;
  embedded?: boolean;
  /** Hide a duplicate heading when the containing workspace already names this result. */
  showHeading?: boolean;
  mode?: "live" | "history";
  timeZone?: string;
  aggregation?: string;
  window?: TelemetryWindow;
  maxGapMs?: number;
  events?: { id: string; at: number; label: string }[];
}) {
  const descriptionId = useId();
  const [hidden, setHidden] = useState<string[]>([]);
  const [emphasized, setEmphasized] = useState<string>();
  // Store an actual timestamp: inserting a sample must not move an inspected cursor.
  const [cursorAt, setCursorAt] = useState<number | null>(null);
  const sources = useMemo(
    () =>
      (series ?? [{ id: "main", label, unit, precision, data }]).map((s) => ({
        ...s,
        data: normalizeTelemetry(s.data, window?.from, window?.to),
      })),
    [series, data, label, unit, precision, window?.from, window?.to],
  );
  const times = [
    ...new Set(sources.flatMap((s) => s.data.map((p) => p.timestamp))),
  ].sort((a, b) => a - b);
  const from = window?.from ?? times[0] ?? 0,
    to = window?.to ?? times.at(-1) ?? 1;
  const windowValid =
    validTimestamp(from) &&
    validTimestamp(to) &&
    to >= from &&
    telemetryTime(from, timeZone) !== "时区无效";
  const visible = sources.filter((s) => !hidden.includes(s.id));
  const units = [...new Set(sources.map((s) => s.unit))];
  const bySeries = new Map(
    sources.map((s) => [s.id, new Map(s.data.map((p) => [p.timestamp, p]))]),
  );
  const exact = (s: TrendSeries, at: number) => bySeries.get(s.id)?.get(at);
  const visibleTimes = times.filter((at) => visible.some((s) => exact(s, at)));
  const at =
    cursorAt === null
      ? visibleTimes.at(-1)
      : visibleTimes.includes(cursorAt)
        ? cursorAt
        : undefined;
  const inWindowEvents = events.filter(
    (e) => validTimestamp(e.at) && e.at >= from && e.at <= to,
  );
  const excludedTimes = (series ?? [{ data }]).reduce(
    (n, s) => n + s.data.filter((p) => !validTimestamp(p.timestamp)).length,
    0,
  );
  const chart = (
    <section
      className={cn("@container min-w-0 space-y-2", className)}
      data-slot="telemetry-chart"
      aria-label={label}
      aria-describedby={descriptionId}
    >
      {embedded && showHeading && (
        <div className="space-y-1">
          <h4 className="text-base font-medium">{label}</h4>
          <p className="text-sm text-muted-foreground">
            {mode === "live" ? "实时窗口" : "历史窗口"} · {aggregation} ·{" "}
            {timeZone}
          </p>
        </div>
      )}
      <p id={descriptionId} className="sr-only">
        同单位共用纵轴，不同单位分图。断线表示缺测或无效记录
        {maxGapMs && maxGapMs > 0 && Number.isFinite(maxGapMs)
          ? `，超过 ${formatAxisNumber(maxGapMs / 1000)} 秒的间隔也断线`
          : "；未提供长间隔规则"}
        。{mode === "live" && "自动尺度随窗口更新；已选采样保持其时间。"}
      </p>
      {windowValid && !!times.length && (
        <p
          data-slot="telemetry-window"
          className="flex flex-wrap gap-x-1 text-sm text-muted-foreground tabular-nums"
        >
          {telemetryWindowLabel(from, to, timeZone)
            .slice(0, -timeZone.length - 1)
            .split(" – ")
            .map((part, index) => (
              <span
                className="max-w-full overflow-x-auto whitespace-nowrap"
                key={index}
              >
                {index > 0 && "– "}
                {part}
              </span>
            ))}
          <span className="wrap-anywhere">{timeZone}</span>
        </p>
      )}
      {!windowValid ? (
        <p className="py-8 text-warning-text">时间窗口或时区无效</p>
      ) : !times.length ? (
        <p className="surface-inset p-5 text-muted-foreground">
          此时间窗内没有采样
        </p>
      ) : !units.length ? (
        <p className="py-8 text-muted-foreground">请选择至少一条序列</p>
      ) : (
        units.map((groupUnit) => {
          const group = visible.filter((s) => s.unit === groupUnit);
          // Include hidden series in the domain so toggling a legend never exaggerates changes.
          const all = sources.filter((s) => s.unit === groupUnit);
          const labelParts = all.map((s) => s.label.split(/\s*·\s*/));
          const sharedLabel =
            all.length > 1 &&
            labelParts.every(
              (parts) => parts.length > 1 && parts[0] === labelParts[0][0],
            )
              ? labelParts[0][0]
              : undefined;

          const readings = all.flatMap((s) =>
            s.data
              .filter((p) => sampleState(p) === "valid")
              .map((p) => p.value!),
          );
          const references = all.flatMap((s) =>
            validDomain(s.domain) ? [s.domain.min, s.domain.max] : [],
          );
          const targets = all.flatMap((s) =>
            validTarget(s) ? [s.target!.low, s.target!.high] : [],
          );
          const referenceDomain = references.length
            ? { min: Math.min(...references), max: Math.max(...references) }
            : undefined;
          const scale = numericScale(
            [...readings, ...targets],
            referenceDomain,
          );
          const validCount = group.reduce(
            (n, s) =>
              n + s.data.filter((p) => sampleState(p) === "valid").length,
            0,
          );
          const recordCount = group.reduce((n, s) => n + s.data.length, 0);
          return (
            <figure
              key={groupUnit}
              className="min-w-0 space-y-2"
              data-slot="telemetry-unit"
            >
              <figcaption className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 @lg:flex">
                <span className="mr-auto text-sm text-muted-foreground">
                  {sharedLabel
                    ? `${sharedLabel} · ${groupUnit || "无量纲"}`
                    : groupUnit || "无量纲"}
                </span>
                <div
                  className="order-3 col-span-2 flex min-w-0 flex-wrap items-center gap-x-3 @lg:order-none @lg:ml-auto"
                  role="group"
                  aria-label={`${groupUnit || "无量纲"} 趋势序列`}
                >
                  {all.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      data-slot="chart-legend-item"
                      className="inline-flex min-h-10 min-w-0 max-w-full items-center gap-2 px-1 text-left text-sm wrap-anywhere"
                      aria-label={s.label}
                      aria-pressed={!hidden.includes(s.id)}
                      onMouseEnter={() => setEmphasized(s.id)}
                      onMouseLeave={() => setEmphasized(undefined)}
                      onFocus={() => setEmphasized(s.id)}
                      onBlur={() => setEmphasized(undefined)}
                      onClick={() =>
                        setHidden((current) =>
                          current.includes(s.id)
                            ? current.filter((id) => id !== s.id)
                            : [...current, s.id],
                        )
                      }
                    >
                      <svg
                        className="h-3 w-6 shrink-0"
                        viewBox="0 0 24 12"
                        aria-hidden="true"
                      >
                        <path
                          d="M1 6H23"
                          stroke={traceColor(s)}
                          strokeWidth="2.5"
                          strokeDasharray={traceStyles[styleIndex(s)]}
                        />
                      </svg>
                      <span>
                        {sharedLabel
                          ? s.label
                              .split(/\s*·\s*/)
                              .slice(1)
                              .join(" · ")
                          : s.label}
                        {s.kind &&
                          s.kind !== "observation" &&
                          ` · ${kindLabels[s.kind]}`}
                      </span>
                    </button>
                  ))}
                </div>
                <PopoverPrimitive.Root>
                  <PopoverPrimitive.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 shrink-0 text-muted-foreground"
                      aria-label={`图表信息 · ${groupUnit || "无量纲"}`}
                    >
                      <Info className="size-4" />
                    </Button>
                  </PopoverPrimitive.Trigger>
                  <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                      sideOffset={8}
                      align="end"
                      collisionPadding={12}
                      className="z-50 w-80 max-w-[calc(100vw-24px)] space-y-3 rounded-lg border border-border bg-popover p-4 text-sm text-popover-foreground shadow-lg"
                      aria-label="图表信息"
                    >
                      <div className="flex justify-between gap-4">
                        <span>{aggregation}</span>
                        <span>{recordCount} 条记录</span>
                      </div>
                      <p className="text-muted-foreground">
                        {referenceDomain ? "参考范围" : "自动范围"}{" "}
                        {formatAxisNumber(scale.min)}–
                        {formatAxisNumber(scale.max)} {groupUnit}
                        {scale.expanded && " · 超界已扩展"}
                      </p>
                      <p className="text-muted-foreground">
                        {recordCount - validCount} 条缺测或无效。
                        {maxGapMs && maxGapMs > 0 && Number.isFinite(maxGapMs)
                          ? `超过 ${formatAxisNumber(maxGapMs / 60_000)} 分钟断线。`
                          : "未提供长间隔规则。"}
                        {mode === "live" && "自动范围随窗口更新。"}
                      </p>
                      {group.filter(validTarget).map((s) => (
                        <p key={s.id}>
                          {s.label} · 目标{" "}
                          {formatTelemetryNumber(s.target!.low, s.precision)}–
                          {formatTelemetryNumber(s.target!.high, s.precision)}{" "}
                          {s.unit}
                        </p>
                      ))}
                      {inWindowEvents.map((e) => (
                        <p key={e.id}>
                          {telemetryTime(e.at, timeZone)} {timeZone} · {e.label}
                        </p>
                      ))}
                      <p className="border-t border-border pt-3 text-muted-foreground">
                        悬停查看，点击保留。聚焦图表后用方向键逐点读取，Esc
                        关闭。
                      </p>
                    </PopoverPrimitive.Content>
                  </PopoverPrimitive.Portal>
                </PopoverPrimitive.Root>
              </figcaption>
              {group.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  序列已隐藏
                </p>
              ) : validCount ? (
                <Suspense
                  fallback={
                    <div className="h-64 @lg:h-72 @3xl:h-80" role="status">
                      正在加载图表…
                    </div>
                  }
                >
                  <TelemetryPlot
                    label={`${label} · ${groupUnit || "无量纲"}，${validCount} 个数值读数，范围 ${formatAxisNumber(scale.min)} 至 ${formatAxisNumber(scale.max)}。方向键逐点读取，Esc 关闭读数。`}
                    series={group}
                    from={from}
                    to={to}
                    timeZone={timeZone}
                    scale={scale}
                    at={at}
                    maxGapMs={maxGapMs}
                    events={inWindowEvents}
                    onSelect={setCursorAt}
                    emphasizedSeries={emphasized}
                  />
                </Suspense>
              ) : (
                <p className="surface-inset p-5 text-sm text-muted-foreground">
                  所选序列在此时段没有有效读数；可在数据表核对缺测和无效记录。
                </p>
              )}
              {all.some(
                (s) =>
                  (s.domain && !validDomain(s.domain)) ||
                  (s.target && !validTarget(s)),
              ) && (
                <p className="text-sm text-warning-text">
                  存在无效的尺度或目标配置，未绘制该参考范围。
                </p>
              )}
            </figure>
          );
        })
      )}
      {cursorAt !== null && at === undefined && visibleTimes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>所选采样已移出窗口</span>
          <Button variant="ghost" onClick={() => setCursorAt(null)}>
            返回最新采样
          </Button>
        </div>
      )}
      {!!excludedTimes && (
        <p className="text-sm text-warning-text">
          {excludedTimes} 条记录的时间无效，未进入时间轴或数据表。
        </p>
      )}
      {showTable && (
        <details className="text-sm">
          <summary className="min-h-10 cursor-pointer py-2 text-muted-foreground">
            数据表
          </summary>
          <div
            className="max-h-64 overflow-auto focus-visible:outline-2 focus-visible:outline-ring"
            tabIndex={0}
            role="region"
            aria-label="精确数据表"
          >
            <table className="w-full text-left tabular-nums">
              <caption className="sr-only">
                {label} · {timeZone} · {aggregation}，包括隐藏序列
              </caption>
              <thead className="sticky top-0 bg-card">
                <tr>
                  <th scope="col" className="whitespace-nowrap p-2 font-medium">
                    采样时间（{timeZone}）
                  </th>
                  {sources.map((s) => (
                    <th
                      scope="col"
                      key={s.id}
                      className="whitespace-nowrap p-2 text-right font-medium"
                    >
                      {s.label} ({s.unit || "无量纲"})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map((t) => (
                  <tr key={t} className="border-t border-border">
                    <th
                      scope="row"
                      className="whitespace-nowrap p-2 font-normal"
                    >
                      {telemetryTime(t, timeZone)}
                    </th>
                    {sources.map((s) => (
                      <td
                        key={s.id}
                        className="whitespace-nowrap p-2 text-right"
                      >
                        {formatTelemetrySample(exact(s, t), s.precision)}
                        {exact(s, t)?.quality && (
                          <span className="block text-muted-foreground">
                            {qualityLabel(exact(s, t))}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!times.length && (
              <p className="py-4 text-muted-foreground">没有采样记录</p>
            )}
          </div>
        </details>
      )}
    </section>
  );
  return embedded ? (
    chart
  ) : (
    <Panel icon={<ChartLine />} title={label}>
      {chart}
    </Panel>
  );
}
