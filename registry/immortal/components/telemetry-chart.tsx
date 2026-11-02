"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "cn";
import { createTelemetryGeometry, type TelemetryPoint } from "@/lib/telemetry";
export type { TelemetryPoint } from "@/lib/telemetry";

export function TelemetryChart({
  data,
  label,
  unit = "",
  className,
  showTable = true,
}: {
  data: TelemetryPoint[];
  label: string;
  unit?: string;
  className?: string;
  showTable?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const { segments } = useMemo(() => createTelemetryGeometry(data), [data]);
  const [active, setActive] = useState<TelemetryPoint | null>(null);
  const time = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  const points = segments.flat();
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-3 flex min-h-5 items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums" aria-live="polite">
          {active
            ? `${time(active.timestamp)} · ${active.value} ${unit}`
            : "UTC"}
        </span>
      </div>
      {!points.length ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No telemetry available
        </div>
      ) : (
        <svg
          viewBox="0 0 640 160"
          className="h-40 w-full overflow-visible"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${label}. ${points.length} readings. Missing samples appear as gaps.`}
          onMouseLeave={() => setActive(null)}
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity=".2" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 60, 100, 140].map((y) => (
            <path
              key={y}
              d={`M0 ${y}H640`}
              stroke="currentColor"
              className="text-foreground/8"
              strokeDasharray="2 6"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {segments.map((segment, index) => {
            const d = segment
              .map(({ x, y }, i) => `${i ? "L" : "M"}${x},${y}`)
              .join(" ");
            return (
              <g key={index}>
                <path
                  d={`${d} L${segment.at(-1)!.x},160 L${segment[0].x},160 Z`}
                  fill={`url(#${id})`}
                />
                <path
                  d={d}
                  fill="none"
                  stroke="var(--chart-1)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                {segment.length === 1 && (
                  <circle
                    cx={segment[0].x}
                    cy={segment[0].y}
                    r="3"
                    fill="var(--chart-1)"
                  />
                )}
              </g>
            );
          })}
          {points.map(({ x, y, point }, i) => (
            <g key={i}>
              <rect
                x={Math.max(0, x - 10)}
                y="0"
                width="20"
                height="160"
                fill="transparent"
                onMouseEnter={() => setActive(point)}
              >
                <title>{`${time(point.timestamp)}: ${point.value} ${unit}`}</title>
              </rect>
              {active === point && (
                <circle cx={x} cy={y} r="3.5" fill="var(--foreground)" />
              )}
            </g>
          ))}
        </svg>
      )}
      {points.length > 0 && (
        <div className="mt-3 flex justify-between text-[11px] tabular-nums text-muted-foreground">
          <span>{time(points[0].point.timestamp)}</span>
          <span>{time(points.at(-1)!.point.timestamp)}</span>
        </div>
      )}
      {showTable && (
        <details className="mt-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer py-2">View readings</summary>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-left tabular-nums">
              <caption className="sr-only">{label} readings, UTC</caption>
              <thead>
                <tr>
                  <th className="py-2">Time (UTC)</th>
                  <th>Value {unit && `(${unit})`}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p, i) => (
                  <tr key={i}>
                    <td className="py-1.5">
                      {Number.isFinite(p.timestamp) ? time(p.timestamp) : "—"}
                    </td>
                    <td>
                      {p.value !== null && Number.isFinite(p.value)
                        ? p.value
                        : "Unavailable"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
