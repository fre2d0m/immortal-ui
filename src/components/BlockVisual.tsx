import { PanelHeader } from "@/components/iot/internal/panel-header";
import type { ReactNode } from "react";
import {
  Activity,
  ChartLine,
  CircleAlert,
  Cpu,
  Droplets,
  FolderTree,
  Layers,
  SlidersHorizontal,
  Snowflake,
  Sprout,
  Zap,
  Workflow,
} from "lucide-react";
import type { CatalogItem } from "@/content/catalog";
import { catalogEnergy } from "@/lib/chart-demo-data";
import { workflowKinds } from "@/components/blocks/workflow-model";
import { createWorkflowDemo } from "@/lib/workflow-demo-data";
import { SoilWaterMiniature } from "./SoilWaterMiniature";

function Readouts({
  values,
}: {
  values: Array<[label: string, value: string]>;
}) {
  return (
    <div className="scenario-stats">
      {values.map(([label, value]) => (
        <div className="surface-inset" key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}

function Rows({ items }: { items: Array<[label: string, value: ReactNode]> }) {
  return (
    <ul className="scenario-rows surface-inset">
      {items.map(([label, value]) => (
        <li key={label}>
          <span>{label}</span>
          <span>{value}</span>
        </li>
      ))}
    </ul>
  );
}

export function BlockVisual({
  item,
  trend,
  bars,
}: {
  item: CatalogItem;
  trend: ReactNode;
  bars: ReactNode;
}) {
  let Icon = Activity;
  let context = item.caption;
  let body: ReactNode;
  switch (item.name) {
    case "soil-water-explorer":
      context = "跨年缺测核查 · 演示数据";
      Icon = Layers;
      body = (
        <>
          <SoilWaterMiniature />
          <p className="text-sm text-muted-foreground">
            多深度 · 气象量 · 现场事件
          </p>
        </>
      );
      break;
    case "data-workflow": {
      Icon = Workflow;
      context = "Events · Sources · Parallelism · Delivery";
      const flow = createWorkflowDemo();
      body = (
        <div className="space-y-3">
          <svg
            viewBox="-40 -40 1400 1040"
            className="w-full"
            aria-hidden="true"
          >
            {flow.edges.map((edge) => {
              const source = flow.nodes.find(
                (node) => node.id === edge.source,
              )!;
              const target = flow.nodes.find(
                (node) => node.id === edge.target,
              )!;
              const down = source.position.x === target.position.x;
              const reverse = source.position.x > target.position.x;
              const sx = source.position.x + (down ? 116 : reverse ? 0 : 232),
                sy = source.position.y + (down ? 168 : 84),
                tx = target.position.x + (down ? 116 : reverse ? 232 : 0),
                ty = target.position.y + (down ? 0 : 84);
              return (
                <path
                  key={edge.id}
                  d={
                    down
                      ? `M${sx} ${sy} L${tx} ${ty}`
                      : `M${sx} ${sy} L${(sx + tx) / 2} ${sy} L${(sx + tx) / 2} ${ty} L${tx} ${ty}`
                  }
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={edge.port === "error" ? "15 12" : undefined}
                  opacity=".7"
                />
              );
            })}
            {flow.nodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.position.x} ${node.position.y})`}
              >
                <rect
                  width="232"
                  height="168"
                  rx="18"
                  fill="var(--card)"
                  stroke="currentColor"
                  strokeWidth="5"
                />
                <text
                  x="116"
                  y="92"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="20"
                >
                  {workflowKinds[node.kind].label}
                </text>
              </g>
            ))}
          </svg>
          <p className="text-sm text-muted-foreground">
            Static illustration · Parallel sources and conditional delivery
          </p>
        </div>
      );
      break;
    }
    case "fleet-overview":
      context = "青禾试验站";
      Icon = Cpu;
      body = (
        <>
          <div className="scenario-chips">
            <span className="surface-control">全部 10</span>
            <span>在线 6</span>
            <span>离线 2</span>
          </div>
          <Rows
            items={[
              ["北区二号剖面仪", <span className="text-success">在线</span>],
              ["南区一号剖面仪", "离线"],
            ]}
          />
        </>
      );
      break;
    case "device-detail":
      context = "SOIL-N02";
      Icon = Cpu;
      body = (
        <>
          <div className="flex items-center gap-4 py-3">
            <img
              src="./examples/weather-station.png"
              alt=""
              className="h-20 w-12 object-contain"
            />
            <div className="space-y-2">
              <p className="font-semibold">北区田间气象站</p>
              <p className="text-xs text-muted-foreground">气象监测 · 户外</p>
              <p className="text-xs text-muted-foreground">
                WS-2025-N01 · FX-003
              </p>
              <p className="text-xs text-success">在线 · 96% · −68 dBm</p>
            </div>
          </div>
          <Readouts
            values={[
              ["空气温度", "24.6 °C"],
              ["相对湿度", "62%"],
            ]}
          />
        </>
      );
      break;
    case "telemetry-explorer":
      context = "空气温度 · 历史概览";
      Icon = ChartLine;
      body = (
        <>
          <p className="text-sm text-muted-foreground">
            12 分钟 · 逐点查询请进入预览
          </p>
          <div className="surface-inset scenario-mini-chart">{trend}</div>
        </>
      );
      break;
    case "device-groups":
      context = "试验站群组";
      Icon = FolderTree;
      body = (
        <div className="scenario-split">
          <ul className="surface-inset scenario-tree">
            <li>青禾试验站</li>
            <li className="pl-2">北区</li>
            <li className="surface-control ml-2 rounded-md! px-2 py-1">
              02 样地
            </li>
          </ul>
          <Rows
            items={[
              ["直接绑定", "2 台"],
              ["剖面仪", ""],
              ["灌溉阀", ""],
            ]}
          />
        </div>
      );
      break;
    case "soil-profile":
      context = "北区 02 样地";
      Icon = Layers;
      body = (
        <div className="scenario-split">
          <div className="scenario-mini-profile surface-inset">
            <span>静态示意 · 地表</span>
            <div className="scenario-mini-scale">
              <i style={{ top: "16.7%" }} />
              <i
                className="scenario-mini-active-probe"
                style={{ top: "50%" }}
              />
              <i style={{ top: "100%" }} />
            </div>
          </div>
          <div className="surface-inset scenario-mini-reading">
            <span>30 cm 探针</span>
            <b>
              24.7<small>%</small>
            </b>
            <span>体积含水率</span>
          </div>
        </div>
      );
      break;
    case "alert-console":
      context = "告警队列";
      Icon = CircleAlert;
      body = (
        <>
          <div className="scenario-chips">
            <span className="surface-control">待确认</span>
            <span>已确认</span>
            <span>已清除</span>
          </div>
          <Rows
            items={[
              [
                "土壤探针停止上报",
                <span className="text-destructive">严重</span>,
              ],
              ["探针读数无效", <span className="text-warning">预警</span>],
            ]}
          />
        </>
      );
      break;
    case "device-control":
      context = "SOIL-N02";
      Icon = SlidersHorizontal;
      body = (
        <Rows
          items={[
            ["采样间隔", "10 分钟"],
            ["自动重连", "启用"],
            ["工作范围", "18–30 °C"],
          ]}
        />
      );
      break;
    case "greenhouse-control":
      context = "一号温室";
      Icon = Sprout;
      body = (
        <>
          <Readouts
            values={[
              ["空气温度", "24.6 °C"],
              ["空气湿度", "68%"],
            ]}
          />
          <Rows
            items={[
              ["侧窗", "已开启"],
              ["循环水泵", "待机"],
            ]}
          />
        </>
      );
      break;
    case "irrigation-scheduling":
      context = "灌溉排程";
      Icon = Droplets;
      body = (
        <Rows
          items={[
            ["一号样地", "06:30"],
            ["二号样地", "07:00"],
            ["计划用量", "6.4 m³"],
          ]}
        />
      );
      break;
    case "cold-chain-monitoring":
      context = "冷藏库区";
      Icon = Snowflake;
      body = (
        <>
          <Readouts
            values={[
              ["库温", "4.1 °C"],
              ["目标范围", "2–8 °C"],
            ]}
          />
          <div className="scenario-mini-chart surface-inset">{trend}</div>
          <p className="text-sm text-muted-foreground">静态示意 · 场景规划</p>
        </>
      );
      break;
    case "energy-management":
      context = "用电看板";
      Icon = Zap;
      body = (
        <>
          <Readouts
            values={[
              [
                `${catalogEnergy.length} 个时段总计`,
                `${catalogEnergy.reduce((sum, p) => sum + p.value, 0)} kWh`,
              ],
            ]}
          />
          <div className="scenario-mini-chart surface-inset">{bars}</div>
        </>
      );
      break;
  }
  return (
    <div
      className={
        "scenario-art" + (item.status === "planned" ? " is-planned" : "")
      }
      aria-hidden="true"
    >
      <div
        className={
          "scenario-window" +
          (item.name === "device-detail" ? "" : " surface-raised")
        }
      >
        {item.name !== "device-detail" && (
          <div className="scenario-window-head">
            <PanelHeader icon={<Icon />} title={context} />
          </div>
        )}
        <div className="scenario-window-body">{body}</div>
      </div>
    </div>
  );
}
