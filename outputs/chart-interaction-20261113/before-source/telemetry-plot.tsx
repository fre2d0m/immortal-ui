"use client";

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
}) {
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
  const select = (state: { activeLabel?: string | number }) => {
    const selected = Number(state.activeLabel);
    if (Number.isFinite(selected) && times.includes(selected))
      onSelect(selected);
  };
  const point = (s: TrendSeries): TelemetryPoint | undefined =>
    s.data.find((p) => p.timestamp === at);
  return (
    <div
      data-slot="telemetry-plot"
      className="h-56 min-w-0 w-full touch-pan-y @lg:h-64 @3xl:h-72"
      role="img"
      aria-label={label}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 600, height: 256 }}
      >
        <LineChart
          data={data}
          margin={{ top: 16, right: 16, bottom: 4, left: 0 }}
          accessibilityLayer={false}
          onMouseMove={select}
          onClick={select}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeOpacity={0.75}
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
                  strokeWidth={2}
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
              at !== undefined && sampleState(selected) === "valid" ? (
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
              stroke="var(--warning-text)"
              strokeDasharray="3 5"
              strokeOpacity={0.8}
            />
          ))}
          {at !== undefined && (
            <ReferenceLine
              x={at}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.7}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
