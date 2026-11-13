"use client";

import { memo, useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { CustomChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  DataZoomComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type {
  EChartsOption,
  SeriesOption,
  CustomSeriesRenderItem,
} from "echarts";
import {
  binSoilRecords,
  packSoilEvents,
  soilHeatColor,
  soilColors,
  soilLightColors,
  soilDashes,
  SOIL_DAY,
  SOIL_HOUR,
  type PreparedSoil,
  type SoilView,
  type SoilWindow,
  type SoilEventKind,
} from "./soil-water-model";

echarts.use([
  CustomChart,
  LineChart,
  GridComponent,
  DataZoomComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export type SoilCursor = {
  at: number;
  pinned: boolean;
  eventId?: string;
  source?: "keyboard";
};
type Props = {
  data: PreparedSoil;
  view: SoilView;
  depthIds: string[];
  cursorAt: number;
  cursorPinned: boolean;
  highlightedEventId?: string;
  onCursor: (cursor: SoilCursor) => boolean;
  onWindow: (window: SoilWindow) => void;
  onRendered?: (duration: number) => void;
};
const eventIndex: Record<SoilEventKind, number> = {
  irrigation: 2,
  installation: 0,
  fault: 4,
  freeze: 3,
};
function themeOf(element: HTMLElement) {
  const css = getComputedStyle(element),
    dark = element.closest(".dark") !== null;
  return {
    foreground: css.getPropertyValue("--foreground").trim() || "#353b43",
    muted: css.getPropertyValue("--muted-foreground").trim() || "#717782",
    line: dark ? "#444952" : "#d9dce0",
    missing: dark ? "#343940" : "#e3e6e9",
    colors: Array.from(
      { length: 5 },
      (_, i) =>
        css.getPropertyValue(`--chart-${i + 1}`).trim() ||
        (dark ? soilColors : soilLightColors)[i],
    ),
    font: css.fontFamily,
    size: parseFloat(css.fontSize) || 14,
  };
}
function formatAt(at: number, zone: string, detailed: boolean) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: zone,
    month: "2-digit",
    day: "2-digit",
    ...(detailed
      ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const }
      : {}),
  })
    .format(at)
    .replace(" ", detailed ? "\n" : " ");
}
function useChartTheme(ref: React.RefObject<HTMLDivElement | null>) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((v) => v + 1));
    // Theme scopes can live on any ancestor, including an installed consumer's wrapper.
    let node: HTMLElement | null = ref.current?.parentElement ?? null;
    while (node) {
      observer.observe(node, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
      node = node.parentElement;
    }
    const query = matchMedia("(forced-colors: active)");
    const update = () => setVersion((v) => v + 1);
    query.addEventListener("change", update);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", update);
    };
  }, [ref]);
  return version;
}

export const SoilWaterPlots = memo(function SoilWaterPlots({
  data,
  view,
  depthIds,
  cursorAt,
  cursorPinned,
  highlightedEventId,
  onCursor,
  onRendered,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    surface = useRef<HTMLDivElement>(null),
    instance = useRef<echarts.ECharts | null>(null);
  const pointerAt = useRef(view.window.from),
    cursorCallback = useRef(onCursor);
  cursorCallback.current = onCursor;
  const themeVersion = useChartTheme(host);
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 410,
    font: 14,
  });
  useEffect(() => {
    if (host.current) {
      const font = parseFloat(getComputedStyle(host.current).fontSize);
      setDimensions((previous) =>
        previous.font === font ? previous : { ...previous, font },
      );
    }
  }, [themeVersion]);
  const lanes = packSoilEvents(view.events, view.window);
  const factor = Math.max(1, dimensions.font / 14);
  const left = Math.ceil((dimensions.width < 480 ? 80 : 90) * factor),
    right = 12;
  const axisSpace = 30 * factor,
    gap = 16 * factor,
    top = 10 * factor;
  const eventHeight = Math.min(8, Math.max(4, lanes.length)) * 12 * factor;
  const waterHeight = 44 * factor,
    kcHeight = 26 * factor;
  const mainHeight = Math.max(
    40 * factor,
    dimensions.height -
      top -
      axisSpace -
      gap * 4 -
      eventHeight -
      waterHeight -
      kcHeight,
  );
  const heights = [
    mainHeight * 0.63,
    mainHeight * 0.37,
    waterHeight,
    kcHeight,
    eventHeight,
  ];
  let trackTop = top;
  const plots = heights.map((height) => {
    const plot = { top: trackTop, height };
    trackTop += height + gap;
    return plot;
  });
  const depthTickCount = Math.min(
    data.depths.length,
    Math.max(2, Math.min(6, Math.floor(heights[0] / (16 * factor)))),
  );
  const depthTicks = new Set(
    Array.from({ length: depthTickCount }, (_, i) =>
      Math.round(
        (i * (data.depths.length - 1)) / Math.max(1, depthTickCount - 1),
      ),
    ),
  );
  const water = view.drivers.find((d) => d.id !== data.kc?.id);
  const trackLabels = [
    { key: "moisture", label: "水分", unit: `cm · ${data.unit}` },
    { key: "comparison", label: "曲线", unit: data.unit },
    {
      key: "weather",
      label: "气象",
      unit: `${water?.unit ?? "mm"}/${water?.intervalMs ? `${water.intervalMs / SOIL_HOUR}h` : "区间"}`,
    },
    { key: "kc", label: "Kc", unit: "无量纲" },
    { key: "events", label: "事件", unit: "" },
  ];

  useEffect(() => {
    if (!host.current || !surface.current) return;
    const chart = echarts.init(surface.current, undefined, {
      renderer: "canvas",
      useDirtyRect: true,
    });
    instance.current = chart;
    const observer = new ResizeObserver(([entry]) => {
      if (!host.current || chart.isDisposed()) return;
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
        font: parseFloat(getComputedStyle(host.current!).fontSize),
      });
      chart.resize();
    });
    observer.observe(host.current);
    return () => {
      observer.disconnect();
      chart.dispose();
      instance.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = instance.current,
      element = host.current;
    if (!chart || !element) return;
    const started = performance.now(),
      theme = themeOf(element);
    const small = dimensions.width < 480;
    const text = {
      color: theme.muted,
      fontFamily: theme.font,
      fontSize: 11 * factor,
    };
    const xAxis = plots.map((_, i) => ({
      type: "time" as const,
      gridIndex: i,
      min: view.window.from,
      max: view.window.to,
      axisLine: { show: false },
      axisTick: { show: false },
      splitNumber: small ? 3 : 6,
      axisLabel: {
        ...text,
        show: i === 4,
        hideOverlap: true,
        showMinLabel: false,
        showMaxLabel: false,
        formatter: (v: number) =>
          formatAt(
            v,
            data.timeZone,
            view.window.to - view.window.from <= 14 * SOIL_DAY,
          ),
      },
      splitLine: {
        show: i !== 0 && i !== 4,
        lineStyle: { color: theme.line, type: "dotted" as const, opacity: 0.6 },
      },
      axisPointer: {
        show: true,
        type: "line" as const,
        snap: false,
        label: { show: false },
        lineStyle: { color: theme.muted, type: "dashed" as const, width: 1 },
      },
    }));
    const numericAxis = (gridIndex: number, min?: number, max?: number) => ({
      type: "value" as const,
      gridIndex,
      min,
      max,
      splitNumber: gridIndex === 1 ? 2 : 1,
      axisLabel: {
        ...text,
        hideOverlap: true,
        showMinLabel: true,
        showMaxLabel: true,
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: theme.line,
          type: "dotted" as const,
          opacity: 0.65,
        },
      },
    });
    const water = view.drivers.filter((d) => d.id !== data.kc?.id);
    const waterValues = [data.rainfall, data.et0].flatMap(
      (d) =>
        d?.records.flatMap((r) =>
          r.value !== null && Number.isFinite(r.value) && r.quality !== "bad"
            ? [r.value]
            : [],
        ) ?? [],
    );
    const waterMax = Math.max(1, ...waterValues),
      waterMin = Math.min(0, ...waterValues);
    const coefficients =
      data.kc?.records.flatMap((r) =>
        r.value !== null && Number.isFinite(r.value) && r.quality !== "bad"
          ? [r.value]
          : [],
      ) ?? [];
    const yAxis = [
      {
        type: "category" as const,
        gridIndex: 0,
        inverse: true,
        data: data.depths.map((d) => `${d.depthCm}`),
        axisLabel: {
          ...text,
          interval: (index: number) => depthTicks.has(index),
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      numericAxis(1, data.scale.min, data.scale.max),
      numericAxis(2, waterMin, waterMax),
      numericAxis(
        3,
        Math.min(0, ...coefficients),
        Math.max(1.2, ...coefficients),
      ),
      {
        type: "category" as const,
        gridIndex: 4,
        inverse: true,
        data: lanes.map((l) => l.label),
        axisLabel: {
          ...text,
          fontSize: 10 * factor,
          interval: lanes.length > 8 ? ("auto" as const) : 0,
          formatter: (value: string) => value.replace("设备故障", "故障"),
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          show: true,
          lineStyle: {
            color: theme.line,
            type: "dotted" as const,
            opacity: 0.55,
          },
        },
      },
    ];
    const rect: CustomSeriesRenderItem = (_params, api) => {
      const start = api.coord([api.value(0), api.value(2)]),
        end = api.coord([api.value(1), api.value(2)]);
      const size = (api.size!([0, 1]) as number[])[1];
      const value = Number(api.value(3)),
        valid = Number(api.value(4)),
        partial = Number(api.value(5)),
        invalid = Number(api.value(6));
      const shape = {
        x: Math.round(start[0]),
        y: Math.round(start[1] - size / 2),
        width: Math.max(1, Math.round(end[0]) - Math.round(start[0])),
        height: Math.max(1, Math.round(size)),
      };
      return {
        type: "group",
        children: [
          {
            type: "rect",
            shape,
            style: {
              fill: valid
                ? soilHeatColor(value, data.heatScale.min, data.heatScale.max)
                : theme.missing,
            },
          },
          ...(!valid || partial
            ? [
                {
                  type: "line" as const,
                  shape: {
                    x1: start[0],
                    x2: end[0],
                    y1: shape.y + shape.height - 1,
                    y2: shape.y + shape.height - 1,
                  },
                  style: {
                    stroke: invalid ? theme.colors[4] : theme.muted,
                    lineWidth: partial ? 1.5 : 0.8,
                    lineDash: valid ? [2, 2] : [1, 3],
                  },
                },
              ]
            : []),
          ...(!valid && invalid
            ? [
                {
                  type: "line" as const,
                  shape: {
                    x1: shape.x,
                    y1: shape.y + shape.height,
                    x2: shape.x + shape.width,
                    y2: shape.y,
                  },
                  style: {
                    stroke: theme.colors[4],
                    lineWidth: 1,
                    opacity: 0.8,
                  },
                },
              ]
            : []),
        ],
      };
    };
    const heat = view.layers.flatMap((d, i) =>
      d.bins.map((b) => [
        b.from,
        b.to,
        i,
        b.mean ?? 0,
        b.count > 0 ? 1 : 0,
        b.covered < b.expected || b.invalid || b.uncertain || b.estimated
          ? 1
          : 0,
        b.invalid > 0 ? 1 : 0,
      ]),
    );
    const series: SeriesOption[] = [
      {
        id: "soil-heat",
        type: "custom",
        xAxisIndex: 0,
        yAxisIndex: 0,
        renderItem: rect,
        data: heat,
        encode: { x: [0, 1], y: 2 },
        progressive: 0,
        silent: true,
        clip: true,
      },
    ];
    for (const [i, layer] of view.layers.entries()) {
      if (!depthIds.includes(layer.id)) continue;
      const color = theme.colors[Math.floor(i / 4) % 5],
        dash = soilDashes[i % 4];
      const rangeRenderer: CustomSeriesRenderItem = (_p, api) => {
        const lower = api.coord([api.value(0), api.value(1)]),
          upper = api.coord([api.value(0), api.value(2)]);
        return {
          type: "line",
          shape: { x1: lower[0], x2: upper[0], y1: lower[1], y2: upper[1] },
          style: { stroke: color, lineWidth: 1, opacity: 0.8 },
        };
      };
      if (view.resolution > data.cadenceMs)
        series.push({
          type: "custom",
          xAxisIndex: 1,
          yAxisIndex: 1,
          renderItem: rangeRenderer,
          data: layer.bins
            .filter((b) => b.count)
            .map((b) => [(b.from + b.to) / 2, b.min, b.max]),
          silent: true,
          clip: true,
        });
      const values: (number | null)[][] = [];
      for (const b of layer.bins) {
        const at =
          view.resolution === data.cadenceMs && b.count === 1
            ? b.firstValidAt!
            : (b.from + b.to) / 2;
        const previous = values.at(-1);
        if (
          view.resolution === data.cadenceMs &&
          previous &&
          previous[1] !== null &&
          at - previous[0]! > data.cadenceMs * 1.5
        )
          values.push([(at + previous[0]!) / 2, null]);
        // Partial buckets remain visible as isolated marks; they never bridge missing observations.
        if (b.covered < b.expected || b.invalid) values.push([b.from, null]);
        values.push([at, b.mean]);
        if (b.covered < b.expected || b.invalid) values.push([b.to - 1, null]);
      }
      const showSamples = layer.bins.length < 100;
      series.push({
        id: `depth-${layer.id}`,
        name: `${layer.depthCm} cm`,
        type: "line",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: values,
        showSymbol: showSamples,
        showAllSymbol: false,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: { color, width: 1.8, type: dash },
        itemStyle: { color },
        connectNulls: false,
        animation: false,
        silent: true,
        clip: false,
      });
      if (!showSamples) {
        const isolated = values.filter(
          (value, index) =>
            value[1] !== null &&
            (index === 0 || values[index - 1][1] === null) &&
            (index === values.length - 1 || values[index + 1][1] === null),
        );
        if (isolated.length) {
          const marker: CustomSeriesRenderItem = (_p, api) => {
            const point = api.coord([api.value(0), api.value(1)]);
            return {
              type: "circle",
              shape: { cx: point[0], cy: point[1], r: 2 },
              style: { fill: color },
            };
          };
          series.push({
            type: "custom",
            xAxisIndex: 1,
            yAxisIndex: 1,
            renderItem: marker,
            data: isolated,
            silent: true,
            clip: false,
          });
        }
      }
    }
    for (const driver of [
      ...water,
      ...view.drivers.filter((d) => d.id === data.kc?.id),
    ]) {
      const isKc = driver.id === data.kc?.id,
        isRain = driver.id === data.rainfall?.id;
      const gridIndex = isKc ? 3 : 2,
        color = theme.colors[isKc ? 3 : isRain ? 0 : 1];
      const render: CustomSeriesRenderItem = (_p, api) => {
        const a = api.coord([api.value(0), api.value(2)]),
          b = api.coord([api.value(1), api.value(2)]),
          zero = api.coord([api.value(0), 0]);
        if (isRain)
          return {
            type: "rect",
            shape: {
              x: a[0] + 0.5,
              y: Math.min(a[1], zero[1]),
              width: Math.max(1, b[0] - a[0] - 1),
              height: Math.max(1, Math.abs(zero[1] - a[1])),
            },
            style: { fill: color, opacity: 0.8 },
          };
        return {
          type: "line",
          shape: { x1: a[0], x2: b[0], y1: a[1], y2: b[1] },
          style: { stroke: color, lineWidth: 2, lineDash: isKc ? [] : [5, 3] },
        };
      };
      series.push({
        id: `driver-${driver.id}`,
        type: "custom",
        xAxisIndex: gridIndex,
        yAxisIndex: gridIndex,
        renderItem: render,
        encode: { x: [0, 1], y: 2 },
        data: driver.records
          .filter(
            (r) =>
              r.value !== null &&
              Number.isFinite(r.value) &&
              r.quality !== "bad",
          )
          .map((r) => [
            Math.max(r.from, view.window.from),
            Math.min(r.to, view.window.to),
            r.value,
          ]),
        silent: true,
        clip: true,
      });
    }
    const eventRenderer: CustomSeriesRenderItem = (_p, api) => {
      const a = api.coord([api.value(0), api.value(2)]),
        b = api.coord([api.value(1), api.value(2)]),
        instant = Number(api.value(3));
      const color = theme.colors[Number(api.value(4))];
      const halfHeight = Math.min(
        5 * factor,
        (plots[4].height / Math.max(1, lanes.length)) * 0.35,
      );
      if (instant)
        return {
          type: "polygon",
          shape: {
            points: [
              [a[0], a[1] - halfHeight],
              [a[0] + halfHeight, a[1]],
              [a[0], a[1] + halfHeight],
              [a[0] - halfHeight, a[1]],
            ],
          },
          style: { fill: color },
        };
      return {
        type: "rect",
        shape: {
          x: a[0],
          y: a[1] - halfHeight,
          width: Math.max(2, b[0] - a[0]),
          height: halfHeight * 2,
          r: Math.min(2, halfHeight),
        },
        style: {
          fill: color,
          opacity: 0.8,
          stroke: color,
          lineWidth: 1,
          lineDash: api.value(5) ? [3, 2] : [],
        },
      };
    };
    series.push({
      id: "soil-events",
      type: "custom",
      xAxisIndex: 4,
      yAxisIndex: 4,
      renderItem: eventRenderer,
      encode: { x: [0, 1], y: 2 },
      clip: true,
      data: lanes.flatMap((lane, i) =>
        lane.events.map((e) => ({
          value: [
            Math.max(e.from, view.window.from),
            Math.min(
              e.to ?? (e.timing === "instant" ? e.from : view.window.to),
              view.window.to,
            ),
            i,
            e.timing === "instant" ? 1 : 0,
            eventIndex[e.kind],
            e.timing === "interval" && !e.to ? 1 : 0,
          ],
          eventId: e.id,
        })),
      ),
    });
    const highlighted = view.events.find((e) => e.id === highlightedEventId);
    if (highlighted)
      for (let i = 0; i < plots.length; i++) {
        const render: CustomSeriesRenderItem = (_p, api) => {
          const a = api.coord([api.value(0), 0]),
            b = api.coord([api.value(1), 0]);
          const shape = {
            x: a[0],
            y: plots[i].top,
            width: Math.max(1, b[0] - a[0]),
            height: plots[i].height,
          };
          return {
            type: "group",
            children: [
              {
                type: "rect",
                shape,
                style: {
                  fill: theme.colors[eventIndex[highlighted.kind]],
                  opacity: 0.05,
                },
              },
              {
                type: "rect",
                shape,
                style: {
                  fill: "transparent",
                  stroke: theme.colors[eventIndex[highlighted.kind]],
                  lineWidth: 1,
                  lineDash: [3, 3],
                },
              },
            ],
          };
        };
        series.push({
          id: `event-focus-${i}`,
          type: "custom",
          xAxisIndex: i,
          yAxisIndex: i,
          renderItem: render,
          data: [
            [
              Math.max(view.window.from, highlighted.from),
              Math.min(
                view.window.to,
                highlighted.to ??
                  (highlighted.timing === "instant"
                    ? highlighted.from
                    : view.window.to),
              ),
            ],
          ],
          silent: true,
          clip: true,
          z: 8,
        });
      }
    const option: EChartsOption = {
      animation: false,
      useUTC: true,
      backgroundColor: "transparent",
      textStyle: { fontFamily: theme.font },
      grid: plots.map((p, i) => ({
        left,
        right,
        top: p.top,
        height: p.height,
        show: i === 0,
        borderColor: theme.muted,
        borderWidth: 1,
        backgroundColor: "transparent",
      })),
      xAxis,
      yAxis,
      series,
      tooltip: { show: false, trigger: "axis" },
      axisPointer: { link: [{ xAxisIndex: "all" }], triggerOn: "none" },
    };
    chart.setOption(option, { notMerge: true });
    chart.resize();
    const frame = requestAnimationFrame(() => {
      element.dataset.renderMs = (performance.now() - started).toFixed(1);
      onRendered?.(performance.now() - started);
    });
    let previous = NaN;
    const point = (
      event: { offsetX: number; offsetY: number },
      pinned: boolean,
      eventId?: string,
    ) => {
      if (event.offsetX < left || event.offsetX > chart.getWidth() - right)
        return;
      const rawAt = Number(
        chart.convertFromPixel({ xAxisIndex: 0 }, event.offsetX),
      );
      const at = Math.max(
        view.window.from,
        Math.min(
          view.window.to - 1,
          data.window.from +
            Math.floor((rawAt - data.window.from) / view.resolution) *
              view.resolution,
        ),
      );
      if (!Number.isFinite(at) || (!pinned && at === previous)) return;
      if (cursorCallback.current({ at, pinned, eventId })) {
        previous = at;
        pointerAt.current = at;
      }
    };
    const move = (event: { offsetX: number; offsetY: number }) =>
      point(event, false);
    let eventHit = false;
    const click = (event: { offsetX: number; offsetY: number }) => {
      queueMicrotask(() => {
        if (!eventHit && !chart.isDisposed()) point(event, true);
        eventHit = false;
      });
    };
    const eventClick = (params: unknown) => {
      const p = params as {
        data?: { eventId?: string };
        event?: { offsetX: number; offsetY: number };
      };
      if (p.data?.eventId && p.event) {
        eventHit = true;
        point(p.event, true, p.data.eventId);
      }
    };
    chart.getZr().on("mousemove", move);
    chart.getZr().on("click", click);
    chart.on("click", eventClick);
    return () => {
      cancelAnimationFrame(frame);
      if (!chart.isDisposed()) {
        chart.getZr().off("mousemove", move);
        chart.getZr().off("click", click);
        chart.off("click", eventClick);
      }
    };
  }, [
    data,
    view,
    depthIds,
    highlightedEventId,
    themeVersion,
    dimensions.width,
    dimensions.height,
    dimensions.font,
    onRendered,
  ]);

  return (
    <div
      ref={host}
      className="soil-water-plots"
      role="group"
      aria-label="土壤水分、气象与事件联动图；左右方向键逐时段查看，Enter 固定读数；原始数据页可核查所有记录"
      tabIndex={0}
      data-cells={view.cellCount}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !cursorPinned) return;
        if (
          ![
            "ArrowLeft",
            "ArrowRight",
            "Home",
            "End",
            "Enter",
            " ",
            "Escape",
          ].includes(event.key)
        )
          return;
        event.preventDefault();
        const at =
          event.key === "Home"
            ? view.window.from
            : event.key === "End"
              ? view.window.to - view.resolution
              : event.key === "ArrowLeft"
                ? Math.max(
                    view.window.from,
                    pointerAt.current - view.resolution,
                  )
                : event.key === "ArrowRight"
                  ? Math.min(
                      view.window.to - 1,
                      pointerAt.current + view.resolution,
                    )
                  : pointerAt.current;
        pointerAt.current = at;
        cursorCallback.current({
          at,
          pinned: event.key !== "Escape",
          source: "keyboard",
        });
      }}
    >
      <div ref={surface} className="soil-water-canvas" aria-hidden="true" />
      {trackLabels.map((track, i) => (
        <div
          key={track.key}
          className="soil-water-track-label"
          data-track={track.key}
          style={{
            top: plots[i].top,
            height: plots[i].height,
            width: 40 * factor,
          }}
          aria-hidden="true"
        >
          <span>{track.label}</span>
          <small>{track.unit}</small>
        </div>
      ))}
      <span
        className="soil-water-crosshair"
        aria-hidden="true"
        style={{
          top: plots[0].top,
          height: plots[4].top + plots[4].height - plots[0].top,
          left:
            left +
            (dimensions.width - left - right) *
              Math.max(
                0,
                Math.min(
                  1,
                  ((Number.isFinite(cursorAt) ? cursorAt : view.window.from) -
                    view.window.from) /
                    (view.window.to - view.window.from),
                ),
              ),
        }}
      />
    </div>
  );
});

export const SoilWaterNavigator = memo(function SoilWaterNavigator({
  data,
  window,
  onWindow,
}: {
  data: PreparedSoil;
  window: SoilWindow;
  onWindow: (window: SoilWindow) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    instance = useRef<echarts.ECharts | null>(null),
    callback = useRef(onWindow);
  callback.current = onWindow;
  const version = useChartTheme(host);
  useEffect(() => {
    if (!host.current) return;
    const chart = echarts.init(host.current, undefined, { renderer: "canvas" });
    instance.current = chart;
    const resize = new ResizeObserver(() => {
      if (!chart.isDisposed()) chart.resize();
    });
    resize.observe(host.current);
    chart.on("datazoom", () => {
      const option = chart.getOption() as {
        dataZoom: { start: number; end: number }[];
      };
      const { start, end } = option.dataZoom[0],
        span = data.window.to - data.window.from;
      callback.current({
        from:
          data.window.from +
          Math.round((span * start) / 100 / data.cadenceMs) * data.cadenceMs,
        to:
          data.window.from +
          Math.round((span * end) / 100 / data.cadenceMs) * data.cadenceMs,
      });
    });
    return () => {
      resize.disconnect();
      chart.dispose();
      instance.current = null;
    };
  }, [data]);
  useEffect(() => {
    const chart = instance.current;
    if (!chart || !host.current) return;
    const theme = themeOf(host.current),
      span = data.window.to - data.window.from;
    const bins = binSoilRecords(
      data.depths[0]?.records ?? [],
      data.window,
      Math.max(SOIL_DAY, data.cadenceMs),
      data.cadenceMs,
      data.window.from,
    );
    chart.setOption(
      {
        animation: false,
        useUTC: true,
        grid: { left: 8, right: 8, top: 0, bottom: 0 },
        xAxis: {
          type: "time",
          min: data.window.from,
          max: data.window.to,
          show: false,
        },
        yAxis: {
          type: "value",
          show: false,
          min: data.scale.min,
          max: data.scale.max,
        },
        series: [
          {
            type: "line",
            data: bins.map((b) => [
              (b.from + b.to) / 2,
              b.covered === b.expected ? b.mean : null,
            ]),
            showSymbol: false,
            lineStyle: { opacity: 0 },
            silent: true,
          },
        ],
        dataZoom: [
          {
            type: "slider",
            xAxisIndex: 0,
            start: ((window.from - data.window.from) / span) * 100,
            end: ((window.to - data.window.from) / span) * 100,
            minValueSpan: data.cadenceMs,
            realtime: false,
            brushSelect: true,
            top: 8,
            bottom: 4,
            left: 8,
            right: 8,
            showDetail: false,
            borderColor: theme.line,
            fillerColor:
              echarts.color.modifyAlpha(theme.colors[0], 0.12) ||
              "rgba(119,181,248,.12)",
            handleSize: "115%",
            handleStyle: { color: theme.colors[0], borderWidth: 0 },
            moveHandleSize: 6,
            moveHandleStyle: { color: theme.muted },
            dataBackground: {
              lineStyle: { color: theme.muted, opacity: 0.6 },
              areaStyle: { color: theme.muted, opacity: 0.1 },
            },
            selectedDataBackground: {
              lineStyle: { color: theme.colors[0] },
              areaStyle: { color: theme.colors[0], opacity: 0.15 },
            },
          },
        ],
      },
      { notMerge: true, silent: true },
    );
  }, [data, window, version]);
  return <div className="soil-water-navigator" ref={host} aria-hidden="true" />;
});
