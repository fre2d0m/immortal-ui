import { cn } from "cn";
import {
  qualityLabels,
  sampleAge,
  timeLabel,
  type Quality,
} from "@/lib/iot-model";
export type MeasurementTrust = {
  quality?: Quality;
  sampledAt?: number | null;
  receivedAt?: number | null;
  now?: number;
  expectedInterval?: number;
  source?: string;
  reason?: string;
};
/** Caller owns the clock: deterministic in SSR, tests and historical inspections. */
export function DataFreshness({
  ageSeconds,
  staleAfter = 60,
  offline = false,
  className,
  quality = "unknown",
  sampledAt,
  receivedAt,
  now,
  expectedInterval,
  source,
  reason,
  detailed = false,
}: MeasurementTrust & {
  ageSeconds?: number | null;
  staleAfter?: number;
  offline?: boolean;
  className?: string;
  detailed?: boolean;
}) {
  const age =
    now !== undefined && sampledAt !== undefined
      ? sampleAge(now, sampledAt)
      : (ageSeconds ?? null);
  const known = age !== null && Number.isFinite(age) && age >= 0;
  const threshold =
    expectedInterval != null &&
    Number.isFinite(expectedInterval) &&
    expectedInterval > 0
      ? expectedInterval * 2
      : staleAfter;
  const stale =
    known && Number.isFinite(threshold) && threshold >= 0 && age > threshold;
  const duration = !known
    ? "采样时间未知"
    : age < 60
      ? `${Math.floor(age)} 秒前`
      : age < 3600
        ? `${Math.floor(age / 60)} 分钟前`
        : `${Math.floor(age / 3600)} 小时前`;
  const temporal = offline
    ? "离线快照"
    : !known
      ? "时效未知"
      : stale
        ? "已陈旧"
        : "新鲜";
  const summary = (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm tabular-nums",
        className,
      )}
    >
      <span
        className={
          quality === "bad"
            ? "text-destructive"
            : quality !== "good"
              ? "text-warning-text"
              : "text-muted-foreground"
        }
      >
        {qualityLabels[quality]}
      </span>
      <span aria-hidden="true" className="text-muted-foreground">
        ·
      </span>
      <span
        className={offline || stale ? "text-warning-text" : "text-muted-foreground"}
      >
        {temporal} · {duration}
      </span>
    </span>
  );
  if (!detailed) return summary;
  return (
    <div className={cn("space-y-4", className)}>
      {summary}
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        {[
          ["采样时间", timeLabel(sampledAt) + " · UTC"],
          ["接收时间", timeLabel(receivedAt) + " · UTC"],
          [
            "预期采样间隔",
            expectedInterval != null && expectedInterval > 0
              ? `${expectedInterval} 秒`
              : "未提供",
          ],
          ["数据来源", source || "未提供"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
      <p className="text-sm text-muted-foreground">
        质量由数据源报告；时效依据采样时间计算。离线不等于历史值无效。
      </p>
    </div>
  );
}
