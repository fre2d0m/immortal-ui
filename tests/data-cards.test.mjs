import test from "node:test";
import assert from "node:assert/strict";
import {
  comparisonValue,
  cardTimeParts,
  numberLabel,
  valueMatches,
} from "../registry/immortal/components/internal/data-card-model.ts";

test("comparison separates absolute changes, percentages and percentage points", () => {
  const baseline = { label: "较昨晚", referenceValue: 64.3 };
  assert.ok(
    Math.abs(
      comparisonValue(85.7, { ...baseline, mode: "percentage-points" }) - 21.4,
    ) < 1e-9,
  );
  assert.ok(
    Math.abs(
      comparisonValue(85.7, { ...baseline, mode: "relative" }) -
        33.28149300155522,
    ) < 1e-9,
  );
  assert.equal(
    comparisonValue(259, {
      label: "较昨晚",
      referenceValue: 218,
      mode: "absolute",
    }),
    41,
  );
  assert.equal(
    comparisonValue(8, {
      label: "较上期",
      referenceValue: 0,
      mode: "relative",
    }),
    null,
  );
  assert.equal(comparisonValue(NaN, { ...baseline, mode: "absolute" }), null);
});

test("card timestamps preserve year and seconds across day boundaries", () => {
  assert.deepEqual(cardTimeParts(Date.UTC(2025, 11, 31, 23, 45, 9)), {
    date: "2025-12-31",
    clock: "23:45:09",
    iso: "2025-12-31T23:45:09.000Z",
  });
  assert.equal(cardTimeParts(Date.UTC(2026, 0, 1))?.date, "2026-01-01");
  assert.equal(
    cardTimeParts(Date.UTC(2026, 0, 1, 0, 0, 0, 123))?.clock,
    "00:00:00.123",
  );
  assert.equal(cardTimeParts(null), null);
  assert.equal(cardTimeParts(NaN), null);
});
test("zero, false and an empty result table remain distinct from missing or mismatched data", () => {
  const identity = { id: "sample", label: "样本", subject: "设备" };
  assert.equal(
    valueMatches({ ...identity, type: "number", unit: "°C" }, 0),
    true,
  );
  assert.equal(
    valueMatches({ ...identity, type: "number", unit: "°C" }, "0"),
    false,
  );
  assert.equal(
    valueMatches(
      { ...identity, type: "state", states: [{ value: false, label: "关闭" }] },
      false,
    ),
    true,
  );
  assert.equal(
    valueMatches(
      { ...identity, type: "state", states: [{ value: false, label: "关闭" }] },
      null,
    ),
    false,
  );
  assert.equal(
    valueMatches({ ...identity, type: "table", columns: [] }, []),
    true,
  );
  assert.equal(
    valueMatches({ ...identity, type: "table", columns: [] }, null),
    false,
  );
});
test("numeric formatting preserves zero and negatives and rejects non-finite values", () => {
  assert.equal(numberLabel(0, 0), "0");
  assert.equal(numberLabel(-8.2, 1), "-8.2");
  assert.equal(numberLabel(Infinity), "—");
  assert.equal(numberLabel(1.23456789, 100), "1.234568");
});
