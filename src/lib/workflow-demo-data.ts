import type {
  WorkflowDefinition,
  WorkflowKind,
  WorkflowNode,
  WorkflowNodeSummary,
  WorkflowParameter,
  WorkflowTemplate,
} from "../../registry/immortal/blocks/workflow-model.ts";

const text = (
  key: string,
  label: string,
  value: string,
  description?: string,
): WorkflowParameter => ({
  key,
  label,
  value,
  type: "text",
  required: true,
  ...(description ? { description } : {}),
});
const number = (
  key: string,
  label: string,
  value: number,
  description?: string,
): WorkflowParameter => ({
  key,
  label,
  value,
  type: "number",
  required: true,
  ...(description ? { description } : {}),
});
const select = (
  key: string,
  label: string,
  value: string,
  options: [string, string][],
): WorkflowParameter => ({
  key,
  label,
  value,
  type: "select",
  required: true,
  options: options.map(([value, label]) => ({ value, label })),
});
function template(
  id: string,
  kind: WorkflowKind,
  label: string,
  description: string,
  parameters: WorkflowParameter[] = [],
  operation = id,
): WorkflowTemplate {
  const inputType =
    kind === "source"
      ? "event"
      : ["quality", "transform", "aggregate"].includes(kind)
        ? "observations"
        : kind === "condition"
          ? "aggregation"
          : "any";
  const outputType =
    kind === "trigger"
      ? "event"
      : ["source", "quality", "transform"].includes(kind)
        ? "observations"
        : ["aggregate", "condition"].includes(kind)
          ? "aggregation"
          : ["sink", "failure"].includes(kind)
            ? "receipt"
            : "any";
  return {
    id,
    kind,
    label,
    description,
    operation,
    parameters,
    inputType,
    outputType,
    timeoutMs: 10000,
    maxAttempts: 1,
    ...(kind === "join" ? { joinMode: "all" as const } : {}),
  };
}
const dataset = () =>
  select("dataset", "Demo data source", "water", [
    ["water", "River water temperature"],
    ["weather", "Rainfall"],
    ["laboratory", "Laboratory pH"],
  ]);
export const workflowTemplates: WorkflowTemplate[] = [
  template(
    "event",
    "trigger",
    "Event trigger",
    "Device reports, alarms or business events",
    [
      text("event", "Event type", "telemetry.received"),
      text("scope", "Event source", "Watershed / North bank"),
    ],
  ),
  template(
    "schedule",
    "trigger",
    "Scheduled trigger",
    "Periodic sampling and batch jobs",
    [
      text(
        "cron",
        "Cron expression",
        "*/10 * * * *",
        "The host service schedules this expression. The demo runs once when started manually.",
      ),
      text("timezone", "Schedule timezone", "Asia/Shanghai"),
    ],
  ),
  template(
    "manual",
    "trigger",
    "Manual trigger",
    "Manual review and historical reprocessing",
    [text("event", "Task type", "manual.reprocess")],
  ),
  template(
    "mqtt",
    "source",
    "Device data",
    "Read raw sensor observations",
    [
      text(
        "sourceRef",
        "Connection reference",
        "north-bank-mqtt",
        "Use a connection ID. The host manages credentials.",
      ),
      dataset(),
    ],
    "source",
  ),
  template(
    "http",
    "source",
    "HTTP source",
    "Weather, remote sensing or external services",
    [
      text("sourceRef", "Connection reference", "weather-api"),
      { ...dataset(), value: "weather" },
    ],
    "source",
  ),
  template(
    "sql",
    "source",
    "Database query",
    "Historical data and reference records",
    [text("sourceRef", "Connection reference", "environment-db"), dataset()],
    "source",
  ),
  template(
    "file",
    "source",
    "File input",
    "CSV files or laboratory results",
    [
      text("sourceRef", "File reference", "laboratory-import"),
      { ...dataset(), value: "laboratory" },
    ],
    "source",
  ),
  template(
    "quality",
    "quality",
    "Quality check",
    "Check missing, invalid and nonfinite values",
    [
      select("invalid", "Invalid data policy", "drop", [
        ["drop", "Drop and record"],
        ["reject", "Stop and route to failure"],
      ]),
    ],
  ),
  template(
    "transform",
    "transform",
    "Field and unit conversion",
    "Explicit linear conversion with sample timestamps preserved",
    [
      text("metric", "Target metric", "water.temperature"),
      text(
        "inputUnit",
        "Source unit",
        "°C",
        "Convert only this metric and preserve the others. Reject mismatched source units.",
      ),
      number("factor", "Scale factor", 1),
      number("offset", "Offset", 0),
      text(
        "unit",
        "Target unit",
        "°C",
        "The application defines the scale, offset and target unit.",
      ),
    ],
  ),
  template(
    "aggregate",
    "aggregate",
    "Window aggregate",
    "Check windows, samples and units by metric",
    [
      text("metric", "Metric ID", "water.temperature"),
      select("method", "Aggregation method", "mean", [
        ["mean", "Mean"],
        ["max", "Maximum"],
        ["min", "Minimum"],
      ]),
      text("from", "Window start (ISO 8601)", "2026-11-12T00:00:00Z"),
      text("to", "Window end (ISO 8601)", "2026-11-12T00:20:00Z"),
    ],
  ),
  template(
    "model",
    "model",
    "Model inference",
    "Process input with a registered model",
    [text("modelRef", "Model ID", ""), text("version", "Model version", "")],
  ),
  template(
    "condition",
    "condition",
    "Condition",
    "Route matches and nonmatches separately",
    [
      select("operator", "Comparison", "gte", [
        ["gte", "Greater than or equal to"],
        ["gt", "Greater than"],
        ["lt", "Less than"],
      ]),
      number(
        "threshold",
        "Threshold",
        21,
        "For demonstration only. This is not a water-quality standard or an operational alarm threshold.",
      ),
    ],
  ),
  template(
    "parallel",
    "parallel",
    "Parallel split",
    "Dispatch independent branches concurrently",
  ),
  template(
    "join",
    "join",
    "Join",
    "Continue after all inputs or any successful input",
  ),
  template(
    "storage",
    "sink",
    "Data storage",
    "Time-series database, object storage or warehouse",
    [text("destination", "Destination reference", "environment-observations")],
    "deliver",
  ),
  template(
    "webhook",
    "sink",
    "Webhook delivery",
    "Send processed results to a downstream service",
    [text("destination", "Destination reference", "water-review-webhook")],
    "deliver",
  ),
  template(
    "notification",
    "sink",
    "Notifications",
    "Alarm centers, subscriptions or manual review",
    [text("destination", "Destination reference", "environment-review-queue")],
    "deliver",
  ),
  template(
    "failure",
    "failure",
    "Failure archive",
    "Send error context to a replay queue",
    [text("destination", "Error queue", "environment-dead-letter")],
  ),
];

/** Adapter-owned summaries use stable keys, never parameter positions or stored copy. */
export function summarizeWorkflowDemoNode(
  node: WorkflowNode,
): WorkflowNodeSummary | undefined {
  const value = (key: string) => {
    const field = node.parameters.find((item) => item.key === key);
    if (!field) return null;
    return (
      field.options?.find((option) => option.value === field.value)?.label ??
      field.value
    );
  };
  const fields = (...entries: [string, string][]): WorkflowNodeSummary => ({
    type: "fields",
    fields: entries.map(([label, key]) => ({ label, value: value(key) })),
  });
  switch (node.operation) {
    case "event":
      return fields(["Event", "event"], ["Source", "scope"]);
    case "manual":
      return fields(["Task", "event"]);
    case "schedule":
      return fields(["Cron", "cron"], ["Timezone", "timezone"]);
    case "source":
      return fields(["Connection", "sourceRef"], ["Dataset", "dataset"]);
    case "quality":
      return fields(["On failure", "invalid"]);
    case "transform":
      return fields(
        ["Metric", "metric"],
        ["Source unit", "inputUnit"],
        ["Target unit", "unit"],
      );
    case "aggregate": {
      const from = Date.parse(String(value("from"))),
        to = Date.parse(String(value("to")));
      const minutes = (to - from) / 60000;
      return {
        type: "fields",
        fields: [
          { label: "Metric", value: value("metric") },
          { label: "Method", value: value("method") },
          {
            label: "Window",
            value:
              Number.isFinite(minutes) && minutes >= 0
                ? minutes
                : "Invalid time range",
            ...(Number.isFinite(minutes) && minutes >= 0
              ? { unit: "min" }
              : {}),
          },
        ],
      };
    }
    case "model":
      return fields(["Model", "modelRef"], ["Version", "version"]);
    case "condition": {
      const operator = node.parameters.find(
        (field) => field.key === "operator",
      )?.value;
      const symbols: Record<string, string> = { gte: "≥", gt: ">", lt: "<" };
      if (!symbols[String(operator)])
        return fields(["Comparison", "operator"], ["Threshold", "threshold"]);
      return {
        type: "expression",
        subject: "Aggregated value",
        operator: symbols[String(operator)],
        value: value("threshold"),
      };
    }
    case "deliver":
      return fields(["Destination", "destination"]);
    case "failure":
      return fields(["Error queue", "destination"]);
    default:
      return undefined;
  }
}

function node(
  templateId: string,
  id: string,
  x: number,
  y: number,
  overrides: Partial<WorkflowNode> = {},
): WorkflowNode {
  const item = workflowTemplates.find((entry) => entry.id === templateId)!;
  return { ...structuredClone(item), id, position: { x, y }, ...overrides };
}
export function createWorkflowDemo(): WorkflowDefinition {
  const pairs: [string, string, "out" | "true" | "false" | "error"][] = [
    ["event", "parallel", "out"],
    ["parallel", "water", "out"],
    ["parallel", "weather", "out"],
    ["water", "join", "out"],
    ["weather", "join", "out"],
    ["join", "quality", "out"],
    ["quality", "aggregate", "out"],
    ["quality", "failure", "error"],
    ["aggregate", "condition", "out"],
    ["condition", "notify", "true"],
    ["condition", "store", "false"],
  ];
  return {
    schemaVersion: 1,
    id: "river-observation",
    name: "Watershed monitoring · Multi-source processing",
    description:
      "Event trigger → Parallel collection → Quality and aggregation → Conditional delivery",
    maxConcurrency: 3,
    nodes: [
      node("event", "event", 0, 140, { label: "Observation received" }),
      node("parallel", "parallel", 360, 140, { label: "Parallel collection" }),
      node("mqtt", "water", 720, 0, { label: "North bank temperature" }),
      node("http", "weather", 720, 280, { label: "Weather observations" }),
      node("join", "join", 1080, 140, { label: "Merge observations" }),
      node("quality", "quality", 1080, 460),
      node("aggregate", "aggregate", 720, 460, {
        label: "Temperature aggregate",
      }),
      node("condition", "condition", 360, 460, { label: "Temperature review" }),
      node("notification", "notify", 0, 420, { label: "Send for review" }),
      node("storage", "store", 0, 700, { label: "Archive observations" }),
      node("failure", "failure", 1080, 780),
    ],
    edges: pairs.map(([source, target, port], index) => ({
      id: `edge-${index + 1}`,
      source,
      target,
      port,
    })),
  };
}

export type DemoObservation = {
  source: string;
  metric: string;
  value: number | null;
  unit: string;
  sampledAt: string;
  quality: "good" | "invalid";
};
export type WorkflowDemoScenario = "normal" | "warm" | "missing" | "failure";
export function demoObservations(
  dataset: string,
  scenario: WorkflowDemoScenario,
): DemoObservation[] {
  const values =
    dataset === "weather"
      ? [0, 4, 8]
      : dataset === "laboratory"
        ? [6.8, 7, 7.2]
        : scenario === "warm"
          ? [24, 26, 28]
          : scenario === "missing"
            ? [18, null, 22]
            : [18, 20, 22];
  return values.map((value, index) => ({
    source: dataset,
    metric:
      dataset === "weather"
        ? "weather.rainfall"
        : dataset === "laboratory"
          ? "water.ph"
          : "water.temperature",
    value,
    unit: dataset === "weather" ? "mm" : dataset === "laboratory" ? "pH" : "°C",
    sampledAt: `2026-11-12T00:${String(index * 10).padStart(2, "0")}:00Z`,
    quality: value === null ? "invalid" : "good",
  }));
}
