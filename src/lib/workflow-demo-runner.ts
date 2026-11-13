/** Showcase-only deterministic adapters + in-memory scheduler. Never installed with the Block. */
import {
  validateWorkflow,
  workflowSignature,
  type WorkflowDefinition,
  type WorkflowNode,
  type WorkflowNodeRun,
  type WorkflowPort,
  type WorkflowRun,
  type WorkflowRunContext,
} from "../../registry/immortal/blocks/workflow-model.ts";
import {
  demoObservations,
  type DemoObservation,
  type WorkflowDemoScenario,
} from "./workflow-demo-data.ts";

const parameter = (node: WorkflowNode, key: string) =>
  node.parameters.find((field) => field.key === key)?.value;
const terminal = (status: WorkflowNodeRun["status"]) =>
  !["pending", "running"].includes(status);
type AdapterResult = { value: unknown; port?: WorkflowPort; message?: string };

export function processDemoNode(
  node: WorkflowNode,
  input: unknown,
  scenario: WorkflowDemoScenario,
): AdapterResult {
  switch (node.operation) {
    case "event":
    case "schedule":
    case "manual":
      return {
        value: {
          type: parameter(node, "event") ?? node.operation,
          occurredAt: "2026-11-12T00:20:00Z",
          demonstration: true,
        },
        message:
          "A single manual demo run. No event listener or schedule was registered.",
      };
    case "source": {
      const dataset = String(parameter(node, "dataset"));
      if (!["water", "weather", "laboratory"].includes(dataset))
        throw new Error("Demo data source not configured.");
      if (scenario === "failure" && dataset === "weather")
        throw new Error(
          "Demo HTTP source unavailable. No observations were read or fabricated.",
        );
      return {
        value: demoObservations(dataset, scenario),
        message:
          "Fixed demo observations. No devices or external services are connected.",
      };
    }
    case "parallel":
      return { value: input };
    case "join":
      return { value: Array.isArray(input) ? input.flat() : input };
    case "quality": {
      if (!Array.isArray(input))
        throw new Error("Quality checks require an array of observations.");
      const good = input.filter(
        (row: DemoObservation) =>
          row.quality === "good" &&
          row.value !== null &&
          Number.isFinite(row.value),
      );
      if (
        good.length !== input.length &&
        parameter(node, "invalid") === "reject"
      )
        throw new Error(
          `${input.length - good.length} invalid or missing records. Stopped according to the configured policy.`,
        );
      return {
        value: good,
        message: `Input ${input.length} records; kept ${good.length}; dropped ${input.length - good.length}. Original inputs remain available for inspection.`,
      };
    }
    case "transform": {
      if (!Array.isArray(input))
        throw new Error("Conversion requires an array of observations.");
      const factor = Number(parameter(node, "factor")),
        offset = Number(parameter(node, "offset"));
      if (!Number.isFinite(factor) || !Number.isFinite(offset))
        throw new Error("Invalid scale factor.");
      return {
        value: input.map((row: DemoObservation) => {
          if (row.metric !== parameter(node, "metric")) return { ...row };
          if (row.unit !== parameter(node, "inputUnit"))
            throw new Error(
              "Source units do not match for the selected metric.",
            );
          const value = row.value === null ? null : row.value * factor + offset;
          if (value !== null && !Number.isFinite(value))
            throw new Error("The converted result is not a finite number.");
          return {
            ...row,
            value,
            unit: String(parameter(node, "unit")),
            transformation: {
              method: "linear",
              factor,
              offset,
              originalValue: row.value,
              originalUnit: row.unit,
            },
          };
        }),
        message:
          "Converted only the selected metric with the supplied scale and offset. Original values and units are preserved; missing values were not interpolated.",
      };
    }
    case "aggregate": {
      if (!Array.isArray(input))
        throw new Error("Aggregation requires an array of observations.");
      const from = Date.parse(String(parameter(node, "from"))),
        to = Date.parse(String(parameter(node, "to")));
      if (!Number.isFinite(from) || !Number.isFinite(to) || from > to)
        throw new Error("Invalid aggregation window.");
      const rows = (input as DemoObservation[]).filter(
        (row) =>
          row.metric === parameter(node, "metric") &&
          Date.parse(row.sampledAt) >= from &&
          Date.parse(row.sampledAt) <= to &&
          row.quality === "good" &&
          row.value !== null &&
          Number.isFinite(row.value),
      );
      if (!rows.length)
        throw new Error("No valid samples in this window. Cannot aggregate.");
      if (new Set(rows.map((row) => row.unit)).size !== 1)
        throw new Error("Aggregation inputs have inconsistent units.");
      const values = rows.map((row) => row.value!);
      const method = parameter(node, "method");
      if (!["mean", "min", "max"].includes(String(method)))
        throw new Error("Unsupported aggregation method.");
      const value =
        method === "max"
          ? Math.max(...values)
          : method === "min"
            ? Math.min(...values)
            : values.reduce((a, b) => a + b, 0) / values.length;
      return {
        value: {
          kind: "aggregation",
          metric: parameter(node, "metric"),
          method,
          value,
          unit: rows[0].unit,
          sampleCount: rows.length,
          inputWindow: {
            from: new Date(from).toISOString(),
            to: new Date(to).toISOString(),
            boundaries: "inclusive",
          },
          source: "Demo data",
        },
      };
    }
    case "condition": {
      const value = (input as { value?: unknown } | null)?.value;
      if (typeof value !== "number" || !Number.isFinite(value))
        throw new Error("The condition requires a finite numeric result.");
      const threshold = Number(parameter(node, "threshold"));
      const operator = parameter(node, "operator");
      if (
        !["gte", "gt", "lt"].includes(String(operator)) ||
        !Number.isFinite(threshold)
      )
        throw new Error("Invalid condition configuration.");
      const matches =
        operator === "gte"
          ? value >= threshold
          : operator === "gt"
            ? value > threshold
            : value < threshold;
      return {
        value: input,
        port: matches ? "true" : "false",
        message: `${value} ${operator === "gte" ? "≥" : operator === "gt" ? ">" : "<"} ${threshold}: ${matches ? "Match" : "No match"} (demo rule)`,
      };
    }
    case "deliver":
    case "failure":
      return {
        value: {
          destination: parameter(node, "destination"),
          payload: input,
          demonstration: true,
        },
        message:
          "Demo delivery recorded only. No database writes, notifications or external requests were made.",
      };
    case "model":
      throw new Error(
        "No model is connected in this demo. The host must provide a model and version.",
      );
    default:
      throw new Error(
        `Operation not implemented in the demo: ${node.operation}`,
      );
  }
}

export async function runWorkflowDemo(
  flow: WorkflowDefinition,
  scenario: WorkflowDemoScenario,
  context: WorkflowRunContext,
  options: { delayMs?: number; onActive?: (ids: string[]) => void } = {},
): Promise<WorkflowRun> {
  const issues = validateWorkflow(flow);
  if (issues.length) throw new Error(issues[0].message);
  const run: WorkflowRun = {
    id: `demo-${Date.now()}`,
    workflowId: flow.id,
    definitionSignature: workflowSignature(flow),
    status: "running",
    startedAt: new Date().toISOString(),
    nodes: flow.nodes.map((node) => ({ nodeId: node.id, status: "pending" })),
  };
  const records = new Map(run.nodes.map((node) => [node.nodeId, node]));
  const outcomes = new Map<string, WorkflowPort>();
  const active = new Map<string, Promise<void>>();
  const emit = () => {
    if (!context.signal.aborted) context.onUpdate(structuredClone(run));
  };
  const finish = (
    record: WorkflowNodeRun,
    status: WorkflowNodeRun["status"],
    message?: string,
  ) => {
    record.status = status;
    record.finishedAt = new Date().toISOString();
    if (message) record.message = message;
  };
  const delay = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      if (context.signal.aborted) {
        reject(new DOMException("Cancelled", "AbortError"));
        return;
      }
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelled", "AbortError"));
      };
      const timer = setTimeout(() => {
        context.signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      context.signal.addEventListener("abort", onAbort, { once: true });
    });
  emit();
  while (run.nodes.some((node) => !terminal(node.status))) {
    if (context.signal.aborted) {
      await Promise.allSettled(active.values());
      for (const record of run.nodes)
        if (!terminal(record.status))
          finish(record, "cancelled", "Demo run cancelled.");
      run.status = "cancelled";
      run.finishedAt = new Date().toISOString();
      return structuredClone(run);
    }
    let progressed = false;
    for (const node of flow.nodes) {
      const record = records.get(node.id)!;
      if (record.status !== "pending") continue;
      const incoming = flow.edges.filter((edge) => edge.target === node.id);
      const matched = incoming.filter(
        (edge) => outcomes.get(edge.source) === edge.port,
      );
      const settled = incoming.every((edge) =>
        terminal(records.get(edge.source)!.status),
      );
      const any =
        node.kind === "failure" ||
        (node.kind === "join" && node.joinMode === "any");
      const ready =
        node.kind === "trigger" ||
        (any
          ? matched.length > 0
          : settled && matched.length === incoming.length);
      if (!ready) {
        if (settled) {
          if (
            node.kind === "join" &&
            incoming.some(
              (edge) =>
                records.get(edge.source)!.status === "failed" &&
                edge.port !== "error",
            )
          ) {
            record.output = { error: "A join input failed.", nodeId: node.id };
            outcomes.set(node.id, "error");
            finish(record, "failed", "A join input failed. Cannot continue.");
          } else
            finish(
              record,
              "skipped",
              "An upstream step failed or this branch was not selected.",
            );
          progressed = true;
          emit();
        }
        continue;
      }
      if (active.size >= flow.maxConcurrency) continue;
      const completionOrder = [...outcomes.keys()];
      const selected = any
        ? [...matched]
            .sort(
              (a, b) =>
                completionOrder.indexOf(a.source) -
                completionOrder.indexOf(b.source),
            )
            .slice(0, 1)
        : matched;
      const inputs = selected.map((edge) => records.get(edge.source)!.output);
      record.input = node.kind === "join" ? inputs : inputs[0];
      record.status = "running";
      record.startedAt = new Date().toISOString();
      progressed = true;
      const execute = async () => {
        for (let attempt = 1; attempt <= node.maxAttempts; attempt++) {
          record.attempts = attempt;
          emit();
          try {
            const latency =
              options.delayMs ??
              (node.id === "water" ? 800 : node.id === "weather" ? 1100 : 320);
            await delay(Math.min(latency, node.timeoutMs));
            if (latency > node.timeoutMs)
              throw new Error(
                `Node exceeded the ${node.timeoutMs} ms demo timeout.`,
              );
            const result = processDemoNode(node, record.input, scenario);
            record.output = result.value;
            outcomes.set(node.id, result.port ?? "out");
            finish(record, "succeeded", result.message);
            break;
          } catch (error) {
            if (context.signal.aborted) {
              finish(record, "cancelled");
              break;
            }
            if (attempt === node.maxAttempts) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Demo execution failed.";
              record.output = {
                error: message,
                nodeId: node.id,
                input: record.input,
              };
              outcomes.set(node.id, "error");
              finish(record, "failed", message);
            }
          }
        }
      };
      const task = execute().finally(() => {
        active.delete(node.id);
        options.onActive?.([...active.keys()]);
        emit();
      });
      active.set(node.id, task);
      options.onActive?.([...active.keys()]);
      emit();
    }
    if (active.size) await Promise.race(active.values());
    else if (!progressed) {
      for (const record of run.nodes)
        if (!terminal(record.status))
          finish(record, "skipped", "No executable input.");
      break;
    }
  }
  run.status = context.signal.aborted
    ? "cancelled"
    : run.nodes.some((node) => node.status === "failed")
      ? "failed"
      : "succeeded";
  run.finishedAt = new Date().toISOString();
  emit();
  return structuredClone(run);
}
