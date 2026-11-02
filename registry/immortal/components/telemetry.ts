export type TelemetryPoint = { timestamp: number; value: number | null };

/** Missing samples split the line instead of implying an observed measurement. */
export function createTelemetryGeometry(
  points: TelemetryPoint[],
  width = 640,
  height = 160,
) {
  const samples = points
    .filter((p) => Number.isFinite(p.timestamp))
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp);
  const values = samples.flatMap((p) =>
    p.value !== null && Number.isFinite(p.value) ? [p.value] : [],
  );
  if (!values.length)
    return {
      segments: [] as { x: number; y: number; point: TelemetryPoint }[][],
      min: 0,
      max: 1,
    };
  const low = values.reduce((a, b) => Math.min(a, b)),
    high = values.reduce((a, b) => Math.max(a, b));
  const padding = Math.max((high - low) * 0.2, Math.abs(high) * 0.02, 0.1);
  const min = low - padding,
    max = high + padding;
  const start = samples[0].timestamp,
    range = samples.at(-1)!.timestamp - start;
  const segments: { x: number; y: number; point: TelemetryPoint }[][] = [];
  let segment: { x: number; y: number; point: TelemetryPoint }[] = [];
  for (const point of samples) {
    if (point.value === null || !Number.isFinite(point.value)) {
      if (segment.length) segments.push(segment);
      segment = [];
    } else
      segment.push({
        x: range ? ((point.timestamp - start) / range) * width : width / 2,
        y: height - ((point.value - min) / (max - min)) * height,
        point,
      });
  }
  if (segment.length) segments.push(segment);
  return { segments, min, max };
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
