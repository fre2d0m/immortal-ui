import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCommandEvent,
  numericError,
  sampleAge,
  alarmState,
  irrigationProgress,
} from "../registry/immortal/components/iot-model.ts";
import { trendSegments } from "../registry/immortal/components/telemetry.ts";
import { firstBatch } from "../src/content/first-batch.ts";
import {
  commonVariables,
  defaultSettings,
  parseSettings,
  serializeSettings,
} from "../src/lib/theme-settings.ts";

test("control and operation patterns keep their semantic catalog entries", () => {
  assert.deepEqual(
    firstBatch.map((item) => item.name),
    [
      "light-control",
      "thermostat-control",
      "actuator-control",
      "setpoint-control",
      "control-authority",
      "interlock-status",
      "command-status",
      "alert-card",
      "irrigation-run",
    ],
  );
});
test("old acknowledgements and regressive events cannot replace newer command state", () => {
  const current = {
    id: "new",
    phase: "running",
    requested: "60%",
    events: [{ phase: "running", at: 100 }],
  };
  assert.equal(
    applyCommandEvent(current, "old", { phase: "verified", at: 200 }),
    current,
  );
  assert.equal(
    applyCommandEvent(current, "new", { phase: "verified", at: 90 }),
    current,
  );
  assert.equal(
    applyCommandEvent(current, "new", { phase: "accepted", at: 200 }),
    current,
  );
  const verified = applyCommandEvent(current, "new", {
    phase: "verified",
    at: 200,
  });
  assert.equal(verified.phase, "verified");
  assert.equal(verified.events.length, 2);
  assert.equal(
    applyCommandEvent(verified, "new", { phase: "failed", at: 300 }),
    verified,
  );
});
test("a timeout remains unknown until an explicit matching verified event arrives", () => {
  const record = {
    id: "r",
    phase: "timeout",
    requested: "stop",
    events: [{ phase: "timeout", at: 200 }],
  };
  assert.equal(
    applyCommandEvent(record, "r", { phase: "accepted", at: 300 }),
    record,
  );
  assert.equal(
    applyCommandEvent(record, "r", { phase: "verified", at: 300 }).phase,
    "verified",
  );
});
test("setpoints validate zero, fractional steps, bounds and malformed ranges", () => {
  assert.equal(numericError(0, -10, 10, 0.5), null);
  assert.equal(numericError(0.3, 0, 1, 0.1), null);
  assert.ok(numericError(0.31, 0, 1, 0.1));
  for (const [value, min, max, step] of [
    [NaN, 0, 10, 1],
    [11, 0, 10, 1],
    [0, 1, 1, 1],
    [0, 0, 10, 0],
    [0, 0, Infinity, 1],
  ])
    assert.ok(numericError(value, min, max, step));
});
test("freshness rejects future or invalid timestamps and preserves zero age", () => {
  assert.equal(sampleAge(1000, 1000), 0);
  assert.equal(sampleAge(1000, 0), 1);
  for (const value of [null, undefined, NaN, Infinity, 1001])
    assert.equal(sampleAge(1000, value), null);
});
test("alarm confirmation and condition recovery are independent", () => {
  assert.equal(alarmState(true, false), "仍在发生 · 未确认");
  assert.equal(alarmState(true, true), "仍在发生 · 已确认");
  assert.equal(alarmState(false, false), "已恢复 · 未确认");
  assert.equal(alarmState(false, true), "已恢复 · 已确认");
  assert.equal(alarmState(undefined, true), "条件未知 · 已确认");
});
test("irrigation progress never fabricates missing totals or measurements", () => {
  assert.equal(irrigationProgress(0, 12), 0);
  assert.equal(irrigationProgress(6, 12), 50);
  for (const pair of [
    [null, 12],
    [6, null],
    [6, 0],
    [-1, 12],
    [NaN, 12],
    [6, Infinity],
  ])
    assert.equal(irrigationProgress(...pair), null);
  assert.equal(irrigationProgress(13, 12), 100);
});
test("trend windows, explicit gaps, elapsed gaps and duplicate samples have consistent geometry", () => {
  const input = [
    { timestamp: 0, value: 0 },
    { timestamp: 1, value: 1 },
    { timestamp: 2, value: null },
    { timestamp: 3, value: 3 },
    { timestamp: 10, value: 10 },
    { timestamp: 10, value: 11 },
  ];
  assert.deepEqual(
    trendSegments(input, 0, 10, 2).map((s) => s.map((p) => p.value)),
    [[0, 1], [3], [11]],
  );
  assert.deepEqual(
    trendSegments(input, 1, 3).map((s) => s.map((p) => p.value)),
    [[1], [3]],
  );
  assert.deepEqual(trendSegments([{ timestamp: 0, value: NaN }], 0, 1), []);
  assert.equal(input.length, 6);
});
test("shared scale covers all row controls, and category overrides remain isolated", () => {
  const enlarged = commonVariables({ ...defaultSettings, controlHeight: 48 });
  for (const key of [
    "button-height",
    "input-height",
    "select-height",
    "nav-height",
    "menu-item-height",
    "tab-height",
  ])
    assert.equal(enlarged["--" + key], "48px", key);
  assert.equal(enlarged["--button-height-xs"], "36px");
  assert.equal(enlarged["--button-height-sm"], "42px");
  assert.equal(enlarged["--button-height-lg"], "54px");
  const custom = {
    ...defaultSettings,
    controlHeight: 48,
    geometry: { "input-height": 40, "button-height": 40, "nav-height": 44 },
  };
  const variables = commonVariables(custom);
  assert.equal(variables["--input-height"], "40px");
  assert.equal(variables["--nav-height"], "44px");
  assert.equal(variables["--select-height"], "48px");
  assert.equal(variables["--button-height-sm"], "35px");
  assert.deepEqual(
    parseSettings(JSON.parse(serializeSettings(custom))),
    custom,
  );
  delete custom.geometry["input-height"];
  assert.equal(commonVariables(custom)["--input-height"], "48px");
});
test("legacy border overrides drive both categories unless explicitly overridden", () => {
  const v = commonVariables({
    ...defaultSettings,
    geometry: { "control-border-width": 2, "input-border-width": 0.5 },
  });
  assert.equal(v["--button-border-width"], "2px");
  assert.equal(v["--input-border-width"], "0.5px");
});
