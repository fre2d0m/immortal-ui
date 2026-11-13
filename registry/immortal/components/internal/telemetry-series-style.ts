import type { TrendSeries } from "@/components/iot/telemetry-chart";

export const traceStyles = [undefined, "8 4", "2 4", "10 4 2 4", "14 4"];
export const seriesStyleIndex = (series: TrendSeries) =>
  Math.abs(
    series.styleIndex ??
      [...series.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) | 0, 0),
  ) % 5;
export const traceColor = (series: TrendSeries) =>
  series.color ?? `var(--chart-${seriesStyleIndex(series) + 1})`;
