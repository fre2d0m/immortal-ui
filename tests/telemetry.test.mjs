import test from "node:test";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL("../registry/immortal/components/telemetry.ts", import.meta.url),
  "utf8",
);
const { createTelemetryGeometry, isValidThreshold, telemetryWindowLabel } =
  await import(
    `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`
  );

test("missing samples split the trace; zero is a valid reading", () => {
  const result = createTelemetryGeometry([
    { timestamp: 0, value: 0 },
    { timestamp: 1, value: null },
    { timestamp: 2, value: 4 },
  ]);
  assert.equal(result.segments.length, 2);
  assert.equal(result.segments[0][0].point.value, 0);
  assert.equal(result.segments[1][0].x, 640);
});
test("empty, invalid, constant and single-point telemetry stay finite", () => {
  assert.deepEqual(createTelemetryGeometry([]).segments, []);
  assert.deepEqual(
    createTelemetryGeometry([
      { timestamp: 1, value: NaN },
      { timestamp: NaN, value: 2 },
    ]).segments,
    [],
  );
  for (const points of [
    [{ timestamp: 1, value: 42 }],
    [
      { timestamp: 1, value: 0 },
      { timestamp: 2, value: 0 },
    ],
  ]) {
    const result = createTelemetryGeometry(points);
    assert.ok(result.max > result.min);
    for (const point of result.segments.flat())
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
  }
});
test("samples are ordered without mutating caller data", () => {
  const points = [
    { timestamp: 3, value: 30 },
    { timestamp: 1, value: 10 },
  ];
  const result = createTelemetryGeometry(points);
  assert.equal(points[0].timestamp, 3);
  assert.equal(result.segments[0][0].point.timestamp, 1);
});
test("threshold validation rejects crossed, missing and out-of-bounds values", () => {
  assert.ok(isValidThreshold({ low: -5, high: 35 }, -20, 80));
  for (const value of [
    { low: 35, high: 10 },
    { low: 10, high: 10 },
    { low: NaN, high: 35 },
    { low: -21, high: 35 },
    { low: 10, high: 81 },
  ])
    assert.equal(isValidThreshold(value, -20, 80), false);
});

const {
  normalizeTelemetry,
  numericScale,
  linearPosition,
  sampleState,
  formatTelemetrySample,
  telemetryTime,
} = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`
);

test("hand-checkable irregular samples drive positions, shared range and duplicate policy", () => {
  const samples = [
    { timestamp: 20, value: 999 },
    { timestamp: 3, value: null },
    { timestamp: 10, value: -10 },
    { timestamp: 0, value: 0 },
    { timestamp: 1, value: 10 },
    { timestamp: 20, value: 20 },
  ];
  const geometry = createTelemetryGeometry(samples, 200, 90, {
    window: { from: 0, to: 20 },
    domain: { min: -10, max: 20 },
  });
  assert.equal(geometry.min, -10);
  assert.equal(geometry.max, 20);
  assert.deepEqual(
    geometry.segments.map((s) => s.map((p) => [p.x, p.y, p.point.value])),
    [
      [
        [0, 60.00000000000001, 0],
        [10, 30.000000000000004, 10],
      ],
      [
        [100, 90, -10],
        [200, 0, 20],
      ],
    ],
  );
  assert.equal(geometry.missing, 1);
  assert.equal(geometry.hasGaps, true);
  assert.equal(geometry.samples.length, 5);
  assert.equal(samples[0].value, 999);
  const other = createTelemetryGeometry(
    [
      { timestamp: 0, value: 5 },
      { timestamp: 20, value: 5 },
    ],
    200,
    90,
    { domain: { min: -10, max: 20 } },
  );
  assert.equal(other.segments[0][0].y, 45);
  const changed = createTelemetryGeometry(
    [
      { timestamp: 0, value: 20 },
      { timestamp: 20, value: -10 },
    ],
    200,
    90,
    { domain: { min: -10, max: 20 } },
  );
  assert.deepEqual(
    changed.segments[0].map((p) => p.y),
    [0, 90],
  );
});
test("last-received missing/invalid duplicates also control the scale, and long gaps split", () => {
  const points = [
    { timestamp: 0, value: 1e6 },
    { timestamp: 0, value: null },
    { timestamp: 1, value: 0 },
    { timestamp: 2, value: NaN },
    { timestamp: 10, value: 2 },
    { timestamp: 20, value: 3 },
  ];
  const geometry = createTelemetryGeometry(points, 100, 50, { maxGapMs: 5 });
  assert.equal(geometry.segments.length, 3);
  assert.ok(geometry.max < 4);
  assert.equal(geometry.invalid, 1);
  assert.deepEqual(
    normalizeTelemetry([
      { timestamp: 1e19, value: 4 },
      { timestamp: NaN, value: 5 },
    ]),
    [],
  );
  assert.equal(
    sampleState({ timestamp: 0, value: 2, quality: "bad" }),
    "invalid",
  );
  assert.equal(
    sampleState({ timestamp: 0, value: 0, quality: "estimated" }),
    "valid",
  );
  assert.equal(formatTelemetrySample(undefined), "无此时刻采样");
  assert.equal(formatTelemetrySample({ timestamp: 0, value: null }), "缺测");
  assert.equal(
    formatTelemetrySample({ timestamp: 0, value: Infinity }),
    "无效",
  );
  assert.equal(formatTelemetrySample({ timestamp: 0, value: 0 }, 1), "0.0");
});
test("declared reference scales expand for outliers without hiding them", () => {
  const geometry = createTelemetryGeometry(
    [
      { timestamp: 0, value: -15 },
      { timestamp: 1, value: 70 },
    ],
    200,
    100,
    { domain: { min: 0, max: 50 } },
  );
  assert.equal(geometry.expanded, true);
  assert.equal(geometry.min, -15);
  assert.equal(geometry.max, 70);
  assert.deepEqual(
    geometry.segments[0].map((p) => p.y),
    [100, 0],
  );
});
test("zero-baseline interval scales preserve signed values and zero positions", () => {
  const scale = numericScale([-10, 0, 20], undefined, true);
  assert.equal(scale.min, -10);
  assert.equal(scale.max, 20);
  assert.equal(linearPosition(0, scale.min, scale.max), 1 / 3);
  assert.deepEqual(
    numericScale([0], undefined, true).ticks,
    [1, 0.75, 0.5, 0.25, 0],
  );
});
test("extreme finite values, singleton and constant scales remain finite", () => {
  for (const values of [
    [-Number.MAX_VALUE, Number.MAX_VALUE],
    [1e308, 1e308],
    [Number.MIN_VALUE, Number.MIN_VALUE],
    [0, 0],
  ]) {
    const g = createTelemetryGeometry(
      values.map((value, i) => ({ timestamp: i, value })),
    );
    assert.ok(g.max > g.min);
    assert.ok(g.ticks.every(Number.isFinite));
    assert.ok(
      g.segments
        .flat()
        .every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    );
  }
  const g = createTelemetryGeometry([{ timestamp: 7, value: 0 }], 200, 100);
  assert.equal(g.segments[0][0].x, 100);
});
test("timestamps retain full year, actual zone and subsecond precision", () => {
  assert.equal(
    telemetryTime(Date.UTC(2025, 11, 31, 23, 59, 59, 123)),
    "2025-12-31 23:59:59.123",
  );
  assert.match(
    telemetryTime(Date.UTC(2025, 11, 31, 23, 59), "Asia/Tokyo"),
    /^2026-01-01 08:59:00/,
  );
  assert.equal(telemetryTime(1e19), "时间未知");
});

test("window labels compress repeated dates but preserve cross-year and timezone boundaries", () => {
  const start = Date.parse("2025-12-31T23:55:00Z");
  const end = Date.parse("2026-01-01T00:15:00Z");
  assert.equal(
    telemetryWindowLabel(start, end),
    "2025-12-31 23:55:00 – 2026-01-01 00:15:00 UTC",
  );
  assert.equal(
    telemetryWindowLabel(start, end, "Asia/Tokyo"),
    "2026-01-01 08:55:00 – 09:15:00 Asia/Tokyo",
  );
  assert.equal(
    telemetryWindowLabel(start, start + 500),
    "2025-12-31 23:55:00 – 23:55:00.500 UTC",
  );
});
