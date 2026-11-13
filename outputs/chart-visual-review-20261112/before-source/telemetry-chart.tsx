"use client";
import { Panel } from "@/components/iot/internal/panel";
import { useId, useMemo, useState, type PointerEvent } from "react";
import { ChartLine } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Slider as SliderPrimitive } from "radix-ui";
import {
  normalizeTelemetry,
  trendSegments,
  numericScale,
  linearPosition,
  validDomain,
  formatAxisNumber,
  formatTelemetryNumber,
  formatTelemetrySample,
  sampleState,
  qualityLabel,
  telemetryTime,
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
const traceStyles = [undefined, "8 4", "2 4", "8 3 2 3", "12 4"];
const kindLabels = {
  observation: "原始观测",
  aggregate: "聚合结果",
  estimate: "估算",
  prediction: "预测",
};
const styleIndex = (series: TrendSeries) =>
  Math.abs(
    series.styleIndex ??
      [...series.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) | 0, 0),
  ) % 5;
const traceColor = (series: TrendSeries) =>
  `color-mix(in srgb, ${series.color ?? `var(--chart-${styleIndex(series) + 1})`} 60%, var(--foreground))`;
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
  const windowValid = validTimestamp(from) && validTimestamp(to) && to >= from;
  const x = (at: number) => 8 + linearPosition(at, from, to) * 624;
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
  const selectNearest = (
    event: PointerEvent<SVGSVGElement>,
    group: TrendSeries[],
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const t =
      from +
      ((((event.clientX - rect.left) / rect.width) * 640 - 8) / 624) *
        (to - from);
    const candidates = visibleTimes.filter((t) =>
      group.some((s) => exact(s, t)),
    );
    const nearest = candidates.reduce<number | undefined>(
      (best, candidate) =>
        best === undefined || Math.abs(candidate - t) < Math.abs(best - t)
          ? candidate
          : best,
      undefined,
    );
    if (nearest !== undefined) setCursorAt(nearest);
  };
  const chart = (
    <section
      className={cn("@container min-w-0 space-y-4", className)}
      data-slot="telemetry-chart"
      aria-label={label}
    >
      {embedded && (
        <div className="space-y-1">
          <h4 className="text-base font-medium">{label}</h4>
          <p className="text-sm text-muted-foreground">
            {mode === "live" ? "实时窗口" : "历史窗口"} · {aggregation} ·{" "}
            {timeZone}
          </p>
        </div>
      )}
      <p id={descriptionId} className="text-sm text-muted-foreground">
        同单位共用纵轴，不同单位分图。断线表示缺测或无效记录
        {maxGapMs && maxGapMs > 0 && Number.isFinite(maxGapMs)
          ? `，超过 ${formatAxisNumber(maxGapMs / 1000)} 秒的间隔也断线`
          : "；未提供长间隔规则"}
        。{mode === "live" && "自动尺度随窗口更新；已选采样保持其时间。"}
      </p>
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
              className="inline-flex min-h-10 min-w-0 max-w-full items-center gap-2 rounded-md px-3 text-left text-sm wrap-anywhere"
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
        <p className="py-8 text-warning-text">时间窗口无效</p>
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
          const y = (value: number) =>
            16 + (1 - linearPosition(value, scale.min, scale.max)) * 160;
          const validCount = group.reduce(
            (n, s) =>
              n + s.data.filter((p) => sampleState(p) === "valid").length,
            0,
          );
          const recordCount = group.reduce((n, s) => n + s.data.length, 0);
          return (
            <figure
              key={groupUnit}
              className="min-w-0 space-y-3 border-t border-border pt-4"
              data-slot="telemetry-unit"
            >
              <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">
                  {groupUnit || "无量纲"}{" "}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {validCount} / {recordCount} 个有效读数
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {referenceDomain ? "参考尺度" : "自动尺度"}{" "}
                  {formatAxisNumber(scale.min)}–{formatAxisNumber(scale.max)}
                  {scale.expanded && " · 超界已扩展"}
                </span>
              </figcaption>
              {validCount ? (
                <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2">
                  <div
                    className="relative h-48 text-right text-sm tabular-nums text-muted-foreground"
                    aria-hidden="true"
                  >
                    <span className="invisible">
                      {
                        scale.ticks
                          .map(formatAxisNumber)
                          .sort((a, b) => b.length - a.length)[0]
                      }
                    </span>
                    {scale.ticks.map((tick, i) => (
                      <span
                        key={i}
                        className="absolute right-0 -translate-y-1/2 whitespace-nowrap"
                        style={{ top: `${(y(tick) / 192) * 100}%` }}
                      >
                        {formatAxisNumber(tick)}
                      </span>
                    ))}
                  </div>
                  <svg
                    viewBox="0 0 640 192"
                    preserveAspectRatio="none"
                    className="h-48 w-full touch-pan-y"
                    data-slot="telemetry-plot"
                    role="img"
                    aria-label={`${label} · ${groupUnit || "无量纲"}，${validCount} 个有效读数，范围 ${formatAxisNumber(scale.min)} 至 ${formatAxisNumber(scale.max)}。下方可逐点读取。`}
                    aria-describedby={descriptionId}
                    onPointerDown={(e) => selectNearest(e, group)}
                    onPointerMove={(e) => {
                      if (e.pointerType === "mouse" || e.buttons)
                        selectNearest(e, group);
                    }}
                  >
                    {scale.ticks.map((tick, i) => (
                      <path
                        key={i}
                        d={`M8 ${y(tick)}H632`}
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity={tick === 0 ? ".45" : ".12"}
                        strokeDasharray={tick === 0 ? undefined : "3 6"}
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    {group.map((s) => (
                      <g key={s.id}>
                        {validTarget(s) && (
                          <rect
                            x="8"
                            width="624"
                            y={y(s.target!.high)}
                            height={y(s.target!.low) - y(s.target!.high)}
                            fill={traceColor(s)}
                            fillOpacity=".06"
                            stroke={traceColor(s)}
                            strokeDasharray="3 4"
                            vectorEffect="non-scaling-stroke"
                          />
                        )}
                        {trendSegments(s.data, from, to, maxGapMs).map(
                          (segment, i) =>
                            segment.length === 1 ? (
                              <circle
                                key={i}
                                cx={x(segment[0].timestamp)}
                                cy={y(segment[0].value!)}
                                r="3.5"
                                fill={traceColor(s)}
                              />
                            ) : (
                              <path
                                key={i}
                                data-series={s.id}
                                d={segment
                                  .map(
                                    (p, j) =>
                                      `${j ? "L" : "M"}${x(p.timestamp)},${y(p.value!)}`,
                                  )
                                  .join(" ")}
                                fill="none"
                                stroke={traceColor(s)}
                                strokeWidth="2"
                                strokeDasharray={traceStyles[styleIndex(s)]}
                                vectorEffect="non-scaling-stroke"
                              />
                            ),
                        )}
                        {at !== undefined &&
                          sampleState(exact(s, at)) === "valid" && (
                            <circle
                              cx={x(at)}
                              cy={y(exact(s, at)!.value!)}
                              r="4"
                              fill={traceColor(s)}
                              stroke="var(--card)"
                              strokeWidth="1.5"
                              vectorEffect="non-scaling-stroke"
                            />
                          )}
                        {s.data
                          .filter(
                            (p) =>
                              sampleState(p) === "valid" &&
                              (p.quality === "estimated" ||
                                p.quality === "uncertain"),
                          )
                          .map((p) => (
                            <rect
                              key={p.timestamp}
                              data-quality={p.quality}
                              x={x(p.timestamp) - 4}
                              y={y(p.value!) - 4}
                              width="8"
                              height="8"
                              fill="var(--card)"
                              stroke={traceColor(s)}
                              strokeWidth="2"
                              vectorEffect="non-scaling-stroke"
                              transform={
                                p.quality === "uncertain"
                                  ? `rotate(45 ${x(p.timestamp)} ${y(p.value!)})`
                                  : undefined
                              }
                            />
                          ))}
                      </g>
                    ))}
                    {inWindowEvents.map((e) => (
                      <path
                        key={e.id}
                        d={`M${x(e.at)} 8V184`}
                        stroke="var(--warning-text)"
                        strokeDasharray="2 4"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    {at !== undefined && (
                      <path
                        d={`M${x(at)} 8V184`}
                        stroke="currentColor"
                        strokeOpacity=".5"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </svg>
                  <div className="col-start-2 flex flex-wrap justify-between gap-2 text-sm tabular-nums text-muted-foreground">
                    <span>{telemetryTime(from, timeZone)}</span>
                    <span>至 {telemetryTime(to, timeZone)}</span>
                    <span className="w-full">{timeZone}</span>
                  </div>
                </div>
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
            <span className="font-medium">逐点读数</span>
            <span className="text-muted-foreground">
              指向或轻触图形 · 方向键逐点查看
            </span>
          </div>
          <div className="grid grid-cols-2 items-center gap-3 @sm:flex">
            <Button
              size="sm"
              variant="secondary"
              className="min-h-10"
              aria-label="上一个采样"
              disabled={selectedIndex <= 0}
              onClick={() => setCursorAt(visibleTimes[selectedIndex - 1])}
            >
              上一点
            </Button>
            <div className="col-span-2 row-start-1 min-w-0 flex-1">
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
            <Button
              size="sm"
              variant="secondary"
              className="min-h-10"
              aria-label="下一个采样"
              disabled={
                selectedIndex < 0 || selectedIndex >= visibleTimes.length - 1
              }
              onClick={() => setCursorAt(visibleTimes[selectedIndex + 1])}
            >
              下一点
            </Button>
          </div>
          <div
            className="surface-inset space-y-3 p-4 text-sm tabular-nums"
            data-slot="telemetry-readout"
          >
            {at === undefined ? (
              <div className="flex flex-wrap items-center gap-3">
                <p>所选采样不在当前窗口或可见序列内。</p>
                <Button variant="outline" onClick={() => setCursorAt(null)}>
                  返回最新采样
                </Button>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">
                  实际采样时刻 · {telemetryTime(at, timeZone)} {timeZone}
                </p>
                <dl className="grid gap-3 @lg:grid-cols-2">
                  {visible.map((s) => (
                    <div key={s.id} className="min-w-0 space-y-1 wrap-anywhere">
                      <dt className="text-muted-foreground">
                        {s.label}
                        {s.kind && ` · ${kindLabels[s.kind]}`}
                      </dt>
                      <dd className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="max-w-full overflow-x-auto whitespace-nowrap text-base font-medium">
                          {formatTelemetrySample(exact(s, at), s.precision)}
                          {sampleState(exact(s, at)) === "valid" &&
                            ` ${s.unit}`}
                        </span>
                        {exact(s, at) && (
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
