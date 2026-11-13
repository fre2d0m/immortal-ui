import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  connectionIssue,
  defaultWorkflowNodeSummary,
  formatWorkflowSummaryValue,
  layoutWorkflow,
  parseWorkflow,
  planWorkflowStep,
  planWorkflowEdgeStep,
  placeWorkflowStep,
  workflowStepContext,
  validateWorkflow,
  workflowSignature,
  workflowPublicationStatus,
  workflowNodeSummaryText,
} from "../registry/immortal/blocks/workflow-model.ts";
import {
  createWorkflowDemo,
  summarizeWorkflowDemoNode,
  workflowTemplates,
} from "../src/lib/workflow-demo-data.ts";
import {
  processDemoNode,
  runWorkflowDemo,
} from "../src/lib/workflow-demo-runner.ts";

const get = (flow, id) => flow.nodes.find((node) => node.id === id);
const result = (run, id) => run.nodes.find((node) => node.nodeId === id);
const set = (node, key, value) => {
  node.parameters.find((field) => field.key === key).value = value;
};
const context = () => ({ signal: new AbortController().signal, onUpdate() {} });
const execute = (flow, scenario = "normal", options = {}) =>
  runWorkflowDemo(flow, scenario, context(), { delayMs: 0, ...options });

test("publication uses host metadata for the current workflow, never infers publication from a draft", () => {
  const flow = createWorkflowDemo();
  assert.equal(workflowPublicationStatus(flow), "unknown");
  assert.equal(
    workflowPublicationStatus(flow, { workflowId: flow.id, status: "draft" }),
    "draft",
  );
  assert.equal(
    workflowPublicationStatus(flow, {
      workflowId: "another-flow",
      status: "draft",
    }),
    "unknown",
  );
  assert.equal(
    workflowPublicationStatus(flow, {
      workflowId: "another-flow",
      status: "published",
      definitionSignature: workflowSignature(flow),
    }),
    "unknown",
  );
});

test("publication follows semantic edits and undo while retaining publication on layout-only changes", () => {
  const flow = createWorkflowDemo();
  const publication = {
    workflowId: flow.id,
    status: "published",
    definitionSignature: workflowSignature(flow),
  };
  const moved = structuredClone(flow);
  moved.nodes[0].position = { x: 150, y: 240 };
  assert.equal(workflowPublicationStatus(moved, publication), "published");
  const changed = structuredClone(moved);
  get(changed, "condition").parameters.find(
    (field) => field.key === "threshold",
  ).value = 25;
  assert.equal(workflowPublicationStatus(changed, publication), "changed");
  assert.equal(workflowPublicationStatus(flow, publication), "published");
});

test("adapter summaries follow stable parameter keys and changed configuration without changing the definition", () => {
  const flow = createWorkflowDemo(),
    aggregate = get(flow, "aggregate"),
    condition = get(flow, "condition");
  const before = workflowSignature(flow),
    initial = summarizeWorkflowDemoNode(aggregate);
  assert.deepEqual(initial.fields, [
    { label: "Metric", value: "water.temperature" },
    { label: "Method", value: "Mean" },
    { label: "Window", value: 20, unit: "min" },
  ]);
  assert.equal(workflowSignature(flow), before);
  aggregate.parameters.reverse();
  assert.deepEqual(summarizeWorkflowDemoNode(aggregate), initial);
  set(aggregate, "method", "max");
  set(aggregate, "to", "2026-11-12T00:10:00Z");
  assert.equal(summarizeWorkflowDemoNode(aggregate).fields[1].value, "Maximum");
  assert.equal(summarizeWorkflowDemoNode(aggregate).fields[2].value, 10);
  condition.parameters.reverse();
  set(condition, "threshold", 0);
  assert.equal(
    workflowNodeSummaryText(summarizeWorkflowDemoNode(condition)),
    "Aggregated value ≥ 0",
  );
  set(condition, "operator", "lt");
  set(condition, "threshold", -5);
  assert.equal(
    workflowNodeSummaryText(summarizeWorkflowDemoNode(condition)),
    "Aggregated value < -5",
  );
  condition.parameters = condition.parameters.filter(
    (field) => field.key !== "threshold",
  );
  assert.equal(summarizeWorkflowDemoNode(condition).value, null);
  set(aggregate, "to", "invalid");
  assert.equal(
    summarizeWorkflowDemoNode(aggregate).fields[2].value,
    "Invalid time range",
  );
  assert.equal(formatWorkflowSummaryValue(0, "°C"), "0 °C");
  assert.equal(formatWorkflowSummaryValue(false), "false");
  assert.equal(formatWorkflowSummaryValue(""), "Empty text");
  assert.equal(formatWorkflowSummaryValue(null), "Not configured");
  assert.equal(formatWorkflowSummaryValue(NaN), "Invalid value");
});

test("generic summaries expose only editor-owned structure and never choose arbitrary adapter parameters", () => {
  const flow = createWorkflowDemo();
  flow.maxConcurrency = 1;
  assert.equal(
    workflowNodeSummaryText(
      defaultWorkflowNodeSummary(get(flow, "parallel"), flow),
    ),
    "Branches: 2; Concurrency: 1",
  );
  const join = get(flow, "join");
  join.joinMode = "any";
  assert.equal(
    workflowNodeSummaryText(defaultWorkflowNodeSummary(join, flow)),
    "Wait for: Any input to succeed; Input: 2",
  );
  flow.edges = flow.edges.filter((edge) => edge.target !== "weather");
  assert.equal(
    defaultWorkflowNodeSummary(get(flow, "parallel"), flow).fields[0].value,
    1,
  );
  const source = get(flow, "water");
  source.description = "This is documentation, not configuration";
  assert.deepEqual(defaultWorkflowNodeSummary(source, flow), {
    type: "fields",
    fields: [{ label: "Parameters", value: 2 }],
  });
  assert.equal(
    summarizeWorkflowDemoNode({ ...source, operation: "unknown-adapter" }),
    undefined,
  );
});

test("the complete multi-source demo validates and round trips without losing its policy or positions", () => {
  const flow = createWorkflowDemo();
  assert.deepEqual(validateWorkflow(flow), []);
  assert.deepEqual(parseWorkflow(JSON.stringify(flow)), flow);
  const arranged = layoutWorkflow(flow);
  assert.equal(workflowSignature(flow), workflowSignature(arranged));
  for (const edge of flow.edges)
    assert.ok(
      get(arranged, edge.source).position.x <
        get(arranged, edge.target).position.x,
    );
});

test("empty workflows, disconnected branches and invalid required configuration are actionable", () => {
  const flow = createWorkflowDemo();
  assert.ok(
    validateWorkflow({ ...flow, nodes: [], edges: [] }).some(
      (issue) => issue.code === "empty",
    ),
  );
  flow.edges = flow.edges.filter((edge) => edge.target !== "weather");
  set(get(flow, "water"), "sourceRef", "");
  flow.maxConcurrency = 0;
  const issues = validateWorkflow(flow);
  for (const code of [
    "input",
    "unreachable",
    "required",
    "concurrency",
    "parallel-outputs",
  ])
    assert.ok(
      issues.some((issue) => issue.code === code),
      code,
    );
});

test("layout uses measured height for compact nodes, long labels and enlarged text", () => {
  for (const height of [92, 500]) {
    const arranged = layoutWorkflow(createWorkflowDemo(), {
      water: { height },
    });
    assert.equal(
      get(arranged, "weather").position.y - get(arranged, "water").position.y,
      height + 112,
    );
  }
});

test("connections reject self loops, cycles, wrong ports, missing nodes, incompatible types and duplicate fanout", () => {
  const flow = createWorkflowDemo();
  assert.match(
    connectionIssue(flow, { source: "water", target: "water", port: "out" }),
    /itself/,
  );
  assert.match(connectionIssue(flow, flow.edges[0]), /already exists/);
  assert.match(
    connectionIssue(flow, { source: "store", target: "water", port: "out" }),
    /does not have this output/,
  );
  assert.match(
    connectionIssue(flow, {
      source: "no-such-node",
      target: "water",
      port: "out",
    }),
    /does not exist/,
  );
  assert.match(
    connectionIssue(flow, { source: "quality", target: "event", port: "out" }),
    /trigger/i,
  );
  const cyclic = structuredClone({
    ...flow,
    edges: flow.edges.filter(
      (edge) => edge.source !== "quality" && edge.target !== "water",
    ),
  });
  get(cyclic, "water").inputType = "any";
  assert.match(
    connectionIssue(cyclic, {
      source: "quality",
      target: "water",
      port: "out",
    }),
    /cycle/,
  );
  const incompatible = structuredClone(cyclic);
  get(incompatible, "water").inputType = "image";
  assert.match(
    connectionIssue(incompatible, {
      source: "quality",
      target: "water",
      port: "out",
    }),
    /types/i,
  );
  assert.match(
    connectionIssue(flow, { source: "event", target: "join", port: "out" }),
    /parallel split/,
  );
  assert.match(
    connectionIssue(flow, {
      source: "parallel",
      target: "quality",
      port: "out",
    }),
    /join/,
  );
});

test("import rejects malformed nested config and duplicate ids while retaining editable structural errors", () => {
  for (const bad of [
    "null",
    "[]",
    "{}",
    "{",
    JSON.stringify({ ...createWorkflowDemo(), nodes: [null] }),
    JSON.stringify({
      ...createWorkflowDemo(),
      nodes: [{ ...createWorkflowDemo().nodes[0], parameters: [null] }],
    }),
  ])
    assert.throws(() => parseWorkflow(bad));
  const flow = createWorkflowDemo();
  flow.nodes.push(flow.nodes[0]);
  assert.throws(() => parseWorkflow(JSON.stringify(flow)), /duplicate/i);
  const editable = createWorkflowDemo();
  editable.edges = [];
  assert.equal(
    parseWorkflow(JSON.stringify(editable)).nodes.length,
    editable.nodes.length,
  );
});

test("all node kinds have templates; configuration changes invalidate runs but positions do not", () => {
  assert.equal(new Set(workflowTemplates.map((node) => node.kind)).size, 11);
  const flow = createWorkflowDemo(),
    before = workflowSignature(flow);
  get(flow, "water").position.x = -50;
  assert.equal(workflowSignature(flow), before);
  set(get(flow, "condition"), "threshold", 0);
  assert.notEqual(workflowSignature(flow), before);
  get(flow, "condition").parameters[1].value = Infinity;
  assert.ok(validateWorkflow(flow).some((issue) => issue.code === "number"));
});

test("known inputs drive sample counts, units, windows and opposite condition branches", async () => {
  const flow = createWorkflowDemo();
  const normal = await execute(flow);
  assert.equal(normal.status, "succeeded");
  assert.equal(result(normal, "aggregate").output.value, 20);
  assert.equal(result(normal, "aggregate").output.sampleCount, 3);
  assert.equal(result(normal, "aggregate").output.unit, "°C");
  assert.deepEqual(result(normal, "aggregate").output.inputWindow, {
    from: "2026-11-12T00:00:00.000Z",
    to: "2026-11-12T00:20:00.000Z",
    boundaries: "inclusive",
  });
  assert.equal(result(normal, "join").output.length, 6);
  assert.equal(result(normal, "notify").status, "skipped");
  assert.equal(result(normal, "store").output.payload.value, 20);
  const warm = await execute(flow, "warm");
  assert.equal(result(warm, "aggregate").output.value, 26);
  assert.equal(result(warm, "notify").output.payload.value, 26);
  assert.equal(result(warm, "store").status, "skipped");
});

test("parallel source tasks overlap and ALL waits for both; the concurrency cap is enforced", async () => {
  const flow = createWorkflowDemo();
  const active = [];
  const run = await execute(flow, "normal", {
    delayMs: 3,
    onActive: (ids) => active.push(ids),
  });
  assert.ok(
    active.some((ids) => ids.includes("water") && ids.includes("weather")),
  );
  assert.ok(
    Math.max(...active.map((ids) => ids.length)) <= flow.maxConcurrency,
  );
  for (const id of ["water", "weather"])
    assert.ok(
      Date.parse(result(run, "join").startedAt) >=
        Date.parse(result(run, id).finishedAt),
    );
  flow.maxConcurrency = 1;
  const serial = [];
  await execute(flow, "normal", { onActive: (ids) => serial.push(ids) });
  assert.equal(Math.max(...serial.map((ids) => ids.length)), 1);
});

test("ANY continues after a successful branch even if another branch fails; ALL blocks it", async () => {
  const flow = createWorkflowDemo();
  const all = await execute(flow, "failure");
  assert.equal(all.status, "failed");
  assert.equal(result(all, "join").status, "failed");
  assert.equal(result(all, "aggregate").status, "skipped");
  assert.equal(result(all, "store").status, "skipped");
  get(flow, "join").joinMode = "any";
  const any = await execute(flow, "failure");
  assert.equal(result(any, "join").status, "succeeded");
  assert.equal(result(any, "store").status, "succeeded");
  assert.equal(
    any.status,
    "failed",
    "a successful join must not hide another failed branch",
  );
});

test("missing values change coverage; explicit rejection sends the actual error to the failure route", async () => {
  const flow = createWorkflowDemo();
  const drop = await execute(flow, "missing");
  assert.equal(result(drop, "aggregate").output.sampleCount, 2);
  assert.equal(result(drop, "aggregate").output.value, 20);
  assert.equal(result(drop, "quality").input.length, 6);
  assert.equal(result(drop, "quality").output.length, 5);
  set(get(flow, "quality"), "invalid", "reject");
  const reject = await execute(flow, "missing");
  assert.equal(reject.status, "failed");
  assert.equal(result(reject, "quality").status, "failed");
  assert.equal(result(reject, "failure").status, "succeeded");
  assert.match(result(reject, "failure").output.payload.error, /1 invalid/);
  assert.equal(result(reject, "aggregate").status, "skipped");
});

test("retry and timeout policy are observed and cancellation does not dispatch downstream work", async () => {
  const flow = createWorkflowDemo();
  get(flow, "weather").maxAttempts = 3;
  const failed = await execute(flow, "failure");
  assert.equal(result(failed, "weather").attempts, 3);
  get(flow, "water").timeoutMs = 1;
  const timedOut = await execute(flow, "normal", { delayMs: 2 });
  assert.match(result(timedOut, "water").message, /timeout/);
  const controller = new AbortController();
  const cancelled = await runWorkflowDemo(
    createWorkflowDemo(),
    "normal",
    {
      signal: controller.signal,
      onUpdate: (run) => {
        if (result(run, "water").status === "running") controller.abort();
      },
    },
    { delayMs: 2 },
  );
  assert.equal(cancelled.status, "cancelled");
  assert.equal(result(cancelled, "aggregate").status, "cancelled");
  assert.equal(result(cancelled, "store").startedAt, undefined);
});

test("aggregation preserves zero, negatives, exact window boundaries and mixed-unit errors", () => {
  const aggregate = get(createWorkflowDemo(), "aggregate");
  set(aggregate, "from", "2025-12-31T23:50:00Z");
  set(aggregate, "to", "2026-01-01T00:10:00Z");
  const rows = [-10, 0, 10].map((value, index) => ({
    source: "fixture",
    metric: "water.temperature",
    value,
    unit: "°C",
    sampledAt: [
      "2025-12-31T23:50:00Z",
      "2026-01-01T00:00:00Z",
      "2026-01-01T00:10:00Z",
    ][index],
    quality: "good",
  }));
  const calculated = processDemoNode(aggregate, rows, "normal").value;
  assert.equal(calculated.value, 0);
  assert.equal(calculated.sampleCount, 3);
  assert.throws(
    () =>
      processDemoNode(
        aggregate,
        [...rows, { ...rows[0], unit: "°F" }],
        "normal",
      ),
    /units/i,
  );
  assert.throws(
    () => processDemoNode(aggregate, [], "normal"),
    /valid samples/,
  );
  set(aggregate, "from", "bad date");
  assert.throws(() => processDemoNode(aggregate, rows, "normal"), /window/);
});

test("constant and single observations stay exact; no model inference is invented", () => {
  const aggregate = get(createWorkflowDemo(), "aggregate");
  const row = {
    metric: "water.temperature",
    value: 0,
    unit: "°C",
    sampledAt: "2026-11-12T00:00:00Z",
    quality: "good",
  };
  assert.equal(processDemoNode(aggregate, [row], "normal").value.value, 0);
  assert.equal(
    processDemoNode(aggregate, [row, { ...row }], "normal").value.sampleCount,
    2,
    "input records are not silently deduplicated",
  );
  assert.throws(
    () =>
      processDemoNode(
        workflowTemplates.find((item) => item.kind === "model"),
        [],
        "normal",
      ),
    /No model is connected/,
  );
});

test("conversion targets one metric, preserves other units and retains the original observation", () => {
  const transform = structuredClone(
    workflowTemplates.find((item) => item.kind === "transform"),
  );
  set(transform, "factor", 1.8);
  set(transform, "offset", 32);
  set(transform, "unit", "°F");
  const water = {
    source: "water",
    metric: "water.temperature",
    value: -10,
    unit: "°C",
    sampledAt: "2026-11-12T00:00:00Z",
    quality: "good",
  };
  const rain = { ...water, metric: "weather.rainfall", value: 0, unit: "mm" };
  const converted = processDemoNode(
    transform,
    [water, rain, { ...water, value: null, quality: "invalid" }],
    "normal",
  ).value;
  assert.equal(converted[0].value, 14);
  assert.equal(converted[0].unit, "°F");
  assert.equal(converted[0].transformation.originalValue, -10);
  assert.equal(converted[0].transformation.originalUnit, "°C");
  assert.deepEqual(converted[1], rain);
  assert.equal(converted[2].value, null);
  assert.equal(water.value, -10);
  assert.throws(
    () => processDemoNode(transform, [{ ...water, unit: "K" }], "normal"),
    /Source units/,
  );
  set(transform, "factor", 1e308);
  assert.throws(
    () => processDemoNode(transform, [water], "normal"),
    /finite number/,
  );
});

test("install package declares React Flow and ships its own styles/model without showcase adapters", () => {
  const payload = JSON.parse(
    readFileSync(
      new URL("../public/r/data-workflow.json", import.meta.url),
      "utf8",
    ),
  );
  assert.ok(
    payload.dependencies.some((name) => name.startsWith("@xyflow/react@")),
  );
  for (const file of [
    "data-workflow.tsx",
    "data-workflow.css",
    "workflow-model.ts",
    "workflow-parts.tsx",
  ])
    assert.ok(
      payload.files.some((entry) => entry.target.endsWith(file)),
      file,
    );
  for (const file of payload.files)
    assert.doesNotMatch(
      file.content,
      /workflow-demo|demoObservations|runWorkflowDemo|@\/lib\/demo-data/,
    );
  assert.ok(
    payload.registryDependencies.some((name) => name.endsWith("/tabs.json")),
  );
  assert.ok(
    !payload.files.some((file) =>
      /\/panel(?:-header)?\.tsx$/.test(file.target),
    ),
  );
});

test("endpoint insertion preserves both ends and explicitly chooses a condition continuation", () => {
  const flow = createWorkflowDemo();
  const before = JSON.stringify(flow);
  const candidate = {
    ...structuredClone(get(flow, "quality")),
    id: "inserted",
  };
  const plan = planWorkflowStep(
    flow,
    { nodeId: "water", port: "out" },
    candidate,
    "out",
  );
  assert.equal(plan.issue, null);
  assert.deepEqual(plan.remove, [
    flow.edges.find((e) => e.source === "water" && e.port === "out").id,
  ]);
  assert.deepEqual(plan.edges, [
    { source: "water", port: "out", target: "inserted" },
    { source: "inserted", port: "out", target: "join" },
  ]);
  const condition = {
    ...structuredClone(get(flow, "condition")),
    id: "new-condition",
  };
  assert.match(
    planWorkflowStep(flow, { nodeId: "condition", port: "false" }, condition)
      .issue,
    /Choose.*output/,
  );
  const chosen = planWorkflowStep(
    flow,
    { nodeId: "condition", port: "false" },
    condition,
    "true",
  );
  assert.equal(chosen.issue, null);
  assert.deepEqual(chosen.edges, [
    { source: "condition", port: "false", target: "new-condition" },
    { source: "new-condition", port: "true", target: "store" },
  ]);
  assert.equal(JSON.stringify(flow), before);
});

test("input endpoint insertion preserves its upstream source and excludes incompatible intermediates", () => {
  const flow = createWorkflowDemo();
  const candidate = {
    ...structuredClone(get(flow, "parallel")),
    id: "inserted",
  };
  const plan = planWorkflowStep(
    flow,
    { nodeId: "water", port: "in" },
    candidate,
    "out",
  );
  assert.equal(plan.issue, null);
  assert.deepEqual(plan.edges, [
    { source: "parallel", port: "out", target: "inserted" },
    { source: "inserted", port: "out", target: "water" },
  ]);
  assert.match(
    planWorkflowStep(
      flow,
      { nodeId: "water", port: "in" },
      { ...candidate, outputType: "image" },
      "out",
    ).issue,
    /types/i,
  );
  assert.match(
    planWorkflowStep(flow, { nodeId: "event", port: "in" }, candidate, "out")
      .issue,
    /trigger/i,
  );
});

test("parallel and join endpoints add branches without replacing existing connections", () => {
  const flow = createWorkflowDemo();
  const source = { ...structuredClone(get(flow, "water")), id: "third-source" };
  const branch = planWorkflowStep(
    flow,
    { nodeId: "parallel", port: "out" },
    source,
  );
  assert.equal(branch.issue, null);
  assert.deepEqual(branch.remove, []);
  assert.deepEqual(branch.edges, [
    { source: "parallel", port: "out", target: "third-source" },
  ]);
  const joined = planWorkflowStep(
    flow,
    { nodeId: "join", port: "in" },
    source,
    "out",
  );
  assert.equal(joined.issue, null);
  assert.deepEqual(joined.remove, []);
  assert.equal(
    workflowStepContext(flow, { nodeId: "water", port: "out" }).mode,
    "insert",
  );
  assert.equal(
    workflowStepContext(flow, { nodeId: "parallel", port: "out" }).mode,
    "after",
  );
});

test("edge insertion replaces only the chosen parallel branch and can be committed atomically", () => {
  const flow = createWorkflowDemo();
  const before = JSON.stringify(flow);
  const edge = flow.edges.find(
    (item) => item.source === "parallel" && item.target === "water",
  );
  const candidate = {
    ...structuredClone(get(flow, "parallel")),
    id: "inserted-parallel",
  };
  const plan = planWorkflowEdgeStep(flow, edge.id, candidate, "out");
  assert.equal(plan.issue, null);
  assert.deepEqual(plan.remove, [edge.id]);
  assert.deepEqual(plan.edges, [
    { source: "parallel", port: "out", target: candidate.id },
    { source: candidate.id, port: "out", target: "water" },
  ]);
  const next = {
    ...flow,
    nodes: [...flow.nodes, candidate],
    edges: [
      ...flow.edges.filter((item) => !plan.remove.includes(item.id)),
      ...plan.edges.map((item, i) => ({ ...item, id: `insert-${i}` })),
    ],
  };
  assert.deepEqual(
    next.edges.find(
      (item) => item.source === "parallel" && item.target === "weather",
    ),
    flow.edges.find(
      (item) => item.source === "parallel" && item.target === "weather",
    ),
  );
  assert.equal(JSON.stringify(flow), before);
  assert.ok(
    !validateWorkflow(next).some((issue) => issue.message.includes("cycle")),
  );
});

test("edge insertion retains condition ports and rejects invalid intermediates without mutating input", () => {
  const flow = createWorkflowDemo(),
    before = JSON.stringify(flow);
  const conditionEdge = flow.edges.find(
    (item) => item.source === "condition" && item.port === "false",
  );
  const condition = {
    ...structuredClone(get(flow, "condition")),
    id: "inserted-condition",
  };
  assert.ok(planWorkflowEdgeStep(flow, conditionEdge.id, condition).issue);
  const plan = planWorkflowEdgeStep(flow, conditionEdge.id, condition, "true");
  assert.equal(plan.issue, null);
  assert.equal(plan.edges[0].port, "false");
  assert.equal(plan.edges[1].port, "true");
  assert.ok(
    planWorkflowEdgeStep(flow, conditionEdge.id, get(flow, "condition"), "true")
      .issue,
  );
  assert.ok(planWorkflowEdgeStep(flow, "missing", condition, "true").issue);
  const errorEdge = flow.edges.find((item) => item.port === "error");
  assert.ok(
    planWorkflowEdgeStep(
      flow,
      errorEdge.id,
      { ...structuredClone(get(flow, "aggregate")), id: "invalid-processor" },
      "out",
    ).issue,
  );
  assert.equal(JSON.stringify(flow), before);
});

test("existing node candidates reject duplicates, cycles and occupied ordinary ports", () => {
  const flow = createWorkflowDemo();
  assert.match(
    planWorkflowStep(
      flow,
      { nodeId: "parallel", port: "out" },
      get(flow, "water"),
    ).issue,
    /already exists/,
  );
  assert.match(
    planWorkflowStep(
      flow,
      { nodeId: "water", port: "out" },
      get(flow, "join"),
      "out",
    ).issue,
    /new node/,
  );
  flow.edges = flow.edges.filter(
    (e) => !(e.source === "water" && e.port === "out"),
  );
  const joined = planWorkflowStep(
    flow,
    { nodeId: "water", port: "out" },
    get(flow, "join"),
  );
  assert.equal(joined.issue, null);
  assert.deepEqual(joined.edges, [
    { source: "water", port: "out", target: "join" },
  ]);
  const cyclic = createWorkflowDemo();
  get(cyclic, "water").inputType = "any";
  cyclic.edges = cyclic.edges.filter(
    (e) => e.source !== "quality" && e.target !== "water",
  );
  assert.match(
    planWorkflowStep(
      cyclic,
      { nodeId: "quality", port: "out" },
      get(cyclic, "water"),
    ).issue,
    /cycle/,
  );
});

test("failure payloads do not enter observation-only processors, including parallel failures", () => {
  const flow = createWorkflowDemo();
  flow.edges = flow.edges.filter((e) => e.source !== "quality");
  const candidate = {
    ...structuredClone(get(flow, "aggregate")),
    id: "new-aggregate",
  };
  assert.match(
    planWorkflowStep(flow, { nodeId: "quality", port: "error" }, candidate)
      .issue,
    /error.*aggregation|error.*observations/,
  );
  const failure = {
    ...structuredClone(get(flow, "failure")),
    id: "new-failure",
  };
  assert.equal(
    planWorkflowStep(flow, { nodeId: "quality", port: "error" }, failure).issue,
    null,
  );
  flow.edges.push({
    id: "parallel-error",
    source: "parallel",
    port: "error",
    target: "failure",
  });
  const expanded = { ...flow, nodes: [...flow.nodes, failure] };
  assert.match(
    connectionIssue(expanded, {
      source: "parallel",
      port: "error",
      target: failure.id,
    }),
    /An output port/,
  );
});

test("step placement respects measured nodes and leaves existing coordinates untouched", () => {
  const flow = createWorkflowDemo();
  flow.nodes = [get(flow, "event")];
  flow.nodes[0].position = { x: 0, y: 0 };
  const before = JSON.stringify(flow);
  assert.deepEqual(placeWorkflowStep(flow, { x: 360, y: 0 }), { x: 360, y: 0 });
  assert.deepEqual(placeWorkflowStep(flow, { x: 0, y: 0 }), { x: 0, y: 280 });
  assert.deepEqual(
    placeWorkflowStep(
      flow,
      { x: 0, y: 0 },
      { event: { width: 232, height: 400 } },
    ),
    { x: 0, y: 512 },
  );
  assert.equal(JSON.stringify(flow), before);
});

test("legacy demo labels become English without changing custom data, identifiers or topology", async () => {
  const { migrateWorkflowDemoLanguage } =
    await import("../src/lib/workflow-demo-language.ts");
  const flow = createWorkflowDemo();
  flow.name = "流域观测 · 多源数据处理";
  const water = get(flow, "water");
  water.label = "北岸水温观测";
  water.parameters[0].label = "连接引用";
  water.parameters[0].value = "数据源";
  const condition = get(flow, "condition");
  condition.label = "自定义复核流程";
  const snapshot = structuredClone(flow);
  const migrated = migrateWorkflowDemoLanguage(flow);
  assert.equal(migrated.name, "Watershed monitoring · Multi-source processing");
  assert.equal(get(migrated, "water").label, "North bank temperature");
  assert.equal(
    get(migrated, "water").parameters[0].label,
    "Connection reference",
  );
  assert.equal(get(migrated, "water").parameters[0].value, "数据源");
  assert.equal(get(migrated, "condition").label, "自定义复核流程");
  assert.deepEqual(migrated.edges, flow.edges);
  assert.deepEqual(
    migrated.nodes.map(({ id, position }) => ({ id, position })),
    flow.nodes.map(({ id, position }) => ({ id, position })),
  );
  assert.deepEqual(flow, snapshot);
});
