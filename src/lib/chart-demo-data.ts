import type { TelemetryQueryResult } from "@/components/blocks/telemetry-explorer";

// Hand-checkable fixture: A = [0, 10, gap, -10, 20], B = [5, 15, 5].
// Unequal elapsed intervals, a last-received duplicate, and a year boundary.
export const chartCaseStart = Date.UTC(2025, 11, 31, 23, 55);
const minute = 60_000;
export const chartCaseWindow = {
  from: chartCaseStart,
  to: chartCaseStart + 20 * minute,
};
export function chartCase(scenario = "known"): TelemetryQueryResult {
  const at = (n: number) => chartCaseStart + n * minute;
  const base = [
    { timestamp: at(0), value: 0 },
    { timestamp: at(1), value: 10 },
    { timestamp: at(3), value: null },
    { timestamp: at(10), value: -10 },
    { timestamp: at(20), value: 20 },
  ];
  const data =
    scenario === "empty"
      ? []
      : scenario === "single"
        ? [base[0]]
        : scenario === "constant"
          ? base.map((p) => ({ ...p, value: 0 }))
          : scenario === "invalid"
            ? base.map((p, i) => ({ ...p, value: i % 2 ? NaN : null }))
            : scenario === "extreme"
              ? base.map((p, i) => ({
                  ...p,
                  value: p.value === null ? null : p.value * 1e8,
                }))
              : [
                  ...base.slice(0, 4).reverse(),
                  { timestamp: at(20), value: 999 },
                  base[4],
                ];
  return {
    series: [
      {
        id: "a",
        label: "测点 A",
        unit: "°C",
        precision: 1,
        styleIndex: 0,
        domain: { min: -10, max: 20 },
        data,
      },
      ...(scenario === "known" || scenario === "mixed"
        ? [
            {
              id: "b",
              label: "测点 B",
              unit: "°C",
              precision: 1,
              styleIndex: 1,
              domain: { min: -10, max: 20 },
              data: [
                { timestamp: at(0), value: 5 },
                { timestamp: at(10), value: 15 },
                { timestamp: at(20), value: 5, quality: "estimated" as const },
              ],
            },
          ]
        : []),
      ...(scenario === "mixed"
        ? [
            {
              id: "humidity",
              label: "相对湿度",
              unit: "%RH",
              precision: 0,
              styleIndex: 2,
              domain: { min: 0, max: 100 },
              data: [
                { timestamp: at(0), value: 50 },
                { timestamp: at(20), value: 60 },
              ],
            },
          ]
        : []),
    ],
    maxGapMs: 12 * minute,
    events: [{ id: "inspection", at: at(10), label: "人工复核" }],
  };
}
export const catalogColdHistory = [4, 3.8, 4.2, 4.5, 4.3, 4.1].map(
  (value, i) => ({ timestamp: chartCaseStart + i * 60_000, value }),
);
export const catalogEnergy = [16, 18, 14, 10, 12, 14, 19, 25].map(
  (value, i) => ({ label: `${String(i * 3).padStart(2, "0")}:00`, value }),
);
