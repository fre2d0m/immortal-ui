import { demoNow } from "@/lib/block-demo-data";
import type { TelemetryPoint } from "@/lib/telemetry";

// Deterministic, presentation-only fixtures. Aggregates below are computed from these inputs.
const temperatures = [
  23.2,
  23.5,
  23.9,
  24.1,
  24.3,
  24.2,
  null,
  23.8,
  23.6,
  23.8,
  24,
  24.2,
  24.6,
];
export const comparableTemperatureDomain = { min: 18, max: 30 };
export function dataCardDemo(scenario = "normal") {
  const end =
    scenario === "cross-year"
      ? Date.UTC(2026, 0, 1, 0, 4)
      : demoNow - (scenario === "stale" ? 720_000 : 12_000);
  const replacement =
    scenario === "zero"
      ? 0
      : scenario === "negative"
        ? -8.2
        : scenario === "outside"
          ? 58.6
          : 24.6;
  let observations: TelemetryPoint[] = temperatures.map((v, i) => ({
    timestamp: end - (12 - i) * 60_000,
    value: scenario === "constant" ? 24.6 : i === 12 ? replacement : v,
    quality:
      scenario === "estimated"
        ? "estimated"
        : scenario === "bad" && i === 12
          ? "bad"
          : "good",
  }));
  if (scenario === "missing") observations = [];
  if (scenario === "single") observations = observations.slice(-1);
  if (scenario === "irregular")
    observations = observations.filter((_, i) => ![2, 3, 4, 8, 9].includes(i));
  const latest = observations.at(-1);
  const previous = observations.filter((p) => p.value !== null).at(-2);
  // Each result is a 15-minute mean of three channels sampled every 30 seconds.
  // One absent record per channel leaves exactly 87 of 90 expected samples.
  const calculations = observations.map((p) => {
    const calculatedAt = p.timestamp - 48_000;
    const window = { from: calculatedAt - 900_000, to: calculatedAt };
    const inputs = Array.from({ length: 90 }, (_, i) => ({
      channel: `T-0${(i % 3) + 1}`,
      timestamp: window.from + Math.floor(i / 3) * 30_000,
      value:
        p.value === null || Math.floor(i / 3) === 6
          ? null
          : Number((p.value + [-0.6, 0, 0.6][i % 3]).toFixed(1)),
    }));
    const valid = inputs.filter((p) => p.value !== null);
    const mean = valid.length
      ? valid.reduce((n, p) => n + p.value!, 0) / valid.length
      : null;
    return {
      timestamp: calculatedAt,
      value: mean === null ? null : Number(mean.toFixed(10)),
      quality: p.quality,
      inputs,
      window,
      sampleCount: valid.length,
      expectedCount: inputs.length,
    };
  });
  return {
    observations,
    latest,
    previous,
    calculations,
    result: calculations.at(-1),
    previousResult: calculations.filter((p) => p.value !== null).at(-2),
  };
}
export const normalCardDemo = dataCardDemo();
