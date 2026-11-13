"use client";
import { Panel } from "@/components/iot/internal/panel";
import { useId, useMemo, useState, lazy, Suspense } from "react";
import { ChartLine, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Slider as SliderPrimitive } from "radix-ui";
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
  const units = [...new Set(visible.map((s) => s.unit))];
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
  const selectedIndex = at === undefined ? -1 : visibleTimes.indexOf(at);
  const inWindowEvents = events.filter(
    (e) => validTimestamp(e.at) && e.at >= from && e.at <= to,
  );
  const excludedTimes = (series ?? [{ data }]).reduce(
    (n, s) => n + s.data.filter((p) => !validTimestamp(p.timestamp)).length,
    0,
  );
  const chart = (
    <section
      className={cn("@container min-w-0 space-y-4", className)}
      data-slot="telemetry-chart"
      aria-label={label}
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
          className="text-sm text-muted-foreground tabular-nums"
        >
          {telemetryWindowLabel(from, to, timeZone)}
        </p>
      )}
      {sources.length > 1 && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="趋势序列"
        >
          {sources.map((s) => (
            <button
              key={s.id}
              type="button"
              data-slot="chart-legend-item"
              className="inline-flex min-h-10 min-w-0 max-w-full items-center gap-2 rounded-md px-2 text-left text-sm wrap-anywhere"
              aria-pressed={!hidden.includes(s.id)}
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
                  strokeWidth="2"
                  strokeDasharray={traceStyles[styleIndex(s)]}
                />
              </svg>
              <span>
                {s.label}
                {s.kind && ` · ${kindLabels[s.kind]}`}
              </span>
            </button>
          ))}
        </div>
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
              <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">
                  {groupUnit || "无量纲"}{" "}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {validCount} 个读数
                    {recordCount > validCount &&
                      ` · ${recordCount - validCount} 条缺测或无效`}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {referenceDomain ? "参考尺度" : "自动尺度"}{" "}
                  {formatAxisNumber(scale.min)}–{formatAxisNumber(scale.max)}
                  {scale.expanded && " · 超界已扩展"}
                </span>
              </figcaption>
              {validCount ? (
                <Suspense
                  fallback={
                    <div className="h-56 @lg:h-64 @3xl:h-72" role="status">
                      正在加载图表…
                    </div>
                  }
                >
                  <TelemetryPlot
                    label={`${label} · ${groupUnit || "无量纲"}，${validCount} 个数值读数，范围 ${formatAxisNumber(scale.min)} 至 ${formatAxisNumber(scale.max)}。下方可逐点读取。`}
                    series={group}
                    from={from}
                    to={to}
                    timeZone={timeZone}
                    scale={scale}
                    at={at}
                    maxGapMs={maxGapMs}
                    events={inWindowEvents}
                    onSelect={setCursorAt}
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
              {group.some((s) =>
                s.data.some(
                  (p) => p.quality === "estimated" || p.quality === "uncertain",
                ),
              ) && (
                <p className="text-sm text-muted-foreground">
                  □ 估算 · ◇ 存疑，质量由来源提供
                </p>
              )}
              {group.filter(validTarget).map((s) => (
                <p key={s.id} className="text-sm text-muted-foreground">
                  虚线边框 · {s.label}目标{" "}
                  {formatTelemetryNumber(s.target!.low, s.precision)}–
                  {formatTelemetryNumber(s.target!.high, s.precision)} {s.unit}
                </p>
              ))}
            </figure>
          );
        })
      )}
      {visibleTimes.length > 0 && windowValid && (
        <div
          className="space-y-3 border-t border-border pt-4"
          data-slot="telemetry-inspector"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-muted-foreground tabular-nums">
              {at === undefined ? (
                "采样已移出窗口"
              ) : (
                <>
                  实际采样 ·{" "}
                  <span className="text-foreground">
                    {telemetryTime(at, timeZone)}
                  </span>{" "}
                  {timeZone}
                </>
              )}
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="size-10"
                aria-label="上一个采样"
                disabled={selectedIndex <= 0}
                onClick={() => setCursorAt(visibleTimes[selectedIndex - 1])}
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-10"
                aria-label="下一个采样"
                disabled={
                  selectedIndex < 0 || selectedIndex >= visibleTimes.length - 1
                }
                onClick={() => setCursorAt(visibleTimes[selectedIndex + 1])}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
          <div className="text-sm tabular-nums" data-slot="telemetry-readout">
            {at === undefined ? (
              <div className="flex flex-wrap items-center gap-3">
                <p>所选采样不在当前窗口或可见序列内。</p>
                <Button variant="outline" onClick={() => setCursorAt(null)}>
                  返回最新采样
                </Button>
              </div>
            ) : (
              <>
                <dl className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-3">
                  {visible.map((s) => (
                    <div key={s.id} className="min-w-0 space-y-1 wrap-anywhere">
                      <dt className="flex items-start gap-2 text-muted-foreground">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 size-2 shrink-0 rounded-full"
                          style={{ background: traceColor(s) }}
                        />
                        {s.label}
                        {s.kind && ` · ${kindLabels[s.kind]}`}
                      </dt>
                      <dd className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="max-w-full overflow-x-auto whitespace-nowrap text-xl font-medium">
                          {formatTelemetrySample(exact(s, at), s.precision)}
                          {sampleState(exact(s, at)) === "valid" &&
                            ` ${s.unit}`}
                        </span>
                        {exact(s, at)?.quality && (
                          <span className="text-muted-foreground">
                            {qualityLabel(exact(s, at))}
                          </span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </div>
        </div>
      )}
      {windowValid && !!times.length && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            {aggregation} ·{" "}
            {maxGapMs && Number.isFinite(maxGapMs) && maxGapMs > 0
              ? `间隔超过 ${formatAxisNumber(maxGapMs / 60_000)} 分钟断线`
              : "缺测断线"}
          </span>
        </div>
      )}
      <details
        className="text-sm text-muted-foreground"
        data-slot="telemetry-reading-guide"
      >
        <summary className="min-h-10 cursor-pointer py-2">
          逐点浏览与读图说明
        </summary>
        <p className="py-2">
          指向或轻触曲线查看实际采样；箭头按钮或下方滑块可用键盘逐点读取。同单位序列共用纵轴，隐藏序列不会改变尺度。断线表示缺测、无效或超过来源给定的采样间隔。
          {mode === "live" && "自动尺度随窗口更新，已选时间保持不变。"}
          质量未标注时表示来源未提供质量。
        </p>
        {visibleTimes.length > 0 && (
          <div className="flex min-h-10 items-center">
            <SliderPrimitive.Root
              data-slot="slider"
              className="relative flex min-h-10 w-full touch-pan-y items-center"
              min={0}
              max={Math.max(1, visibleTimes.length - 1)}
              step={1}
              value={[Math.max(0, selectedIndex)]}
              disabled={visibleTimes.length < 2}
              onValueChange={([i]) => setCursorAt(visibleTimes[i])}
            >
              <SliderPrimitive.Track
                data-slot="slider-track"
                className="relative h-1 w-full overflow-hidden rounded-full bg-muted"
              >
                <SliderPrimitive.Range
                  data-slot="slider-range"
                  className="absolute h-full bg-primary"
                />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb
                data-slot="slider-thumb"
                aria-label="查看采样时间"
                aria-valuetext={
                  at === undefined
                    ? "所选采样不在窗口内"
                    : telemetryTime(at, timeZone) + " " + timeZone
                }
                className="relative block size-3 rounded-full border border-ring bg-background after:absolute after:-inset-3.5 focus-visible:outline-2 focus-visible:outline-ring"
              />
            </SliderPrimitive.Root>
          </div>
        )}
      </details>
      {!!excludedTimes && (
        <p className="text-sm text-warning-text">
          {excludedTimes} 条记录的时间无效，未进入时间轴或数据表。
        </p>
      )}
      {!!inWindowEvents.length && (
        <details className="text-sm">
          <summary className="min-h-10 cursor-pointer py-2 text-muted-foreground">
            事件标记 · {inWindowEvents.length}
          </summary>
          <ul className="space-y-2">
            {inWindowEvents.map((e) => (
              <li key={e.id}>
                {telemetryTime(e.at, timeZone)} {timeZone} · {e.label}
              </li>
            ))}
          </ul>
        </details>
      )}
      {showTable && (
        <details className="text-sm">
          <summary className="min-h-10 cursor-pointer py-2 text-muted-foreground">
            查看精确数据表 · 全部序列
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
    <Panel
      icon={<ChartLine />}
      title={label}
      description={
        <>
          {mode === "live" ? "实时窗口" : "历史窗口"} · {aggregation} ·{" "}
          {timeZone}
        </>
      }
    >
      {chart}
    </Panel>
  );
}
