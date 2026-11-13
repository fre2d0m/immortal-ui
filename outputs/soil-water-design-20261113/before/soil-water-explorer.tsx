"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  Layers3,
  Maximize2,
  Minimize2,
  Pin,
  RotateCcw,
  X,
} from "lucide-react";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  formatTelemetrySample,
  qualityLabel,
  sampleState,
} from "@/lib/telemetry";
import {
  prepareSoilData,
  createSoilView,
  clampSoilWindow,
  recordsInWindow,
  soilExport,
  soilHeatColors,
  soilDashes,
  soilEventLabels,
  eventInWindow,
  SOIL_DAY,
  SOIL_HOUR,
  type SoilWaterDataset,
  type PreparedSoil,
  type SoilWindow,
  type SoilWaterExport,
} from "./soil-water-model";
import type { SoilCursor } from "./soil-water-plots";
import "./soil-water-explorer.css";

const Plots = lazy(() =>
  import("./soil-water-plots").then((m) => ({ default: m.SoilWaterPlots })),
);
const Navigator = lazy(() =>
  import("./soil-water-plots").then((m) => ({ default: m.SoilWaterNavigator })),
);
export type { SoilWaterDataset, SoilWaterExport } from "./soil-water-model";

function time(at: number, zone: string, compact = false) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(!compact
      ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const }
      : {}),
  }).format(at);
}
function timeInput(at: number) {
  return new Date(at).toISOString().slice(0, 16);
}
const num = (value: number | null, precision = 1) =>
  value === null || !Number.isFinite(value)
    ? "—"
    : value.toLocaleString("zh-CN", {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      });
const count = (value: number) => value.toLocaleString("zh-CN");
function LegendLine({ index }: { index: number }) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" aria-hidden="true">
      <line
        x1="1"
        x2="19"
        y1="5"
        y2="5"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={soilDashes[index % 4].join(" ")}
      />
    </svg>
  );
}

export function SoilWaterExplorer(props: {
  data: SoilWaterDataset;
  initialWindow?: SoilWindow;
  initialDepthIds?: string[];
  initialCursorAt?: number;
  onExport?: (result: SoilWaterExport) => void;
}) {
  const prepared = useMemo(() => {
    const started = performance.now();
    try {
      return {
        data: prepareSoilData(props.data),
        elapsed: performance.now() - started,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "数据定义无效" };
    }
  }, [props.data]);
  if (!prepared.data)
    return (
      <section className="soil-water-workspace surface-raised" role="alert">
        {prepared.error}
      </section>
    );
  return (
    <Workspace
      key={props.data.id}
      {...props}
      prepared={prepared.data}
      preparedMs={prepared.elapsed!}
    />
  );
}

function Workspace({
  prepared: data,
  preparedMs,
  initialWindow,
  initialDepthIds,
  initialCursorAt,
  onExport,
}: {
  prepared: PreparedSoil;
  preparedMs: number;
  initialWindow?: SoilWindow;
  initialDepthIds?: string[];
  initialCursorAt?: number;
  onExport?: (result: SoilWaterExport) => void;
}) {
  const [requestedWindow, setWindow] = useState(() =>
    clampSoilWindow(initialWindow ?? data.window, data.window, data.cadenceMs),
  );
  const window = useMemo(
    () => clampSoilWindow(requestedWindow, data.window, data.cadenceMs),
    [requestedWindow, data.window, data.cadenceMs],
  );
  const [requestedDepthIds, setDepthIds] = useState(
    () =>
      initialDepthIds?.filter((id) => data.depths.some((d) => d.id === id)) ??
      data.depths.filter((_, i) => [0, 4, 14].includes(i)).map((d) => d.id),
  );
  const depthIds = useMemo(
    () =>
      requestedDepthIds.filter((id) =>
        data.depths.some((depth) => depth.id === id),
      ),
    [requestedDepthIds, data.depths],
  );
  const [tab, setTab] = useState("chart"),
    [showDrivers, setShowDrivers] = useState(false),
    [page, setPage] = useState(0),
    [rangeOpen, setRangeOpen] = useState(false),
    [rangeError, setRangeError] = useState("");
  const [expanded, setExpanded] = useState(false),
    dialog = useRef<HTMLDialogElement>(null),
    expandButton = useRef<HTMLButtonElement>(null),
    wasExpanded = useRef(false);
  useEffect(() => {
    if (expanded) {
      dialog.current?.showModal();
      wasExpanded.current = true;
    } else {
      dialog.current?.close();
      if (wasExpanded.current)
        expandButton.current?.focus({ preventScroll: true });
      wasExpanded.current = false;
    }
  }, [expanded]);
  const [cursor, setCursor] = useState<SoilCursor>({
    at: initialCursorAt ?? window.from,
    pinned: false,
  });
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const uid = useId(),
    root = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false),
    [readoutOpen, setReadoutOpen] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setCompact(entry.contentRect.width < 760),
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [expanded]);
  const viewResult = useMemo(() => {
    const start = performance.now();
    const result = createSoilView(data, window);
    return { result, ms: performance.now() - start };
  }, [data, window]);
  const view = viewResult.result;
  const at = Math.max(window.from, Math.min(window.to - 1, cursor.at));
  const binIndex = Math.max(
    0,
    view.layers[0]?.bins.findIndex((b) => b.from <= at && b.to > at) ?? 0,
  );
  const cursorBin = view.layers[0]?.bins[binIndex];
  const selectedLayers = view.layers.filter((d) => depthIds.includes(d.id));
  const focusEvents = view.events.filter(
    (e) =>
      e.id === cursor.eventId ||
      eventInWindow(e, {
        from: cursorBin?.from ?? at,
        to: cursorBin?.to ?? at + data.cadenceMs,
      }),
  );
  const rawRows = useMemo(
    () =>
      tab !== "records"
        ? []
        : data.depths
            .filter((d) => depthIds.includes(d.id))
            .flatMap((d) =>
              recordsInWindow(d.records, window).map((record) => ({
                ...record,
                depthCm: d.depthCm,
                depthId: d.id,
              })),
            )
            .sort((a, b) => a.timestamp - b.timestamp || a.depthCm - b.depthCm),
    [data, depthIds, window, tab],
  );
  const pageSize = 80,
    driverRows = useMemo(
      () =>
        view.drivers
          .flatMap((driver) =>
            driver.records.map((record) => ({ ...record, driver })),
          )
          .sort(
            (a, b) => a.from - b.from || a.driver.id.localeCompare(b.driver.id),
          ),
      [view],
    ),
    pageCount = Math.max(
      1,
      Math.ceil((showDrivers ? driverRows.length : rawRows.length) / pageSize),
    );
  const activePage = Math.min(page, pageCount - 1);
  const onCursor = useCallback((next: SoilCursor) => {
    if (cursorRef.current.pinned && !next.pinned && next.source !== "keyboard")
      return false;
    setCursor(next);
    return true;
  }, []);
  const changeWindow = useCallback(
    (next: SoilWindow) => {
      setWindow(clampSoilWindow(next, data.window, data.cadenceMs));
      setPage(0);
      setCursor((current) => ({
        ...current,
        pinned: false,
        eventId: undefined,
      }));
    },
    [data],
  );
  const onRendered = useCallback((ms: number) => {
    if (root.current) root.current.dataset.renderMs = ms.toFixed(1);
  }, []);
  function setSpan(days?: number) {
    if (!days) {
      changeWindow(data.window);
      return;
    }
    const span = Math.min(days * SOIL_DAY, data.window.to - data.window.from);
    const start =
      data.window.from +
      Math.floor((at - span / 2 - data.window.from) / data.cadenceMs) *
        data.cadenceMs;
    changeWindow({ from: start, to: start + span });
  }
  function toggleDepth(id: string) {
    setDepthIds((current) =>
      current.includes(id) ? current.filter((v) => v !== id) : [...current, id],
    );
    setPage(0);
  }
  function applyDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const from = Date.parse(`${fields.get("from")}Z`),
      to = Date.parse(`${fields.get("to")}Z`);
    if (
      !Number.isFinite(from) ||
      !Number.isFinite(to) ||
      from >= to ||
      from < data.window.from ||
      to > data.window.to ||
      to - from < data.cadenceMs
    ) {
      setRangeError("请选择数据范围内的有效区间，至少包含一个采样间隔。");
      return;
    }
    changeWindow({ from, to });
    setRangeError("");
    setRangeOpen(false);
  }
  function locateEvent(id: string) {
    const event = data.events.find((e) => e.id === id);
    if (!event) return;
    const end =
      event.timing === "instant"
        ? event.from + data.cadenceMs
        : (event.to ?? Math.min(data.window.to, event.from + 5 * SOIL_DAY));
    changeWindow({ from: event.from - SOIL_DAY, to: end + SOIL_DAY });
    setCursor({ at: event.from, pinned: true, eventId: id });
    setTab("chart");
  }
  const qualityWarnings =
    data.stats.rejected + data.stats.rejectedDepths + data.stats.rejectedEvents;
  const depthSelector = (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="soil-water-depth-trigger"
          aria-label={`选择对比深度，已选 ${depthIds.length} / ${data.depths.length}`}
        >
          <Layers3 size={14} />
          深度 {depthIds.length}/{data.depths.length}
        </Button>
      </Popover.Trigger>
      <Popover.Portal container={expanded ? dialog.current : undefined}>
        <Popover.Content
          className="soil-water-info soil-water-depth-popover surface-raised"
          sideOffset={8}
          collisionPadding={12}
          align="start"
        >
          <div className="soil-water-depth-heading">
            <h3>
              深度对比{" "}
              <small>
                {depthIds.length}/{data.depths.length}
              </small>
            </h3>
            <Button
              variant="ghost"
              onClick={() =>
                setDepthIds(
                  depthIds.length === data.depths.length
                    ? []
                    : data.depths.map((d) => d.id),
                )
              }
            >
              {depthIds.length === data.depths.length ? "清空" : "全选"}
            </Button>
          </div>
          <div className="soil-water-profile" aria-label="当前时段各深度水分">
            {view.layers.map((layer, index) => {
              const bin = layer.bins[binIndex];
              return (
                <button
                  key={layer.id}
                  aria-pressed={depthIds.includes(layer.id)}
                  aria-label={`${layer.depthCm} cm ${num(bin?.mean ?? null, data.precision)} ${data.unit}，${depthIds.includes(layer.id) ? "移除" : "加入"}对比`}
                  onClick={() => toggleDepth(layer.id)}
                  className="soil-water-profile-row"
                  style={
                    {
                      "--soil-series-color": `var(--soil-series-${Math.floor(index / 4) % 5})`,
                    } as CSSProperties
                  }
                >
                  <span>
                    {layer.depthCm}
                    <small> cm</small>
                  </span>
                  <span className="soil-water-profile-track">
                    <i
                      style={{
                        left: `${bin?.mean === null || !bin ? 0 : Math.max(0, Math.min(100, ((bin.mean - data.scale.min) / (data.scale.max - data.scale.min)) * 100))}%`,
                        visibility:
                          bin?.mean === null || !bin ? "hidden" : "visible",
                      }}
                    />
                  </span>
                  <b>{num(bin?.mean ?? null, data.precision)}</b>
                  <span className="soil-water-selection-mark">
                    {depthIds.includes(layer.id) ? "●" : "○"}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="soil-water-profile-axis">
            <span>{data.scale.min}</span>
            <span>水分 / {data.unit}</span>
            <span>{data.scale.max}</span>
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
  const navigation = (
    <div className="soil-water-nav-row">
      <Button
        size="icon"
        variant="ghost"
        aria-label="前移一个时间窗口"
        disabled={window.from <= data.window.from}
        onClick={() =>
          changeWindow({
            from: window.from - (window.to - window.from),
            to: window.from,
          })
        }
      >
        <ChevronLeft />
      </Button>
      <div className="soil-water-nav-wrap">
        <Suspense fallback={<div className="soil-water-navigator" />}>
          <Navigator data={data} window={window} onWindow={changeWindow} />
        </Suspense>
      </div>
      <Button
        size="icon"
        variant="ghost"
        aria-label="后移一个时间窗口"
        disabled={window.to >= data.window.to}
        onClick={() =>
          changeWindow({
            from: window.to,
            to: window.to + window.to - window.from,
          })
        }
      >
        <ChevronRight />
      </Button>
    </div>
  );
  const inspector = (
    <aside
      className="soil-water-inspector"
      aria-label="联动读数"
      aria-live={cursor.pinned ? "polite" : "off"}
    >
      <div className="soil-water-inspector-head">
        <span>{cursor.pinned ? "已固定" : "联动读数"}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={cursor.pinned ? "解除固定读数" : "固定读数"}
          onClick={() => setCursor((c) => ({ ...c, pinned: !c.pinned }))}
        >
          {cursor.pinned ? <X /> : <Pin />}
        </Button>
      </div>
      <p className="soil-water-focus-time">
        {time(cursorBin?.from ?? at, data.timeZone)}
        <small>
          {data.timeZone}
          {view.resolution > data.cadenceMs
            ? ` · ${((cursorBin?.to ?? at + view.resolution) - (cursorBin?.from ?? at)) / SOIL_HOUR} h 分箱`
            : " · 1 个采样时隙"}
        </small>
      </p>
      <h3 className="soil-water-readings-title">
        水分 <small>/ {data.unit}</small>
      </h3>
      <div className="soil-water-readings">
        {selectedLayers.map((layer) => {
          const index = data.depths.findIndex((d) => d.id === layer.id),
            b = layer.bins[binIndex];
          const raw = b ? recordsInWindow(layer.records, b) : [];
          return (
            <div
              key={layer.id}
              className="soil-water-reading"
              style={
                {
                  "--soil-series-color": `var(--soil-series-${Math.floor(index / 4) % 5})`,
                } as CSSProperties
              }
            >
              <div>
                <span>
                  <LegendLine index={index} />
                  {layer.depthCm} cm
                </span>
                <strong>
                  {num(b?.mean ?? null, data.precision)}
                  <small> {data.unit}</small>
                </strong>
              </div>
              {b && (
                <p>
                  {view.resolution > data.cadenceMs
                    ? `${num(b.min, data.precision)}–${num(b.max, data.precision)} · ${b.count}/${b.expected} 样本`
                    : raw.length === 1
                      ? `${time(raw[0].timestamp, data.timeZone)} · ${sampleState(raw[0]) === "missing" ? "缺测" : qualityLabel(raw[0])}`
                      : `${b.count}/${b.expected} 样本`}
                  {(view.resolution > data.cadenceMs || raw.length !== 1) &&
                    b.invalid > 0 &&
                    ` · ${b.invalid} 无效`}
                  {(view.resolution > data.cadenceMs || raw.length !== 1) &&
                    b.uncertain > 0 &&
                    " · 存疑"}
                  {(view.resolution > data.cadenceMs || raw.length !== 1) &&
                    b.estimated > 0 &&
                    " · 含估算"}
                </p>
              )}
            </div>
          );
        })}
        {!selectedLayers.length && (
          <p className="soil-water-muted">选择深度以比较曲线</p>
        )}
      </div>
      <div className="soil-water-driver-section">
        <div className="soil-water-inspector-section">
          <h3>气象与系数</h3>
          <Popover.Root>
            <Popover.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label="气象区间与质量">
                <Info />
              </Button>
            </Popover.Trigger>
            <Popover.Portal container={expanded ? dialog.current : undefined}>
              <Popover.Content
                className="soil-water-info surface-raised"
                sideOffset={8}
                collisionPadding={12}
                align="end"
              >
                <h3>气象区间与质量 · {data.timeZone}</h3>
                {view.drivers.map((driver) => {
                  const record = driver.records.find(
                    (r) => r.from <= at && r.to > at,
                  );
                  return (
                    <div key={driver.id}>
                      <strong>{driver.label}</strong>
                      <p>
                        {record
                          ? `${time(record.from, data.timeZone)} — ${time(record.to, data.timeZone)}`
                          : "此时段无记录"}
                      </p>
                      <p>
                        {record?.quality &&
                          qualityLabel({ timestamp: record.from, ...record })}
                        {driver.method && ` · ${driver.method}`}
                      </p>
                    </div>
                  );
                })}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
        <div className="soil-water-driver-readings">
          {view.drivers.map((driver) => {
            const record = driver.records.find(
              (r) => r.from <= at && r.to > at,
            );
            return (
              <div key={driver.id}>
                <span
                  className={`soil-water-driver-label soil-water-driver-${driver.id === data.kc?.id ? "kc" : driver.id === data.et0?.id ? "et0" : "rain"}`}
                >
                  {driver.label}
                </span>
                <strong>
                  {num(
                    record?.quality === "bad" ? null : (record?.value ?? null),
                    driver.precision,
                  )}
                  <small> {driver.unit === "1" ? "" : driver.unit}</small>
                </strong>
              </div>
            );
          })}
        </div>
      </div>
      <div className="soil-water-focus-events">
        <h3>
          时段事件 <small>{focusEvents.length}</small>
        </h3>
        {focusEvents.map((e) => (
          <button key={e.id} onClick={() => locateEvent(e.id)}>
            <i data-kind={e.kind} />{" "}
            <span>
              {e.label}
              <small>
                {e.timing === "instant"
                  ? "◆ 瞬时"
                  : e.to
                    ? "持续区间"
                    : "持续中"}
              </small>
            </span>
            <ChevronRight size={14} />
          </button>
        ))}
        {focusEvents.length === 0 && (
          <p className="soil-water-muted">没有关联事件</p>
        )}
      </div>
    </aside>
  );
  const modes = (
    <TabsList>
      <TabsTrigger value="chart">联动分析</TabsTrigger>
      <TabsTrigger value="records">原始数据</TabsTrigger>
      <TabsTrigger value="events">事件 {view.events.length}</TabsTrigger>
    </TabsList>
  );
  const workspace = (
    <section
      ref={root}
      className="soil-water-workspace surface-raised"
      aria-label={data.title}
      data-slot="soil-water-explorer"
      data-compact={compact}
      data-records={data.stats.received}
      data-window-records={view.received}
      data-expected={data.stats.expected}
      data-prepared-ms={preparedMs.toFixed(1)}
      data-view-ms={viewResult.ms.toFixed(1)}
      data-resolution={view.resolution}
      data-from={window.from}
      data-to={window.to}
      data-cells={view.cellCount}
    >
      <Tabs
        className="soil-water-tabs"
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          setPage(0);
        }}
      >
        <header className="soil-water-header">
          <div className="soil-water-title">
            <div>
              <h2>{data.title}</h2>
              <p>
                {data.depths.length} 深度 <span>·</span>{" "}
                {data.cadenceMs / SOIL_HOUR} h 采样 <span>·</span>{" "}
                {count(view.received)} 条
              </p>
            </div>
          </div>
          {!compact && modes}
          <div className="soil-water-header-actions">
            <Popover.Root>
              <Popover.Trigger asChild>
                <Button variant="ghost" size="icon" aria-label="数据口径与来源">
                  <Info />
                </Button>
              </Popover.Trigger>
              <Popover.Portal container={expanded ? dialog.current : undefined}>
                <Popover.Content
                  className="soil-water-info surface-raised"
                  sideOffset={8}
                  collisionPadding={12}
                  align="end"
                >
                  <h3>数据口径与来源</h3>
                  <p>{data.source}</p>
                  <dl>
                    <dt>时间范围</dt>
                    <dd>
                      {time(data.window.from, data.timeZone)} —{" "}
                      {time(data.window.to, data.timeZone)}，右端不含；
                      {data.timeZone}
                    </dd>
                    <dt>水分</dt>
                    <dd>
                      {data.unit} · 精度 {data.precision} 位；参考范围{" "}
                      {data.referenceDomain.min}–{data.referenceDomain.max}{" "}
                      {data.unit}，越界值扩展显示尺度。
                    </dd>
                    <dt>采样</dt>
                    <dd>
                      {count(data.stats.valid)} 个可用值 /{" "}
                      {count(data.stats.expected)} 个计划时隙；
                      {count(data.stats.invalid)} 个无效值、
                      {count(data.stats.missing)} 个空值。未报告的时隙保持缺测。
                    </dd>
                    <dt>热图</dt>
                    <dd>
                      等高行代表离散探针，不是连续土层厚度。超过 14 天用 24 h
                      分箱均值；细线保留范围，底部点线表示覆盖不足或来源质量标记。色阶依据全年原始值范围固定，放大不变色。小时视图保留实际采样时间；间隔超过采样周期的
                      1.5 倍断线。
                    </dd>
                    <dt>来源</dt>
                    <dd>
                      {[data.rainfall, data.et0, data.kc]
                        .filter(Boolean)
                        .map((d) => (
                          <p key={d!.id}>
                            {d!.label}：{d!.source}
                            {d!.method && ` · ${d!.method}`}
                          </p>
                        ))}
                    </dd>
                    <dt>交互</dt>
                    <dd>
                      拖动年度窗口；方向键逐时段查看，Enter 固定，Escape
                      解除。事件可定位，原始记录可按当前范围导出。事件共现不代表因果，Kc
                      未自动转换成耗水量。
                    </dd>
                  </dl>
                  {qualityWarnings > 0 && (
                    <p role="status">
                      {qualityWarnings} 个无效时间、深度或事件已排除。
                    </p>
                  )}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            {onExport && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="导出当前范围与所选深度"
                onClick={() => onExport(soilExport(data, window, depthIds))}
              >
                <Download />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="重置视图"
              onClick={() => {
                changeWindow(data.window);
                setDepthIds(
                  data.depths
                    .filter((_, i) => [0, 4, 14].includes(i))
                    .map((d) => d.id),
                );
              }}
            >
              <RotateCcw size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              ref={expandButton}
              aria-label={expanded ? "收起分析工作区" : "展开分析工作区"}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? <Minimize2 /> : <Maximize2 />}
            </Button>
          </div>
        </header>
        {compact && <div className="soil-water-viewbar">{modes}</div>}

        <div className="soil-water-rangebar">
          <div className="soil-water-range">
            <strong>
              <span>
                {time(
                  window.from,
                  data.timeZone,
                  data.timeZone === "UTC" &&
                    window.from % SOIL_DAY === 0 &&
                    window.to % SOIL_DAY === 0,
                )}
              </span>{" "}
              <span>—</span>{" "}
              <span>
                {time(
                  window.to,
                  data.timeZone,
                  data.timeZone === "UTC" &&
                    window.from % SOIL_DAY === 0 &&
                    window.to % SOIL_DAY === 0,
                )}
              </span>
            </strong>
            <span>{data.timeZone} · 右端不含</span>
          </div>
          <div className="soil-water-query-actions">
            {depthSelector}
            <div className="soil-water-presets" data-slot="control-row">
              {[undefined, 90, 30, 7, 1].map((days) => (
                <Button
                  key={days ?? "all"}
                  size="sm"
                  variant="ghost"
                  aria-pressed={
                    days
                      ? window.to - window.from === days * SOIL_DAY
                      : window.from === data.window.from &&
                        window.to === data.window.to
                  }
                  onClick={() => setSpan(days)}
                >
                  {days
                    ? `${days} 天`
                    : data.window.to - data.window.from >= 365 * SOIL_DAY
                      ? "全年"
                      : "全部"}
                </Button>
              ))}
              <Popover.Root open={rangeOpen} onOpenChange={setRangeOpen}>
                <Popover.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="自定义时间范围"
                  >
                    <CalendarRange />
                  </Button>
                </Popover.Trigger>
                <Popover.Portal
                  container={expanded ? dialog.current : undefined}
                >
                  <Popover.Content
                    className="soil-water-info surface-raised"
                    sideOffset={8}
                    collisionPadding={12}
                    align="end"
                  >
                    <form onSubmit={applyDates} className="soil-water-dateform">
                      <h3>时间范围 · UTC</h3>
                      <label htmlFor={`${uid}-from`}>开始</label>
                      <Input
                        id={`${uid}-from`}
                        name="from"
                        type="datetime-local"
                        defaultValue={timeInput(window.from)}
                        required
                      />
                      <label htmlFor={`${uid}-to`}>结束（不含）</label>
                      <Input
                        id={`${uid}-to`}
                        name="to"
                        type="datetime-local"
                        defaultValue={timeInput(window.to)}
                        required
                      />
                      {rangeError && <p role="alert">{rangeError}</p>}
                      <Button type="submit">应用范围</Button>
                    </form>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>
        </div>

        <TabsContent value="chart" className="soil-water-chart-view">
          {data.depths.length === 0 ? (
            <p className="soil-water-empty">没有可用深度或观测记录</p>
          ) : (
            <div className="soil-water-body">
              <div className="soil-water-chart-column">
                {compact && (
                  <div
                    className="soil-water-compact-cursor"
                    aria-label="当前联动读数摘要"
                  >
                    <strong>
                      {time(cursorBin?.from ?? at, data.timeZone)}{" "}
                      <small>{data.timeZone}</small>
                    </strong>
                    <Popover.Root
                      open={readoutOpen}
                      onOpenChange={(open) => {
                        setReadoutOpen(open);
                        if (open) setCursor((c) => ({ ...c, pinned: true }));
                      }}
                    >
                      <Popover.Trigger asChild>
                        <Button variant="ghost" size="sm">
                          读数
                        </Button>
                      </Popover.Trigger>
                      <Popover.Portal
                        container={expanded ? dialog.current : undefined}
                      >
                        <Popover.Content
                          className="soil-water-info soil-water-readout-popover surface-raised"
                          sideOffset={8}
                          collisionPadding={12}
                          align="end"
                        >
                          {inspector}
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  </div>
                )}
                <div className="soil-water-scale">
                  <span className="soil-water-resolution">
                    {view.resolution === data.cadenceMs
                      ? `${data.cadenceMs / SOIL_HOUR} h 时隙`
                      : "24 h 均值 · min–max"}
                  </span>
                  <div>
                    <span>{num(data.heatScale.min, 1)}</span>
                    <i
                      style={{
                        background: `linear-gradient(90deg,${soilHeatColors.join(",")})`,
                      }}
                    />
                    <span>
                      {num(data.heatScale.max, 1)} {data.unit}
                    </span>
                    <b className="soil-water-missing-key" /> <span>缺测</span>
                    <b className="soil-water-invalid-key" /> <span>无效</span>
                  </div>
                </div>
                <Suspense
                  fallback={
                    <p role="status" className="soil-water-empty">
                      正在准备年度视图…
                    </p>
                  }
                >
                  <Plots
                    data={data}
                    view={view}
                    depthIds={depthIds}
                    cursorAt={
                      cursorBin
                        ? view.resolution > data.cadenceMs
                          ? (cursorBin.from + cursorBin.to) / 2
                          : cursorBin.from
                        : at
                    }
                    cursorPinned={cursor.pinned}
                    highlightedEventId={cursor.eventId}
                    onCursor={onCursor}
                    onWindow={changeWindow}
                    onRendered={onRendered}
                  />
                </Suspense>
                {navigation}
              </div>
              {!compact && inspector}
            </div>
          )}
        </TabsContent>
        <TabsContent value="records">
          <div className="soil-water-record-switch" data-slot="control-row">
            <Button
              variant="ghost"
              aria-pressed={!showDrivers}
              onClick={() => {
                setShowDrivers(false);
                setPage(0);
              }}
            >
              水分样本
            </Button>
            <Button
              variant="ghost"
              aria-pressed={showDrivers}
              onClick={() => {
                setShowDrivers(true);
                setPage(0);
              }}
            >
              气象与系数
            </Button>
          </div>
          <div className="soil-water-table-controls">
            <p>
              {count(showDrivers ? driverRows.length : rawRows.length)}{" "}
              条原始记录{" "}
              {showDrivers
                ? "· 相交的完整统计区间"
                : `· ${depthIds.length} 个所选深度`}
              · {data.timeZone}
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                if (showDrivers) setShowDrivers(false);
                else setDepthIds(data.depths.map((d) => d.id));
                setPage(0);
              }}
            >
              {showDrivers ? "返回水分样本" : "所有深度"}
            </Button>
          </div>
          <div
            className="soil-water-table-scroll"
            tabIndex={0}
            role="region"
            aria-label={showDrivers ? "原始气象与系数记录" : "原始水分记录"}
          >
            {showDrivers ? (
              <table>
                <caption className="sr-only">
                  当前范围相交的气象与系数原始区间，不拆分、不摊薄
                </caption>
                <thead>
                  <tr>
                    <th scope="col">序列</th>
                    <th scope="col">开始 · {data.timeZone}</th>
                    <th scope="col">结束（不含）</th>
                    <th scope="col" className="numeric">
                      数值
                    </th>
                    <th scope="col">单位</th>
                    <th scope="col">质量</th>
                  </tr>
                </thead>
                <tbody>
                  {driverRows
                    .slice(activePage * pageSize, (activePage + 1) * pageSize)
                    .map((r) => (
                      <tr key={`${r.driver.id}-${r.from}`}>
                        <th scope="row">{r.driver.label}</th>
                        <td>{time(r.from, data.timeZone)}</td>
                        <td>{time(r.to, data.timeZone)}</td>
                        <td className="numeric">
                          {formatTelemetrySample(
                            { timestamp: r.from, ...r },
                            r.driver.precision,
                          )}
                        </td>
                        <td>
                          {r.driver.unit === "1" ? "无量纲" : r.driver.unit}
                        </td>
                        <td>{qualityLabel({ timestamp: r.from, ...r })}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <table>
                <caption className="sr-only">
                  当前时间范围与所选深度的原始记录，按采样时间、深度排序
                </caption>
                <thead>
                  <tr>
                    <th scope="col">采样时间 · {data.timeZone}</th>
                    <th scope="col" className="numeric">
                      深度 / cm
                    </th>
                    <th scope="col" className="numeric">
                      水分 / {data.unit}
                    </th>
                    <th scope="col">质量</th>
                  </tr>
                </thead>
                <tbody>
                  {rawRows
                    .slice(activePage * pageSize, (activePage + 1) * pageSize)
                    .map((p) => (
                      <tr key={`${p.depthId}-${p.timestamp}`}>
                        <th scope="row">{time(p.timestamp, data.timeZone)}</th>
                        <td className="numeric">{p.depthCm}</td>
                        <td className="numeric">
                          {formatTelemetrySample(p, data.precision)}
                        </td>
                        <td>
                          {sampleState(p) === "missing"
                            ? "缺测"
                            : sampleState(p) === "invalid"
                              ? "无效"
                              : qualityLabel(p)}
                          {p.qualityReason &&
                            !p.quality &&
                            ` · ${p.qualityReason}`}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
            {!(showDrivers ? driverRows.length : rawRows.length) && (
              <p className="soil-water-empty">当前范围与深度没有原始记录</p>
            )}
          </div>
          <div className="soil-water-pagination">
            <Button
              variant="ghost"
              disabled={activePage === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              上一页
            </Button>
            <span>
              {activePage + 1} / {pageCount}
            </span>
            <Button
              variant="ghost"
              disabled={activePage >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="events">
          <div
            className="soil-water-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="当前范围内的事件"
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">事件</th>
                  <th scope="col">类型</th>
                  <th scope="col">开始 · {data.timeZone}</th>
                  <th scope="col">结束 · {data.timeZone}</th>
                  <th scope="col">影响深度</th>
                  <th scope="col">
                    <span className="sr-only">定位</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {view.events.map((e) => (
                  <tr key={e.id}>
                    <th scope="row">
                      {e.label}
                      {e.description && <small>{e.description}</small>}
                    </th>
                    <td>{soilEventLabels[e.kind]}</td>
                    <td>{time(e.from, data.timeZone)}</td>
                    <td>
                      {e.timing === "instant"
                        ? "◆ 瞬时"
                        : e.to
                          ? time(e.to, data.timeZone)
                          : "持续中"}
                    </td>
                    <td>
                      {e.depthIds
                        ? e.depthIds
                            .map(
                              (id) =>
                                data.depths.find((d) => d.id === id)?.depthCm ??
                                id,
                            )
                            .join("、") + " cm"
                        : "未指定"}
                    </td>
                    <td>
                      <Button variant="ghost" onClick={() => locateEvent(e.id)}>
                        定位
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!view.events.length && (
              <p className="soil-water-empty">当前范围没有事件</p>
            )}
          </div>
        </TabsContent>
        <footer className="soil-water-footer">
          <span>{data.source}</span>
        </footer>
      </Tabs>
    </section>
  );
  return (
    <>
      {!expanded && workspace}
      <dialog
        className="soil-water-expanded"
        ref={dialog}
        aria-label={`${data.title} · 分析工作区`}
        onClose={() => setExpanded(false)}
      >
        {expanded && workspace}
      </dialog>
    </>
  );
}
