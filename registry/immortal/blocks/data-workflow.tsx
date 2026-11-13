"use client";

import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Background,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useUpdateNodeInternals,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type OnConnectEnd,
  type ReactFlowInstance,
} from "@xyflow/react";
import { DropdownMenu as Menu } from "radix-ui";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Braces,
  CircleAlert,
  CircleHelp,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Copy,
  Database,
  Filter,
  GitBranch,
  GitBranchPlus,
  GitFork,
  GitMerge,
  LayoutGrid,
  LoaderCircle,
  LocateFixed,
  Maximize,
  Maximize2,
  Minimize2,
  Minus,
  MoreHorizontal,
  Play,
  Plus,
  Redo2,
  Save,
  Scan,
  Send,
  Settings2,
  ShieldCheck,
  ShieldAlert,
  Sigma,
  Square,
  Trash2,
  Undo2,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NodeInspector,
  NodeSummary,
  RunStatus,
  WorkflowRunResults,
  WorkflowStatusIndicator,
  WorkflowIconButton,
  WorkflowTooltips,
  WorkflowStepPicker,
  WorkflowContextMenu,
  WorkflowToolbar,
  type WorkflowMenuAction,
  type WorkflowStepChoice,
  duration,
} from "./workflow-parts";
import {
  connectionIssue,
  defaultWorkflowNodeSummary,
  layoutWorkflow,
  outputPorts,
  parseWorkflow,
  planWorkflowStep,
  planWorkflowEdgeStep,
  placeWorkflowStep,
  workflowStepContext,
  validateWorkflow,
  workflowKinds,
  workflowNodeSummaryText,
  workflowSignature,
  workflowPublicationStatus,
  type WorkflowDefinition,
  type WorkflowEdge,
  type WorkflowEndpoint,
  type WorkflowNode,
  type WorkflowNodeRun,
  type WorkflowNodeSummary,
  type WorkflowPort,
  type WorkflowRun,
  type WorkflowRunContext,
  type WorkflowTemplate,
  type WorkflowPublication,
} from "./workflow-model";
import "@xyflow/react/dist/style.css";
import "./data-workflow.css";

export type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowRun,
  WorkflowRunContext,
  WorkflowTemplate,
  WorkflowNodeSummary,
  WorkflowSummaryField,
  WorkflowPublication,
} from "./workflow-model";
export { workflowSignature } from "./workflow-model";

const icons = {
  trigger: Zap,
  source: Database,
  quality: ShieldCheck,
  transform: Braces,
  aggregate: Sigma,
  model: Filter,
  condition: GitBranch,
  parallel: GitFork,
  join: GitMerge,
  sink: Send,
  failure: CircleAlert,
};
type PortLayout = { id: WorkflowPort; label: string; side: Position };
type CanvasData = {
  definition: WorkflowNode;
  result?: WorkflowNodeRun;
  issues: number;
  readOnly: boolean;
  inputSide: Position;
  ports: PortLayout[];
  connectedPorts: WorkflowPort[];
  summary: WorkflowNodeSummary;
  showRunDetails: boolean;
  activePort?: string;
  onEndpoint: (
    endpoint: WorkflowEndpoint,
    point: { x: number; y: number },
    side: Position,
    trigger: HTMLButtonElement,
  ) => void;
};
type CanvasNode = Node<CanvasData, "workflow">;
type CanvasEdge = Edge<
  {
    definition: WorkflowEdge;
    readOnly: boolean;
    caption?: string;
    actionLabel: string;
    active: boolean;
    onInsert: (
      edge: WorkflowEdge,
      point: { x: number; y: number },
      trigger: HTMLElement,
    ) => void;
  },
  "workflow"
>;
type StepPickerState = {
  endpoint?: WorkflowEndpoint;
  edgeId?: string;
  point: { x: number; y: number };
  position: WorkflowNode["position"];
};
type CanvasMenuState = {
  kind: "canvas" | "node" | "edge";
  id?: string;
  point: { x: number; y: number };
  trigger: HTMLElement;
};
type StepChoice = WorkflowStepChoice & {
  node: WorkflowNode;
  port?: WorkflowPort;
};

function toward(
  from: WorkflowNode,
  targets: WorkflowNode[],
  fallback: Position,
): Position {
  if (!targets.length) return fallback;
  const dx =
    targets.reduce((sum, node) => sum + node.position.x - from.position.x, 0) /
    targets.length;
  const dy =
    targets.reduce((sum, node) => sum + node.position.y - from.position.y, 0) /
    targets.length;
  if (Math.abs(dx) < 120 && Math.abs(dy) > 100)
    return dy > 0 ? Position.Bottom : Position.Top;
  return dx < 0 ? Position.Left : Position.Right;
}

/** One insertion action per edge, anchored to half of its rendered path length. */
function WorkflowCanvasEdge(props: EdgeProps<CanvasEdge>) {
  const { id, data, markerEnd, markerStart, style, interactionWidth } = props;
  const [path, labelX, labelY] = getSmoothStepPath(props);
  const shape = useRef<SVGGElement>(null);
  const [middle, setMiddle] = useState({
    x: labelX,
    y: labelY,
    vertical: false,
  });
  useLayoutEffect(() => {
    const element = shape.current?.querySelector<SVGPathElement>(
      ".react-flow__edge-path",
    );
    if (!element) return;
    const length = element.getTotalLength();
    const point = element.getPointAtLength(length / 2);
    const before = element.getPointAtLength(Math.max(0, length / 2 - 1));
    const after = element.getPointAtLength(Math.min(length, length / 2 + 1));
    const next = {
      x: point.x,
      y: point.y,
      vertical: Math.abs(after.y - before.y) > Math.abs(after.x - before.x),
    };
    setMiddle((current) =>
      current.x === next.x &&
      current.y === next.y &&
      current.vertical === next.vertical
        ? current
        : next,
    );
  }, [path]);
  return (
    <>
      <g ref={shape}>
        <BaseEdge
          id={id}
          path={path}
          markerEnd={markerEnd}
          markerStart={markerStart}
          style={style}
          interactionWidth={interactionWidth}
        />
      </g>
      {data && (
        <EdgeLabelRenderer>
          <div
            className="wf-edge-action nodrag nopan"
            data-edge-action={id}
            data-vertical={middle.vertical}
            style={{
              transform: `translate(-50%, -50%) translate(${middle.x}px, ${middle.y}px)`,
            }}
          >
            {data.caption && (
              <span className="wf-edge-caption" data-branch-caption={id}>
                {data.caption}
              </span>
            )}
            {!data.readOnly && (
              <WorkflowIconButton
                className="wf-graph-add wf-edge-insert"
                label={data.actionLabel}
                aria-haspopup="dialog"
                aria-expanded={data.active}
                data-edge-insert={id}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  const box = event.currentTarget.getBoundingClientRect();
                  data.onInsert(
                    data.definition,
                    {
                      x: box.left + box.width / 2,
                      y: box.top + box.height / 2,
                    },
                    event.currentTarget,
                  );
                }}
              >
                <span className="wf-endpoint-mark">
                  <Plus aria-hidden="true" />
                </span>
              </WorkflowIconButton>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
const edgeTypes = { workflow: WorkflowCanvasEdge };

function WorkflowCanvasNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const node = data.definition;
  const Icon = icons[node.kind];
  const updateInternals = useUpdateNodeInternals();
  const arrangement = `${data.inputSide}:${data.ports.map((port) => port.side).join(":")}`;
  useEffect(() => {
    updateInternals(id);
  }, [id, arrangement, updateInternals]);
  const handles = [
    ...(node.kind === "trigger"
      ? []
      : [
          {
            id: "in",
            side: data.inputSide,
            label: "Input",
            type: "target" as const,
          },
        ]),
    ...data.ports.map((port) => ({ ...port, type: "source" as const })),
  ];
  const portSpacing = 42;
  const verticalPorts = Math.max(
    ...[Position.Left, Position.Right].map(
      (side) => handles.filter((handle) => handle.side === side).length,
    ),
  );
  return (
    <div
      className="wf-node surface-raised"
      data-kind={node.kind}
      data-selected={selected}
      data-status={data.result?.status}
      // Content sets the height; side ports need 40px targets and 4px end clearance.
      style={{
        minBlockSize: Math.max(0, verticalPorts - 1) * portSpacing + 48,
      }}
    >
      <div className="wf-node-heading">
        <span className="wf-node-icon">
          <Icon aria-hidden="true" />
        </span>
        <span className="wf-node-title">
          <small>{workflowKinds[node.kind].label}</small>
          <strong>{node.label || "Untitled node"}</strong>
        </span>
        {!data.readOnly &&
          node.kind === "parallel" &&
          data.connectedPorts.includes("out") && (
            <WorkflowIconButton
              className="wf-node-branch nodrag nopan"
              label={`${node.label}: Add parallel branch`}
              aria-haspopup="dialog"
              aria-expanded={data.activePort === "out"}
              data-add-branch={node.id}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                const box = event.currentTarget.getBoundingClientRect();
                data.onEndpoint(
                  { nodeId: node.id, port: "out" },
                  { x: box.left + box.width / 2, y: box.bottom },
                  data.ports.find((port) => port.id === "out")?.side ??
                    Position.Right,
                  event.currentTarget,
                );
              }}
            >
              <GitBranchPlus aria-hidden="true" />
            </WorkflowIconButton>
          )}
        {data.issues > 0 && (
          <CircleAlert
            className="wf-issue-icon"
            aria-label={`${data.issues} ${data.issues === 1 ? "issue" : "issues"}`}
          />
        )}
      </div>
      <NodeSummary summary={data.summary} />
      {data.showRunDetails && (
        <div className="wf-node-result">
          {data.result ? (
            <RunStatus status={data.result.status} />
          ) : (
            <span>No record provided</span>
          )}
          <span>{duration(data.result)}</span>
        </div>
      )}
      {handles.map((handle) => {
        const sameSide = handles.filter((item) => item.side === handle.side);
        const vertical =
          handle.side === Position.Left || handle.side === Position.Right;
        const offset = `calc(50% + ${(sameSide.indexOf(handle) - (sameSide.length - 1) / 2) * portSpacing}px)`;
        const canAdd =
          handle.type === "source" &&
          !data.connectedPorts.includes(handle.id as WorkflowPort);
        return (
          <Fragment key={handle.id}>
            <Handle
              id={handle.id}
              type={handle.type}
              position={handle.side}
              isConnectable={!data.readOnly}
              aria-label={`${node.label}: ${handle.label}`}
              className={handle.id === "error" ? "wf-handle-error" : ""}
              style={vertical ? { top: offset } : { left: offset }}
            />
            {!data.readOnly && canAdd && (
              <span
                className="wf-endpoint nodrag nopan"
                data-side={handle.side}
                data-port={handle.id}
                style={vertical ? { top: offset } : { left: offset }}
              >
                <WorkflowIconButton
                  className="wf-graph-add wf-endpoint-button"
                  label={`${node.label}: ${handle.label}: Choose a connected node`}
                  aria-haspopup="dialog"
                  aria-expanded={data.activePort === handle.id}
                  data-endpoint-node={node.id}
                  data-endpoint-port={handle.id}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    const bounds = event.currentTarget.getBoundingClientRect();
                    data.onEndpoint(
                      {
                        nodeId: node.id,
                        port: handle.id as WorkflowEndpoint["port"],
                      },
                      {
                        x: bounds.left + bounds.width / 2,
                        y: bounds.top + bounds.height / 2,
                      },
                      handle.side,
                      event.currentTarget,
                    );
                  }}
                >
                  <span className="wf-endpoint-mark">
                    <Plus aria-hidden="true" />
                  </span>
                </WorkflowIconButton>
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
const nodeTypes = { workflow: WorkflowCanvasNode };
const ariaLabels = {
  "node.a11yDescription.default":
    "Press Enter or Space to select a node, use the arrow keys to move it, and Escape to deselect. Press Tab to reach an unused output or an insertion button on a connection.",
  "node.a11yDescription.keyboardDisabled":
    "Press Enter or Space to select a node. When editing is enabled, use the arrow keys to move it. Press Tab to reach an unused output or a connection's add button.",
  "node.a11yDescription.ariaLiveMessage": ({
    x,
    y,
  }: {
    x: number;
    y: number;
  }) => `Node moved to canvas coordinates ${x}, ${y}.`,
  "edge.a11yDescription.default":
    "Press Enter to select and edit a connection.",
  "minimap.ariaLabel": "Workflow minimap",
};
function download(flow: WorkflowDefinition) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(flow, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${flow.id.replace(/[^a-zA-Z0-9_-]/g, "_") || "workflow"}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type DataWorkflowProps = {
  workflow: WorkflowDefinition;
  onChange?: (workflow: WorkflowDefinition) => void;
  templates?: WorkflowTemplate[];
  /** Persist drafts, including incomplete graphs. Execution validation is separate. */
  onSave?: (workflow: WorkflowDefinition) => Promise<void>;
  onRun?: (
    workflow: WorkflowDefinition,
    context: WorkflowRunContext,
  ) => Promise<WorkflowRun>;
  run?: WorkflowRun;
  /** Authoritative publication state. Saving a draft never publishes it. */
  publication?: WorkflowPublication;
  runLabel?: string;
  saveLabel?: string;
  /** Return 1–3 key fields or an expression derived from current adapter configuration. */
  getNodeSummary?: (
    node: WorkflowNode,
    context: { workflow: WorkflowDefinition },
  ) => WorkflowNodeSummary | undefined;
  /** Host-specific configuration forms; name, execution policy and run data remain shared. */
  renderNodeConfiguration?: (
    node: WorkflowNode,
    context: {
      readOnly: boolean;
      onChange: (patch: Partial<WorkflowNode>) => void;
    },
  ) => ReactNode;
  initialViewport?: { x: number; y: number; zoom: number };
  className?: string;
};

export function DataWorkflow({
  workflow,
  onChange,
  templates = [],
  onSave,
  onRun,
  run,
  publication,
  runLabel = "Test workflow",
  saveLabel = "Save draft",
  getNodeSummary,
  renderNodeConfiguration,
  initialViewport,
  className = "",
}: DataWorkflowProps) {
  const uid = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [picker, setPicker] = useState<StepPickerState | null>(null);
  const [contextMenu, setContextMenu] = useState<CanvasMenuState | null>(null);
  const contextMenuRef = useRef(contextMenu);
  contextMenuRef.current = contextMenu;
  const [zoom, setZoom] = useState(initialViewport?.zoom ?? 1);
  const reconnecting = useRef<string | null>(null);
  const pickerTrigger = useRef<HTMLElement | null>(null);
  const restorePickerFocus = useRef(true);
  const afterMenu = useRef<(() => void) | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [resultNodeId, setResultNodeId] = useState<string | null>(null);
  const [resultView, setResultView] = useState({
    failuresOnly: false,
    payloadTab: "output",
  });
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [expanded, setExpanded] = useState(false);
  const [savedViewport, setSavedViewport] = useState<typeof initialViewport>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<"run" | "save" | null>(null);
  const [savedDefinition, setSavedDefinition] = useState<string | null>(null);
  const [localRun, setLocalRun] = useState<{
    signature: string;
    value: WorkflowRun;
  } | null>(null);
  const [, setHistoryVersion] = useState(0);
  const history = useRef<{
    past: WorkflowDefinition[];
    future: WorkflowDefinition[];
    group: string;
    at: number;
  }>({ past: [], future: [], group: "", at: 0 });
  const dragging = useRef(false);
  const serialized = JSON.stringify(workflow);
  const expectedDefinition = useRef(serialized);
  const flowRef = useRef(workflow);
  flowRef.current = workflow;
  const actionRef = useRef<{
    controller: AbortController;
    signature: string;
  } | null>(null);
  const canvas = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const canvasElement = useRef<HTMLDivElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const wasExpanded = useRef(false);
  const inspectorHeading = useRef<HTMLHeadingElement>(null);
  const signature = workflowSignature(workflow);
  const publicationStatus = workflowPublicationStatus(workflow, publication);
  const publicationText = {
    unknown: "Unknown",
    draft: "Draft",
    published: "Published",
    changed: "Unpublished changes",
  }[publicationStatus];
  const publicationLabel = {
    unknown: "Publication: Not provided",
    draft: "Publication: Draft",
    published: "Publication: Published",
    changed: "Publication: Draft with unpublished changes",
  }[publicationStatus];
  const PublicationIcon =
    publicationStatus === "published"
      ? CircleCheck
      : publicationStatus === "unknown"
        ? CircleHelp
        : publicationStatus === "changed"
          ? CircleDot
          : CircleDashed;
  const issues = useMemo(() => validateWorkflow(workflow), [workflow]);
  const validationLabel = issues.length
    ? `Validation: ${issues.length} ${issues.length === 1 ? "issue" : "issues"}. ${issues
        .slice(0, 3)
        .map((issue) => issue.message)
        .join(" ")}`
    : "Validation: Passed";
  const editable = !!onChange && !busy;
  const selected = workflow.nodes.find((node) => node.id === selectedId);
  const edge = workflow.edges.find((item) => item.id === selectedEdge);
  const edgeSources = edge
    ? workflow.nodes.flatMap((node) =>
        outputPorts(node).map((port) => ({
          value: JSON.stringify([node.id, port.id]),
          label: `${node.label} / ${port.label}`,
          disabled: !!connectionIssue(
            {
              ...workflow,
              edges: workflow.edges.filter((item) => item.id !== edge.id),
            },
            { source: node.id, port: port.id, target: edge.target },
          ),
        })),
      )
    : [];
  const result =
    run?.workflowId === workflow.id && run.definitionSignature === signature
      ? run
      : localRun?.signature === signature
        ? localRun.value
        : undefined;
  const rightOpen = !!selected || !!edge || settingsOpen;
  const motionDuration = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180;

  useEffect(() => () => actionRef.current?.controller.abort(), []);
  useEffect(() => {
    setResultNodeId(null);
    setRunMessage(null);
  }, [signature]);
  useEffect(() => {
    setResultNodeId(null);
    setResultView((view) => ({ ...view, failuresOnly: false }));
  }, [result?.id]);
  useEffect(() => {
    // A fresh authoritative receipt supersedes a local request/cancel message.
    if (
      run?.workflowId === workflow.id &&
      run.definitionSignature === signature
    )
      setRunMessage(null);
  }, [run, workflow.id, signature]);
  useEffect(() => {
    setPicker(null);
    setContextMenu(null);
  }, [signature, editable, expanded]);
  useEffect(() => {
    if (!selectedId || !rightOpen) return;
    const frame = requestAnimationFrame(() => {
      const bounds = canvasElement.current?.getBoundingClientRect();
      const element = root.current?.querySelector<HTMLElement>(
        `.react-flow__node[data-id="${CSS.escape(selectedId)}"]`,
      );
      if (!bounds || !element || !canvas.current) return;
      const box = element.getBoundingClientRect();
      const dx =
        box.right > bounds.right - 64
          ? bounds.right - 64 - box.right
          : box.left < bounds.left + 64
            ? bounds.left + 64 - box.left
            : 0;
      const dy =
        box.bottom > bounds.bottom - 64
          ? bounds.bottom - 64 - box.bottom
          : box.top < bounds.top + 64
            ? bounds.top + 64 - box.top
            : 0;
      if (dx || dy) {
        const viewport = canvas.current.getViewport();
        void canvas.current.setViewport(
          { ...viewport, x: viewport.x + dx, y: viewport.y + dy },
          { duration: motionDuration() },
        );
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId, rightOpen, expanded]);
  useEffect(() => {
    if (expectedDefinition.current !== serialized) {
      history.current = { past: [], future: [], group: "", at: 0 };
      expectedDefinition.current = serialized;
      setHistoryVersion((value) => value + 1);
    }
  }, [serialized]);
  useEffect(() => {
    if (expanded) {
      dialog.current?.showModal();
      wasExpanded.current = true;
    } else if (wasExpanded.current) {
      wasExpanded.current = false;
      dialog.current?.close();
      root.current
        ?.querySelector<HTMLButtonElement>("[data-workflow-expand]")
        ?.focus();
    }
  }, [expanded]);
  useEffect(() => {
    if (actionRef.current && actionRef.current.signature !== signature) {
      actionRef.current.controller.abort();
      actionRef.current = null;
      setBusy(null);
      setNotice(
        "The workflow changed. Stopped waiting for the previous request.",
      );
    }
  }, [signature]);

  const nodes = useMemo<CanvasNode[]>(
    () =>
      workflow.nodes.map((definition) => {
        const summary =
          getNodeSummary?.(definition, { workflow }) ??
          defaultWorkflowNodeSummary(definition, workflow);
        return {
          id: definition.id,
          type: "workflow",
          position: definition.position,
          measured: dimensions[definition.id],
          selected: definition.id === selectedId,
          ariaLabel: `${definition.label}, ${workflowKinds[definition.kind].label}.${workflowNodeSummaryText(summary)}`,
          data: {
            definition,
            summary,
            onEndpoint: openEndpoint,
            connectedPorts: workflow.edges
              .filter((edge) => edge.source === definition.id)
              .map((edge) => edge.port),
            activePort:
              !picker?.edgeId && picker?.endpoint?.nodeId === definition.id
                ? picker.endpoint.port
                : undefined,
            showRunDetails: !!result,
            result: result?.nodes.find((node) => node.nodeId === definition.id),
            issues: issues.filter((issue) => issue.nodeId === definition.id)
              .length,
            readOnly: !editable,
            inputSide: toward(
              definition,
              workflow.edges
                .filter((item) => item.target === definition.id)
                .flatMap((item) =>
                  workflow.nodes.filter((node) => node.id === item.source),
                ),
              Position.Left,
            ),
            ports: outputPorts(definition).map((port) => ({
              ...port,
              side: toward(
                definition,
                workflow.edges
                  .filter(
                    (item) =>
                      item.source === definition.id && item.port === port.id,
                  )
                  .flatMap((item) =>
                    workflow.nodes.filter((node) => node.id === item.target),
                  ),
                Position.Right,
              ),
            })),
          },
        };
      }),
    [
      workflow,
      getNodeSummary,
      selectedId,
      result,
      issues,
      editable,
      dimensions,
      picker,
    ],
  );
  const edges = useMemo<CanvasEdge[]>(
    () =>
      workflow.edges.map((item) => {
        const source = workflow.nodes.find((node) => node.id === item.source);
        const target = workflow.nodes.find((node) => node.id === item.target);
        const portLabel = source
          ? (outputPorts(source).find((port) => port.id === item.port)?.label ??
            item.port)
          : item.port;
        const connectionLabel = `${source?.label ?? item.source} → ${target?.label ?? item.target}, ${portLabel}`;
        return {
          ...item,
          sourceHandle: item.port,
          targetHandle: "in",
          type: "workflow",
          reconnectable: editable && item.id === selectedEdge,
          selected:
            item.id === selectedEdge ||
            (contextMenu?.kind === "edge" && contextMenu.id === item.id),
          interactionWidth: 28,
          data: {
            definition: item,
            readOnly: !editable,
            caption:
              item.port === "error"
                ? "Failure"
                : item.port === "true"
                  ? "Match"
                  : item.port === "false"
                    ? "No match"
                    : undefined,
            actionLabel: `${connectionLabel}: Insert node`,
            active: picker?.edgeId === item.id,
            onInsert: insertOnEdge,
          },
          className: item.port === "error" ? "wf-error-edge" : undefined,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "var(--muted-foreground)",
          },
          ariaLabel: connectionLabel,
        };
      }),
    [
      workflow.edges,
      workflow.nodes,
      selectedEdge,
      contextMenu,
      editable,
      picker?.edgeId,
    ],
  );

  function change(next: WorkflowDefinition, group = "") {
    if (!editable || JSON.stringify(next) === JSON.stringify(flowRef.current))
      return;
    const stack = history.current;
    if (
      !group ||
      group !== stack.group ||
      (!dragging.current && Date.now() - stack.at > 700)
    )
      stack.past = [...stack.past.slice(-49), structuredClone(flowRef.current)];
    stack.future = [];
    stack.group = group;
    stack.at = Date.now();
    expectedDefinition.current = JSON.stringify(next);
    onChange?.(next);
    setHistoryVersion((value) => value + 1);
    setNotice("");
  }
  function travel(direction: "past" | "future") {
    if (!editable) return;
    const stack = history.current;
    const next = stack[direction].pop();
    if (!next) return;
    stack[direction === "past" ? "future" : "past"].push(
      structuredClone(flowRef.current),
    );
    stack.group = "";
    expectedDefinition.current = JSON.stringify(next);
    onChange?.(next);
    setHistoryVersion((value) => value + 1);
    setNotice(direction === "past" ? "Undone." : "Redone.");
  }
  function patchNode(id: string, patch: Partial<WorkflowNode>) {
    change(
      {
        ...workflow,
        nodes: workflow.nodes.map((node) =>
          node.id === id ? { ...node, ...patch, id: node.id } : node,
        ),
      },
      `node-${id}-${Object.keys(patch).join()}`,
    );
  }
  function closeInspector() {
    setSelectedId(null);
    setSelectedEdge(null);
    setSettingsOpen(false);
  }
  function locate(id: string) {
    const node = canvas.current?.getNode(id);
    if (!node) return;
    void canvas.current?.setCenter(
      node.position.x + (node.measured?.width ?? 232) / 2,
      node.position.y + (node.measured?.height ?? 168) / 2,
      {
        zoom: Math.max(canvas.current.getZoom(), 0.85),
        duration: motionDuration(),
      },
    );
  }
  function select(id: string, focus = false, data = false) {
    if (data) {
      closeInspector();
      setConsoleOpen(true);
      setResultNodeId(id);
      if (focus)
        requestAnimationFrame(() => {
          locate(id);
          root.current
            ?.querySelector<HTMLElement>(".wf-result-detail h4")
            ?.focus();
        });
      return;
    }
    setSelectedId(id);
    setSelectedEdge(null);
    setSettingsOpen(false);
    if (focus)
      requestAnimationFrame(() => {
        locate(id);
        inspectorHeading.current?.focus();
      });
  }
  function connect(item: Omit<WorkflowEdge, "id">) {
    if (!editable) return;
    const issue = connectionIssue(workflow, item);
    if (issue) {
      setNotice(issue);
      return;
    }
    change({
      ...workflow,
      edges: [...workflow.edges, { ...item, id: crypto.randomUUID() }],
    });
    setNotice("Connection added.");
  }
  function canvasCenter() {
    const bounds = canvasElement.current?.getBoundingClientRect();
    return bounds
      ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
      : { x: 0, y: 0 };
  }
  function openTrigger(point: { x: number; y: number }, trigger?: HTMLElement) {
    if (!editable) return;
    pickerTrigger.current =
      trigger ??
      root.current?.querySelector<HTMLElement>("[data-workflow-more]") ??
      null;
    restorePickerFocus.current = true;
    const center = canvas.current?.screenToFlowPosition(point) ?? {
      x: 116,
      y: 84,
    };
    closeInspector();
    setPicker({ point, position: { x: center.x - 116, y: center.y - 84 } });
  }
  function insertOnEdge(
    edge: WorkflowEdge,
    point = canvasCenter(),
    trigger?: HTMLElement,
  ) {
    if (!editable) return;
    const source = workflow.nodes.find((node) => node.id === edge.source);
    const target = workflow.nodes.find((node) => node.id === edge.target);
    if (!source || !target) return;
    pickerTrigger.current = trigger ?? canvasElement.current;
    restorePickerFocus.current = true;
    closeInspector();
    setPicker({
      edgeId: edge.id,
      endpoint: { nodeId: edge.source, port: edge.port },
      point,
      position: {
        x: (source.position.x + target.position.x) / 2,
        y: (source.position.y + target.position.y) / 2,
      },
    });
  }
  function openEndpoint(
    endpoint: WorkflowEndpoint,
    point: { x: number; y: number },
    side: Position,
    trigger?: HTMLButtonElement,
    dropped = false,
  ) {
    if (!editable) return;
    const context = workflowStepContext(workflow, endpoint);
    if (!context.node) return;
    const node = context.node;
    const size = dimensions[node.id] ?? { width: 232, height: 168 };
    let position = {
      x:
        node.position.x +
        (side === Position.Right
          ? size.width + 128
          : side === Position.Left
            ? -360
            : 0),
      y:
        node.position.y +
        (side === Position.Bottom
          ? size.height + 112
          : side === Position.Top
            ? -280
            : 0),
    };
    if (context.replace[0]) {
      const otherId =
        endpoint.port === "in"
          ? context.replace[0].source
          : context.replace[0].target;
      const other = workflow.nodes.find((item) => item.id === otherId);
      if (other)
        position = {
          x: (node.position.x + other.position.x) / 2,
          y: (node.position.y + other.position.y) / 2,
        };
    }
    if (dropped) {
      const center = canvas.current?.screenToFlowPosition(point);
      if (center) position = { x: center.x - 116, y: center.y - 84 };
    }
    pickerTrigger.current = trigger ?? canvasElement.current;
    restorePickerFocus.current = true;
    closeInspector();
    setPicker({ endpoint, point, position });
  }
  const onConnectEnd: OnConnectEnd = (event, state) => {
    if (
      reconnecting.current ||
      !editable ||
      state.isValid ||
      !state.fromNode ||
      !state.fromHandle
    )
      return;
    const pointer = "changedTouches" in event ? event.changedTouches[0] : event;
    if (!pointer) return;
    const target = document.elementFromPoint(pointer.clientX, pointer.clientY);
    if (
      !target?.closest(".react-flow__pane") ||
      target.closest(".react-flow__node")
    ) {
      if (target?.closest(".react-flow__node"))
        setNotice(
          "These ports are incompatible. Choose a compatible input or output.",
        );
      return;
    }
    openEndpoint(
      {
        nodeId: state.fromNode.id,
        port:
          state.fromHandle.type === "target"
            ? "in"
            : ((state.fromHandle.id ?? "out") as WorkflowPort),
      },
      { x: pointer.clientX, y: pointer.clientY },
      state.fromHandle.position,
      undefined,
      true,
    );
  };
  const endpointContext = picker?.endpoint
    ? workflowStepContext(workflow, picker.endpoint)
    : undefined;
  const pickerContext =
    picker?.edgeId && endpointContext
      ? { ...endpointContext, mode: "insert" as const }
      : endpointContext;
  const choices: StepChoice[] = [];
  if (picker && editable) {
    const needsOutput =
      picker.endpoint?.port === "in" || pickerContext?.mode === "insert";
    const addChoice = (node: WorkflowNode, existing: boolean, key: string) => {
      if (!picker.endpoint && node.kind !== "trigger") return;
      const ports = needsOutput
        ? outputPorts(node).filter((port) => existing || port.id !== "error")
        : [undefined];
      for (const port of ports) {
        if (
          picker.endpoint &&
          (picker.edgeId
            ? planWorkflowEdgeStep(workflow, picker.edgeId, node, port?.id)
            : planWorkflowStep(workflow, picker.endpoint, node, port?.id)
          ).issue
        )
          continue;
        const Icon = icons[node.kind];
        choices.push({
          id: `${existing ? "existing" : "new"}:${key}:${port?.id ?? "auto"}`,
          node,
          port: port?.id,
          existing,
          label:
            port && (node.kind === "condition" || port.id === "error")
              ? `${node.label} · ${port.label}`
              : node.label,
          description: existing
            ? workflowKinds[node.kind].label
            : (node.description ?? workflowKinds[node.kind].label),
          group: existing ? "Current workflow" : workflowKinds[node.kind].group,
          icon: <Icon aria-hidden="true" />,
        });
      }
    };
    for (const [index, template] of templates.entries()) {
      let id = `new-step-${index}`;
      while (workflow.nodes.some((node) => node.id === id)) id += "-";
      addChoice(
        { ...template, id, position: picker.position },
        false,
        template.id,
      );
    }
    if (picker.endpoint && pickerContext?.mode !== "insert")
      for (const node of workflow.nodes) addChoice(node, true, node.id);
  }
  function chooseStep(id: string) {
    if (!editable || !picker) return;
    const choice = choices.find((item) => item.id === id);
    if (!choice) return;
    const current = flowRef.current;
    const node = choice.existing
      ? choice.node
      : {
          ...structuredClone(choice.node),
          id: crypto.randomUUID(),
          position: placeWorkflowStep(current, picker.position, dimensions),
        };
    const plan = picker.edgeId
      ? planWorkflowEdgeStep(current, picker.edgeId, node, choice.port)
      : picker.endpoint
        ? planWorkflowStep(current, picker.endpoint, node, choice.port)
        : { issue: null, remove: [], edges: [] };
    if (plan.issue !== null) {
      setNotice(plan.issue);
      setPicker(null);
      return;
    }
    change({
      ...current,
      nodes: choice.existing ? current.nodes : [...current.nodes, node],
      edges: [
        ...current.edges.filter((item) => !plan.remove.includes(item.id)),
        ...plan.edges.map((item) => ({ ...item, id: crypto.randomUUID() })),
      ],
    });
    restorePickerFocus.current = false;
    setPicker(null);
    select(node.id, true);
    setNotice(
      choice.existing
        ? `Connected "${node.label}".`
        : `${pickerContext?.mode === "insert" ? "Inserted" : "Added"} "${node.label}".`,
    );
  }
  function duplicateNode(node: WorkflowNode) {
    const id = crypto.randomUUID();
    change({
      ...workflow,
      nodes: [
        ...workflow.nodes,
        {
          ...structuredClone(node),
          id,
          label: `${node.label} copy`,
          position: placeWorkflowStep(
            workflow,
            {
              x: node.position.x + 40,
              y: node.position.y + (dimensions[node.id]?.height ?? 168) + 32,
            },
            dimensions,
          ),
        },
      ],
    });
    select(id, true);
    setNotice(
      "Node configuration copied without connections. You can undo this action.",
    );
  }
  function removeNode(id: string) {
    change({
      ...workflow,
      nodes: workflow.nodes.filter((node) => node.id !== id),
      edges: workflow.edges.filter(
        (item) => item.source !== id && item.target !== id,
      ),
    });
    closeInspector();
    canvasElement.current?.focus({ preventScroll: true });
    setNotice("Node and its connections removed. You can undo this action.");
  }
  function removeEdge(id: string) {
    change({
      ...workflow,
      edges: workflow.edges.filter((item) => item.id !== id),
    });
    setSelectedEdge(null);
    canvasElement.current?.focus({ preventScroll: true });
    setNotice("Connection removed. You can undo this action.");
  }
  async function action(type: "save" | "run") {
    if (actionRef.current) return;
    if (type === "run" && issues.length) {
      const issue = issues[0];
      setNotice(
        `Cannot test: ${issues.length} configuration ${issues.length === 1 ? "issue" : "issues"}. ${issue.message}`,
      );
      if (issue.nodeId) select(issue.nodeId, true);
      else if (issue.edgeId) selectEdge(issue.edgeId, true);
      else if (issue.code === "identity" || issue.code === "concurrency")
        showSettings();
      return;
    }
    const request = { controller: new AbortController(), signature };
    actionRef.current = request;
    setBusy(type);
    setNotice("");
    const snapshot = structuredClone(workflow);
    const current = () =>
      actionRef.current === request &&
      !request.controller.signal.aborted &&
      workflowSignature(flowRef.current) === request.signature;
    try {
      if (type === "save" && onSave) {
        await onSave(snapshot);
        if (current()) {
          setSavedDefinition(JSON.stringify(snapshot));
          setNotice("Draft saved.");
        }
      }
      if (type === "run" && onRun) {
        closeInspector();
        setConsoleOpen(true);
        setResultNodeId(null);
        setRunMessage(null);
        setLocalRun(null);
        const value = await onRun(snapshot, {
          signal: request.controller.signal,
          onUpdate: (update) => {
            if (
              current() &&
              update.workflowId === snapshot.id &&
              update.definitionSignature === signature
            )
              setLocalRun({ signature, value: update });
          },
        });
        if (current()) {
          if (
            value.workflowId !== snapshot.id ||
            value.definitionSignature !== signature
          )
            throw new Error(
              "The run result does not match the current workflow version.",
            );
          setLocalRun({ signature, value });
        }
      }
    } catch (error) {
      if (current()) {
        const message =
          error instanceof Error
            ? error.message
            : "Request failed. Please try again.";
        if (type === "run")
          setRunMessage(
            `Could not retrieve the complete run result: ${message}`,
          );
        else setNotice(message);
      }
    } finally {
      if (actionRef.current === request) {
        actionRef.current = null;
        setBusy(null);
      }
    }
  }
  function cancel() {
    actionRef.current?.controller.abort();
    actionRef.current = null;
    setBusy(null);
    setRunMessage(
      result
        ? "Cancellation requested; stopped waiting. Existing data is the last received result. Background cancellation is not yet confirmed."
        : "Cancellation requested; stopped waiting. No result has been received. Background cancellation is not yet confirmed.",
    );
  }
  function toggleExpanded() {
    setSavedViewport(canvas.current?.getViewport());
    setExpanded(!expanded);
  }
  function showSettings() {
    closeInspector();
    setSettingsOpen(true);
    requestAnimationFrame(() => inspectorHeading.current?.focus());
  }
  function fit() {
    void canvas.current?.fitView({
      padding: 0.1,
      duration: motionDuration(),
      maxZoom: 1,
    });
  }
  function resetZoom() {
    if (!canvas.current) return;
    void canvas.current.zoomTo(1, { duration: motionDuration() });
  }
  function arrange() {
    if (!editable) return;
    change(layoutWorkflow(workflow, dimensions));
    requestAnimationFrame(fit);
  }
  function selectEdge(id: string, focus = false) {
    closeInspector();
    setSelectedEdge(id);
    if (focus) requestAnimationFrame(() => inspectorHeading.current?.focus());
  }
  function changeEdge(edge: WorkflowEdge, connection: Connection) {
    if (!editable) return;
    const definition = workflow.edges.find((item) => item.id === edge.id);
    if (!definition) return;
    const next = {
      ...definition,
      source: connection.source,
      target: connection.target,
      port: (connection.sourceHandle ?? "out") as WorkflowPort,
    };
    const issue = connectionIssue(
      {
        ...workflow,
        edges: workflow.edges.filter((item) => item.id !== edge.id),
      },
      next,
    );
    if (issue) {
      setNotice(issue);
      return;
    }
    change({
      ...workflow,
      edges: workflow.edges.map((item) => (item.id === edge.id ? next : item)),
    });
    setNotice("Connection updated. You can undo this action.");
  }
  function invokeContext(target: Element, point: { x: number; y: number }) {
    const node = target.closest<HTMLElement>(".react-flow__node");
    const edge = target.closest<HTMLElement>(
      ".react-flow__edge,[data-edge-action]",
    );
    if (!node && !edge && !target.closest(".react-flow__pane")) return false;
    setPicker(null);
    setContextMenu({
      kind: node ? "node" : edge ? "edge" : "canvas",
      id: node?.dataset.id ?? edge?.dataset.edgeAction ?? edge?.dataset.id,
      point: {
        x: Math.max(12, Math.min(window.innerWidth - 12, point.x)),
        y: Math.max(12, Math.min(window.innerHeight - 12, point.y)),
      },
      trigger:
        target.closest<HTMLElement>("button") ??
        node ??
        edge ??
        canvasElement.current!,
    });
    return true;
  }
  const menuNode =
    contextMenu?.kind === "node"
      ? workflow.nodes.find((node) => node.id === contextMenu.id)
      : undefined;
  const menuEdge =
    contextMenu?.kind === "edge"
      ? workflow.edges.find((edge) => edge.id === contextMenu.id)
      : undefined;
  const menuActions: WorkflowMenuAction[] = menuNode
    ? [
        {
          id: "configure",
          label: onChange ? "Configure node" : "View node",
          icon: <Settings2 aria-hidden="true" />,
          onSelect: () => select(menuNode.id, true),
        },
        ...(result
          ? [
              {
                id: "data",
                label: "View input and output",
                icon: <Braces aria-hidden="true" />,
                onSelect: () => select(menuNode.id, true, true),
              },
            ]
          : []),
        ...(onChange
          ? [
              {
                id: "duplicate",
                label: "Duplicate node",
                icon: <Copy aria-hidden="true" />,
                separator: true,
                disabled: !editable,
                onSelect: () => duplicateNode(menuNode),
              },
              {
                id: "delete",
                label: "Remove node",
                icon: <Trash2 aria-hidden="true" />,
                destructive: true,
                disabled: !editable,
                onSelect: () => removeNode(menuNode.id),
              },
            ]
          : []),
      ]
    : menuEdge
      ? [
          {
            id: "configure",
            label: onChange ? "Edit connection" : "View connection",
            icon: <Settings2 aria-hidden="true" />,
            onSelect: () => selectEdge(menuEdge.id, true),
          },
          ...(onChange
            ? [
                {
                  id: "insert",
                  label: "Insert node",
                  icon: <Plus aria-hidden="true" />,
                  disabled: !editable || !templates.length,
                  onSelect: () =>
                    insertOnEdge(
                      menuEdge,
                      contextMenu!.point,
                      contextMenu!.trigger,
                    ),
                },
              ]
            : []),
          {
            id: "source",
            label: "Locate source node",
            icon: <LocateFixed aria-hidden="true" />,
            separator: true,
            onSelect: () => select(menuEdge.source, true),
          },
          {
            id: "target",
            label: "Locate target node",
            icon: <LocateFixed aria-hidden="true" />,
            onSelect: () => select(menuEdge.target, true),
          },
          ...(onChange
            ? [
                {
                  id: "delete",
                  label: "Remove connection",
                  icon: <Trash2 aria-hidden="true" />,
                  destructive: true,
                  separator: true,
                  disabled: !editable,
                  onSelect: () => removeEdge(menuEdge.id),
                },
              ]
            : []),
        ]
      : [
          ...(onChange &&
          templates.some((template) => template.kind === "trigger")
            ? [
                {
                  id: "trigger",
                  label: "Add trigger",
                  icon: <Zap aria-hidden="true" />,
                  disabled: !editable,
                  onSelect: () =>
                    openTrigger(contextMenu!.point, contextMenu!.trigger),
                },
              ]
            : []),
          ...(onChange
            ? [
                {
                  id: "undo",
                  label: "Undo",
                  icon: <Undo2 aria-hidden="true" />,
                  separator: true,
                  disabled: !editable || !history.current.past.length,
                  onSelect: () => travel("past"),
                },
                {
                  id: "redo",
                  label: "Redo",
                  icon: <Redo2 aria-hidden="true" />,
                  disabled: !editable || !history.current.future.length,
                  onSelect: () => travel("future"),
                },
                {
                  id: "layout",
                  label: "Arrange layout",
                  icon: <LayoutGrid aria-hidden="true" />,
                  disabled: !editable || !workflow.nodes.length,
                  onSelect: arrange,
                },
              ]
            : []),
          {
            id: "fit",
            label: "Fit workflow",
            icon: <Maximize aria-hidden="true" />,
            separator: true,
            disabled: !workflow.nodes.length,
            onSelect: fit,
          },
          {
            id: "zoom",
            label: "Reset to 100%",
            icon: <Scan aria-hidden="true" />,
            onSelect: resetZoom,
          },
          {
            id: "settings",
            label: "Workflow settings",
            icon: <Settings2 aria-hidden="true" />,
            onSelect: showSettings,
          },
        ];

  const editor = (
    <section
      ref={root}
      className={`wf-root ${className}`}
      lang="en"
      aria-label="Data processing workflow"
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        const editing = target.closest(
          'input,textarea,select,[contenteditable=true],[role="menu"],.wf-step-picker',
        );
        const graphObject = target.closest<HTMLElement>(
          ".react-flow__node,.react-flow__edge",
        );
        const contextObject =
          graphObject ?? target.closest<HTMLElement>("[data-edge-action]");
        if (
          !editing &&
          (event.key === "ContextMenu" ||
            (event.shiftKey && event.key === "F10"))
        ) {
          const anchor = contextObject ?? canvasElement.current;
          if (anchor && (contextObject || target.closest(".wf-canvas"))) {
            const box = anchor.getBoundingClientRect();
            const point = {
              x: box.x + Math.min(box.width / 2, 160),
              y: box.y + Math.min(box.height / 2, 120),
            };
            if (
              invokeContext(
                contextObject
                  ? target
                  : canvasElement.current!.querySelector(".react-flow__pane")!,
                point,
              )
            )
              event.preventDefault();
          }
        }
        if (editable && !editing && graphObject && !target.closest("button")) {
          const id = graphObject.dataset.id!;
          if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            if (graphObject.classList.contains("react-flow__node"))
              removeNode(id);
            else removeEdge(id);
          }
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === "d" &&
            graphObject.classList.contains("react-flow__node")
          ) {
            const node = workflow.nodes.find((node) => node.id === id);
            if (node) {
              event.preventDefault();
              duplicateNode(node);
            }
          }
        }
        if (
          editable &&
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "z" &&
          !editing
        ) {
          event.preventDefault();
          travel(event.shiftKey ? "future" : "past");
        }
        if (
          event.key === "Escape" &&
          !target.closest('[role="menu"],.wf-step-picker')
        ) {
          if (rightOpen) {
            event.preventDefault();
            event.stopPropagation();
            closeInspector();
            canvasElement.current?.focus();
          }
        }
      }}
    >
      {contextMenu && (
        <WorkflowContextMenu
          key={`${contextMenu.kind}:${contextMenu.id}:${contextMenu.point.x}:${contextMenu.point.y}`}
          point={contextMenu.point}
          label={
            menuNode?.label ||
            (menuEdge ? "Connection actions" : "Canvas actions")
          }
          actions={menuActions}
          container={root}
          trigger={contextMenu.trigger}
          onClose={() => {
            if (contextMenuRef.current !== contextMenu) return false;
            setContextMenu(null);
            return true;
          }}
        />
      )}
      {picker && editable && (
        <WorkflowStepPicker
          key={`${picker.endpoint?.nodeId ?? "trigger"}:${picker.endpoint?.port ?? ""}:${picker.point.x}:${picker.point.y}`}
          point={picker.point}
          title={
            !picker.endpoint
              ? "Choose a trigger"
              : pickerContext?.mode === "insert"
                ? "Insert a step"
                : picker.endpoint.port === "in"
                  ? "Choose the previous step"
                  : "Choose the next step"
          }
          context={
            pickerContext?.node
              ? `${pickerContext.node.label} / ${picker.endpoint?.port === "in" ? "Input" : (outputPorts(pickerContext.node).find((port) => port.id === picker.endpoint?.port)?.label ?? "Output")}`
              : undefined
          }
          choices={choices}
          container={root}
          onChoose={chooseStep}
          onClose={() => setPicker(null)}
          onRestoreFocus={() => {
            if (restorePickerFocus.current) {
              const trigger = pickerTrigger.current;
              if (trigger?.isConnected) trigger.focus({ preventScroll: true });
              else canvasElement.current?.focus({ preventScroll: true });
            }
          }}
        />
      )}
      <header className="wf-header">
        <div className="wf-identity">
          <span className="wf-identity-icon surface-control" aria-hidden="true">
            <Workflow />
          </span>
          <div>
            <h3>{workflow.name || "Untitled workflow"}</h3>
            <div
              className="wf-header-states"
              role="group"
              aria-label="Workflow status"
            >
              <WorkflowStatusIndicator
                name="publication"
                state={publicationStatus}
                label={publicationLabel}
                icon={<PublicationIcon aria-hidden="true" />}
              >
                {publicationText}
              </WorkflowStatusIndicator>
              <WorkflowStatusIndicator
                name="nodes"
                label={`Nodes: ${workflow.nodes.length}`}
                icon={<Workflow aria-hidden="true" />}
              >
                {workflow.nodes.length}{" "}
                {workflow.nodes.length === 1 ? "node" : "nodes"}
              </WorkflowStatusIndicator>
              <WorkflowStatusIndicator
                name="validation"
                state={
                  issues.length === 0
                    ? "valid"
                    : issues.length === 1
                      ? "warning"
                      : "invalid"
                }
                label={validationLabel}
                icon={
                  issues.length ? (
                    <ShieldAlert aria-hidden="true" />
                  ) : (
                    <ShieldCheck aria-hidden="true" />
                  )
                }
              >
                {issues.length} {issues.length === 1 ? "issue" : "issues"}
              </WorkflowStatusIndicator>
            </div>
          </div>
        </div>
        <WorkflowToolbar
          className="wf-actions"
          label="Workflow actions"
          grouping="separate"
        >
          {onSave && (
            <WorkflowIconButton
              variant="outline"
              label={
                busy === "save"
                  ? "Saving…"
                  : savedDefinition === serialized
                    ? `${saveLabel} (saved)`
                    : savedDefinition
                      ? `${saveLabel} (unsaved changes)`
                      : saveLabel
              }
              aria-busy={busy === "save"}
              disabled={!!busy}
              onClick={() => void action("save")}
            >
              {busy === "save" ? (
                <LoaderCircle aria-hidden="true" />
              ) : (
                <Save aria-hidden="true" />
              )}
            </WorkflowIconButton>
          )}
          {onRun &&
            (busy === "run" ? (
              <WorkflowIconButton
                variant="outline"
                label="Stop waiting"
                onClick={cancel}
              >
                <Square aria-hidden="true" />
              </WorkflowIconButton>
            ) : (
              <WorkflowIconButton
                variant="default"
                label={runLabel}
                disabled={!!busy}
                onClick={() => void action("run")}
              >
                <Play aria-hidden="true" />
              </WorkflowIconButton>
            ))}
          <Menu.Root>
            <Menu.Trigger asChild>
              <WorkflowIconButton
                data-workflow-more
                label="More workflow actions"
                touchHint={false}
              >
                <MoreHorizontal aria-hidden="true" />
              </WorkflowIconButton>
            </Menu.Trigger>
            <Menu.Portal container={expanded ? dialog.current : undefined}>
              <Menu.Content
                className="wf-menu"
                data-slot="dropdown-menu-content"
                align="end"
                sideOffset={8}
                collisionPadding={12}
                onCloseAutoFocus={(event) => {
                  const action = afterMenu.current;
                  if (!action) return;
                  event.preventDefault();
                  afterMenu.current = null;
                  root.current
                    ?.querySelector<HTMLElement>("[data-workflow-more]")
                    ?.focus();
                  action();
                }}
              >
                <Menu.Item
                  data-slot="dropdown-menu-item"
                  onSelect={() => {
                    afterMenu.current = showSettings;
                  }}
                >
                  <Settings2 aria-hidden="true" />
                  Workflow settings
                </Menu.Item>
                {onChange &&
                  templates.some((template) => template.kind === "trigger") && (
                    <Menu.Item
                      data-slot="dropdown-menu-item"
                      disabled={!editable}
                      onSelect={() => {
                        afterMenu.current = () => openTrigger(canvasCenter());
                      }}
                    >
                      <Zap aria-hidden="true" />
                      Add trigger
                    </Menu.Item>
                  )}
                {onChange && (
                  <Menu.Item
                    data-slot="dropdown-menu-item"
                    disabled={!editable || !workflow.nodes.length}
                    onSelect={() => {
                      afterMenu.current = arrange;
                    }}
                  >
                    <LayoutGrid aria-hidden="true" />
                    Arrange layout
                  </Menu.Item>
                )}
                {onChange && (
                  <Menu.Item
                    data-slot="dropdown-menu-item"
                    disabled={!editable}
                    onSelect={() => upload.current?.click()}
                  >
                    <ArrowUpFromLine aria-hidden="true" />
                    Import workflow JSON
                  </Menu.Item>
                )}
                <Menu.Item
                  data-slot="dropdown-menu-item"
                  onSelect={() => download(workflow)}
                >
                  <ArrowDownToLine aria-hidden="true" />
                  Export workflow JSON
                </Menu.Item>
              </Menu.Content>
            </Menu.Portal>
          </Menu.Root>
          <WorkflowIconButton
            data-workflow-expand
            label={expanded ? "Collapse workspace" : "Expand workspace"}
            onClick={toggleExpanded}
          >
            {expanded ? (
              <Minimize2 aria-hidden="true" />
            ) : (
              <Maximize2 aria-hidden="true" />
            )}
          </WorkflowIconButton>
        </WorkflowToolbar>
      </header>
      <input
        ref={upload}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (file.size > 2_000_000) {
            setNotice("Workflow files must be no larger than 2 MB.");
            return;
          }
          try {
            const next = parseWorkflow(await file.text());
            change(next);
            closeInspector();
            setNotice("Workflow imported. You can edit it or undo the import.");
            requestAnimationFrame(() => requestAnimationFrame(fit));
          } catch (error) {
            setNotice(
              error instanceof Error
                ? error.message
                : "Could not read the workflow file.",
            );
          }
        }}
      />
      <div className="wf-stage" data-right={rightOpen}>
        <div
          ref={canvasElement}
          className="wf-canvas"
          tabIndex={0}
          aria-label="Workflow canvas"
          onContextMenu={(event) => {
            if (
              !event.defaultPrevented &&
              invokeContext(event.target as Element, {
                x: event.clientX,
                y: event.clientY,
              })
            )
              event.preventDefault();
          }}
        >
          <ReactFlow<CanvasNode, CanvasEdge>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeDragStart={() => {
              setPicker(null);
              setContextMenu(null);
              dragging.current = true;
              history.current.group = "";
            }}
            onNodeDragStop={() => {
              dragging.current = false;
              history.current.group = "";
            }}
            onInit={(instance) => {
              canvas.current = instance;
              setZoom(instance.getZoom());
            }}
            onNodesChange={(changes) => {
              const measurements = changes.filter(
                (item) => item.type === "dimensions" && item.dimensions,
              );
              if (measurements.length)
                setDimensions((current) => {
                  const next = { ...current };
                  let changed = false;
                  for (const item of measurements)
                    if (
                      item.type === "dimensions" &&
                      item.dimensions &&
                      (current[item.id]?.width !== item.dimensions.width ||
                        current[item.id]?.height !== item.dimensions.height)
                    ) {
                      next[item.id] = item.dimensions;
                      changed = true;
                    }
                  return changed ? next : current;
                });
              const choice = changes.find(
                (item) => item.type === "select" && item.selected,
              );
              if (choice?.type === "select" && choice.id !== selectedId)
                select(choice.id);
              const positions = changes.filter(
                (item) => item.type === "position",
              );
              if (editable && positions.length)
                change(
                  {
                    ...workflow,
                    nodes: workflow.nodes.map((node) => {
                      const move = positions.find(
                        (item) => item.id === node.id,
                      );
                      return move?.position
                        ? { ...node, position: move.position }
                        : node;
                    }),
                  },
                  `move-${positions.map((item) => item.id).join()}`,
                );
            }}
            onEdgesChange={(changes) => {
              const choice = changes.find(
                (item) => item.type === "select" && item.selected,
              );
              if (choice?.type === "select") {
                closeInspector();
                setSelectedEdge(choice.id);
              }
            }}
            onNodeClick={(_, node) => select(node.id)}
            onEdgeClick={(_, item) => selectEdge(item.id)}
            onPaneClick={() => {
              closeInspector();
            }}
            onConnect={(connection: Connection) =>
              connect({
                source: connection.source,
                target: connection.target,
                port: (connection.sourceHandle ?? "out") as WorkflowPort,
              })
            }
            onConnectEnd={onConnectEnd}
            onMoveStart={(event) => {
              if (event) {
                setPicker(null);
                setContextMenu(null);
              }
            }}
            onMove={(_, viewport) => setZoom(viewport.zoom)}
            onMoveEnd={(_, viewport) => setZoom(viewport.zoom)}
            onReconnectStart={(_, edge) => {
              reconnecting.current = edge.id;
            }}
            onReconnect={(edge, connection) =>
              changeEdge(edge as WorkflowEdge, connection)
            }
            onReconnectEnd={(_, __, ___, state) => {
              reconnecting.current = null;
              if (!state.isValid)
                setNotice("Connection unchanged. Choose a compatible port.");
            }}
            reconnectRadius={12}
            elevateEdgesOnSelect
            isValidConnection={(connection) =>
              !connectionIssue(
                reconnecting.current
                  ? {
                      ...workflow,
                      edges: workflow.edges.filter(
                        (edge) => edge.id !== reconnecting.current,
                      ),
                    }
                  : workflow,
                {
                  source: connection.source,
                  target: connection.target,
                  port: (connection.sourceHandle ?? "out") as WorkflowPort,
                },
              )
            }
            nodesDraggable={editable}
            nodesConnectable={editable}
            edgesReconnectable={editable}
            deleteKeyCode={null}
            defaultViewport={savedViewport ?? initialViewport}
            fitView={!(savedViewport ?? initialViewport)}
            fitViewOptions={{ padding: 0.1, maxZoom: 1 }}
            minZoom={0.15}
            maxZoom={1.8}
            zoomOnScroll={false}
            preventScrolling={false}
            ariaLabelConfig={ariaLabels}
          >
            <Background gap={24} size={1} />
            {workflow.nodes.length > 0 && (
              <MiniMap
                position="top-right"
                style={{ width: 112, height: 72 }}
                pannable
                zoomable
                nodeColor="var(--muted-foreground)"
                maskColor="color-mix(in srgb, var(--background) 80%, transparent)"
              />
            )}
          </ReactFlow>
          {workflow.nodes.length === 0 && (
            <div className="wf-empty">
              {editable &&
              templates.some((template) => template.kind === "trigger") ? (
                <button
                  type="button"
                  className="wf-start-node"
                  aria-haspopup="dialog"
                  onClick={(event) => {
                    const bounds = event.currentTarget.getBoundingClientRect();
                    openTrigger(
                      { x: bounds.right, y: bounds.top },
                      event.currentTarget,
                    );
                  }}
                >
                  <span>
                    <Plus aria-hidden="true" />
                  </span>
                  <strong>Choose a trigger</strong>
                  <small>Start your workflow here</small>
                </button>
              ) : (
                <div className="wf-start-node" aria-label="Empty workflow">
                  <Zap aria-hidden="true" />
                  <strong>No trigger yet</strong>
                  <small>
                    {editable
                      ? "No trigger types provided"
                      : "No workflow nodes provided"}
                  </small>
                </div>
              )}
            </div>
          )}
          {onChange && (
            <WorkflowToolbar className="wf-canvas-toolbar" label="Edit history">
              <WorkflowIconButton
                variant="outline"
                label="Undo"
                shortcut="⌘/Ctrl Z"
                disabled={!editable || !history.current.past.length}
                onClick={() => travel("past")}
              >
                <Undo2 aria-hidden="true" />
              </WorkflowIconButton>
              <WorkflowIconButton
                variant="outline"
                label="Redo"
                shortcut="⌘/Ctrl Shift Z"
                disabled={!editable || !history.current.future.length}
                onClick={() => travel("future")}
              >
                <Redo2 aria-hidden="true" />
              </WorkflowIconButton>
            </WorkflowToolbar>
          )}
          <WorkflowToolbar className="wf-zoom-controls" label="Canvas view">
            <WorkflowIconButton
              label="Zoom out"
              disabled={zoom <= 0.151}
              onClick={() =>
                void canvas.current?.zoomOut({ duration: motionDuration() })
              }
            >
              <Minus aria-hidden="true" />
            </WorkflowIconButton>
            <output
              className="wf-zoom-value"
              aria-label="Canvas zoom"
              aria-live="off"
            >
              {Math.round(zoom * 100)}%
            </output>
            <WorkflowIconButton
              label="Zoom in"
              disabled={zoom >= 1.799}
              onClick={() =>
                void canvas.current?.zoomIn({ duration: motionDuration() })
              }
            >
              <Plus aria-hidden="true" />
            </WorkflowIconButton>
            <WorkflowIconButton
              label="Fit workflow"
              disabled={!workflow.nodes.length}
              onClick={fit}
            >
              <Maximize aria-hidden="true" />
            </WorkflowIconButton>
          </WorkflowToolbar>
        </div>
        {rightOpen && (
          <aside
            className="wf-drawer wf-inspector"
            aria-label="Node and workflow configuration"
          >
            <div className="wf-drawer-heading">
              <div>
                <small>
                  {selected
                    ? workflowKinds[selected.kind].label
                    : edge
                      ? "Connection"
                      : "Workflow"}
                </small>
                <h4 ref={inspectorHeading} tabIndex={-1}>
                  {selected?.label ||
                    (edge ? "Connection details" : "Workflow settings")}
                </h4>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close configuration"
                onClick={() => {
                  closeInspector();
                  canvasElement.current?.focus();
                }}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            {selected && (
              <NodeInspector
                node={selected}
                editable={editable}
                onInspectData={
                  result ? () => select(selected.id, true, true) : undefined
                }
                onChange={(patch) => patchNode(selected.id, patch)}
                onRemove={onChange ? () => removeNode(selected.id) : undefined}
                onDuplicate={
                  onChange ? () => duplicateNode(selected) : undefined
                }
                renderConfiguration={renderNodeConfiguration}
              />
            )}
            {edge && (
              <div className="wf-drawer-body wf-fields">
                <div className="wf-connection-field">
                  <div className="wf-field-caption">
                    <label htmlFor={`${uid}-edge-source`}>
                      Source and output
                    </label>
                    <WorkflowIconButton
                      label="Locate source node"
                      disabled={
                        !workflow.nodes.some((node) => node.id === edge.source)
                      }
                      onClick={() => select(edge.source, true)}
                    >
                      <LocateFixed aria-hidden="true" />
                    </WorkflowIconButton>
                  </div>
                  <select
                    id={`${uid}-edge-source`}
                    data-slot="select-trigger"
                    value={JSON.stringify([edge.source, edge.port])}
                    disabled={!editable}
                    onChange={(event) => {
                      const [source, port] = JSON.parse(event.target.value) as [
                        string,
                        WorkflowPort,
                      ];
                      changeEdge(edge, {
                        source,
                        sourceHandle: port,
                        target: edge.target,
                        targetHandle: "in",
                      });
                    }}
                  >
                    {!edgeSources.some(
                      (item) =>
                        item.value === JSON.stringify([edge.source, edge.port]),
                    ) && (
                      <option
                        value={JSON.stringify([edge.source, edge.port])}
                        disabled
                      >
                        {workflow.nodes.find((node) => node.id === edge.source)
                          ?.label ?? edge.source}{" "}
                        / {edge.port} (unavailable)
                      </option>
                    )}
                    {edgeSources.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                        disabled={
                          item.disabled &&
                          item.value !==
                            JSON.stringify([edge.source, edge.port])
                        }
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="wf-connection-field">
                  <div className="wf-field-caption">
                    <label htmlFor={`${uid}-edge-target`}>Target node</label>
                    <WorkflowIconButton
                      label="Locate target node"
                      disabled={
                        !workflow.nodes.some((node) => node.id === edge.target)
                      }
                      onClick={() => select(edge.target, true)}
                    >
                      <LocateFixed aria-hidden="true" />
                    </WorkflowIconButton>
                  </div>
                  <select
                    id={`${uid}-edge-target`}
                    data-slot="select-trigger"
                    value={edge.target}
                    disabled={!editable}
                    onChange={(event) =>
                      changeEdge(edge, {
                        source: edge.source,
                        sourceHandle: edge.port,
                        target: event.target.value,
                        targetHandle: "in",
                      })
                    }
                  >
                    {!workflow.nodes.some(
                      (node) => node.id === edge.target,
                    ) && (
                      <option value={edge.target}>
                        {edge.target} (no longer available)
                      </option>
                    )}
                    {workflow.nodes.map((node) => (
                      <option
                        key={node.id}
                        value={node.id}
                        disabled={
                          node.id !== edge.target &&
                          !!connectionIssue(
                            {
                              ...workflow,
                              edges: workflow.edges.filter(
                                (item) => item.id !== edge.id,
                              ),
                            },
                            { ...edge, target: node.id },
                          )
                        }
                      >
                        {node.label}
                      </option>
                    ))}
                  </select>
                </div>
                {onChange && (
                  <p className="wf-field-help">
                    Occupied ports, incompatible types and connections that
                    create a cycle are unavailable. You can also drag either end
                    of the selected connection to reconnect it.
                  </p>
                )}
                <WorkflowToolbar
                  className="wf-node-actions"
                  label="Connection actions"
                >
                  {onChange && (
                    <>
                      <WorkflowIconButton
                        label="Insert a node in this connection"
                        disabled={!editable || !templates.length}
                        onClick={(event) => {
                          const box =
                            event.currentTarget.getBoundingClientRect();
                          insertOnEdge(
                            edge,
                            { x: box.left, y: box.bottom },
                            event.currentTarget,
                          );
                        }}
                      >
                        <Plus aria-hidden="true" />
                      </WorkflowIconButton>
                      <WorkflowIconButton
                        label="Remove connection"
                        disabled={!editable}
                        onClick={() => removeEdge(edge.id)}
                      >
                        <Trash2 aria-hidden="true" />
                      </WorkflowIconButton>
                    </>
                  )}
                </WorkflowToolbar>
              </div>
            )}
            {settingsOpen && (
              <div className="wf-drawer-body wf-fields">
                <label htmlFor={`${uid}-flow-name`}>
                  Workflow name
                  <input
                    data-slot="input"
                    id={`${uid}-flow-name`}
                    value={workflow.name}
                    readOnly={!editable}
                    onChange={(e) =>
                      change({ ...workflow, name: e.target.value }, "flow-name")
                    }
                  />
                </label>
                <label htmlFor={`${uid}-description`}>
                  Description
                  <textarea
                    data-slot="textarea"
                    id={`${uid}-description`}
                    value={workflow.description ?? ""}
                    readOnly={!editable}
                    rows={3}
                    onChange={(e) =>
                      change(
                        { ...workflow, description: e.target.value },
                        "flow-description",
                      )
                    }
                  />
                </label>
                <label htmlFor={`${uid}-concurrency`}>
                  Concurrency limit
                  <input
                    data-slot="input"
                    id={`${uid}-concurrency`}
                    type="number"
                    min={1}
                    max={64}
                    step={1}
                    value={workflow.maxConcurrency}
                    readOnly={!editable}
                    onChange={(e) =>
                      change(
                        { ...workflow, maxConcurrency: Number(e.target.value) },
                        "concurrency",
                      )
                    }
                  />
                  <small>
                    Maximum number of nodes that can execute at the same time in
                    one run.
                  </small>
                </label>
              </div>
            )}
          </aside>
        )}
      </div>
      <p className="wf-notice" role="status" aria-live="polite">
        {notice}
      </p>
      {(onRun || result) && (
        <WorkflowRunResults
          id={`${uid}-results`}
          workflow={workflow}
          run={result}
          pending={busy === "run"}
          message={runMessage}
          open={consoleOpen}
          onOpenChange={setConsoleOpen}
          selectedId={resultNodeId}
          onSelect={setResultNodeId}
          view={resultView}
          onViewChange={setResultView}
          onLocate={locate}
          onConfigure={(id) => select(id, true)}
        />
      )}
    </section>
  );
  return (
    <WorkflowTooltips container={root}>
      {!expanded && editor}
      <dialog
        ref={dialog}
        className="wf-expanded"
        aria-label="Expanded workflow workspace"
        onCancel={(event) => {
          event.preventDefault();
          setSavedViewport(canvas.current?.getViewport());
          setExpanded(false);
        }}
      >
        {expanded && editor}
      </dialog>
    </WorkflowTooltips>
  );
}
