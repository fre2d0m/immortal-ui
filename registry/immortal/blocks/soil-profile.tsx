"use client";

import { Panel } from "@/components/iot/internal/panel";

import { useState } from "react";
import { ArrowUpRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

import { telemetryTime } from "@/lib/telemetry";

export type SoilLayer = {
  id: string;
  depthCm: number;
  moisture: number | null;
  temperature: number | null;
  salinity?: { value: number | null; unit: string };
  historyHref?: string;
};

const valid = (value: number | null) =>
  value !== null && Number.isFinite(value);
const reading = (value: number | null, digits: number) =>
  valid(value) ? value!.toFixed(digits) : "缺测";

export function SoilProfile({
  title,
  location,
  sampledAt,
  layers,
  initialLayerId,
}: {
  title: string;
  location?: string;
  sampledAt: number | null;
  layers: SoilLayer[];
  initialLayerId?: string;
}) {
  const [selectedId, setSelectedId] = useState(initialLayerId);
  const ordered = layers
    .filter((layer) => Number.isFinite(layer.depthCm) && layer.depthCm >= 0)
    .sort((a, b) => a.depthCm - b.depthCm);
  const unpositioned = layers.filter(
    (layer) => !Number.isFinite(layer.depthCm) || layer.depthCm < 0,
  );
  const selected =
    ordered.find((layer) => layer.id === selectedId) ?? ordered[0];
  const tickStep = Math.max(
    5,
    Math.ceil((ordered.at(-1)?.depthCm ?? 0) / 20) * 5,
  );
  const maxDepth = tickStep * 4;
  const percent = (depthCm: number) => (depthCm / maxDepth) * 100 + "%";

  return (
    <Panel
      as="h2"
      icon={<Layers />}
      title={title}
      description={location}
      status={
        <span className="tabular-nums">
          采样 ·{" "}
          {sampledAt == null ? "时间未知" : telemetryTime(sampledAt) + " UTC"}
        </span>
      }
      className="@container min-w-0"
    >
      {selected ? (
        <div className="grid min-w-0 gap-4 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <figure
            className="surface-inset min-w-0 p-4"
            aria-label="地表以下探针位置，按安装深度等比例绘制"
          >
            <figcaption className="flex justify-between gap-3 text-sm text-muted-foreground">
              <span>地表</span>
              <span>深度（cm）</span>
            </figcaption>
            <div
              aria-hidden="true"
              className="relative mt-4 mb-2 h-52 border-y border-border/70 @lg:h-64"
            >
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  background:
                    "linear-gradient(180deg, color-mix(in oklab, var(--warning) 10%, transparent), color-mix(in oklab, var(--warning) 3%, transparent) 43%, color-mix(in oklab, var(--chart-1) 12%, transparent))",
                }}
              />
              <div
                className="absolute top-0 left-[54%] w-px bg-muted-foreground/65"
                style={{ height: percent(ordered.at(-1)!.depthCm) }}
              />
              {[0, 1, 2, 3, 4].map((tick) => (
                <div
                  key={tick}
                  className="absolute inset-x-0 flex -translate-y-1/2 items-center gap-3"
                  style={{ top: percent(tick * tickStep) }}
                >
                  <span className="w-9 shrink-0 text-right font-mono text-sm text-muted-foreground tabular-nums">
                    {tick * tickStep}
                  </span>
                  <span className="flex-1 border-t border-dashed border-muted-foreground/20" />
                </div>
              ))}
              {ordered.map((layer) => (
                <span
                  key={layer.id}
                  className="absolute left-[54%] z-10 flex size-4 -translate-1/2 items-center justify-center rounded-full border border-foreground bg-card text-sm font-bold text-foreground"
                  style={{ top: percent(layer.depthCm) }}
                >
                  {!valid(layer.moisture) || !valid(layer.temperature)
                    ? "×"
                    : ""}
                </span>
              ))}
              <div
                className="pointer-events-none absolute right-0 left-[54%] z-20 flex -translate-y-1/2 items-center"
                style={{ top: percent(selected.depthCm) }}
              >
                <span className="size-3.5 shrink-0 -translate-x-1/2 rounded-full border-[3px] border-card bg-foreground outline outline-foreground" />
                <span className="-ml-1 min-w-0 flex-1 border-t border-foreground/50" />
                <span className="rounded-md bg-card px-2 py-1 text-sm font-medium tabular-nums text-card-foreground">
                  {selected.depthCm} cm
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              按深度等比例 · ○ 有读数 · × 部分或全部缺测
            </p>
          </figure>
          <div className="min-w-0 space-y-3">
            <h3 className="font-medium">分层读数</h3>
            <div
              role="group"
              aria-label="选择观测深度"
              className="surface-inset min-w-0 p-2 @md:p-3"
            >
              <div
                aria-hidden="true"
                className="grid grid-cols-[0.8fr_1fr_1fr] gap-2 px-2 py-2 text-sm text-muted-foreground @md:px-3"
              >
                <span>深度</span>
                <span className="text-right">含水率</span>
                <span className="text-right">温度</span>
              </div>
              <ul className="space-y-1">
                {ordered.map((layer) => {
                  const water =
                    reading(layer.moisture, 1) +
                    (valid(layer.moisture) ? " %" : "");
                  const temperature =
                    reading(layer.temperature, 1) +
                    (valid(layer.temperature) ? " °C" : "");
                  return (
                    <li key={layer.id}>
                      <button
                        type="button"
                        data-slot="navigation-link"
                        className="grid! min-h-11! w-full grid-cols-[0.8fr_1fr_1fr] gap-2! px-2! text-left tabular-nums @md:px-3!"
                        aria-pressed={selected.id === layer.id}
                        aria-label={
                          layer.depthCm +
                          " cm，含水率 " +
                          water +
                          "，温度 " +
                          temperature
                        }
                        onClick={() => setSelectedId(layer.id)}
                      >
                        <span className="wrap-break-word">
                          {layer.depthCm} cm
                        </span>
                        <span className="flex flex-wrap items-center justify-end gap-x-1.5 text-right text-foreground">
                          {!valid(layer.moisture) && (
                            <span
                              className="size-1.5 rounded-full bg-warning"
                              aria-hidden="true"
                            />
                          )}
                          {water}
                        </span>
                        <span className="flex flex-wrap items-center justify-end gap-x-1.5 text-right text-foreground">
                          {!valid(layer.temperature) && (
                            <span
                              className="size-1.5 rounded-full bg-warning"
                              aria-hidden="true"
                            />
                          )}
                          {temperature}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            {(selected.salinity || selected.historyHref) && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                {selected.salinity && (
                  <p
                    className="text-sm text-muted-foreground tabular-nums"
                    aria-live="polite"
                  >
                    盐分 {reading(selected.salinity.value, 2)}
                    {valid(selected.salinity.value) &&
                      " " + selected.salinity.unit}
                  </p>
                )}
                {selected.historyHref && (
                  <Button asChild className="ml-auto min-h-10">
                    <a href={selected.historyHref}>
                      查看该层历史 <ArrowUpRight aria-hidden="true" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="surface-inset p-5 text-sm text-muted-foreground">
          暂无探针安装深度
        </p>
      )}
      {unpositioned.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4 text-sm">
          <p className="text-muted-foreground">
            {unpositioned.length} 个探针未提供有效安装深度，未放入剖面图。
          </p>
          <ul className="space-y-2">
            {unpositioned.map((layer) => (
              <li key={layer.id} className="wrap-anywhere">
                {layer.id} · 含水率 {reading(layer.moisture, 1)}
                {valid(layer.moisture) && " %"} · 温度{" "}
                {reading(layer.temperature, 1)}
                {valid(layer.temperature) && " °C"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
