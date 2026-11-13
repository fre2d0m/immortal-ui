"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatAxisNumber,
  formatTelemetrySample,
  qualityLabel,
  linearPosition,
  sampleState,
  trendSegments,
  validDomain,
  validTimestamp,
  telemetryTime,
  type TelemetryPoint,
} from "@/lib/telemetry";
import type { TrendSeries } from "@/components/iot/telemetry-chart";

import {
  traceStyles,
  seriesStyleIndex,
  traceColor,
} from "@/components/iot/internal/telemetry-series-style";

/** Recharts owns axes, layout and SVG sizing. Record semantics remain in telemetry.ts. */
export function TelemetryPlot({
  label,
  series,
  from,
  to,
  timeZone,
  scale,
  at,
  maxGapMs,
  events,
  onSelect,
  emphasizedSeries,
}: {
  label: string;
  series: TrendSeries[];
  from: number;
  to: number;
  timeZone: string;
  scale: { min: number; max: number; ticks: number[] };
  at?: number;
  maxGapMs?: number;
  events: { id: string; at: number; label: string }[];
  onSelect: (at: number) => void;
  emphasizedSeries?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const [opened, setOpened] = useState(false);
  const [pinned, setPinned] = useState(false);
  const dismissed = useRef(false);
  const close = () => {
    setOpened(false);
    setPinned(false);
    dismissed.current = true;
  };
  useEffect(() => {
    if (!opened) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [opened]);
  const times = [
    ...new Set(series.flatMap((s) => s.data.map((p) => p.timestamp))),
  ].sort((a, b) => a - b);
  const data = times.map((timestamp) => ({ timestamp }));
  // Normalized Y avoids overflow for valid, extreme finite input; labels retain original values.
  const y = (value: number) => linearPosition(value, scale.min, scale.max);
  const ticks = scale.ticks.map((value) => ({ value, position: y(value) }));
  const axisFrom = from === to ? Math.max(-8.64e15, from - 30_000) : from;
  const axisTo = from === to ? Math.min(8.64e15, to + 30_000) : to;
  const timeTicks = Array.from(
    { length: 5 },
    (_, i) => axisFrom + ((axisTo - axisFrom) * i) / 4,
  );
  const timeLabel = (value: number) => {
    if (!validTimestamp(value)) return "";
    const formatted = telemetryTime(value, timeZone);
    return to - from >= 86_400_000
      ? formatted.slice(5, 16)
      : to - from < 120_000
        ? formatted.slice(11)
        : formatted.slice(11, 16);
  };
  const select = (state: { activeLabel?: string | number }, pin = false) => {
    if (!pin && (pinned || dismissed.current)) return;
    const selected = Number(state.activeLabel);
    if (Number.isFinite(selected) && times.includes(selected)) {
      onSelect(selected);
      setOpened(true);
      if (pin) {
        root.current?.focus({ preventScroll: true });
        setPinned(true);
        dismissed.current = false;
      }
    }
  };
  const point = (s: TrendSeries): TelemetryPoint | undefined =>
    s.data.find((p) => p.timestamp === at);
  return (
    <div
      ref={root}
      data-slot="telemetry-plot"
      data-interactive=""
      className="relative min-w-0 w-full rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      role="group"
      aria-roledescription="交互折线图"
      tabIndex={0}
      aria-label={label}
      aria-describedby={opened && at !== undefined ? tooltipId : undefined}
      onFocus={(event) => {
        if (event.target === event.currentTarget) {
          dismissed.current = false;
          setOpened(true);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget) && !pinned)
          setOpened(false);
      }}
      onMouseEnter={() => {
        dismissed.current = false;
      }}
      onMouseLeave={() => {
        dismissed.current = false;
        if (!pinned && !root.current?.contains(document.activeElement))
          setOpened(false);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const index = at === undefined ? times.length - 1 : times.indexOf(at);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? times.length - 1
              : event.key === "ArrowLeft"
                ? Math.max(0, index - 1)
                : event.key === "ArrowRight"
                  ? Math.min(times.length - 1, index + 1)
                  : -1;
        if (next >= 0) {
          event.preventDefault();
          onSelect(times[next]);
          dismissed.current = false;
          setOpened(true);
        }
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          dismissed.current = false;
          setOpened(true);
          setPinned(true);
        }
      }}
    >
      <div
        className="h-64 touch-pan-y @lg:h-72 @3xl:h-80"
        onMouseDown={(event) => {
          event.preventDefault();
          root.current?.focus({ preventScroll: true });
        }}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 600, height: 256 }}
        >
          <LineChart
            data={data}
            margin={{ top: 16, right: 12, bottom: 4, left: 0 }}
            accessibilityLayer={false}
            onMouseMove={(state) => select(state)}
            onClick={(state) => select(state, true)}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeOpacity={0.55}
              strokeDasharray="3 5"
            />
            <XAxis
              type="number"
              dataKey="timestamp"
              scale="time"
              domain={[axisFrom, axisTo]}
              ticks={timeTicks}
              minTickGap={44}
              tickFormatter={timeLabel}
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)", fontSize: "0.75rem" }}
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              height={36}
            />
            <YAxis
              type="number"
              domain={[0, 1]}
              ticks={ticks.map((t) => t.position)}
              width="auto"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fill: "var(--muted-foreground)", fontSize: "0.75rem" }}
              tickFormatter={(position) =>
                formatAxisNumber(
                  ticks.reduce((best, t) =>
                    Math.abs(t.position - position) <
                    Math.abs(best.position - position)
                      ? t
                      : best,
                  ).value,
                )
              }
            />
            <Tooltip
              content={() => null}
              cursor={false}
              isAnimationActive={false}
            />
            {scale.min <= 0 && scale.max >= 0 && (
              <ReferenceLine
                y={y(0)}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.65}
              />
            )}
            {series.flatMap((s) => {
              const color = traceColor(s);
              const segments = trendSegments(s.data, from, to, maxGapMs);
              const selected = point(s);
              return [
                s.target &&
                validDomain({ min: s.target.low, max: s.target.high }) ? (
                  <ReferenceArea
                    key={`${s.id}-target`}
                    y1={y(s.target.low)}
                    y2={y(s.target.high)}
                    fill={color}
                    fillOpacity={0.05}
                    stroke={color}
                    strokeOpacity={0.4}
                    strokeDasharray="3 4"
                  />
                ) : null,
                ...segments.map((segment, i) => (
                  <Line
                    key={`${s.id}-${i}`}
                    name={s.label}
                    data={segment.map((p) => ({
                      timestamp: p.timestamp,
                      value: y(p.value!),
                    }))}
                    dataKey="value"
                    type="linear"
                    stroke={color}
                    strokeWidth={emphasizedSeries === s.id ? 3 : 2.5}
                    strokeOpacity={
                      emphasizedSeries && emphasizedSeries !== s.id ? 0.25 : 1
                    }
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={traceStyles[seriesStyleIndex(s)]}
                    connectNulls={false}
                    dot={
                      segment.length === 1
                        ? {
                            r: 3.5,
                            fill: color,
                            stroke: "var(--card)",
                            strokeWidth: 1.5,
                          }
                        : false
                    }
                    activeDot={false}
                    isAnimationActive={false}
                    className={`telemetry-series-${seriesStyleIndex(s)}`}
                  />
                )),
                ...s.data
                  .filter(
                    (p) =>
                      sampleState(p) === "valid" &&
                      (p.quality === "estimated" || p.quality === "uncertain"),
                  )
                  .map((p) => (
                    <ReferenceDot
                      key={`${s.id}-quality-${p.timestamp}`}
                      x={p.timestamp}
                      y={y(p.value!)}
                      shape={({ cx, cy }: { cx?: number; cy?: number }) => (
                        <rect
                          data-quality={p.quality}
                          x={(cx ?? 0) - 3.5}
                          y={(cy ?? 0) - 3.5}
                          width={7}
                          height={7}
                          fill="var(--card)"
                          stroke={color}
                          strokeWidth={1.75}
                          transform={
                            p.quality === "uncertain"
                              ? `rotate(45 ${cx} ${cy})`
                              : undefined
                          }
                        />
                      )}
                    />
                  )),
                opened &&
                at !== undefined &&
                sampleState(selected) === "valid" ? (
                  <ReferenceDot
                    key={`${s.id}-selected`}
                    x={at}
                    y={y(selected!.value!)}
                    r={
                      selected?.quality === "estimated" ||
                      selected?.quality === "uncertain"
                        ? 7
                        : 4
                    }
                    fill={
                      selected?.quality === "estimated" ||
                      selected?.quality === "uncertain"
                        ? "none"
                        : color
                    }
                    stroke={
                      selected?.quality === "estimated" ||
                      selected?.quality === "uncertain"
                        ? color
                        : "var(--card)"
                    }
                    strokeWidth={1.5}
                  />
                ) : null,
              ];
            })}
            {events.map((event) => (
              <ReferenceLine
                key={event.id}
                x={event.at}
                stroke="var(--muted-foreground)"
                strokeDasharray="2 5"
                strokeOpacity={0.65}
                label={{
                  value: "◆",
                  className: "telemetry-event-label",
                  position: "insideTop",
                  fill: "var(--muted-foreground)",
                  fontSize: 9,
                }}
              />
            ))}
            {opened && at !== undefined && (
              <ReferenceLine
                x={at}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.75}
                strokeDasharray="3 4"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {opened && at !== undefined && (
        <div
          id={tooltipId}
          data-slot="telemetry-tooltip"
          data-side={
            linearPosition(at, axisFrom, axisTo) > 0.5 ? "left" : "right"
          }
          role="dialog"
          aria-label="采样详情"
          aria-modal="false"
          className="absolute top-3 z-10 w-72 max-w-[calc(100%-24px)] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="mb-3 flex min-w-0 items-start gap-2">
            <p className="min-w-0 flex-1 text-sm tabular-nums">
              <span className="block font-medium">
                {telemetryTime(at, timeZone).slice(0, 10)}
              </span>
              <span className="text-muted-foreground">
                {telemetryTime(at, timeZone).slice(11)} {timeZone}
              </span>
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-2 size-10 shrink-0"
              aria-label="关闭采样详情"
              onClick={close}
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <dl className="space-y-3 text-sm tabular-nums">
            {series.map((s) => {
              const sample = point(s);
              return (
                <div
                  key={s.id}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1"
                >
                  <dt className="flex min-w-0 items-start gap-2 wrap-anywhere">
                    <svg
                      width="20"
                      height="18"
                      viewBox="0 0 20 18"
                      className="shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M1 9H19"
                        stroke={traceColor(s)}
                        strokeWidth="2.5"
                        strokeDasharray={traceStyles[seriesStyleIndex(s)]}
                      />
                    </svg>
                    {s.label}
                  </dt>
                  <dd className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap text-right font-medium leading-relaxed">
                    {formatTelemetrySample(sample, s.precision)}
                    {sampleState(sample) === "valid" && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        {s.unit}
                      </span>
                    )}
                  </dd>
                  {(sample?.quality || sample?.qualityReason) && (
                    <dd className="col-span-2 pl-7 text-xs text-muted-foreground">
                      {qualityLabel(sample)}
                      {sample.qualityReason && ` · ${sample.qualityReason}`}
                    </dd>
                  )}
                </div>
              );
            })}
          </dl>
        </div>
      )}
    </div>
  );
}
