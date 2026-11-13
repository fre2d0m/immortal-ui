import { Panel } from "@/components/iot/internal/panel";

import { Activity } from "lucide-react";

import type { DeviceState } from "@/components/iot/device-status";
import {
  TelemetryChart,
  type TelemetryPoint,
} from "@/components/iot/telemetry-chart";
import {
  DataFreshness,
  type MeasurementTrust,
} from "@/components/iot/data-freshness";
import { qualityLabels } from "@/lib/iot-model";
export function TelemetryCard({
  label,
  value,
  unit,
  description,
  state = "online",
  data,
  loading = false,
  precision = 1,
  ageSeconds,
  className,
  range,
  measurementId,
  source,
  quality = "unknown",
  sampledAt,
  receivedAt,
  now,
  expectedInterval,
  reason,
}: MeasurementTrust & {
  label: string;
  value: number | null;
  unit: string;
  description?: string;
  state?: DeviceState;
  data?: TelemetryPoint[];
  loading?: boolean;
  precision?: number;
  ageSeconds?: number | null;
  className?: string;
  range?: { min: number; max: number };
  measurementId?: string;
}) {
  const available =
    value !== null && Number.isFinite(value) && quality !== "bad";
  const digits = Number.isFinite(precision)
    ? Math.max(0, Math.min(6, Math.trunc(precision)))
    : 1;
  const outside =
    available && range && (value < range.min || value > range.max);
  return (
    <Panel
      icon={<Activity />}
      title={label}
      description={measurementId}
      status={loading ? "读取中" : state === "offline" ? "离线快照" : undefined}
      className={className}
      aria-busy={loading}
    >
      <div className="surface-inset space-y-4 p-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums">
          <span className="text-4xl font-medium tracking-tight">
            {loading
              ? "···"
              : available
                ? value.toLocaleString("en-US", {
                    minimumFractionDigits: digits,
                    maximumFractionDigits: digits,
                  })
                : "—"}
          </span>
          <span className="text-sm text-muted-foreground break-all">
            {unit}
          </span>
        </div>
        <p
          className={
            outside ? "text-sm text-warning" : "text-sm text-muted-foreground"
          }
        >
          {loading
            ? "正在读取测量值"
            : quality === "bad"
              ? "无效测量 · 不用于当前判断"
              : !available
                ? "尚无有效读数"
                : outside
                  ? `超出量程 ${range!.min}–${range!.max} ${unit}`
                  : state === "offline"
                    ? "最后有效快照 · 非当前实时值"
                    : description || `${qualityLabels[quality]}测量`}
        </p>
        <DataFreshness
          ageSeconds={ageSeconds}
          quality={quality}
          offline={state === "offline"}
          sampledAt={sampledAt}
          receivedAt={receivedAt}
          now={now}
          expectedInterval={expectedInterval}
        />
        {(source || reason) && (
          <p className="text-sm text-muted-foreground break-words">
            {source}
            {source && reason && " · "}
            {reason}
          </p>
        )}
        {data && !loading && (
          <TelemetryChart
            embedded
            data={data}
            label={label}
            unit={unit}
            precision={precision}
            maxGapMs={expectedInterval ? expectedInterval * 1000 : undefined}
            showTable={false}
            className="pt-2"
          />
        )}
      </div>
    </Panel>
  );
}
