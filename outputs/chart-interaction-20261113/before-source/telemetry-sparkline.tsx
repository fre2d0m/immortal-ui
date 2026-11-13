import {
  createTelemetryGeometry,
  formatAxisNumber,
  formatTelemetryNumber,
  telemetryWindowLabel,
  validDomain,
  validTimestamp,
  type NumericDomain,
  type TelemetryPoint,
  type TelemetryWindow,
} from "@/lib/telemetry";

export type TrendHistory = {
  points: TelemetryPoint[];
  /** Name the record type: observations, aggregates, estimates or predictions. */
  label: string;
  maxGapMs?: number;
  window?: TelemetryWindow;
  /** Use the same domain for adjacent, comparable sparklines. */
  domain?: NumericDomain;
};

/** Overview only; the same renderer is used by cards and catalog thumbnails. */
export function TelemetrySparkline({
  history,
  label,
  unit,
  precision = 1,
  compact = false,
}: {
  history: TrendHistory;
  label: string;
  unit: string;
  precision?: number;
  compact?: boolean;
}) {
  if (
    history.window &&
    (!validTimestamp(history.window.from) ||
      !validTimestamp(history.window.to) ||
      history.window.to < history.window.from)
  )
    return <p className="text-sm text-warning-text">历史时间窗口无效</p>;
  if (
    history.points.length &&
    !history.points.some((p) => validTimestamp(p.timestamp))
  )
    return <p className="text-sm text-warning-text">历史记录的时间均无效</p>;
  const geometry = createTelemetryGeometry(history.points, 400, 64, history);
  const { segments, min, max, from, to, hasGaps, dataMin, dataMax } = geometry;
  if (!segments.length)
    return (
      <p className="py-5 text-sm text-muted-foreground">
        {geometry.samples.length ? "历史记录均缺测或无效" : "暂无历史记录"}
      </p>
    );
  const count = segments.reduce((n, segment) => n + segment.length, 0);
  return (
    <figure className="space-y-2" data-slot="metric-trend">
      <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
        <span>趋势概览 · {unit || "无量纲"}</span>
        <span>
          {validDomain(history.domain) ? "参考尺度" : "独立自动尺度"}{" "}
          {formatAxisNumber(min)}–{formatAxisNumber(max)}
        </span>
      </div>
      <svg
        viewBox="-4 0 408 80"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}，${count} 个有效点，最低 ${formatTelemetryNumber(dataMin, precision)}，最高 ${formatTelemetryNumber(dataMax, precision)} ${unit}。${hasGaps ? "含缺测，断线不插值。" : ""}仅用于概览。`}
        className={`${compact ? "h-20" : "h-28"} block w-full text-chart-1`}
        data-slot="telemetry-plot"
      >
        {[8, 72].map((y) => (
          <path
            key={y}
            d={`M0 ${y}H400`}
            fill="none"
            stroke="currentColor"
            strokeOpacity=".12"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {segments.map((segment, i) =>
          segment.length === 1 ? (
            <circle
              key={i}
              cx={segment[0].x}
              cy={segment[0].y + 8}
              r="3"
              fill="currentColor"
            />
          ) : (
            <polyline
              key={i}
              points={segment.map((p) => `${p.x},${p.y + 8}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          ),
        )}
        {segments
          .flat()
          .filter(
            (p) =>
              p.point.quality === "estimated" ||
              p.point.quality === "uncertain",
          )
          .map((p) => (
            <rect
              key={p.point.timestamp}
              x={p.x - 3}
              y={p.y + 5}
              width="6"
              height="6"
              fill="var(--card)"
              stroke="currentColor"
              vectorEffect="non-scaling-stroke"
              transform={
                p.point.quality === "uncertain"
                  ? `rotate(45 ${p.x} ${p.y + 8})`
                  : undefined
              }
            />
          ))}
      </svg>
      <p className="text-sm tabular-nums text-muted-foreground">
        {telemetryWindowLabel(from, to)}
      </p>
      {history.domain && !validDomain(history.domain) && (
        <p className="text-sm text-warning-text">
          参考尺度无效，已使用自动尺度。
        </p>
      )}
      <figcaption
        className={
          compact
            ? "sr-only"
            : "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground"
        }
      >
        <span>
          最低 {formatTelemetryNumber(dataMin, precision)} · 最高{" "}
          {formatTelemetryNumber(dataMax, precision)} {unit}
        </span>
        {hasGaps && <span>含缺测</span>}
        {geometry.samples.some((p) => p.quality === "estimated") && (
          <span>□ 估算</span>
        )}
        {geometry.samples.some((p) => p.quality === "uncertain") && (
          <span>◇ 存疑</span>
        )}
        {geometry.expanded && <span>超出参考尺度，已扩展</span>}
      </figcaption>
      {!compact && (
        <details className="text-sm text-muted-foreground">
          <summary className="min-h-10 cursor-pointer py-2">趋势口径</summary>
          <p className="pb-2">
            {history.label}
            。仅用于概览，断线表示缺测、无效或超过来源规定的采样间隔；精确样本请进入历史查询。
          </p>
        </details>
      )}
    </figure>
  );
}
