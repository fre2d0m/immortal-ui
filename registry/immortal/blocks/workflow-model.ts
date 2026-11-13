/** Portable workflow definition. No transport, credentials, scheduler or fixtures. */
export type WorkflowKind =
  | "trigger"
  | "source"
  | "quality"
  | "transform"
  | "aggregate"
  | "model"
  | "condition"
  | "parallel"
  | "join"
  | "sink"
  | "failure";
export type WorkflowValue = string | number | boolean | null;
/** Presentation derived from current configuration, never a second stored configuration. */
export type WorkflowSummaryField = {
  label: string;
  value: WorkflowValue;
  /** Only provide a unit defined by the adapter's data contract. */
  unit?: string;
};
export type WorkflowNodeSummary =
  | { type: "fields"; fields: readonly WorkflowSummaryField[] }
  | {
      type: "expression";
      subject: string;
      operator: string;
      value: WorkflowValue;
      unit?: string;
    };
export type WorkflowParameter = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  value: WorkflowValue;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: { label: string; value: string }[];
};
export type WorkflowNode = {
  id: string;
  kind: WorkflowKind;
  label: string;
  description?: string;
  /** Adapter identifier supplied by the application; never evaluated as code. */
  operation: string;
  position: { x: number; y: number };
  inputType?: string;
  outputType?: string;
  parameters: WorkflowParameter[];
  joinMode?: "all" | "any";
  timeoutMs: number;
  maxAttempts: number;
};
export type WorkflowTemplate = Omit<WorkflowNode, "id" | "position"> & {
  id: string;
};
export type WorkflowPort = "out" | "true" | "false" | "error";
export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  port: WorkflowPort;
};
export type WorkflowDefinition = {
  schemaVersion: 1;
  id: string;
  name: string;
  description?: string;
  maxConcurrency: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};
/** Publication metadata belongs to the host, separate from draft persistence. */
export type WorkflowPublication =
  | { workflowId: string; status: "draft" }
  | {
      workflowId: string;
      status: "published";
      /** Signature of the definition actually published, excluding canvas layout. */
      definitionSignature: string;
    };

export function workflowPublicationStatus(
  workflow: WorkflowDefinition,
  publication?: WorkflowPublication,
): "unknown" | "draft" | "published" | "changed" {
  if (!publication || publication.workflowId !== workflow.id) return "unknown";
  if (publication.status === "draft") return "draft";
  return publication.definitionSignature === workflowSignature(workflow)
    ? "published"
    : "changed";
}
export type WorkflowStatus =
  "pending" | "running" | "succeeded" | "failed" | "skipped" | "cancelled";
export type WorkflowNodeRun = {
  nodeId: string;
  status: WorkflowStatus;
  startedAt?: string;
  finishedAt?: string;
  attempts?: number;
  input?: unknown;
  output?: unknown;
  message?: string;
};
export type WorkflowRun = {
  id: string;
  workflowId: string;
  /** workflowSignature(definition), captured at dispatch; not a security hash. */
  definitionSignature: string;
  status: WorkflowStatus;
  startedAt: string;
  finishedAt?: string;
  nodes: WorkflowNodeRun[];
};
export type WorkflowRunContext = {
  signal: AbortSignal;
  onUpdate: (run: WorkflowRun) => void;
};
export type WorkflowIssue = {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
};

export const workflowKinds: Record<
  WorkflowKind,
  { label: string; group: string }
> = {
  trigger: { label: "Event trigger", group: "Triggers and inputs" },
  source: { label: "Data source", group: "Triggers and inputs" },
  quality: { label: "Quality check", group: "Data processing" },
  transform: { label: "Transform", group: "Data processing" },
  aggregate: { label: "Window aggregate", group: "Data processing" },
  model: { label: "Model inference", group: "Data processing" },
  condition: { label: "Condition", group: "Flow control" },
  parallel: { label: "Parallel split", group: "Flow control" },
  join: { label: "Join", group: "Flow control" },
  sink: { label: "Delivery", group: "Outputs and errors" },
  failure: { label: "Error handler", group: "Outputs and errors" },
};
export const workflowStatuses: Record<WorkflowStatus, string> = {
  pending: "Queued",
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
  skipped: "Skipped",
  cancelled: "Cancelled",
};
export function formatWorkflowSummaryValue(
  value: WorkflowValue,
  unit?: string,
) {
  if (value === null) return "Not configured";
  if (value === "") return "Empty text";
  if (typeof value === "number" && !Number.isFinite(value))
    return "Invalid value";
  return `${String(value)}${unit ? ` ${unit}` : ""}`;
}

/** Only summarize semantics owned by the editor; adapter parameter keys are opaque. */
export function defaultWorkflowNodeSummary(
  node: WorkflowNode,
  workflow: WorkflowDefinition,
): WorkflowNodeSummary {
  if (node.kind === "parallel")
    return {
      type: "fields",
      fields: [
        {
          label: "Branches",
          value: workflow.edges.filter(
            (edge) => edge.source === node.id && edge.port === "out",
          ).length,
        },
        { label: "Concurrency", value: workflow.maxConcurrency },
      ],
    };
  if (node.kind === "join")
    return {
      type: "fields",
      fields: [
        {
          label: "Wait for",
          value:
            node.joinMode === "any"
              ? "Any input to succeed"
              : "All inputs to succeed",
        },
        {
          label: "Input",
          value: workflow.edges.filter((edge) => edge.target === node.id)
            .length,
        },
      ],
    };
  return {
    type: "fields",
    fields: [{ label: "Parameters", value: node.parameters.length }],
  };
}

export function workflowNodeSummaryText(summary: WorkflowNodeSummary) {
  if (summary.type === "expression")
    return `${summary.subject} ${summary.operator} ${formatWorkflowSummaryValue(summary.value, summary.unit)}`;
  return summary.fields
    .slice(0, 3)
    .map(
      (field) =>
        `${field.label}: ${formatWorkflowSummaryValue(field.value, field.unit)}`,
    )
    .join("; ");
}

export function outputPorts(
  node: WorkflowNode,
): { id: WorkflowPort; label: string }[] {
  if (node.kind === "sink" || node.kind === "failure") return [];
  if (node.kind === "condition")
    return [
      { id: "true", label: "Match" },
      { id: "false", label: "No match" },
      { id: "error", label: "Failure" },
    ];
  return [
    { id: "out", label: node.kind === "parallel" ? "Parallel" : "Output" },
    ...(node.kind === "trigger"
      ? []
      : [{ id: "error" as const, label: "Failure" }]),
  ];
}

/** Used by drag connections and the endpoint picker. */
export function connectionIssue(
  flow: WorkflowDefinition,
  edge: Omit<WorkflowEdge, "id">,
  ignoreId?: string,
): string | null {
  const source = flow.nodes.find((node) => node.id === edge.source);
  const target = flow.nodes.find((node) => node.id === edge.target);
  if (!source || !target) return "A connected node does not exist.";
  if (source.id === target.id) return "A node cannot connect to itself.";
  if (target.kind === "trigger")
    return "A trigger cannot receive an upstream connection.";
  if (!outputPorts(source).some((port) => port.id === edge.port))
    return "The source node does not have this output port.";
  const edges = flow.edges.filter((item) => item.id !== ignoreId);
  if (
    edges.some(
      (item) =>
        item.source === edge.source &&
        item.target === edge.target &&
        item.port === edge.port,
    )
  )
    return "This connection already exists.";
  const outputType = edge.port === "error" ? "error" : source.outputType;
  if (
    outputType &&
    target.inputType &&
    outputType !== "any" &&
    target.inputType !== "any" &&
    outputType !== target.inputType
  )
    return `Incompatible data types: ${outputType} → ${target.inputType}.`;
  if (
    target.kind !== "join" &&
    target.kind !== "failure" &&
    edges.some((item) => item.target === target.id)
  )
    return "Multiple inputs must be combined through a join node.";
  if (
    !(source.kind === "parallel" && edge.port === "out") &&
    edges.some((item) => item.source === source.id && item.port === edge.port)
  )
    return "An output port can connect to only one node. Use a parallel split for multiple branches.";
  const visited = new Set<string>();
  const queue = [target.id];
  while (queue.length) {
    const id = queue.pop()!;
    if (id === source.id) return "This connection would create a cycle.";
    if (visited.has(id)) continue;
    visited.add(id);
    queue.push(
      ...edges.filter((item) => item.source === id).map((item) => item.target),
    );
  }
  return null;
}

export type WorkflowEndpoint = { nodeId: string; port: WorkflowPort | "in" };

/** A normal occupied port inserts a step; parallel outputs and join inputs add branches. */
export function workflowStepContext(
  flow: WorkflowDefinition,
  endpoint: WorkflowEndpoint,
) {
  const node = flow.nodes.find((item) => item.id === endpoint.nodeId);
  const incoming = endpoint.port === "in";
  const edges = flow.edges.filter((edge) =>
    incoming
      ? edge.target === endpoint.nodeId
      : edge.source === endpoint.nodeId && edge.port === endpoint.port,
  );
  const branching = incoming
    ? node?.kind === "join" || node?.kind === "failure"
    : node?.kind === "parallel" && endpoint.port === "out";
  return {
    node,
    mode:
      edges.length && !branching
        ? ("insert" as const)
        : incoming
          ? ("before" as const)
          : ("after" as const),
    replace: branching ? [] : edges,
  };
}

/** Compute and validate the complete edit before changing the controlled graph. */
export function planWorkflowStep(
  flow: WorkflowDefinition,
  endpoint: WorkflowEndpoint,
  candidate: WorkflowNode,
  continuationPort?: WorkflowPort,
):
  | { issue: string }
  | { issue: null; remove: string[]; edges: Omit<WorkflowEdge, "id">[] } {
  const context = workflowStepContext(flow, endpoint);
  if (!context.node) return { issue: "A connected node does not exist." };
  if (endpoint.port === "in" && context.node.kind === "trigger")
    return { issue: "A trigger cannot receive an upstream connection." };
  if (context.replace.length > 1)
    return {
      issue:
        "This port has multiple connections. Resolve them before continuing.",
    };
  const exists = flow.nodes.some((node) => node.id === candidate.id);
  if (exists && context.mode === "insert")
    return { issue: "Choose a new node to insert a step." };
  const previous = context.replace[0];
  const edges: Omit<WorkflowEdge, "id">[] = [];
  if (endpoint.port === "in") {
    if (!continuationPort)
      return { issue: "Choose an output port for the new step." };
    if (previous)
      edges.push({
        source: previous.source,
        port: previous.port,
        target: candidate.id,
      });
    edges.push({
      source: candidate.id,
      port: continuationPort,
      target: context.node.id,
    });
  } else {
    edges.push({
      source: context.node.id,
      port: endpoint.port,
      target: candidate.id,
    });
    if (previous) {
      if (!continuationPort)
        return { issue: "Choose an output port for the new step." };
      edges.push({
        source: candidate.id,
        port: continuationPort,
        target: previous.target,
      });
    }
  }
  const remove = context.replace.map((edge) => edge.id);
  const draft: WorkflowDefinition = {
    ...flow,
    nodes: exists ? flow.nodes : [...flow.nodes, candidate],
    edges: flow.edges.filter((edge) => !remove.includes(edge.id)),
  };
  for (const [index, edge] of edges.entries()) {
    const issue = connectionIssue(draft, edge);
    if (issue) return { issue };
    draft.edges.push({ ...edge, id: `pending-${index}` });
  }
  return { issue: null, remove, edges };
}

/** Replace exactly one edge atomically, preserving sibling parallel branches. */
export function planWorkflowEdgeStep(
  flow: WorkflowDefinition,
  edgeId: string,
  candidate: WorkflowNode,
  continuationPort?: WorkflowPort,
): ReturnType<typeof planWorkflowStep> {
  const previous = flow.edges.find((edge) => edge.id === edgeId);
  if (!previous) return { issue: "The connection no longer exists." };
  if (flow.nodes.some((node) => node.id === candidate.id))
    return { issue: "Choose a new node to insert a step." };
  if (!continuationPort)
    return { issue: "Choose an output port for the new step." };
  const edges: Omit<WorkflowEdge, "id">[] = [
    { source: previous.source, port: previous.port, target: candidate.id },
    { source: candidate.id, port: continuationPort, target: previous.target },
  ];
  const draft = {
    ...flow,
    nodes: [...flow.nodes, candidate],
    edges: flow.edges.filter((edge) => edge.id !== edgeId),
  };
  for (const [index, edge] of edges.entries()) {
    const issue = connectionIssue(draft, edge);
    if (issue) return { issue };
    draft.edges.push({ ...edge, id: `pending-insert-${index}` });
  }
  return { issue: null, remove: [edgeId], edges };
}

/** Keep existing positions intact, leaving room for endpoint actions around the new node. */
export function placeWorkflowStep(
  flow: WorkflowDefinition,
  preferred: WorkflowNode["position"],
  dimensions: Record<string, { width: number; height: number }> = {},
): WorkflowNode["position"] {
  const width = 232;
  const height = Math.max(
    168,
    ...Object.values(dimensions).map((size) => size.height),
  );
  const stride = height + 112;
  for (let attempt = 0; attempt <= flow.nodes.length * 2 + 2; attempt++) {
    const offset = Math.ceil(attempt / 2) * (attempt % 2 ? 1 : -1) * stride;
    const position = { x: preferred.x, y: preferred.y + offset };
    const overlaps = flow.nodes.some((node) => {
      const size = dimensions[node.id] ?? { width, height };
      return (
        position.x < node.position.x + size.width + 128 &&
        position.x + width + 128 > node.position.x &&
        position.y < node.position.y + size.height + 112 &&
        position.y + height + 112 > node.position.y
      );
    });
    if (!overlaps) return position;
  }
  return {
    x: preferred.x,
    y: Math.max(0, ...flow.nodes.map((node) => node.position.y)) + stride,
  };
}

export function validateWorkflow(flow: WorkflowDefinition): WorkflowIssue[] {
  const issues: WorkflowIssue[] = [];
  const add = (
    code: string,
    message: string,
    nodeId?: string,
    edgeId?: string,
  ) => issues.push({ code, message, nodeId, edgeId });
  if (!flow.id.trim() || !flow.name.trim())
    add("identity", "Enter a workflow ID and name.");
  if (
    !Number.isInteger(flow.maxConcurrency) ||
    flow.maxConcurrency < 1 ||
    flow.maxConcurrency > 64
  )
    add(
      "concurrency",
      "The concurrency limit must be an integer from 1 to 64.",
    );
  if (!flow.nodes.length)
    add(
      "empty",
      "Add a trigger, processing steps and a destination to start building your workflow.",
    );
  if (!flow.nodes.some((node) => node.kind === "trigger"))
    add("trigger", "At least one trigger is required.");
  if (!flow.nodes.some((node) => node.kind === "sink"))
    add("sink", "At least one delivery node is required.");
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  for (const node of flow.nodes) {
    if (nodeIds.has(node.id))
      add("duplicate-node", "Duplicate node ID.", node.id);
    nodeIds.add(node.id);
    if (!node.id.trim() || !node.label.trim() || !node.operation.trim())
      add(
        "node-label",
        "Node ID, name and operation ID are required.",
        node.id,
      );
    if (![node.position.x, node.position.y].every(Number.isFinite))
      add("position", "Node coordinates must be finite numbers.", node.id);
    if (
      !Number.isInteger(node.timeoutMs) ||
      node.timeoutMs < 1 ||
      !Number.isInteger(node.maxAttempts) ||
      node.maxAttempts < 1 ||
      node.maxAttempts > 10
    )
      add(
        "policy",
        "Timeout must be a positive integer. Maximum attempts must be an integer from 1 to 10.",
        node.id,
      );
    if (node.kind === "join" && !["all", "any"].includes(node.joinMode ?? ""))
      add(
        "join-mode",
        "Choose whether to wait for all inputs or any successful input.",
        node.id,
      );
    const keys = new Set<string>();
    for (const field of node.parameters) {
      if (!field.key.trim() || keys.has(field.key))
        add(
          "parameter-key",
          "Parameter keys must be nonempty and unique.",
          node.id,
        );
      keys.add(field.key);
      if (
        field.required &&
        (field.value === null || String(field.value).trim() === "")
      )
        add("required", `Enter a value for "${field.label}".`, node.id);
      if (
        field.type === "number" &&
        field.value !== null &&
        (typeof field.value !== "number" ||
          !Number.isFinite(field.value) ||
          (field.min !== undefined && field.value < field.min) ||
          (field.max !== undefined && field.value > field.max))
      )
        add(
          "number",
          `"${field.label}" is outside the allowed range.`,
          node.id,
        );
      if (
        field.type === "select" &&
        !field.options?.some((option) => option.value === field.value)
      )
        add("option", `"${field.label}" requires a valid option.`, node.id);
    }
    const incoming = flow.edges.filter((edge) => edge.target === node.id);
    const outgoing = flow.edges.filter((edge) => edge.source === node.id);
    if (node.kind !== "trigger" && !incoming.length)
      add("input", "This node needs an upstream input.", node.id);
    if (node.kind === "join" && incoming.length < 2)
      add("join-inputs", "A join needs at least two inputs.", node.id);
    if (
      node.kind === "parallel" &&
      outgoing.filter((edge) => edge.port === "out").length < 2
    )
      add(
        "parallel-outputs",
        "A parallel split needs at least two output branches.",
        node.id,
      );
    if (node.kind === "condition") {
      for (const port of ["true", "false"] as const)
        if (!outgoing.some((edge) => edge.port === port))
          add(
            "condition-output",
            `Connect the ${port === "true" ? "Match" : "No match"} output.`,
            node.id,
          );
    } else if (
      !["sink", "failure"].includes(node.kind) &&
      !outgoing.some((edge) => edge.port === "out")
    )
      add(
        "output",
        "This node needs a downstream step or destination.",
        node.id,
      );
  }
  for (const edge of flow.edges) {
    if (!edge.id.trim() || edgeIds.has(edge.id))
      add(
        "duplicate-edge",
        "Connection IDs must be nonempty and unique.",
        undefined,
        edge.id,
      );
    edgeIds.add(edge.id);
    const issue = connectionIssue(flow, edge, edge.id);
    if (issue) add("connection", issue, edge.target, edge.id);
  }
  const reached = new Set(
    flow.nodes.filter((node) => node.kind === "trigger").map((node) => node.id),
  );
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of flow.edges)
      if (reached.has(edge.source) && !reached.has(edge.target)) {
        reached.add(edge.target);
        changed = true;
      }
  }
  for (const node of flow.nodes)
    if (!reached.has(node.id))
      add(
        "unreachable",
        "This node cannot be reached from any trigger.",
        node.id,
      );
  return issues;
}

/** Layout only: positions are not physical coordinates or a measure of duration. */
export function layoutWorkflow(
  flow: WorkflowDefinition,
  sizes: Record<string, { height: number }> = {},
): WorkflowDefinition {
  const remaining = new Set(flow.nodes.map((node) => node.id));
  const levels = new Map<string, number>();
  for (let pass = 0; pass < flow.nodes.length && remaining.size; pass++) {
    for (const id of remaining) {
      const parents = flow.edges
        .filter((edge) => edge.target === id)
        .map((edge) => edge.source);
      if (parents.every((parent) => levels.has(parent))) {
        levels.set(
          id,
          parents.length
            ? Math.max(...parents.map((parent) => levels.get(parent)!)) + 1
            : 0,
        );
        remaining.delete(id);
      }
    }
  }
  const rows = new Map<number, number>();
  return {
    ...flow,
    nodes: flow.nodes.map((node) => {
      const level = levels.get(node.id) ?? 0;
      const row = rows.get(level) ?? 0;
      rows.set(level, row + (sizes[node.id]?.height ?? 168) + 112);
      return { ...node, position: { x: level * 360, y: row } };
    }),
  };
}

/** JSON import validates shape before any editor reads nested values. Invalid graphs remain editable. */
export function parseWorkflow(text: string): WorkflowDefinition {
  const value: unknown = JSON.parse(text);
  const object = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === "object" && !Array.isArray(v);
  const string = (v: unknown) => typeof v === "string";
  const optionalString = (v: unknown) => v === undefined || string(v);
  const finite = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    !string(value.id) ||
    !string(value.name) ||
    !optionalString(value.description) ||
    !finite(value.maxConcurrency) ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.edges)
  )
    throw new Error("Unsupported workflow file. Expected schemaVersion: 1.");
  if (value.nodes.length > 500 || value.edges.length > 2000)
    throw new Error("Import is limited to 500 nodes and 2,000 connections.");
  for (const node of value.nodes) {
    if (
      !object(node) ||
      !string(node.id) ||
      !string(node.label) ||
      !string(node.operation) ||
      !string(node.kind) ||
      !Object.hasOwn(workflowKinds, node.kind as string) ||
      !optionalString(node.description) ||
      !optionalString(node.inputType) ||
      !optionalString(node.outputType) ||
      !object(node.position) ||
      !finite(node.position.x) ||
      !finite(node.position.y) ||
      !finite(node.timeoutMs) ||
      !finite(node.maxAttempts) ||
      !Array.isArray(node.parameters) ||
      (node.joinMode !== undefined &&
        !["all", "any"].includes(node.joinMode as string))
    )
      throw new Error(
        "A node definition is incomplete or has an invalid type.",
      );
    for (const field of node.parameters) {
      if (
        !object(field) ||
        !string(field.key) ||
        !string(field.label) ||
        !["text", "number", "select"].includes(field.type as string) ||
        !(
          field.value === null ||
          string(field.value) ||
          finite(field.value) ||
          typeof field.value === "boolean"
        ) ||
        !optionalString(field.description) ||
        (field.required !== undefined && typeof field.required !== "boolean") ||
        (field.min !== undefined && !finite(field.min)) ||
        (field.max !== undefined && !finite(field.max)) ||
        (field.options !== undefined &&
          (!Array.isArray(field.options) ||
            !field.options.every(
              (option) =>
                object(option) && string(option.label) && string(option.value),
            )))
      )
        throw new Error("Invalid node parameter definition.");
    }
  }
  for (const edge of value.edges)
    if (
      !object(edge) ||
      !string(edge.id) ||
      !string(edge.source) ||
      !string(edge.target) ||
      !["out", "true", "false", "error"].includes(edge.port as string)
    )
      throw new Error("Invalid connection definition.");
  const flow = value as WorkflowDefinition;
  if (
    new Set(flow.nodes.map((node) => node.id)).size !== flow.nodes.length ||
    new Set(flow.edges.map((edge) => edge.id)).size !== flow.edges.length
  )
    throw new Error("Cannot import duplicate node or connection IDs.");
  return flow;
}

/** Positions are presentation state; editing them does not invalidate a run. */
export function workflowSignature(flow: WorkflowDefinition): string {
  return JSON.stringify({
    ...flow,
    nodes: flow.nodes.map(({ position: _position, ...node }) => node),
  });
}
