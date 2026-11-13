import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const url = (source) =>
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`;
const telemetryUrl = url(
  readFileSync(
    new URL("../registry/immortal/components/telemetry.ts", import.meta.url),
    "utf8",
  ),
);
const modelUrl = url(
  readFileSync(
    new URL("../registry/immortal/blocks/soil-water-model.ts", import.meta.url),
    "utf8",
  ).replace('"@/lib/telemetry"', JSON.stringify(telemetryUrl)),
);
const model = await import(modelUrl);
const demoUrl = url(
  readFileSync(
    new URL("../src/lib/soil-water-demo.ts", import.meta.url),
    "utf8",
  ).replaceAll(
    '"@/components/blocks/soil-water-model"',
    JSON.stringify(modelUrl),
  ),
);
const { annualSoilDemo, soilHandCheckDemo } = await import(demoUrl);
const {
  prepareSoilData,
  createSoilView,
  binSoilRecords,
  recordsInWindow,
  packSoilEvents,
  soilExport,
  clampSoilWindow,
  eventInWindow,
  SOIL_HOUR: hour,
  SOIL_DAY: day,
} = model;

test("known cross-year input: zero, negative, gap, outlier, last duplicate and invalid stay distinct", () => {
  const input = soilHandCheckDemo(),
    prepared = prepareSoilData(input),
    view = createSoilView(prepared, input.window);
  assert.equal(prepared.depths[0].records.length, 6);
  assert.equal(prepared.depths[0].records.at(-1).value, 20);
  assert.deepEqual(
    view.layers[0].bins.map((b) => b.mean),
    [0, 10, null, -5, null, null, 70, 20],
  );
  assert.deepEqual(
    view.layers[1].bins.map((b) => b.mean),
    Array(8).fill(25),
  );
  assert.deepEqual(
    view.layers[2].bins.map((b) => b.mean),
    [null, null, null, 15, null, null, null, null],
  );
  assert.deepEqual([prepared.scale.min, prepared.scale.max], [-5, 70]);
  assert.equal(view.layers[2].bins[4].invalid, 1);
  assert.equal(view.layers[0].bins[6].uncertain, 1);
  assert.equal(view.layers[0].bins[2].received, 1);
  assert.equal(view.layers[0].bins[4].received, 0);
  assert.equal(view.cellCount, 24);
  assert.equal(
    input.depths[0].records[0].value,
    999,
    "caller order and data remain unchanged",
  );
});
test("daily bin mean and extrema are hand-checkable and never fill missing samples", () => {
  const points = [
    { timestamp: 0, value: 0 },
    { timestamp: hour, value: 10 },
    { timestamp: 2 * hour, value: null },
    { timestamp: 3 * hour, value: -5 },
    { timestamp: 4 * hour, value: 70 },
    { timestamp: 5 * hour, value: 20 },
    { timestamp: 6 * hour, value: 100, quality: "bad" },
  ];
  const [bin] = binSoilRecords(points, { from: 0, to: 8 * hour }, day, hour, 0);
  assert.equal(bin.mean, 19);
  assert.equal(bin.min, -5);
  assert.equal(bin.max, 70);
  assert.equal(bin.count, 5);
  assert.equal(bin.covered, 5);
  assert.equal(bin.received, 7);
  assert.equal(bin.expected, 8);
  assert.equal(bin.invalid, 1);
});
test("irregular multiple observations cannot fake complete time-slot coverage", () => {
  const points = [
    { timestamp: 0, value: 10 },
    { timestamp: hour / 2, value: 30 },
  ];
  const [bin] = binSoilRecords(points, { from: 0, to: 2 * hour }, day, hour, 0);
  assert.equal(bin.count, 2);
  assert.equal(bin.covered, 1);
  assert.equal(bin.expected, 2);
  assert.equal(bin.mean, 20);
});
test("year fixture has 175200 expected slots and retains every failure and unreported gap", () => {
  const data = annualSoilDemo(),
    prepared = prepareSoilData(data),
    view = createSoilView(prepared, data.window);
  assert.equal(prepared.depths.length, 20);
  assert.equal(prepared.stats.expected, 175200);
  assert.equal(prepared.stats.received, 175056);
  assert.equal(prepared.stats.missing, 1680);
  assert.equal(prepared.stats.invalid, 208);
  assert.equal(prepared.stats.valid, 173168);
  assert.equal(view.cellCount, 7300);
  assert.equal(view.resolution, day);
  const focus = createSoilView(prepared, {
    from: Date.UTC(2025, 6, 12),
    to: Date.UTC(2025, 6, 13),
  });
  assert.equal(focus.resolution, hour);
  assert.equal(focus.cellCount, 480);
  assert.equal(focus.layers[1].bins.filter((b) => b.invalid).length, 16);
  assert.equal(focus.layers[0].bins.filter((b) => b.count).length, 24);
  assert.equal(focus.drivers.find((d) => d.id === "rain").records[0].value, 42);
});
test("changing window changes resolution, data and counts while retaining the full-year scale", () => {
  const data = prepareSoilData(annualSoilDemo());
  const month = createSoilView(data, {
    from: Date.UTC(2025, 6, 1),
    to: Date.UTC(2025, 7, 1),
  });
  const week = createSoilView(data, {
    from: Date.UTC(2025, 6, 10),
    to: Date.UTC(2025, 6, 17),
  });
  assert.equal(month.resolution, day);
  assert.equal(month.cellCount, 31 * 20);
  assert.equal(week.resolution, hour);
  assert.equal(week.cellCount, 168 * 20);
  assert.equal(week.layers[18].bins.filter((b) => !b.received).length, 72);
  assert.deepEqual(data.window, annualSoilDemo().window);
});
test("concurrent events remain separate; instantaneous and ongoing boundaries stay explicit", () => {
  const source = soilHandCheckDemo(),
    events = packSoilEvents(source.events, source.window);
  assert.equal(events.filter((l) => l.kind === "irrigation").length, 2);
  assert.equal(events.flatMap((l) => l.events).length, 4);
  const instant = source.events[0];
  assert.equal(
    eventInWindow(instant, { from: instant.from, to: instant.from + hour }),
    true,
  );
  assert.equal(
    eventInWindow(instant, { from: instant.from - hour, to: instant.from }),
    false,
  );
  const continuous = source.events[1];
  assert.equal(
    eventInWindow(continuous, {
      from: continuous.to,
      to: continuous.to + hour,
    }),
    false,
  );
  assert.equal(
    eventInWindow(source.events[3], {
      from: source.window.to,
      to: source.window.to + hour,
    }),
    true,
  );
});
test("export matches raw table scope, keeps original driver intervals and event edges", () => {
  const data = prepareSoilData(soilHandCheckDemo()),
    range = { from: data.window.from + hour, to: data.window.from + 5 * hour };
  const exported = soilExport(data, range, ["a"]);
  assert.equal(exported.depths.length, 1);
  assert.deepEqual(
    exported.depths[0].records.map((p) => p.value),
    [10, null, -5],
  );
  assert.deepEqual(
    exported.depths[0].records,
    recordsInWindow(data.depths[0].records, range),
  );
  assert.deepEqual(
    exported.drivers[0].records.map((p) => p.value),
    [0, 12],
  );
  assert.equal(exported.drivers[0].records[0].from, data.window.from);
  assert.equal(
    exported.events.find((e) => e.id === "duration").to,
    data.window.from + 6 * hour,
  );
  assert.equal(exported.window.boundary, "[from,to)");
});
test("different units, ambiguous intervals and duplicate identifiers fail explicitly", () => {
  const input = soilHandCheckDemo();
  assert.throws(
    () => prepareSoilData({ ...input, et0: { ...input.et0, unit: "inch" } }),
    /单位/,
  );
  assert.throws(
    () => prepareSoilData({ ...input, kc: { ...input.kc, unit: "mm" } }),
    /无量纲/,
  );
  assert.throws(
    () =>
      prepareSoilData({ ...input, depths: [input.depths[0], input.depths[0]] }),
    /重复/,
  );
  assert.throws(
    () =>
      prepareSoilData({
        ...input,
        rainfall: {
          ...input.rainfall,
          records: [
            { from: input.window.from, to: input.window.from + hour, value: 1 },
          ],
        },
      }),
    /区间/,
  );
  assert.throws(
    () =>
      prepareSoilData({
        ...input,
        rainfall: {
          ...input.rainfall,
          records: [
            ...input.rainfall.records,
            {
              from: input.window.from + hour,
              to: input.window.from + 5 * hour,
              value: 3,
            },
          ],
        },
      }),
    /重叠/,
  );
});
test("empty, invalid, single and constant inputs remain truthful", () => {
  const input = soilHandCheckDemo();
  for (const records of [
    [],
    [{ timestamp: input.window.from, value: 0 }],
    [{ timestamp: NaN, value: 12 }],
    [{ timestamp: input.window.from, value: Infinity }],
  ]) {
    const data = prepareSoilData({
      ...input,
      depths: [{ id: "empty", depthCm: 0, records }],
    });
    const view = createSoilView(data, input.window);
    assert.equal(view.layers[0].bins.length, 8);
    assert.equal(
      view.layers[0].bins.filter((b) => b.count).length,
      records[0]?.value === 0 ? 1 : 0,
    );
    assert.ok(
      Number.isFinite(data.scale.min) && Number.isFinite(data.scale.max),
    );
  }
});
test("range clamping preserves span at both ends", () => {
  assert.deepEqual(
    clampSoilWindow({ from: NaN, to: Infinity }, { from: 0, to: 100 }, 1),
    { from: 0, to: 100 },
  );
  assert.deepEqual(
    clampSoilWindow({ from: -5, to: 5 }, { from: 0, to: 100 }, 1),
    { from: 0, to: 10 },
  );
  assert.deepEqual(
    clampSoilWindow({ from: 95, to: 105 }, { from: 0, to: 100 }, 1),
    { from: 90, to: 100 },
  );
});
