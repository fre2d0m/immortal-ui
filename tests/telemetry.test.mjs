import test from "node:test";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL("../registry/immortal/components/telemetry.ts", import.meta.url),
  "utf8",
);
const { createTelemetryGeometry, isValidThreshold } = await import(
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
