export type TelemetryPoint = {
  timestamp: number;
  value: number | null;
  /** Quality is supplied by the source; absence does not imply good quality. */
  quality?: "good" | "uncertain" | "estimated" | "bad";
  qualityReason?: string;
};
export type NumericDomain = { min: number; max: number };
export type TelemetryWindow = { from: number; to: number };

export const validTimestamp = (at: number) =>
  Number.isFinite(at) && Math.abs(at) <= 8.64e15;
export const validDomain = (domain?: NumericDomain): domain is NumericDomain =>
  !!domain &&
  Number.isFinite(domain.min) &&
  Number.isFinite(domain.max) &&
  domain.min < domain.max;
export function sampleState(point?: TelemetryPoint) {
  if (!point) return "absent";
  if (
    point.quality === "bad" ||
    (point.value !== null && !Number.isFinite(point.value))
  )
    return "invalid";
  return point.value === null ? "missing" : "valid";
}
export function qualityLabel(point?: TelemetryPoint) {
  const labels = {
    good: "有效",
    uncertain: "存疑",
    estimated: "估算",
    bad: "无效",
  };
  return point?.quality
    ? labels[point.quality] +
        (point.qualityReason ? ` · ${point.qualityReason}` : "")
    : "未提供质量";
}
/** Shared contract: inclusive window; sort by time; last received duplicate wins. */
export function normalizeTelemetry(
  points: TelemetryPoint[],
  from = -8.64e15,
  to = 8.64e15,
) {
  return [
    ...new Map(
      points
        .filter(
          (p) =>
            validTimestamp(p.timestamp) &&
            p.timestamp >= from &&
            p.timestamp <= to,
        )
        .map((p) => [p.timestamp, p]),
    ).values(),
  ].sort((a, b) => a.timestamp - b.timestamp);
}

/** Missing/invalid readings and caller-defined elapsed gaps split the line. */
export function trendSegments(
  points: TelemetryPoint[],
  from: number,
  to: number,
  maxGapMs = Infinity,
) {
  const segments: TelemetryPoint[][] = [];
  let current: TelemetryPoint[] = [];
  const gap = maxGapMs > 0 ? maxGapMs : Infinity;
  for (const point of normalizeTelemetry(points, from, to)) {
    const valid = sampleState(point) === "valid";
    if (
      !valid ||
      (current.length > 0 && point.timestamp - current.at(-1)!.timestamp > gap)
    ) {
      if (current.length) segments.push(current);
      current = [];
    }
    if (valid) current.push(point);
  }
  if (current.length) segments.push(current);
  return segments;
}

/** Divide before subtracting to keep even very large finite values drawable. */
export function linearPosition(value: number, min: number, max: number) {
  if (min === max) return 0.5;
  if (Number.isFinite(max - min) && Number.isFinite(value - min))
    return (value - min) / (max - min);
  const magnitude = Math.max(Math.abs(min), Math.abs(max), Number.MIN_VALUE);
  return (
    (value / magnitude - min / magnitude) / (max / magnitude - min / magnitude)
  );
}

/** A declared domain is a reference, never a reason to silently clip observations. */
export function numericScale(
  values: number[],
  domain?: NumericDomain,
  zeroBaseline = false,
) {
  const finite = values.filter(Number.isFinite);
  let low = validDomain(domain) ? domain.min : (finite[0] ?? 0);
  let high = validDomain(domain) ? domain.max : (finite[0] ?? 1);
  for (const value of finite) {
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  if (zeroBaseline) {
    low = Math.min(0, low);
    high = Math.max(0, high);
  }
  if (zeroBaseline && low === 0 && high === 0) high = 1;
  if ((!validDomain(domain) && !zeroBaseline) || low === high) {
    const magnitude = Math.max(Math.abs(low), Math.abs(high));
    const spread = magnitude
      ? (high / magnitude - low / magnitude) * magnitude
      : 0;
    const padding = Math.max(
      Number.isFinite(spread) ? spread * 0.08 : magnitude * 0.08,
      magnitude * 0.01,
      low === high ? magnitude * 0.05 || 1 : Number.MIN_VALUE,
    );
    low = Number.isFinite(low - padding) ? low - padding : low;
    high = Number.isFinite(high + padding) ? high + padding : high;
  }
  let ticks = Array.from(
    { length: 5 },
    (_, i) => high * (1 - i / 4) + low * (i / 4),
  );
  const span = high - low;
  const magnitude = 10 ** Math.floor(Math.log10(span / 4));
  const step = [1, 2, 2.5, 5, 10]
    .map((n) => n * magnitude)
    .find((n) => n >= span / 4);
  if (step && Number.isFinite(span) && span / step <= 8) {
    const first = Math.ceil(low / step);
    const inside = Array.from(
      { length: Math.max(0, Math.floor(high / step) - first + 1) },
      (_, i) => (first + i) * step,
    ).filter((n) => n > low && n < high);
    ticks = [high, ...inside.reverse(), low];
  }
  return {
    min: low,
    max: high,
    ticks,
    expanded: validDomain(domain) && (low < domain.min || high > domain.max),
  };
}

export function formatTelemetryNumber(value: number, precision = 2) {
  if (!Number.isFinite(value)) return "无效";
  const digits = Number.isFinite(precision)
    ? Math.max(0, Math.min(6, Math.trunc(precision)))
    : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
export function formatTelemetrySample(point?: TelemetryPoint, precision = 2) {
  const state = sampleState(point);
  return state === "valid"
    ? formatTelemetryNumber(point!.value!, precision)
    : state === "absent"
      ? "无此时刻采样"
      : state === "missing"
        ? "缺测"
        : "无效";
}
export function formatAxisNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumSignificantDigits: 5,
    notation:
      value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 1e7)
        ? "scientific"
        : "standard",
  });
}
export function telemetryTime(timestamp: number, timeZone = "UTC") {
  if (!validTimestamp(timestamp)) return "时间未知";
  try {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      ...(timestamp % 1000 ? { fractionalSecondDigits: 3 as const } : {}),
    })
      .format(timestamp)
      .replace(",", ".");
  } catch {
    return "时区无效";
  }
}

/** Compress only a repeated calendar date; never hide a cross-day/year boundary. */
export function telemetryWindowLabel(
  from: number,
  to: number,
  timeZone = "UTC",
) {
  const start = telemetryTime(from, timeZone),
    end = telemetryTime(to, timeZone);
  const sameDay =
    start.length >= 19 &&
    end.length >= 19 &&
    start.slice(0, 10) === end.slice(0, 10);
  return `${start} – ${sameDay ? end.slice(11) : end} ${timeZone}`;
}

export function createTelemetryGeometry(
  points: TelemetryPoint[],
  width = 640,
  height = 160,
  options: {
    window?: TelemetryWindow;
    maxGapMs?: number;
    domain?: NumericDomain;
  } = {},
) {
  const samples = normalizeTelemetry(
    points,
    options.window?.from,
    options.window?.to,
  );
  const from = options.window?.from ?? samples[0]?.timestamp ?? 0;
  const to = options.window?.to ?? samples.at(-1)?.timestamp ?? 1;
  const chunks = trendSegments(samples, from, to, options.maxGapMs);
  const values = chunks.flat().map((p) => p.value!);
  const scale = numericScale(values, options.domain);
  const dataMin = values.reduce((a, b) => Math.min(a, b), Infinity);
  const dataMax = values.reduce((a, b) => Math.max(a, b), -Infinity);
  return {
    ...scale,
    from,
    to,
    samples,
    dataMin,
    dataMax,
    missing: samples.filter((p) => sampleState(p) === "missing").length,
    invalid: samples.filter((p) => sampleState(p) === "invalid").length,
    hasGaps:
      chunks.length > 1 || samples.some((p) => sampleState(p) !== "valid"),
    segments: chunks.map((chunk) =>
      chunk.map((point) => ({
        x: linearPosition(point.timestamp, from, to) * width,
        y: (1 - linearPosition(point.value!, scale.min, scale.max)) * height,
        point,
      })),
    ),
  };
}

export function isValidThreshold(
  value: { low: number; high: number },
  min: number,
  max: number,
) {
  return (
    Number.isFinite(value.low) &&
    Number.isFinite(value.high) &&
    value.low >= min &&
    value.high <= max &&
    value.low < value.high
  );
}
