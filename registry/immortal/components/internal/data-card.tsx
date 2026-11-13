"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  History,
  Minus,
  Sigma,
} from "lucide-react";
import { Panel } from "@/components/iot/internal/panel";
import { Button } from "@/components/ui/button";
import { RangeGauge } from "@/components/iot/range-gauge";
import {
  TelemetrySparkline,
  type TrendHistory,
} from "@/components/iot/internal/telemetry-sparkline";
import {
  comparisonValue,
  cardTimeParts,
  numberLabel,
  valueMatches,
  type CardDefinition,
  type CardValue,
  type DataTone,
  type MetricComparison,
} from "@/components/iot/internal/data-card-model";

export type DataCardPresentation = {
  visualization?: "value" | "trend" | "range";
  history?: TrendHistory;
  comparison?: MetricComparison;
  secondary?: { label: string; value: string }[];
  historyHref?: string;
  loading?: boolean;
  error?: string;
};
const tones: Record<DataTone, string> = {
  neutral: "text-muted-foreground",
  positive: "text-success-text",
  warning: "text-warning-text",
  negative: "text-destructive",
};

export function DataTimestamp({ at }: { at: number | null }) {
  const parts = cardTimeParts(at);
  return parts ? (
    <time
      dateTime={parts.iso}
      className="inline-flex flex-wrap gap-x-1 tabular-nums"
    >
      <span className="whitespace-nowrap">{parts.date}</span>
      <span className="whitespace-nowrap">{parts.clock} UTC</span>
    </time>
  ) : (
    <span>时间未知</span>
  );
}

export function DataTimeWindow({ from, to }: { from: number; to: number }) {
  const start = cardTimeParts(from),
    end = cardTimeParts(to);
  if (!start || !end || to < from) return <span>统计窗口无效</span>;
  if (start.date === end.date)
    return (
      <span className="inline-flex flex-wrap gap-x-1 tabular-nums">
        <span className="whitespace-nowrap">{start.date}</span>
        <span className="whitespace-nowrap">{start.clock}</span>
        <span className="whitespace-nowrap">– {end.clock} UTC</span>
      </span>
    );
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <DataTimestamp at={from} />
      <span>至</span>
      <DataTimestamp at={to} />
    </span>
  );
}

function ResultTable({
  definition,
  rows,
}: {
  definition: Extract<CardDefinition, { type: "table" }>;
  rows: Record<string, number | string | boolean | null>[];
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const measure = () =>
      setScrollable(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, []);
  const numericColumns = new Set(
    definition.columns
      .filter((column) => {
        const values = rows
          .map((row) => row[column.key])
          .filter((value) => value != null);
        return (
          column.precision != null ||
          (values.length > 0 &&
            values.every((value) => typeof value === "number"))
        );
      })
      .map((column) => column.key),
  );
  return (
    <div className="space-y-2">
      <div
        ref={wrapper}
        className="max-h-60 overflow-auto rounded-md border border-border"
        tabIndex={0}
        role="region"
        aria-label={`${definition.label}结果表`}
      >
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            {definition.label} · {definition.subject}
          </caption>
          <thead className="sticky top-0 z-10 bg-card text-muted-foreground">
            <tr>
              {definition.columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-3 py-2 font-medium ${numericColumns.has(column.key) ? "text-right" : ""}`}
                >
                  {column.label}
                  {column.unit && ` (${column.unit})`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border">
                {definition.columns.map((column) => (
                  <td
                    key={column.key}
                    className={`whitespace-nowrap px-3 py-2 tabular-nums ${numericColumns.has(column.key) ? "text-right" : ""}`}
                  >
                    {row[column.key] == null ? (
                      <>
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">无数据</span>
                      </>
                    ) : typeof row[column.key] === "number" ? (
                      column.precision == null ? (
                        Number.isFinite(row[column.key]) ? (
                          String(row[column.key])
                        ) : (
                          "—"
                        )
                      ) : (
                        numberLabel(row[column.key] as number, column.precision)
                      )
                    ) : (
                      String(row[column.key])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {scrollable && (
        <p className="text-sm text-muted-foreground">左右滚动查看全部列</p>
      )}
    </div>
  );
}

/** Shared rendering within the two semantic cards; not a catalog component. */
export function DataCard({
  kind,
  definition,
  value,
  invalid = false,
  message,
  metadata,
  details,
  visualization = "value",
  history,
  comparison,
  secondary,
  historyHref,
  loading,
  error,
}: DataCardPresentation & {
  kind: "metric" | "indicator";
  definition: CardDefinition;
  value: CardValue;
  invalid?: boolean;
  message?: string;
  metadata: ReactNode;
  details: ReactNode;
}) {
  const available = !invalid && valueMatches(definition, value);
  const numeric =
    definition.type === "number" && available && typeof value === "number";
  const delta =
    numeric && comparison ? comparisonValue(value, comparison) : null;
  const state =
    definition.type === "state"
      ? definition.states.find((state) => state.value === value)
      : undefined;
  const outside =
    numeric &&
    definition.type === "number" &&
    definition.range &&
    Number.isFinite(definition.range.min) &&
    Number.isFinite(definition.range.max) &&
    definition.range.max > definition.range.min &&
    (value < definition.range.min || value > definition.range.max);
  return (
    <Panel
      data-slot={`${kind}-card`}
      className="data-card"
      icon={kind === "metric" ? <Activity /> : <Sigma />}
      title={definition.label}
      description={definition.subject}
      aria-busy={loading}
      action={
        historyHref && (
          <Button asChild variant="ghost" size="icon">
            <a href={historyHref} aria-label={`查看${definition.label}历史`}>
              <History aria-hidden="true" />
            </a>
          </Button>
        )
      }
    >
      <div className="space-y-4 wrap-anywhere">
        {loading ? (
          <p role="status" className="py-6 text-muted-foreground">
            正在读取{kind === "metric" ? "观测" : "计算结果"}…
          </p>
        ) : error ? (
          <p role="alert" className="py-6 text-destructive">
            {error}
          </p>
        ) : (
          <>
            {definition.type === "table" &&
            available &&
            Array.isArray(value) ? (
              value.length ? (
                <ResultTable definition={definition} rows={value} />
              ) : (
                <p className="py-5 text-muted-foreground">本次结果为空</p>
              )
            ) : (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                <p
                  data-slot="data-card-value"
                  className={`flex max-w-full min-w-0 flex-wrap items-baseline gap-x-2 font-medium tracking-tight tabular-nums wrap-anywhere ${definition.type === "text" ? "text-xl" : "text-4xl"} ${available && state?.tone ? tones[state.tone] : ""}`}
                >
                  <span
                    className={
                      definition.type === "number"
                        ? "block max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap leading-[1.35]"
                        : ""
                    }
                    style={
                      numeric &&
                      numberLabel(value, definition.precision).length > 12
                        ? {
                            fontSize: `clamp(1rem, ${160 / numberLabel(value, definition.precision).length}cqi, 2.25rem)`,
                          }
                        : undefined
                    }
                  >
                    {!available
                      ? "—"
                      : definition.type === "number"
                        ? numberLabel(value as number, definition.precision)
                        : state
                          ? state.label
                          : value === ""
                            ? "空文本"
                            : String(value)}
                  </span>
                  {definition.type === "number" && (
                    <span className="whitespace-nowrap text-base font-normal tracking-normal text-muted-foreground">
                      {definition.unit}
                    </span>
                  )}
                </p>
                {numeric && comparison && (
                  <div
                    className={`flex min-w-0 max-w-full flex-wrap items-baseline gap-x-2 gap-y-1 text-sm tabular-nums ${tones[comparison.tone ?? "neutral"]}`}
                  >
                    <span className="inline-flex max-w-full items-center gap-1">
                      {delta !== null &&
                        (delta > 0 ? (
                          <ArrowUpRight
                            className="size-4 shrink-0"
                            aria-hidden="true"
                          />
                        ) : delta < 0 ? (
                          <ArrowDownRight
                            className="size-4 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <Minus
                            className="size-4 shrink-0"
                            aria-hidden="true"
                          />
                        ))}
                      <span className="min-w-0 overflow-x-auto whitespace-nowrap">
                        {delta === null
                          ? "无法比较"
                          : `${delta > 0 ? "+" : ""}${numberLabel(delta, definition.type === "number" ? definition.precision : 1)}${comparison.mode === "relative" ? "%" : comparison.mode === "percentage-points" ? " 个百分点" : definition.type === "number" ? ` ${definition.unit}` : ""}`}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {comparison.label}
                    </span>
                  </div>
                )}
              </div>
            )}
            {(invalid ||
              !available ||
              message ||
              definition.description ||
              outside) && (
              <p
                className={`text-sm leading-relaxed ${outside ? "text-warning-text" : "text-muted-foreground"}`}
              >
                {invalid
                  ? message || "数据无效，暂不可用于判断"
                  : !available
                    ? value === null
                      ? "暂无数据"
                      : "数据与定义不匹配"
                    : message ||
                      (outside ? "超出定义范围" : definition.description)}
              </p>
            )}
            {definition.type === "number" &&
              visualization === "trend" &&
              (history ? (
                <TelemetrySparkline
                  history={history}
                  label={definition.label}
                  unit={definition.type === "number" ? definition.unit : ""}
                  precision={
                    definition.type === "number"
                      ? definition.precision
                      : undefined
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">暂无历史数据</p>
              ))}
            {numeric &&
              visualization === "range" &&
              definition.type === "number" &&
              (definition.range ? (
                <RangeGauge
                  embedded
                  showValue={false}
                  label={definition.label}
                  value={value}
                  unit={definition.unit}
                  precision={definition.precision}
                  {...definition.range}
                />
              ) : (
                <p className="text-sm text-muted-foreground">未定义范围</p>
              ))}
            {metadata && <div className="text-sm">{metadata}</div>}
          </>
        )}
      </div>
      {!loading && !error && !!secondary?.length && (
        <dl className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
          {secondary.map((item) => (
            <div key={item.label} className="flex min-w-0 flex-wrap gap-x-2">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="tabular-nums wrap-anywhere">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <details data-slot="data-card-details" className="text-sm">
        <summary>
          <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
          {kind === "metric" ? "来源与测量定义" : "计算依据与口径"}
        </summary>
        <dl className="grid gap-3 pt-2 @md:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-muted-foreground">标识</dt>
            <dd className="mt-1 font-mono wrap-anywhere">{definition.id}</dd>
          </div>
          {details}
        </dl>
      </details>
    </Panel>
  );
}
