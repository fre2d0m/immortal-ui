import { Panel } from "@/components/iot/internal/panel";
import { Gauge } from "lucide-react";
import {
  formatTelemetryNumber,
  linearPosition,
  validDomain,
} from "@/lib/telemetry";

/** A position on a range, not a filled magnitude or a health judgement. */
export function RangeGauge({
  label,
  value,
  min = 0,
  max = 100,
  unit = "%",
  precision = 1,
  target,
  className,
  embedded = false,
  showValue = true,
}: {
  label: string;
  value: number | null;
  min?: number;
  max?: number;
  unit?: string;
  precision?: number;
  target?: { low: number; high: number };
  className?: string;
  embedded?: boolean;
  showValue?: boolean;
}) {
  const rangeValid = validDomain({ min, max });
  const available = value !== null && Number.isFinite(value);
  const targetValid =
    rangeValid &&
    target &&
    validDomain({ min: target.low, max: target.high }) &&
    target.low >= min &&
    target.high <= max;
  const outsideRange = available && rangeValid && (value < min || value > max);
  const position = !available
    ? value === null
      ? "无读数"
      : "读数无效"
    : !rangeValid
      ? "量程配置无效"
      : value < min
        ? "低于量程"
        : value > max
          ? "高于量程"
          : targetValid
            ? value < target.low
              ? "低于目标"
              : value > target.high
                ? "高于目标"
                : "目标内"
            : "量程内";
  const format = (v: number) => formatTelemetryNumber(v, precision);
  const content = (
    <figure
      data-slot="metric-range"
      className={`min-w-0 space-y-3 ${embedded ? (className ?? "") : ""}`}
      aria-label={`${label}，当前 ${available ? `${format(value)} ${unit}` : position}，量程 ${format(min)} 至 ${format(max)} ${unit}${targetValid ? `，目标 ${format(target.low)} 至 ${format(target.high)} ${unit}` : ""}，${position}`}
    >
      {showValue && (
        <p className="flex flex-wrap items-baseline gap-2 tabular-nums">
          <span className="max-w-full overflow-x-auto whitespace-nowrap text-4xl font-medium">
            {available ? format(value) : "—"}
          </span>
          <span className="text-muted-foreground">{unit}</span>
        </p>
      )}
      {rangeValid && (
        <>
          <div aria-hidden="true" className="relative mx-2 h-7">
            <div className="absolute inset-x-0 top-3 border-t-2 border-muted-foreground" />
            <span className="absolute left-0 top-2 h-3 border-l border-muted-foreground" />
            <span className="absolute right-0 top-2 h-3 border-r border-muted-foreground" />
            {targetValid && (
              <div
                className="absolute top-2 h-2.5 border border-foreground bg-muted"
                style={{
                  left: `${linearPosition(target.low, min, max) * 100}%`,
                  width: `${(linearPosition(target.high, min, max) - linearPosition(target.low, min, max)) * 100}%`,
                }}
              />
            )}
            {available && (
              <span
                data-slot="range-position"
                className={`absolute top-0.5 h-6 -translate-x-1/2 border-l-[3px] ${outsideRange ? "border-warning-text" : "border-foreground"}`}
                style={{
                  left: `${Math.max(0, Math.min(1, linearPosition(value, min, max))) * 100}%`,
                }}
              >
                {outsideRange && (
                  <span className="absolute -top-0.5 -translate-x-1/2 bg-card text-sm text-warning-text">
                    {value < min ? "◀" : "▶"}
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-sm tabular-nums text-muted-foreground">
            <span>
              {format(min)} {unit}
            </span>
            <span>
              {format(max)} {unit}
            </span>
          </div>
        </>
      )}
      <figcaption className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {targetValid && (
          <span>
            方框 · 目标 {format(target.low)}–{format(target.high)} {unit}
          </span>
        )}
        <span
          className={outsideRange || !rangeValid ? "text-warning-text" : ""}
        >
          {available && rangeValid ? "竖线 · " : ""}
          {position}
          {outsideRange && ` ${format(value)} ${unit}`}
        </span>
        {!!target && !targetValid && (
          <span className="w-full text-warning-text">
            目标区间无效或超出量程，未绘制目标。
          </span>
        )}
      </figcaption>
    </figure>
  );
  return embedded ? (
    content
  ) : (
    <Panel icon={<Gauge />} title={label} className={className}>
      {content}
    </Panel>
  );
}
