import {
  normalizeTelemetry,
  linearPosition,
  numericScale,
  sampleState,
  validTimestamp,
  type TelemetryPoint,
} from "@/lib/telemetry";

export const SOIL_HOUR = 3_600_000;
export const SOIL_DAY = 24 * SOIL_HOUR;
export type SoilWindow = { from: number; to: number };
export type SoilDepth = {
  id: string;
  depthCm: number;
  label?: string;
  records: TelemetryPoint[];
};
/** Interval quantities keep their original accumulation period; they are never prorated. */
export type SoilInterval = {
  from: number;
  to: number;
  value: number | null;
  quality?: TelemetryPoint["quality"];
  qualityReason?: string;
};
export type SoilDriver = {
  id: string;
  label: string;
  unit: string;
  precision: number;
  kind: "observation" | "estimate" | "coefficient";
  source: string;
  method?: string;
  intervalMs: number;
  records: SoilInterval[];
};
export type SoilEventKind = "irrigation" | "installation" | "fault" | "freeze";
export type SoilEvent = {
  id: string;
  kind: SoilEventKind;
  label: string;
  from: number;
  /** An absent end on an interval means ongoing, not instantaneous. */
  timing: "instant" | "interval";
  to?: number;
  depthIds?: string[];
  description?: string;
};
export type SoilWaterDataset = {
  id: string;
  title: string;
  source: string;
  timeZone: string;
  /** All windows are half-open [from, to). cadenceMs is the expected sampling interval. */
  window: SoilWindow;
  cadenceMs: number;
  unit: string;
  precision: number;
  referenceDomain: { min: number; max: number };
  depths: SoilDepth[];
  rainfall?: SoilDriver;
  et0?: SoilDriver;
  kc?: SoilDriver;
  events: SoilEvent[];
};
export type SoilBin = {
  from: number;
  to: number;
  mean: number | null;
  min: number | null;
  max: number | null;
  count: number;
  covered: number;
  received: number;
  expected: number;
  invalid: number;
  uncertain: number;
  estimated: number;
  firstAt?: number;
  lastAt?: number;
  firstValidAt?: number;
};
export type PreparedSoil = ReturnType<typeof prepareSoilData>;
export type SoilView = ReturnType<typeof createSoilView>;
export const soilEventLabels: Record<SoilEventKind, string> = {
  irrigation: "灌溉",
  installation: "安装",
  fault: "设备故障",
  freeze: "冻融",
};

export function overlaps(a: SoilWindow, b: SoilWindow) {
  return a.from < b.to && a.to > b.from;
}
export function eventInWindow(event: SoilEvent, window: SoilWindow) {
  return event.timing === "instant"
    ? event.from >= window.from && event.from < window.to
    : event.from < window.to && (event.to ?? Infinity) > window.from;
}
export function validSoilEvent(event: SoilEvent) {
  return (
    validTimestamp(event.from) &&
    (event.timing === "instant" ||
      event.to === undefined ||
      (validTimestamp(event.to) && event.to > event.from))
  );
}
export function lowerBound(records: { timestamp: number }[], value: number) {
  let low = 0,
    high = records.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (records[mid].timestamp < value) low = mid + 1;
    else high = mid;
  }
  return low;
}
export function recordsInWindow(records: TelemetryPoint[], window: SoilWindow) {
  return records.slice(
    lowerBound(records, window.from),
    lowerBound(records, window.to),
  );
}
function prepareDriver(driver: SoilDriver | undefined, window: SoilWindow) {
  if (!driver) return undefined;
  if (
    !Number.isInteger(driver.precision) ||
    driver.precision < 0 ||
    driver.precision > 20
  )
    throw new Error(`${driver.label} 的显示精度无效`);
  if (!Number.isFinite(driver.intervalMs) || driver.intervalMs <= 0)
    throw new Error(`${driver.label} 的区间长度无效`);
  // Exact duplicate windows use the last received record, matching telemetry's policy.
  const records = [
    ...new Map(
      driver.records
        .filter(
          (r) =>
            validTimestamp(r.from) &&
            validTimestamp(r.to) &&
            r.from < r.to &&
            overlaps(r, window),
        )
        .map((r) => [`${r.from}:${r.to}`, r]),
    ).values(),
  ].sort((a, b) => a.from - b.from);
  if (records.some((r) => r.to - r.from !== driver.intervalMs))
    throw new Error(`${driver.label} 的记录区间与声明长度不一致`);
  if (records.some((r, i) => i > 0 && r.from < records[i - 1].to))
    throw new Error(`${driver.label} 含重叠区间，需由数据源明确统计口径`);
  return {
    ...driver,
    records,
    rejected: driver.records.filter(
      (r) => !validTimestamp(r.from) || !validTimestamp(r.to) || r.from >= r.to,
    ).length,
  };
}

/** Only preparation sorts and deduplicates the year's records. Range changes use binary searches. */
export function prepareSoilData(data: SoilWaterDataset) {
  if (
    !validTimestamp(data.window.from) ||
    !validTimestamp(data.window.to) ||
    data.window.from >= data.window.to ||
    !Number.isFinite(data.cadenceMs) ||
    data.cadenceMs <= 0
  )
    throw new Error("时间范围或采样间隔无效");
  if (
    !Number.isInteger(data.precision) ||
    data.precision < 0 ||
    data.precision > 20
  )
    throw new Error("水分显示精度无效");
  if (
    !Number.isFinite(data.referenceDomain.min) ||
    !Number.isFinite(data.referenceDomain.max) ||
    data.referenceDomain.min >= data.referenceDomain.max
  )
    throw new Error("水分参考范围无效");
  new Intl.DateTimeFormat("zh-CN", { timeZone: data.timeZone }).format(
    data.window.from,
  );
  if (new Set(data.depths.map((d) => d.id)).size !== data.depths.length)
    throw new Error("深度标识重复");
  if (
    data.rainfall &&
    data.et0 &&
    (data.rainfall.unit !== data.et0.unit ||
      data.rainfall.intervalMs !== data.et0.intervalMs)
  )
    throw new Error(
      "降雨与 ET₀ 的单位和累计区间必须一致；请在数据源统一口径后传入",
    );
  if (data.kc && data.kc.unit !== "1")
    throw new Error("Kc 应为无量纲系数（unit: 1）");
  if (new Set(data.events.map((e) => e.id)).size !== data.events.length)
    throw new Error("事件标识重复");
  const depths = data.depths
    .filter((d) => Number.isFinite(d.depthCm) && d.depthCm >= 0)
    .map((d) => ({
      ...d,
      records: normalizeTelemetry(
        d.records,
        data.window.from,
        data.window.to,
      ).filter((p) => p.timestamp < data.window.to),
    }))
    .sort((a, b) => a.depthCm - b.depthCm);
  let valid = 0,
    invalid = 0,
    missing = 0;
  const values: number[] = [];
  for (const depth of depths)
    for (const p of depth.records) {
      const state = sampleState(p);
      if (state === "valid") {
        valid++;
        values.push(p.value!);
      } else if (state === "invalid") invalid++;
      else missing++;
    }
  const expected =
    Math.ceil((data.window.to - data.window.from) / data.cadenceMs) *
    depths.length;
  const rejected = data.depths.reduce(
    (n, d) => n + d.records.filter((p) => !validTimestamp(p.timestamp)).length,
    0,
  );
  return {
    ...data,
    depths,
    scale: numericScale(values, data.referenceDomain),
    heatScale: numericScale(values),
    rainfall: prepareDriver(data.rainfall, data.window),
    et0: prepareDriver(data.et0, data.window),
    kc: prepareDriver(data.kc, data.window),
    events: data.events.filter(validSoilEvent).sort((a, b) => a.from - b.from),
    stats: {
      received: depths.reduce((n, d) => n + d.records.length, 0),
      valid,
      invalid,
      missing,
      expected,
      rejected,
      rejectedDepths: data.depths.length - depths.length,
      rejectedEvents: data.events.filter((e) => !validSoilEvent(e)).length,
    },
  };
}

/** Rendering buckets retain extrema, actual sample times and coverage; raw records remain intact. */
export function binSoilRecords(
  records: TelemetryPoint[],
  window: SoilWindow,
  resolution: number,
  cadence: number,
  origin: number,
): SoilBin[] {
  const start =
    origin + Math.floor((window.from - origin) / resolution) * resolution;
  const count = Math.ceil((window.to - start) / resolution);
  const bins: SoilBin[] = Array.from({ length: count }, (_, i) => {
    const from = Math.max(window.from, start + i * resolution),
      to = Math.min(window.to, start + (i + 1) * resolution);
    const firstSlot = Math.ceil((from - origin) / cadence),
      lastSlot = Math.ceil((to - origin) / cadence);
    return {
      from,
      to,
      mean: null,
      min: null,
      max: null,
      count: 0,
      covered: 0,
      received: 0,
      expected: Math.max(0, lastSlot - firstSlot),
      invalid: 0,
      uncertain: 0,
      estimated: 0,
    };
  });
  const covered = bins.map(() => new Set<number>());
  const first = lowerBound(records, window.from),
    last = lowerBound(records, window.to);
  for (let i = first; i < last; i++) {
    const p = records[i],
      index = Math.floor((p.timestamp - start) / resolution),
      bin = bins[index];
    if (!bin) continue;
    bin.received++;
    bin.firstAt ??= p.timestamp;
    bin.lastAt = p.timestamp;
    if (sampleState(p) !== "valid") {
      if (sampleState(p) === "invalid") bin.invalid++;
      continue;
    }
    bin.count++;
    bin.firstValidAt ??= p.timestamp;
    covered[index].add(Math.floor((p.timestamp - origin) / cadence));
    bin.covered = covered[index].size;
    // Weighted incremental mean avoids an overflowing sum for large finite readings.
    bin.mean =
      bin.count === 1
        ? p.value!
        : bin.mean! * ((bin.count - 1) / bin.count) + p.value! / bin.count;
    bin.min = Math.min(bin.min ?? p.value!, p.value!);
    bin.max = Math.max(bin.max ?? p.value!, p.value!);
    if (p.quality === "uncertain") bin.uncertain++;
    if (p.quality === "estimated") bin.estimated++;
  }
  return bins;
}
export function clampSoilWindow(
  window: SoilWindow,
  full: SoilWindow,
  minimum = SOIL_HOUR,
) {
  if (
    !Number.isFinite(window.from) ||
    !Number.isFinite(window.to) ||
    window.to <= window.from
  )
    return { ...full };
  const span = Math.max(
    Math.min(minimum, full.to - full.from),
    Math.min(window.to - window.from, full.to - full.from),
  );
  const from = Math.max(full.from, Math.min(full.to - span, window.from));
  return { from, to: from + span };
}
export function createSoilView(prepared: PreparedSoil, requested: SoilWindow) {
  const window = clampSoilWindow(
    requested,
    prepared.window,
    prepared.cadenceMs,
  );
  const resolution =
    window.to - window.from <= 14 * SOIL_DAY
      ? prepared.cadenceMs
      : Math.max(SOIL_DAY, prepared.cadenceMs);
  const layers = prepared.depths.map((d) => ({
    ...d,
    bins: binSoilRecords(
      d.records,
      window,
      resolution,
      prepared.cadenceMs,
      prepared.window.from,
    ),
  }));
  const drivers = [prepared.rainfall, prepared.et0, prepared.kc]
    .filter((d): d is NonNullable<typeof d> => !!d)
    .map((d) => ({
      ...d,
      records: d.records.filter((r) => overlaps(r, window)),
    }));
  return {
    window,
    resolution,
    layers,
    drivers,
    events: prepared.events.filter((e) => eventInWindow(e, window)),
    cellCount: layers.reduce((n, d) => n + d.bins.length, 0),
    received: layers.reduce(
      (n, d) => n + d.bins.reduce((sum, bin) => sum + bin.received, 0),
      0,
    ),
  };
}
/** Overlapping events in one category get independent lanes rather than hiding one another. */
export function packSoilEvents(events: SoilEvent[], window: SoilWindow) {
  const lanes: {
    key: string;
    kind: SoilEventKind;
    label: string;
    events: SoilEvent[];
  }[] = [];
  for (const kind of Object.keys(soilEventLabels) as SoilEventKind[]) {
    const tracks: typeof lanes = [];
    for (const event of events
      .filter((e) => e.kind === kind && eventInWindow(e, window))
      .sort((a, b) => a.from - b.from)) {
      const start = Math.max(event.from, window.from);
      const track = tracks.find((t) => {
        const previous = t.events.at(-1)!;
        return (
          (previous.timing === "instant"
            ? previous.from + (window.to - window.from) / 150
            : (previous.to ?? window.to)) <= start
        );
      });
      if (track) track.events.push(event);
      else
        tracks.push({
          key: `${kind}-${tracks.length}`,
          kind,
          label:
            soilEventLabels[kind] +
            (tracks.length ? ` ${tracks.length + 1}` : ""),
          events: [event],
        });
    }
    lanes.push(
      ...(tracks.length
        ? tracks
        : [{ key: kind, kind, label: soilEventLabels[kind], events: [] }]),
    );
  }
  return lanes;
}
export function soilExport(
  prepared: PreparedSoil,
  window: SoilWindow,
  depthIds: string[],
) {
  return {
    datasetId: prepared.id,
    title: prepared.title,
    source: prepared.source,
    timeZone: prepared.timeZone,
    window: { ...window, boundary: "[from,to)" },
    unit: prepared.unit,
    precision: prepared.precision,
    cadenceMs: prepared.cadenceMs,
    depths: prepared.depths
      .filter((d) => depthIds.includes(d.id))
      .map((d) => ({ ...d, records: recordsInWindow(d.records, window) })),
    drivers: [prepared.rainfall, prepared.et0, prepared.kc]
      .filter((d) => !!d)
      .map((d) => ({
        ...d,
        records: d.records.filter((r) => overlaps(r, window)),
      })),
    events: prepared.events.filter((e) => eventInWindow(e, window)),
  };
}
export type SoilWaterExport = ReturnType<typeof soilExport>;

export const soilColors = [
  "#77b5f8",
  "#e8b86d",
  "#6bc4af",
  "#bb9ce4",
  "#e49db1",
];
export const soilLightColors = [
  "#286bb2",
  "#996018",
  "#277567",
  "#7858a0",
  "#a24a68",
];
export const soilDashes = [[], [7, 4], [2, 3], [8, 3, 2, 3]];
/** Perceptually ordered blue scale, not a categorical rainbow. */
export const soilHeatColors = [
  "#e0f3e9",
  "#a6d9d2",
  "#65b6c7",
  "#398aad",
  "#245b87",
  "#173956",
];
export function soilHeatColor(value: number, min: number, max: number) {
  const t =
    Math.max(0, Math.min(1, linearPosition(value, min, max))) *
    (soilHeatColors.length - 1);
  const low = Math.floor(t),
    high = Math.min(soilHeatColors.length - 1, low + 1);
  const rgb = (hex: string) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const a = rgb(soilHeatColors[low]),
    b = rgb(soilHeatColors[high]);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * (t - low))).join(",")})`;
}
