import React, { useEffect, useId, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCheck,
  Folder,
  LayoutDashboard,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import {
  ImmortalBadge,
  ImmortalButton,
  ImmortalCard,
  ImmortalCheckbox,
  ImmortalInput,
  ImmortalSelect,
  ImmortalSlider,
  ImmortalSwitch,
  ImmortalTabs,
} from "./ImmortalComponents";
import { ImmortalMark } from "./ImmortalMark";
import { METAL_MATERIALS, MetalMaterialScope, useMaterialSound } from "./WebGLMetalEngine";
import { useToast } from "./ImmortalToast";
import "./HeroWorkspace.css";

type Finish = "platinum" | "gold" | "obsidian";
type View = "overview" | "projects" | "activity";
type Status = "active" | "review" | "completed" | "planned";
type Project = {
  id: string;
  name: string;
  initials: string;
  owner: string;
  budget: number;
  progress: number;
  status: Status;
  priority: string;
};
type Event = { id: string; title: string; detail: string; time: string };
const FINISHES: { id: Finish; label: string; shortLabel: string }[] = [
  { id: "platinum", label: "Chrome", shortLabel: "Chrome" },
  { id: "gold", label: "Gold", shortLabel: "Gold" },
  { id: "obsidian", label: "Black Titanium", shortLabel: "Titanium" },
];
const INITIAL_PROJECTS: Project[] = [
  {
    id: "website",
    name: "Website redesign",
    initials: "JL",
    owner: "Jamie Lee",
    budget: 18500,
    progress: 72,
    status: "active",
    priority: "High",
  },
  {
    id: "mobile",
    name: "Mobile application",
    initials: "SP",
    owner: "Sofia Park",
    budget: 12800,
    progress: 92,
    status: "review",
    priority: "Normal",
  },
  {
    id: "system",
    name: "Design system",
    initials: "OM",
    owner: "Oliver Martin",
    budget: 9600,
    progress: 48,
    status: "active",
    priority: "Normal",
  },
  {
    id: "brand",
    name: "Brand refresh",
    initials: "AL",
    owner: "Alex Laurent",
    budget: 7400,
    progress: 100,
    status: "completed",
    priority: "Normal",
  },
];
const TASKS = [
  { id: "proposal", title: "Send the project proposal" },
  { id: "review", title: "Review the landing page" },
  { id: "handoff", title: "Prepare the design handoff" },
];
const INITIAL_EVENTS: Event[] = [
  {
    id: "brand",
    title: "Brand refresh completed",
    detail: "Alex Laurent wrapped up the final delivery.",
    time: "20 min ago",
  },
  {
    id: "mobile",
    title: "Mobile application moved to review",
    detail: "Sofia Park shared the latest build.",
    time: "1 hour ago",
  },
  {
    id: "system",
    title: "Design system updated",
    detail: "Oliver Martin added the new foundations.",
    time: "2 hours ago",
  },
];
const PERIODS = {
  month: {
    label: "Last 30 days",
    values: [
      1800, 2900, 2200, 3800, 2700, 4400, 3300, 5600, 4100, 6200, 5100, 6190,
    ],
    change: "18.6%",
    dates: ["Sep 16", "Sep 23", "Sep 30", "Oct 07", "Oct 15"],
  },
  week: {
    label: "Last 7 days",
    values: [1320, 1580, 1240, 1900, 1640, 2050, 2110],
    change: "12.8%",
    dates: ["Oct 09", "Oct 11", "Oct 13", "Oct 15"],
  },
};
const STATUS_NAMES: Record<Status, string> = {
  active: "In progress",
  review: "In review",
  completed: "Completed",
  planned: "Planned",
};
const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
const compactMoney = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
const total = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0);

function TaskCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const playSound = useMaterialSound();
  return (
    <div
      className="hero-task-toggle"
      role="checkbox"
      tabIndex={0}
      aria-checked={checked}
      aria-label={label}
      onClick={(event) => {
        if (event.target === event.currentTarget) { playSound('button'); onChange(!checked); }
      }}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          playSound('button');
          onChange(!checked);
        }
      }}
    >
      <ImmortalCheckbox checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function RevenueChart({
  period,
  metric,
  goal,
  onGoalChange,
}: {
  period: keyof typeof PERIODS;
  metric: string;
  goal: number;
  onGoalChange: (goal: number) => void;
}) {
  const id = useId().replace(/:/g, "");
  const [point, setPoint] = useState<number | null>(null);
  useEffect(() => setPoint(null), [period, metric]);
  const values = PERIODS[period].values.map((value) =>
    metric === "expenses" ? Math.round(value * 0.58) : value,
  );
  const max = Math.ceil(Math.max(...values) / 2500) * 2500;
  const points = values.map((value, i) => ({
    x: 8 + (i * 504) / (values.length - 1),
    y: 145 - (value / max) * 130,
  }));
  const line = points
    .map((p, i) => {
      if (!i) return `M${p.x} ${p.y}`;
      const before = points[Math.max(0, i - 2)],
        last = points[i - 1],
        next = points[Math.min(points.length - 1, i + 1)];
      return `C${last.x + (p.x - before.x) / 6} ${last.y + (p.y - before.y) / 6} ${p.x - (next.x - last.x) / 6} ${p.y - (next.y - last.y) / 6} ${p.x} ${p.y}`;
    })
    .join(" ");
  const selected = point === null ? null : points[point];
  const date =
    point === null
      ? null
      : new Date(
          Date.UTC(
            2026,
            period === "month" ? 8 : 9,
            (period === "month" ? 16 : 9) +
              Math.round(
                (point * (period === "month" ? 29 : 6)) / (values.length - 1),
              ),
          ),
        );
  return (
    <>
      <div className="hero-chart-heading">
        <div>
          <span>{metric === "revenue" ? "Revenue" : "Expenses"}</span>
          <strong>{money(total(values))}</strong>
        </div>
        <span className="hero-chart-change">
          <ArrowUpRight size={13} />
          {PERIODS[period].change}
        </span>
      </div>
      <div
        className="hero-chart-plot"
        onPointerMove={(event) => {
          const rect = event.currentTarget
            .querySelector("svg")!
            .getBoundingClientRect();
          setPoint(
            Math.max(
              0,
              Math.min(
                values.length - 1,
                Math.round(
                  ((((event.clientX - rect.left) / rect.width) * 520 - 8) /
                    504) *
                    (values.length - 1),
                ),
              ),
            ),
          );
        }}
        onPointerLeave={() => setPoint(null)}
      >
        <div className="hero-chart-axis">
          {[1, 2 / 3, 1 / 3, 0].map((ratio) => (
            <span key={ratio}>{compactMoney(max * ratio)}</span>
          ))}
        </div>
        <svg
          viewBox="0 0 520 155"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${metric === "revenue" ? "Revenue" : "Expenses"} over ${PERIODS[period].label.toLowerCase()}: ${money(total(values))}`}
        >
          <defs>
            <linearGradient
              id={`hero-chart-fill-${id}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop stopColor="currentColor" stopOpacity=".20" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[15, 58.3, 101.7, 145].map((y) => (
            <path
              key={y}
              d={`M0 ${y}H520`}
              stroke="#ffffff"
              strokeOpacity=".07"
              strokeDasharray="3 5"
            />
          ))}
          <path
            d={`${line} L512 155 H8 Z`}
            fill={`url(#hero-chart-fill-${id})`}
          />
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {selected && (
            <>
              <path
                d={`M${selected.x} 4V155`}
                stroke="currentColor"
                strokeOpacity=".24"
                strokeDasharray="3 4"
              />
              <circle
                cx={selected.x}
                cy={selected.y}
                r="4"
                fill="#111113"
                stroke="currentColor"
                strokeWidth="2"
              />
            </>
          )}
        </svg>
        {point !== null && (
          <div
            className="hero-chart-tooltip"
            style={{
              left: `${Math.min(82, Math.max(20, (point / (values.length - 1)) * 100))}%`,
            }}
          >
            {money(values[point])}
            <span>
              {" "}
              ·{" "}
              {date &&
                new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                }).format(date)}
            </span>
          </div>
        )}
      </div>
      <div className="hero-chart-dates">
        {PERIODS[period].dates.map((date) => (
          <span key={date}>{date}</span>
        ))}
      </div>
      <div className="hero-goal-control">
        <div>
          <span>Monthly target</span>
          <strong>{money(goal)}</strong>
        </div>
        <label aria-label="Monthly revenue target">
          <ImmortalSlider
            value={goal}
            min={40000}
            max={100000}
            step={5000}
            onChange={onGoalChange}
          />
        </label>
      </div>
    </>
  );
}

function NewProjectDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (
    name: string,
    budget: number,
    priority: string,
    start: boolean,
  ) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(""),
    [budget, setBudget] = useState("5000"),
    [priority, setPriority] = useState("Normal"),
    [start, setStart] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      setName("");
      setBudget("5000");
      setPriority("Normal");
      setStart(true);
      setError("");
      element.showModal();
      element
        .querySelector<HTMLInputElement>("input")
        ?.focus({ preventScroll: true });
    } else if (!open && element.open) element.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="hero-project-dialog"
      aria-labelledby="hero-project-title"
      aria-describedby="hero-project-description"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <ImmortalCard className="hero-project-form-card">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setError("Give your project a name.");
              return;
            }
            onCreate(name.trim(), Number(budget), priority, start);
          }}
        >
          <div className="hero-project-dialog-heading">
            <div>
              <h2 id="hero-project-title">Start something good.</h2>
              <p id="hero-project-description">
                Create a project in your demo workspace.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close project dialog"
              onClick={onClose}
            >
              <X size={17} />
            </button>
          </div>
          <label className="hero-form-field" htmlFor="hero-project-name">
            <span>Project name</span>
            <ImmortalInput
              id="hero-project-name"
              autoFocus
              required
              maxLength={60}
              placeholder="e.g. Customer portal"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "hero-project-error" : undefined}
            />
          </label>
          {error && (
            <p id="hero-project-error" className="hero-form-error" role="alert">
              {error}
            </p>
          )}
          <div className="hero-form-columns">
            <label className="hero-form-field" htmlFor="hero-project-budget">
              <span>Budget</span>
              <ImmortalInput
                id="hero-project-budget"
                type="number"
                min={0}
                max={10000000}
                step={100}
                required
                value={budget}
                icon={<span>$</span>}
                onChange={(event) => setBudget(event.target.value)}
              />
            </label>
            <ImmortalSelect
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={[
                { value: "Normal", label: "Normal" },
                { value: "High", label: "High" },
              ]}
            />
          </div>
          <ImmortalSwitch
            id="hero-project-start"
            checked={start}
            onChange={setStart}
            label="Start immediately"
            hint="Include this project in your active work."
          />
          <div className="hero-project-dialog-actions">
            <ImmortalButton type="button" variant="recessed" onClick={onClose}>
              Cancel
            </ImmortalButton>
            <ImmortalButton type="submit" variant="metallic">
              <Plus size={14} />
              Create project
            </ImmortalButton>
          </div>
        </form>
      </ImmortalCard>
    </dialog>
  );
}

export function HeroWorkspace() {
  const [finish, setFinish] = useState<Finish>("platinum");
  const playSound = useMaterialSound(finish);
  const [view, setView] = useState<View>("overview");
  const [period, setPeriod] = useState<keyof typeof PERIODS>("month");
  const [metric, setMetric] = useState("revenue");
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [done, setDone] = useState(["proposal"]);
  const [digest, setDigest] = useState(true);
  const [goal, setGoal] = useState(60000);
  const [query, setQuery] = useState(""),
    [statusFilter, setStatusFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const preset = METAL_MATERIALS[finish];
  const monthlyRevenue = total(PERIODS.month.values),
    revenue = total(PERIODS[period].values);
  const active = projects.filter(
    (project) => project.status === "active" || project.status === "review",
  ).length;
  const goalProgress = Math.round((monthlyRevenue / goal) * 100);
  const filteredProjects = projects.filter(
    (project) =>
      (project.name + " " + project.owner)
        .toLowerCase()
        .includes(query.toLowerCase().trim()) &&
      (statusFilter === "all" ||
        (statusFilter === "active"
          ? project.status === "active" || project.status === "review"
          : project.status === statusFilter)),
  );
  const announce = (title: string, detail: string) => {
    setEvents((previous) =>
      [
        { id: crypto.randomUUID(), title, detail, time: "Just now" },
        ...previous,
      ].slice(0, 10),
    );
  };
  const reset = () => {
    setProjects(INITIAL_PROJECTS);
    setEvents(INITIAL_EVENTS);
    setDone(["proposal"]);
    setDigest(true);
    setGoal(60000);
    setView("overview");
    setPeriod("month");
    setMetric("revenue");
    setQuery("");
    setStatusFilter("all");
    toast({
      title: "Workspace reset",
      description: "Your demo is ready for another try.",
      type: "info",
    });
  };
  const toggleTask = (id: string, checked: boolean) => {
    setDone((previous) =>
      checked
        ? [...previous.filter((value) => value !== id), id]
        : previous.filter((value) => value !== id),
    );
  };
  const toggleProject = (project: Project, checked: boolean) => {
    setProjects((previous) =>
      previous.map((item) =>
        item.id === project.id
          ? {
              ...item,
              status: checked ? "completed" : "active",
              progress: checked ? 100 : 75,
            }
          : item,
      ),
    );
    announce(
      `${project.name} ${checked ? "completed" : "reopened"}`,
      "Alex Laurent updated the project status.",
    );
  };
  const scopeStyle = {
    "--border-rim": preset.cssBorderRim,
    "--border-rim-subtle": preset.cssBorderRimSubtle,
    "--metal-accent": preset.accentHex,
    "--workspace-accent": preset.accentHex,
  } as React.CSSProperties;
  const goTo = (next: View) => {
    setView(next);
    setQuery("");
    setStatusFilter("all");
  };
  return (
    <MetalMaterialScope material={finish}>
      <section
        className="hero-workspace-showcase"
        aria-label="Interactive Forma workspace"
        data-material={finish}
        style={scopeStyle}
      >
        <div className="hero-workspace-frame">
          <div className="hero-workspace-windowbar">
            <div className="hero-workspace-window-label">
              <span className="hero-window-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>Interactive workspace</span>
            </div>
            <div
              className="hero-finish-controls"
              role="group"
              aria-label="Workspace material"
            >
              {FINISHES.map((option) => (
                <ImmortalButton
                  key={option.id}
                  material={option.id}
                  size="sm"
                  variant={finish === option.id ? "default" : "recessed"}
                  aria-label={option.label}
                  aria-pressed={finish === option.id}
                  onClick={() => setFinish(option.id)}
                  className="hero-finish-option"
                >
                  <span
                    className="hero-finish-swatch"
                    style={{
                      background: METAL_MATERIALS[option.id].swatchGradient,
                    }}
                  />
                  <span className="hero-finish-full">{option.label}</span>
                  <span className="hero-finish-short">{option.shortLabel}</span>
                  {finish === option.id && (
                    <Check size={12} aria-hidden="true" />
                  )}
                </ImmortalButton>
              ))}
            </div>
          </div>
          <div className="hero-workspace-body">
            <aside
              className="hero-workspace-sidebar"
              aria-label="Demo workspace navigation"
            >
              <div className="hero-workspace-brand">
                <ImmortalMark width={29} height={29} />
                <span>Forma</span>
              </div>
              <span className="hero-workspace-eyebrow">WORKSPACE</span>
              <nav aria-label="Workspace views">
                {(
                  [
                    {
                      id: "overview",
                      label: "Overview",
                      icon: LayoutDashboard,
                    },
                    { id: "projects", label: "Projects", icon: Folder },
                    { id: "activity", label: "Activity", icon: Activity },
                  ] as const
                ).map((item) => (
                  <ImmortalButton
                    key={item.id}
                    variant={view === item.id ? "default" : "ghost"}
                    className={`hero-workspace-nav ${view === item.id ? "is-current" : ""}`}
                    aria-pressed={view === item.id}
                    onClick={() => goTo(item.id)}
                    icon={<item.icon size={15} />}
                  >
                    <span>{item.label}</span>
                    {item.id === "projects" && <small>{projects.length}</small>}
                  </ImmortalButton>
                ))}
              </nav>
              <div className="hero-workspace-favorites">
                <span className="hero-workspace-eyebrow">FAVORITES</span>
                {projects.slice(0, 2).map((project, index) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      playSound('select');
                      setView("projects");
                      setQuery(project.name);
                      setStatusFilter("all");
                    }}
                  >
                    <span
                      className={`hero-favorite-dot ${index ? "warm" : ""}`}
                    />
                    {project.name}
                  </button>
                ))}
              </div>
              <div className="hero-workspace-sidebar-bottom">
                <button className="hero-workspace-reset" onClick={() => { playSound('select'); reset(); }}>
                  <RotateCcw size={13} />
                  Reset demo
                </button>
                <div className="hero-workspace-profile">
                  <span>AL</span>
                  <div>
                    Alex Laurent<small>Demo workspace</small>
                  </div>
                </div>
              </div>
            </aside>
            <div className="hero-workspace-main">
              <div className="hero-mobile-views">
                <ImmortalTabs
                  tabs={[
                    { id: "overview", label: "Overview" },
                    { id: "projects", label: "Projects" },
                    { id: "activity", label: "Activity" },
                  ]}
                  activeId={view}
                  onChange={(id) => goTo(id as View)}
                />
              </div>
              <header className="hero-workspace-heading">
                <div>
                  <span className="hero-workspace-breadcrumb">
                    Forma <span>/</span>{" "}
                    {view === "overview"
                      ? "Overview"
                      : view === "projects"
                        ? "Projects"
                        : "Activity"}
                  </span>
                  <h2>
                    {view === "overview"
                      ? "A little clarity. A lot of progress."
                      : view === "projects"
                        ? "Good work, taking shape."
                        : "Every small step, in view."}
                  </h2>
                </div>
                <ImmortalButton
                  variant="metallic"
                  size="sm"
                  onClick={() => setCreating(true)}
                  className="hero-new-project"
                  aria-label="New project"
                >
                  <Plus size={14} />
                  <span>New project</span>
                </ImmortalButton>
              </header>
              {view === "overview" ? (
                <>
                  <div className="hero-workspace-kpis">
                    <ImmortalCard className="hero-workspace-kpi">
                      <span>
                        Total revenue
                        <ArrowUpRight size={13} />
                      </span>
                      <strong>
                        <span className="hero-kpi-full">{money(revenue)}</span>
                        <span className="hero-kpi-compact">
                          {compactMoney(revenue)}
                        </span>
                      </strong>
                      <small>
                        <b>↗ {PERIODS[period].change}</b> vs. previous period
                      </small>
                    </ImmortalCard>
                    <ImmortalCard className="hero-workspace-kpi">
                      <span>
                        Active projects
                        <Folder size={13} />
                      </span>
                      <strong>{active.toString().padStart(2, "0")}</strong>
                      <small>
                        {projects.length} projects in your workspace
                      </small>
                    </ImmortalCard>
                    <ImmortalCard className="hero-workspace-kpi">
                      <span>
                        Monthly goal
                        <CheckCheck size={13} />
                      </span>
                      <strong>
                        {goalProgress}
                        <i>%</i>
                      </strong>
                      <small>{money(goal)} revenue target</small>
                    </ImmortalCard>
                  </div>
                  <div className="hero-workspace-grid">
                    <ImmortalCard className="hero-workspace-chart">
                      <div className="hero-chart-toolbar">
                        <ImmortalTabs
                          activeId={metric}
                          onChange={setMetric}
                          tabs={[
                            { id: "revenue", label: "Revenue" },
                            { id: "expenses", label: "Expenses" },
                          ]}
                        />
                        <div
                          className="hero-chart-period"
                          role="group"
                          aria-label="Reporting period"
                        >
                          <ImmortalSelect
                            options={[
                              { value: "month", label: "Last 30 days" },
                              { value: "week", label: "Last 7 days" },
                            ]}
                            value={period}
                            onChange={(value) =>
                              setPeriod(value as keyof typeof PERIODS)
                            }
                          />
                        </div>
                      </div>
                      <RevenueChart
                        period={period}
                        metric={metric}
                        goal={goal}
                        onGoalChange={setGoal}
                      />
                    </ImmortalCard>
                    <ImmortalCard className="hero-workspace-tasks">
                      <div className="hero-tasks-heading">
                        <h3>Today, thoughtfully.</h3>
                        <span>
                          {done.length}/{TASKS.length}
                        </span>
                      </div>
                      <div className="hero-task-list">
                        {TASKS.map((task) => (
                          <TaskCheckbox
                            key={task.id}
                            checked={done.includes(task.id)}
                            label={task.title}
                            onChange={(checked) => toggleTask(task.id, checked)}
                          />
                        ))}
                      </div>
                      <div className="hero-weekly-digest">
                        <div>
                          <strong>Weekly digest</strong>
                          <span>
                            {digest
                              ? "Arrives every Monday"
                              : "Your inbox can take a breather"}
                          </span>
                        </div>
                        <span aria-label="Weekly digest">
                          <ImmortalSwitch
                            id="hero-weekly-digest"
                            ariaLabel="Weekly digest"
                            checked={digest}
                            onChange={setDigest}
                          />
                        </span>
                      </div>
                      <div className="hero-workspace-team">
                        <div aria-label="Team members">
                          <span>JL</span>
                          <span>SP</span>
                          <span>OM</span>
                          <span>+5</span>
                        </div>
                        <span>
                          A small team.
                          <br />
                          Good things ahead.
                        </span>
                      </div>
                    </ImmortalCard>
                  </div>
                </>
              ) : view === "projects" ? (
                <div className="hero-projects-view">
                  <div className="hero-projects-toolbar">
                    <ImmortalInput
                      icon={<Search size={14} />}
                      aria-label="Search projects"
                      placeholder="Find a project…"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    <div className="hero-project-filter">
                      <ImmortalSelect
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                          { value: "all", label: "All statuses" },
                          { value: "active", label: "Active" },
                          { value: "completed", label: "Completed" },
                          { value: "planned", label: "Planned" },
                        ]}
                      />
                    </div>
                  </div>
                  <ImmortalCard className="hero-projects-card">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Project</th>
                          <th scope="col" className="hero-project-budget">
                            Budget
                          </th>
                          <th scope="col">Status</th>
                          <th scope="col">
                            <span className="sr-only">Completion</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map((project) => (
                          <tr key={project.id}>
                            <td>
                              <strong>{project.name}</strong>
                              <small>
                                {project.owner} · {project.priority} priority
                              </small>
                            </td>
                            <td className="hero-project-budget">
                              {money(project.budget)}
                            </td>
                            <td>
                              <ImmortalBadge
                                dotColor={
                                  project.status === "completed"
                                    ? "green"
                                    : project.status === "review"
                                      ? "amber"
                                      : "white"
                                }
                              >
                                {STATUS_NAMES[project.status]}
                              </ImmortalBadge>
                            </td>
                            <td>
                              <TaskCheckbox
                                checked={project.status === "completed"}
                                label={`Complete ${project.name}`}
                                onChange={(checked) =>
                                  toggleProject(project, checked)
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredProjects.length === 0 && (
                      <div className="hero-projects-empty">
                        <Folder size={24} />
                        <strong>No projects found</strong>
                        <p>Try a different name or status.</p>
                        <ImmortalButton
                          size="sm"
                          variant="recessed"
                          onClick={() => {
                            setQuery("");
                            setStatusFilter("all");
                          }}
                        >
                          Clear filters
                        </ImmortalButton>
                      </div>
                    )}
                  </ImmortalCard>
                  <p className="hero-demo-note">
                    Your changes live in this demo and reset on refresh.
                  </p>
                </div>
              ) : (
                <div className="hero-activity-view">
                  <ImmortalCard className="hero-activity-card">
                    <h3>Workspace activity</h3>
                    <ol>
                      {events.map((event) => (
                        <li key={event.id}>
                          <span className="hero-activity-icon">
                            <Check size={13} />
                          </span>
                          <div>
                            <strong>{event.title}</strong>
                            <p>{event.detail}</p>
                          </div>
                          <time>{event.time}</time>
                        </li>
                      ))}
                    </ol>
                  </ImmortalCard>
                  <p className="hero-demo-note">
                    Create a project or update its status to add to the
                    timeline.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {events[0].time === "Just now" ? events[0].title : ""}
        </p>
        <NewProjectDialog
          open={creating}
          onClose={() => setCreating(false)}
          onCreate={(name, budget, priority, start) => {
            const project = {
              id: crypto.randomUUID(),
              name,
              initials: "AL",
              owner: "Alex Laurent",
              budget,
              priority,
              progress: 0,
              status: (start ? "active" : "planned") as Status,
            };
            setProjects((previous) => [project, ...previous]);
            announce(
              `${name} created`,
              `${money(budget)} budget · ${priority.toLowerCase()} priority`,
            );
            setCreating(false);
            setView("projects");
            setQuery("");
            setStatusFilter("all");
            toast({
              title: "Project created",
              description: `${name} is ready in your demo workspace.`,
              type: "success",
            });
          }}
        />
      </section>
    </MetalMaterialScope>
  );
}
