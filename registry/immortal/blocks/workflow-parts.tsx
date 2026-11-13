"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type ReactElement,
  type RefObject,
} from "react";
import { DropdownMenu as Menu, Popover, Toolbar, Tooltip } from "radix-ui";
import {
  Check,
  Braces,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  Clock3,
  LoaderCircle,
  LocateFixed,
  Filter,
  Minus,
  Search,
  Square,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatWorkflowSummaryValue,
  workflowKinds,
  workflowStatuses,
  type WorkflowNode,
  type WorkflowDefinition,
  type WorkflowRun,
  type WorkflowNodeRun,
  type WorkflowNodeSummary,
  type WorkflowStatus,
} from "./workflow-model";

export type WorkflowStepChoice = {
  id: string;
  label: string;
  description: string;
  group: string;
  icon: ReactNode;
  existing?: boolean;
};

export type WorkflowMenuAction = {
  id: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
  onSelect: () => void;
};

/** Same menu behavior and material as the toolbar, anchored to the invoked object. */
export function WorkflowContextMenu({
  point,
  label,
  actions,
  container,
  trigger,
  onClose,
}: {
  point: { x: number; y: number };
  label: string;
  actions: WorkflowMenuAction[];
  container: RefObject<HTMLElement | null>;
  trigger: HTMLElement;
  onClose: () => boolean;
}) {
  const [open, setOpen] = useState(true);
  const selected = useRef<(() => void) | undefined>(undefined);
  const restore = useRef(true);
  return (
    <Menu.Root open={open} onOpenChange={setOpen} modal={false}>
      <Menu.Trigger asChild>
        <span
          className="wf-context-anchor"
          aria-hidden="true"
          tabIndex={-1}
          style={{ left: point.x, top: point.y }}
        />
      </Menu.Trigger>
      <Menu.Portal container={container.current}>
        <Menu.Content
          className="wf-menu wf-context-menu"
          data-slot="dropdown-menu-content"
          aria-label={label}
          aria-labelledby={undefined}
          align="start"
          sideOffset={4}
          collisionPadding={12}
          onEscapeKeyDown={(event) => event.stopPropagation()}
          onInteractOutside={() => {
            restore.current = false;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!onClose()) return;
            if ((selected.current || restore.current) && trigger.isConnected)
              trigger.focus({ preventScroll: true });
            selected.current?.();
          }}
        >
          <Menu.Label className="wf-menu-label">{label}</Menu.Label>
          {actions.map((action) => (
            <div key={action.id}>
              {action.separator && (
                <Menu.Separator data-slot="dropdown-menu-separator" />
              )}
              <Menu.Item
                data-slot="dropdown-menu-item"
                data-variant={action.destructive ? "destructive" : undefined}
                disabled={action.disabled}
                onSelect={() => {
                  selected.current = action.onSelect;
                }}
              >
                {action.icon}
                <span>{action.label}</span>
              </Menu.Item>
            </div>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** A searchable dialog: Tab remains usable; arrows also move between choices. */
export function WorkflowStepPicker({
  point,
  title,
  context,
  choices,
  container,
  onChoose,
  onClose,
  onRestoreFocus,
}: {
  point: { x: number; y: number };
  title: string;
  context?: string;
  choices: WorkflowStepChoice[];
  container: RefObject<HTMLElement | null>;
  onChoose: (id: string) => void;
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("new");
  const search = useRef<HTMLInputElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const restoreOnClose = useRef(true);
  const anchor = useRef({
    getBoundingClientRect: () => new DOMRect(point.x, point.y, 0, 0),
  });
  anchor.current = {
    getBoundingClientRect: () => new DOMRect(point.x, point.y, 0, 0),
  };
  const hasExisting = choices.some((choice) => choice.existing);
  const renderChoices = (existing: boolean) => {
    const filtered = choices.filter(
      (choice) =>
        !!choice.existing === existing &&
        `${choice.label} ${choice.description} ${choice.group}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    );
    return (
      <>
        {[...new Set(filtered.map((choice) => choice.group))].map((group) => (
          <div
            className="wf-step-group"
            role="group"
            aria-label={group}
            key={group}
          >
            <small aria-hidden="true">{group}</small>
            {filtered
              .filter((choice) => choice.group === group)
              .map((choice) => (
                <button
                  type="button"
                  key={choice.id}
                  data-step-choice={choice.id}
                  onClick={() => onChoose(choice.id)}
                >
                  {choice.icon}
                  <span>
                    <strong>{choice.label}</strong>
                    <small>{choice.description}</small>
                  </span>
                </button>
              ))}
          </div>
        ))}
        {!filtered.length && (
          <p className="wf-step-empty">
            {query ? "No matching nodes" : "No compatible nodes"}
          </p>
        )}
      </>
    );
  };
  return (
    <Popover.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Popover.Anchor virtualRef={anchor} />
      <Popover.Portal container={container.current}>
        <Popover.Content
          ref={content}
          className="wf-step-picker"
          side="bottom"
          align="start"
          sideOffset={10}
          collisionPadding={12}
          aria-labelledby={`${uid}-title`}
          aria-describedby={context ? `${uid}-context` : undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            search.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const active = document.activeElement;
            if (
              restoreOnClose.current &&
              (!active ||
                active === document.body ||
                content.current?.contains(active))
            )
              onRestoreFocus();
          }}
          onInteractOutside={() => {
            restoreOnClose.current = false;
          }}
          onEscapeKeyDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
              return;
            const inSearch = event.target === search.current;
            if (inSearch && (event.key === "Home" || event.key === "End"))
              return;
            if (
              !inSearch &&
              !(event.target as HTMLElement).closest("[data-step-choice]")
            )
              return;
            const buttons = Array.from(
              content.current?.querySelectorAll<HTMLButtonElement>(
                "[data-step-choice]",
              ) ?? [],
            );
            if (!buttons.length) return;
            event.preventDefault();
            event.stopPropagation();
            const current = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? buttons.length - 1
                  : current < 0
                    ? event.key === "ArrowUp"
                      ? buttons.length - 1
                      : 0
                    : (current +
                        (event.key === "ArrowUp" ? -1 : 1) +
                        buttons.length) %
                      buttons.length;
            buttons[next].focus();
          }}
        >
          <div className="wf-step-picker-heading">
            <strong id={`${uid}-title`}>{title}</strong>
            {context && <small id={`${uid}-context`}>{context}</small>}
          </div>
          <label className="wf-search">
            <Search aria-hidden="true" />
            <input
              data-slot="input"
              ref={search}
              aria-label="Search compatible nodes"
              placeholder="Search nodes…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {hasExisting ? (
            <Tabs className="wf-step-tabs" value={tab} onValueChange={setTab}>
              <TabsList aria-label="Choose node source">
                <TabsTrigger value="new">New node</TabsTrigger>
                <TabsTrigger value="existing">Connect existing</TabsTrigger>
              </TabsList>
              <TabsContent value="new" className="wf-step-choices">
                {renderChoices(false)}
              </TabsContent>
              <TabsContent value="existing" className="wf-step-choices">
                {renderChoices(true)}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="wf-step-choices">{renderChoices(false)}</div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function NodeSummary({ summary }: { summary: WorkflowNodeSummary }) {
  if (summary.type === "expression")
    return (
      <div className="wf-node-summary wf-node-expression">
        <span>{summary.subject}</span>
        <strong>
          <span className="wf-node-operator">{summary.operator}</span>
          {formatWorkflowSummaryValue(summary.value, summary.unit)}
        </strong>
      </div>
    );
  return (
    <dl className="wf-node-summary wf-node-fields">
      {summary.fields.slice(0, 3).map((field, index) => (
        <div key={`${index}-${field.label}`}>
          <dt>{field.label}</dt>
          <dd>{formatWorkflowSummaryValue(field.value, field.unit)}</dd>
        </div>
      ))}
    </dl>
  );
}

const TooltipContainer = createContext<RefObject<HTMLElement | null> | null>(
  null,
);
const InWorkflowToolbar = createContext(false);

export function WorkflowToolbar({
  children,
  label,
  className,
  grouping = "auto",
}: {
  children: ReactNode;
  label: string;
  className: string;
  grouping?: "auto" | "separate";
}) {
  return (
    <InWorkflowToolbar.Provider value={true}>
      <Toolbar.Root
        className={`wf-icon-toolbar ${className}`}
        aria-label={label}
        data-grouping={grouping}
        data-slot="control-row"
        loop
      >
        {children}
      </Toolbar.Root>
    </InWorkflowToolbar.Provider>
  );
}

export function WorkflowTooltips({
  container,
  children,
}: {
  container: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  return (
    <TooltipContainer.Provider value={container}>
      <Tooltip.Provider delayDuration={400} skipDelayDuration={100}>
        {children}
      </Tooltip.Provider>
    </TooltipContainer.Provider>
  );
}

export function WorkflowIconButton({
  label,
  shortcut,
  touchHint = true,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "size" | "title" | "aria-label"> & {
  label: string;
  shortcut?: string;
  touchHint?: boolean;
}) {
  const container = useContext(TooltipContainer);
  const inToolbar = useContext(InWorkflowToolbar);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const held = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const clearHold = () => clearTimeout(timer.current);
  useEffect(() => clearHold, []);
  const button = (
    <Button
      variant="ghost"
      {...props}
      size="icon"
      aria-label={label}
      onPointerDown={(event) => {
        props.onPointerDown?.(event);
        clearHold();
        held.current = false;
        if (
          !touchHint ||
          event.pointerType !== "touch" ||
          event.defaultPrevented
        )
          return;
        start.current = { x: event.clientX, y: event.clientY };
        timer.current = setTimeout(() => {
          held.current = true;
          setOpen(true);
        }, 450);
      }}
      onPointerMove={(event) => {
        props.onPointerMove?.(event);
        if (
          Math.hypot(
            event.clientX - start.current.x,
            event.clientY - start.current.y,
          ) > 8
        )
          clearHold();
      }}
      onPointerUp={(event) => {
        clearHold();
        props.onPointerUp?.(event);
      }}
      onPointerCancel={(event) => {
        clearHold();
        held.current = false;
        setOpen(false);
        props.onPointerCancel?.(event);
      }}
      onContextMenu={(event) => {
        if (held.current) event.preventDefault();
        props.onContextMenu?.(event);
      }}
      onClick={(event) => {
        if (held.current) {
          held.current = false;
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        props.onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Trigger asChild>
        {inToolbar ? (
          <Toolbar.Button asChild disabled={props.disabled}>
            {button}
          </Toolbar.Button>
        ) : (
          button
        )}
      </Tooltip.Trigger>
      <Tooltip.Portal container={container?.current}>
        <Tooltip.Content
          className="wf-tooltip"
          data-slot="tooltip-content"
          sideOffset={8}
          collisionPadding={12}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          {label}
          {shortcut && <kbd>{shortcut}</kbd>}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** Shared hint behavior for status indicators and dense rows. */
export function WorkflowHint({
  label,
  children,
  touchHint = false,
}: {
  label: string;
  children: ReactElement;
  touchHint?: boolean;
}) {
  const container = useContext(TooltipContainer);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const held = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const clearHold = () => clearTimeout(timer.current);
  useEffect(() => clearHold, []);
  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Trigger
        asChild
        onPointerDown={(event) => {
          clearHold();
          held.current = false;
          if (!touchHint || event.pointerType !== "touch") return;
          start.current = { x: event.clientX, y: event.clientY };
          timer.current = setTimeout(() => {
            held.current = true;
            setOpen(true);
          }, 450);
        }}
        onPointerMove={(event) => {
          if (
            Math.hypot(
              event.clientX - start.current.x,
              event.clientY - start.current.y,
            ) > 8
          )
            clearHold();
        }}
        onPointerUp={clearHold}
        onPointerCancel={() => {
          clearHold();
          held.current = false;
          setOpen(false);
        }}
        onContextMenu={(event) => {
          if (held.current) event.preventDefault();
        }}
        onClick={(event) => {
          if (!held.current) return;
          held.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal container={container?.current}>
        <Tooltip.Content
          className="wf-tooltip"
          data-slot="tooltip-content"
          sideOffset={8}
          collisionPadding={12}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** Read-only header metadata: one visual structure and one hint interaction. */
export function WorkflowStatusIndicator({
  name,
  state,
  label,
  icon,
  children,
}: {
  name: "publication" | "nodes" | "validation";
  state?: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <WorkflowHint label={label} touchHint>
      <span
        tabIndex={0}
        className="wf-header-state"
        data-workflow-status={name}
        data-state={state}
        aria-label={label}
      >
        {icon}
        <span className="wf-header-state-value">{children}</span>
      </span>
    </WorkflowHint>
  );
}

export function RunStatus({
  status,
  iconOnly = false,
}: {
  status: WorkflowStatus;
  iconOnly?: boolean;
}) {
  const Icon = {
    pending: Clock3,
    running: LoaderCircle,
    succeeded: Check,
    failed: CircleAlert,
    skipped: Minus,
    cancelled: Square,
  }[status];
  return (
    <span className="wf-status" data-status={status}>
      <Icon aria-hidden="true" />
      <span className={iconOnly ? "sr-only" : undefined}>
        {workflowStatuses[status]}
      </span>
    </span>
  );
}

export function utcTime(value?: string) {
  if (!value) return "—";
  const time = new Date(value);
  return Number.isFinite(time.getTime())
    ? time.toISOString().replace("T", " ").replace("Z", " UTC")
    : "Invalid time";
}

export function duration(
  entry?: Pick<WorkflowNodeRun, "startedAt" | "finishedAt">,
) {
  if (!entry?.startedAt || !entry.finishedAt) return "—";
  const ms = Date.parse(entry.finishedAt) - Date.parse(entry.startedAt);
  return Number.isFinite(ms) && ms >= 0
    ? ms < 1000
      ? `${ms} ms`
      : `${(ms / 1000).toFixed(2)} s`
    : "—";
}

function Payload({ label, value }: { label: string; value: unknown }) {
  let formatted = "Not provided";
  try {
    formatted =
      value === undefined
        ? "Not provided"
        : (JSON.stringify(value, null, 2) ?? "Not provided");
  } catch {
    formatted = "Data cannot be serialized";
  }
  return (
    <section className="wf-payload">
      <h4>{label}</h4>
      <pre tabIndex={0} aria-label={label}>
        {formatted}
      </pre>
    </section>
  );
}

/** A single matching execution receipt, not an execution-history or replay service. */
export function WorkflowRunResults({
  id,
  workflow,
  run,
  pending,
  message,
  open,
  onOpenChange,
  selectedId,
  onSelect,
  onLocate,
  onConfigure,
  view,
  onViewChange,
}: {
  id: string;
  workflow: WorkflowDefinition;
  run?: WorkflowRun;
  pending: boolean;
  message: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLocate: (id: string) => void;
  onConfigure: (id: string) => void;
  view: { failuresOnly: boolean; payloadTab: string };
  onViewChange: (view: { failuresOnly: boolean; payloadTab: string }) => void;
}) {
  const { failuresOnly, payloadTab } = view;
  const nodeList = useRef<HTMLUListElement>(null);
  const entries = new Map(run?.nodes.map((entry) => [entry.nodeId, entry]));
  const rows = [
    ...workflow.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      node,
      entry: entries.get(node.id),
    })),
    ...(
      run?.nodes.filter(
        (entry) => !workflow.nodes.some((node) => node.id === entry.nodeId),
      ) ?? []
    ).map((entry) => ({
      id: entry.nodeId,
      label: entry.nodeId,
      node: undefined,
      entry,
    })),
  ];
  const failures = rows.filter((row) => row.entry?.status === "failed");
  const visibleRows = failuresOnly && failures.length ? failures : rows;
  const latestCompleted = visibleRows
    .filter((row) => row.entry?.status === "succeeded")
    .sort(
      (a, b) =>
        (Date.parse(b.entry?.finishedAt ?? "") || 0) -
        (Date.parse(a.entry?.finishedAt ?? "") || 0),
    )[0];
  // Follow the first failure/running node until the user deliberately selects a node.
  const active =
    visibleRows.find((row) => row.id === selectedId) ??
    visibleRows.find((row) => row.entry?.status === "failed") ??
    visibleRows.find((row) => row.entry?.status === "running") ??
    latestCompleted ??
    visibleRows.find((row) => row.entry) ??
    visibleRows[0];
  const entry = active?.entry;
  useEffect(() => {
    const list = nodeList.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!open || !list || !current) return;
    const bounds = list.getBoundingClientRect();
    const item = current.getBoundingClientRect();
    // Keep selection in the local list without scrolling the page or moving focus.
    if (item.top < bounds.top) list.scrollTop += item.top - bounds.top;
    else if (item.bottom > bounds.bottom)
      list.scrollTop += item.bottom - bounds.bottom;
  }, [active?.id, open, failuresOnly]);
  return (
    <section className="wf-results" aria-label="Run results">
      <button
        type="button"
        className="wf-results-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => onOpenChange(!open)}
      >
        <Braces aria-hidden="true" />
        <span>Run results</span>
        <span className="wf-results-summary" role="status">
          {run ? (
            <>
              <RunStatus status={run.status} />
              <span>Total duration {duration(run)}</span>
            </>
          ) : (
            <span>
              {pending
                ? "Waiting for run results…"
                : message
                  ? "Run result unavailable"
                  : "Not tested"}
            </span>
          )}
        </span>
        <ChevronDown
          className={open ? "wf-chevron-open" : ""}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={id} className="wf-results-body">
          {message && (
            <p className="wf-run-message" role="status">
              {message}
            </p>
          )}
          {run ? (
            <>
              <details className="wf-run-context">
                <summary>
                  Run details<span>{utcTime(run.startedAt)}</span>
                </summary>
                <dl className="wf-definition">
                  <dt>Run ID</dt>
                  <dd>{run.id}</dd>
                  <dt>Started</dt>
                  <dd>{utcTime(run.startedAt)}</dd>
                  <dt>Finished</dt>
                  <dd>{utcTime(run.finishedAt)}</dd>
                </dl>
              </details>
              <div className="wf-run-workspace">
                <div className="wf-run-navigation">
                  <div className="wf-run-list-heading">
                    <h4>
                      Nodes <span>{rows.length}</span>
                    </h4>
                    {!!failures.length && (
                      <WorkflowIconButton
                        label={`Failed nodes only (${failures.length})`}
                        aria-pressed={failuresOnly}
                        variant={failuresOnly ? "outline" : "ghost"}
                        onClick={() =>
                          onViewChange({ ...view, failuresOnly: !failuresOnly })
                        }
                      >
                        <Filter aria-hidden="true" />
                      </WorkflowIconButton>
                    )}
                  </div>
                  <ul
                    ref={nodeList}
                    className="wf-run-node-list"
                    aria-label="Run nodes"
                  >
                    {visibleRows.map((row) => (
                      <li key={row.id}>
                        <WorkflowHint
                          label={`${row.label}, ${row.entry ? workflowStatuses[row.entry.status] : "No result provided"}, duration ${duration(row.entry)}`}
                        >
                          <button
                            type="button"
                            aria-current={
                              active?.id === row.id ? "true" : undefined
                            }
                            data-run-node={row.id}
                            onClick={() => onSelect(row.id)}
                          >
                            {row.entry ? (
                              <RunStatus status={row.entry.status} iconOnly />
                            ) : (
                              <span
                                className="wf-status"
                                data-status="unreported"
                              >
                                <CircleHelp aria-hidden="true" />
                                <span className="sr-only">
                                  No result provided
                                </span>
                              </span>
                            )}
                            <span className="wf-run-node-label">
                              {row.label}
                            </span>
                            <span className="wf-run-node-duration">
                              {duration(row.entry)}
                            </span>
                          </button>
                        </WorkflowHint>
                      </li>
                    ))}
                  </ul>
                </div>
                <section
                  className="wf-result-detail"
                  aria-label="Node execution data"
                >
                  {active ? (
                    <>
                      <header className="wf-result-heading">
                        <h4 tabIndex={-1}>{active.label}</h4>
                        {active.node && (
                          <div data-slot="control-row">
                            <WorkflowIconButton
                              label="Locate on canvas"
                              onClick={() => onLocate(active.id)}
                            >
                              <LocateFixed aria-hidden="true" />
                            </WorkflowIconButton>
                            <WorkflowIconButton
                              label="View node configuration"
                              onClick={() => onConfigure(active.id)}
                            >
                              <Settings2 aria-hidden="true" />
                            </WorkflowIconButton>
                          </div>
                        )}
                      </header>
                      {entry ? (
                        <>
                          <div className="wf-result-meta">
                            <RunStatus status={entry.status} />
                            <span>Duration {duration(entry)}</span>
                            <span>Attempts {entry.attempts ?? "—"} </span>
                          </div>
                          {entry.message && (
                            <p
                              className="wf-result-message"
                              data-failed={entry.status === "failed"}
                            >
                              {entry.message}
                            </p>
                          )}
                          <Tabs
                            value={payloadTab}
                            onValueChange={(payloadTab) =>
                              onViewChange({ ...view, payloadTab })
                            }
                            className="wf-result-data"
                          >
                            <TabsList
                              variant="line"
                              aria-label="Execution data"
                            >
                              <TabsTrigger value="input">Input</TabsTrigger>
                              <TabsTrigger value="output">Output</TabsTrigger>
                              <TabsTrigger value="timing">
                                Execution info
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="input">
                              <Payload label="Input data" value={entry.input} />
                            </TabsContent>
                            <TabsContent value="output">
                              <Payload
                                label="Output data"
                                value={entry.output}
                              />
                            </TabsContent>
                            <TabsContent value="timing">
                              <dl className="wf-definition">
                                <dt>Node ID</dt>
                                <dd>{entry.nodeId}</dd>
                                <dt>Started</dt>
                                <dd>{utcTime(entry.startedAt)}</dd>
                                <dt>Finished</dt>
                                <dd>{utcTime(entry.finishedAt)}</dd>
                              </dl>
                            </TabsContent>
                          </Tabs>
                        </>
                      ) : (
                        <p className="wf-run-empty">
                          No result was provided for this node, so its execution
                          status is unknown.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="wf-run-empty">
                      This run contains no node records.
                    </p>
                  )}
                </section>
              </div>
            </>
          ) : (
            <p className="wf-run-empty">
              {pending
                ? "Node status and data will appear when execution results arrive."
                : message
                  ? "You can test the workflow again."
                  : "Test the workflow to inspect node inputs, outputs and failures here."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export function NodeInspector({
  node,
  editable,
  onInspectData,
  onChange,
  onRemove,
  onDuplicate,
  renderConfiguration,
}: {
  node: WorkflowNode;
  editable: boolean;
  onInspectData?: () => void;
  onChange: (patch: Partial<WorkflowNode>) => void;
  onRemove?: () => void;
  onDuplicate?: () => void;
  renderConfiguration?: (
    node: WorkflowNode,
    context: {
      readOnly: boolean;
      onChange: (patch: Partial<WorkflowNode>) => void;
    },
  ) => ReactNode;
}) {
  const uid = useId();
  return (
    <div className="wf-drawer-body wf-fields">
      {onInspectData && (
        <Button variant="outline" onClick={onInspectData}>
          <Braces aria-hidden="true" />
          View execution data
        </Button>
      )}
      <label htmlFor={`${uid}-name`}>
        Node name
        <input
          data-slot="input"
          id={`${uid}-name`}
          value={node.label}
          readOnly={!editable}
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </label>
      {node.kind === "parallel" && (
        <p className="wf-field-help">
          Send the same input to each branch and execute them in parallel.
        </p>
      )}
      {node.kind === "join" && (
        <label htmlFor={`${uid}-join`}>
          Wait policy
          <select
            data-slot="select-trigger"
            id={`${uid}-join`}
            disabled={!editable}
            value={node.joinMode ?? ""}
            onChange={(e) =>
              onChange({ joinMode: e.target.value as "all" | "any" })
            }
          >
            <option value="" disabled>
              Choose a wait policy
            </option>
            <option value="all">Wait for all branches to succeed</option>
            <option value="any">
              Continue after the first successful branch
            </option>
          </select>
          <small>
            {node.joinMode === "any"
              ? "Other branches continue running and are not cancelled automatically."
              : "The join fails if any branch fails, and is skipped if a branch is skipped."}
          </small>
        </label>
      )}
      {renderConfiguration
        ? renderConfiguration(node, { readOnly: !editable, onChange })
        : node.parameters.map((field, index) => {
            const id = `${uid}-parameter-${index}`;
            const setValue = (value: string) =>
              onChange({
                parameters: node.parameters.map((entry, i) =>
                  i === index
                    ? {
                        ...entry,
                        value:
                          field.type === "number"
                            ? value === ""
                              ? null
                              : Number(value)
                            : value,
                      }
                    : entry,
                ),
              });
            return (
              <label key={field.key} htmlFor={id}>
                {field.label}
                {field.required && (
                  <span className="wf-required" aria-hidden="true">
                    {" "}
                    *
                  </span>
                )}
                {field.type === "select" ? (
                  <select
                    data-slot="select-trigger"
                    id={id}
                    disabled={!editable}
                    value={String(field.value ?? "")}
                    required={field.required}
                    aria-describedby={
                      field.description ? `${id}-hint` : undefined
                    }
                    onChange={(e) => setValue(e.target.value)}
                  >
                    {field.value === null && (
                      <option value="">Select an option</option>
                    )}
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    data-slot="input"
                    id={id}
                    type={field.type === "number" ? "number" : "text"}
                    min={field.min}
                    max={field.max}
                    step={field.type === "number" ? "any" : undefined}
                    value={field.value === null ? "" : String(field.value)}
                    required={field.required}
                    readOnly={!editable}
                    aria-describedby={
                      field.description ? `${id}-hint` : undefined
                    }
                    onChange={(e) => setValue(e.target.value)}
                  />
                )}
                {field.description && (
                  <small id={`${id}-hint`}>{field.description}</small>
                )}
              </label>
            );
          })}
      <details className="wf-advanced">
        <summary>Execution policy</summary>
        <div className="wf-fields">
          <label htmlFor={`${uid}-timeout`}>
            Timeout (ms)
            <input
              data-slot="input"
              id={`${uid}-timeout`}
              type="number"
              min={1}
              step={1}
              value={node.timeoutMs}
              readOnly={!editable}
              onChange={(e) => onChange({ timeoutMs: Number(e.target.value) })}
            />
          </label>
          <label htmlFor={`${uid}-attempts`}>
            Maximum attempts
            <input
              data-slot="input"
              id={`${uid}-attempts`}
              type="number"
              min={1}
              max={10}
              step={1}
              value={node.maxAttempts}
              readOnly={!editable}
              onChange={(e) =>
                onChange({ maxAttempts: Number(e.target.value) })
              }
            />
          </label>
          <small>
            Retries may deliver data more than once. The execution service must
            ensure idempotency.
          </small>
        </div>
      </details>
      <details className="wf-advanced">
        <summary>Node definition</summary>
        <dl className="wf-definition">
          <dt>Type</dt>
          <dd>{workflowKinds[node.kind].label}</dd>
          <dt>Handler</dt>
          <dd>{node.operation}</dd>
          <dt>Input</dt>
          <dd>{node.inputType ?? "Not declared"}</dd>
          <dt>Output</dt>
          <dd>{node.outputType ?? "Not declared"}</dd>
        </dl>
        {node.description && (
          <p className="wf-field-help">{node.description}</p>
        )}
      </details>
      {(onRemove || onDuplicate) && (
        <div className="wf-node-actions" data-slot="control-row">
          {onDuplicate && (
            <Button
              variant="outline"
              disabled={!editable}
              onClick={onDuplicate}
            >
              Duplicate node
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" disabled={!editable} onClick={onRemove}>
              Remove node
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
