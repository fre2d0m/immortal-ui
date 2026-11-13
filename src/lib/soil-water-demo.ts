import type {
  SoilWaterDataset,
  SoilEvent,
  SoilInterval,
} from "@/components/blocks/soil-water-model";
import {
  SOIL_DAY as day,
  SOIL_HOUR as hour,
} from "@/components/blocks/soil-water-model";

const from = Date.UTC(2025, 0, 1),
  to = Date.UTC(2026, 0, 1);
const at = (month: number, date: number, hours = 0) =>
  Date.UTC(2025, month - 1, date, hours);
let cachedYear: SoilWaterDataset | undefined;

/** Synthetic, reproducible visual stress fixture. This is not an agronomic simulation or recommendation. */
export function annualSoilDemo(): SoilWaterDataset {
  if (cachedYear) return cachedYear;
  const events: SoilEvent[] = [
    {
      id: "install",
      kind: "installation",
      timing: "instant",
      from,
      label: "剖面仪安装",
      description: "20 层探针接入；合成事件。",
    },
    {
      id: "freeze-1",
      kind: "freeze",
      timing: "interval",
      from: at(1, 5),
      to: at(2, 17, 10),
      label: "冬季冻融阶段",
    },
    {
      id: "freeze-2",
      kind: "freeze",
      timing: "interval",
      from: at(3, 7),
      to: at(3, 16, 12),
      label: "春季冻融阶段",
    },
    {
      id: "freeze-3",
      kind: "freeze",
      timing: "interval",
      from: at(12, 9),
      label: "冬季冻融阶段",
      description: "截至观测窗口结束仍持续；结束时间未提供。",
    },
    {
      id: "fault-1",
      kind: "fault",
      timing: "interval",
      from: at(4, 16, 7),
      to: at(4, 19, 19),
      label: "采集链路中断",
      description: "全深度缺测。事件与缺口同时提供，不自动推断因果。",
    },
    {
      id: "replace",
      kind: "installation",
      timing: "instant",
      from: at(4, 19, 19),
      label: "采集器更换",
    },
    {
      id: "fault-2",
      kind: "fault",
      timing: "interval",
      from: at(7, 12, 8),
      to: at(7, 14, 12),
      depthIds: ["d20", "d30", "d40", "d50"],
      label: "20–50 cm 通道故障",
      description: "所列通道报告无效质量；其他深度保留观测。",
    },
    {
      id: "fault-3",
      kind: "fault",
      timing: "interval",
      from: at(7, 13),
      to: at(7, 16),
      depthIds: ["d190", "d200"],
      label: "深层传感器断报",
    },
    {
      id: "recalibrate",
      kind: "installation",
      timing: "instant",
      from: at(7, 14, 12),
      label: "探针重装",
    },
  ];
  for (let index = 0; index < 14; index++) {
    const start = at(5, 3, 6) + index * 12 * day;
    events.push({
      id: `irrigation-${index}`,
      kind: "irrigation",
      timing: "interval",
      from: start,
      to: start + (5 + (index % 4)) * hour,
      label: `第 ${index + 1} 次灌溉`,
      description: "仅提供运行时段；未提供灌溉水量。",
    });
  }
  events.push(
    {
      id: "irrigation-focus",
      kind: "irrigation",
      timing: "interval",
      from: at(7, 12, 6),
      to: at(7, 12, 18),
      label: "A 区灌溉",
    },
    {
      id: "irrigation-overlap",
      kind: "irrigation",
      timing: "interval",
      from: at(7, 12, 10),
      to: at(7, 13, 1),
      label: "B 区灌溉",
    },
  );
  const rain: SoilInterval[] = [],
    et0: SoilInterval[] = [],
    kc: SoilInterval[] = [];
  for (let d = 0; d < 365; d++) {
    const season = Math.max(0, Math.sin(((d - 62) / 365) * Math.PI * 2));
    const precipitation =
      d === 192
        ? 42
        : d % 17 === 4
          ? 12 + (d % 23)
          : d % 9 === 2
            ? 3.2 + (d % 5) * 1.7
            : 0;
    const interval = { from: from + d * day, to: from + (d + 1) * day };
    rain.push({
      ...interval,
      value: Math.round(precipitation * 10) / 10,
      quality: "good",
    });
    et0.push({
      ...interval,
      value:
        d >= 105 && d <= 107
          ? null
          : Math.round((1.1 + 4.3 * season + 0.35 * Math.sin(d * 1.7)) * 100) /
            100,
      quality: "estimated",
    });
    const coefficient =
      d < 110
        ? 0.3
        : d < 160
          ? 0.3 + ((d - 110) / 50) * 0.85
          : d < 235
            ? 1.15
            : d < 280
              ? 1.15 - ((d - 235) / 45) * 0.6
              : 0.55;
    kc.push({
      ...interval,
      value: Math.round(coefficient * 100) / 100,
      quality: "estimated",
    });
  }
  const depths = Array.from({ length: 20 }, (_, index) => {
    const depth = (index + 1) * 10;
    let response = 0;
    const records = [];
    for (let h = 0; h < 8760; h++) {
      const timestamp = from + h * hour,
        d = Math.floor(h / 24);
      const delayedDay = Math.max(0, Math.floor((h - index * 4) / 24));
      const irrigating = events.some(
        (e) =>
          e.kind === "irrigation" &&
          timestamp - index * 3 * hour >= e.from &&
          timestamp - index * 3 * hour < e.to!,
      );
      response =
        response * (0.982 + index * 0.0005) +
        ((rain[delayedDay].value ?? 0) / 24) * 0.11 * Math.exp(-index / 8) +
        (irrigating ? 0.29 * Math.exp(-index / 7) : 0);
      const seasonal =
        3.4 * Math.cos(((d - 15) / 365) * Math.PI * 2) * Math.exp(-index / 9);
      const value =
        Math.round(
          (19 +
            index * 0.55 +
            seasonal +
            response +
            0.65 * Math.sin(h / 65 + index * 0.4) +
            0.3 * Math.sin(h / 8.3) * Math.exp(-index / 5)) *
            10,
        ) / 10;
      if (index >= 18 && timestamp >= at(7, 13) && timestamp < at(7, 16))
        continue;
      const missing = timestamp >= at(4, 16, 7) && timestamp < at(4, 19, 19);
      const invalid =
        index >= 1 &&
        index <= 4 &&
        timestamp >= at(7, 12, 8) &&
        timestamp < at(7, 14, 12);
      const uncertain =
        index < 3 && timestamp >= at(3, 7) && timestamp < at(3, 8);
      records.push({
        timestamp,
        value: missing ? null : value,
        quality: invalid
          ? ("bad" as const)
          : uncertain
            ? ("uncertain" as const)
            : ("good" as const),
        ...(invalid
          ? { qualityReason: "通道故障" }
          : missing
            ? { qualityReason: "采集链路中断" }
            : uncertain
              ? { qualityReason: "来源标记为存疑" }
              : {}),
      });
    }
    return { id: `d${depth}`, depthCm: depth, records };
  });
  cachedYear = {
    id: "synthetic-soil-2025-v1",
    title: "北区 02 · 土壤水分",
    source: "演示数据 · 可重复合成场景 v1",
    timeZone: "UTC",
    window: { from, to },
    cadenceMs: hour,
    unit: "%",
    precision: 1,
    referenceDomain: { min: 0, max: 50 },
    depths,
    events,
    rainfall: {
      id: "rain",
      label: "降雨",
      unit: "mm",
      precision: 1,
      kind: "observation",
      source: "合成雨量计记录",
      intervalMs: day,
      records: rain,
    },
    et0: {
      id: "et0",
      label: "ET₀",
      unit: "mm",
      precision: 2,
      kind: "estimate",
      source: "合成参考蒸散序列",
      method: "演示函数 v1；未执行 FAO-56 计算",
      intervalMs: day,
      records: et0,
    },
    kc: {
      id: "kc",
      label: "Kc",
      unit: "1",
      precision: 2,
      kind: "coefficient",
      source: "合成生育阶段参数",
      method: "演示分段函数 v1；未指定真实作物",
      intervalMs: day,
      records: kc,
    },
  };
  return cachedYear;
}

export function soilHandCheckDemo(): SoilWaterDataset {
  const from = Date.UTC(2025, 11, 31, 22),
    t = (h: number) => from + h * hour;
  return {
    id: "soil-hand-check",
    title: "跨年核对 · 3 个深度",
    source: "演示数据 · 手工可核对样例",
    timeZone: "UTC",
    window: { from, to: t(8) },
    cadenceMs: hour,
    unit: "%",
    precision: 1,
    referenceDomain: { min: 0, max: 50 },
    depths: [
      {
        id: "a",
        depthCm: 10,
        records: [
          { timestamp: t(7), value: 999 },
          { timestamp: t(0), value: 0 },
          { timestamp: t(1), value: 10 },
          { timestamp: t(2), value: null },
          { timestamp: t(3), value: -5 },
          { timestamp: t(6), value: 70, quality: "uncertain" },
          { timestamp: t(7), value: 20 },
        ],
      },
      {
        id: "b",
        depthCm: 55,
        records: Array.from({ length: 8 }, (_, h) => ({
          timestamp: t(h),
          value: 25,
          quality: "good",
        })),
      },
      {
        id: "c",
        depthCm: 200,
        records: [
          { timestamp: t(3), value: 15 },
          { timestamp: t(4), value: Number.NaN },
        ],
      },
    ],
    rainfall: {
      id: "rain",
      label: "降雨",
      unit: "mm",
      precision: 1,
      source: "核对样例",
      kind: "observation",
      intervalMs: 4 * hour,
      records: [
        { from, to: t(4), value: 0 },
        { from: t(4), to: t(8), value: 12 },
      ],
    },
    et0: {
      id: "et0",
      label: "ET₀",
      unit: "mm",
      precision: 1,
      source: "核对样例",
      kind: "estimate",
      intervalMs: 4 * hour,
      records: [
        { from, to: t(4), value: 2 },
        { from: t(4), to: t(8), value: null },
      ],
    },
    kc: {
      id: "kc",
      label: "Kc",
      unit: "1",
      precision: 2,
      source: "核对样例",
      kind: "coefficient",
      intervalMs: 4 * hour,
      records: [
        { from, to: t(4), value: 0 },
        { from: t(4), to: t(8), value: 1.2 },
      ],
    },
    events: [
      {
        id: "instant",
        kind: "installation",
        timing: "instant",
        from: t(1),
        label: "安装：跨年核对",
      },
      {
        id: "duration",
        kind: "irrigation",
        timing: "interval",
        from: t(1),
        to: t(6),
        label: "持续灌溉",
      },
      {
        id: "overlap",
        kind: "irrigation",
        timing: "interval",
        from: t(2),
        to: t(4),
        label: "另一灌溉区域",
      },
      {
        id: "fault",
        kind: "fault",
        timing: "interval",
        from: t(4),
        label: "持续故障",
      },
    ],
  };
}
