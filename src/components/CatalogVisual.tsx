import { PanelHeader } from "@/components/iot/internal/panel-header";
import {
  Activity,
  CheckCheck,
  Cpu,
  KeyRound,
  Lightbulb,
  MoveVertical,
  ShieldCheck,
  CircleAlert,
  Clock3,
  Droplets,
  Fan,
  Hand,
  Minus,
  Plus,
  Power,
  Radio,
  Sparkles,
  Sigma,
  Thermometer,
  Timer,
  Zap,
} from "lucide-react";
import { BlockVisual } from "@/components/BlockVisual";
import type { CatalogItem } from "@/content/catalog";
import { DeviceStatus, type DeviceState } from "@/components/iot/device-status";
import { SignalStrength } from "@/components/iot/signal-strength";

import { TelemetrySparkline } from "@/components/iot/internal/telemetry-sparkline";
import {
  normalCardDemo,
  comparableTemperatureDomain,
} from "@/lib/data-card-demo-data";
import {
  numericScale,
  linearPosition,
  formatTelemetryNumber,
} from "@/lib/telemetry";
import { catalogColdHistory, catalogEnergy } from "@/lib/chart-demo-data";

function CatalogTrend({ cold = false }: { cold?: boolean }) {
  return (
    <TelemetrySparkline
      compact
      label={cold ? "库温" : "空气温度"}
      unit="°C"
      history={{
        points: cold ? catalogColdHistory : normalCardDemo.observations,
        label: "演示数据 · 原始观测",
        maxGapMs: 90_000,
        domain: cold ? { min: 2, max: 8 } : comparableTemperatureDomain,
      }}
    />
  );
}
function Bars() {
  const scale = numericScale(
    catalogEnergy.map((p) => p.value),
    undefined,
    true,
  );
  return (
    <div className="space-y-2">
      <div
        className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 text-xs text-muted-foreground tabular-nums"
        role="img"
        aria-label={`演示用电量，八个三小时时段合计 ${catalogEnergy.reduce((sum, p) => sum + p.value, 0)} kWh，零基线`}
      >
        <div className="flex h-24 flex-col justify-between text-right">
          <span>{formatTelemetryNumber(scale.max, 0)}</span>
          <span>0</span>
        </div>
        <div>
          <div
            className="grid h-24 grid-cols-8 items-end gap-2 border-y border-border"
            aria-hidden="true"
          >
            {catalogEnergy.map((p) => (
              <span
                key={p.label}
                className="block rounded-t-sm bg-chart-1"
                style={{
                  height: `${linearPosition(p.value, scale.min, scale.max) * 100}%`,
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between">
            <span>00:00</span>
            <span>12:00</span>
            <span>24:00</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        静态示意 · 演示数据 · 每 3 小时用电量 · kWh
      </p>
    </div>
  );
}
export function CatalogVisual({ item }: { item: CatalogItem }) {
  const name = item.name;
  if (name === "device-profile") {
    return (
      <div className="w-full max-w-90 px-4 py-6" aria-hidden="true">
        <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-4">
          <img
            src="./examples/weather-station.png"
            alt=""
            className="h-28 w-16 object-contain"
          />
          <div className="min-w-0 space-y-2.5">
            <p className="text-base font-semibold">北区田间气象站</p>
            <p className="text-sm text-muted-foreground">气象监测 · 户外</p>
            <p className="text-sm font-mono text-muted-foreground">
              WS-2025-N01
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <DeviceStatus state="online" label="在线" />
              <span>96%</span>
              <SignalStrength rssi={-68} />
            </div>
          </div>
        </div>
      </div>
    );
  }
  const professional = {
    "light-control": {
      icon: Lightbulb,
      label: "育苗区灯组",
      value: "72",
      unit: "%",
      detail: "4000 K · 实际亮度",
      footer: "请求与逐项回读",
    },
    "thermostat-control": {
      icon: Thermometer,
      label: "区域温控",
      value: "24.6",
      unit: "°C",
      detail: "目标 22–26 °C",
      footer: "自动模式 · 当前待机",
    },
    "control-authority": {
      icon: KeyRound,
      label: "远程控制",
      value: "张工",
      unit: "",
      detail: "临时覆盖至 15:00",
      footer: "持有者 · 期限 · 释放",
    },
    "interlock-status": {
      icon: ShieldCheck,
      label: "许可与联锁",
      value: "2 / 3",
      unit: "",
      detail: "雨保护 · 未满足",
      footer: "条件来源与判定时间",
    },
    "irrigation-run": {
      icon: Droplets,
      label: "晨间灌溉",
      value: "8.2",
      unit: "m³",
      detail: "计划 12 m³ · 流量 6.4 m³/h",
      footer: "定量灌溉 · 运行中",
    },
  }[name];
  if (professional) {
    const Icon = professional.icon;
    return (
      <div className="catalog-specimen surface-raised" aria-hidden="true">
        <PanelHeader icon={<Icon />} title={professional.label} />
        <div className="surface-inset p-4 space-y-3">
          <p className="text-3xl tabular-nums">
            {professional.value}
            <span className="ml-2 text-sm text-muted-foreground">
              {professional.unit}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">{professional.detail}</p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {professional.footer}
        </p>
      </div>
    );
  }
  if (item.kind === "block") {
    return (
      <BlockVisual
        item={item}
        trend={<CatalogTrend cold={item.name === "cold-chain-monitoring"} />}
        bars={<Bars />}
      />
    );
  }
  let content;
  switch (name) {
    case "indicator-card":
      content = (
        <>
          <PanelHeader
            icon={<Sigma />}
            title="干旱风险"
            description="北区 02 样地 · 根区"
          />
          <div className="specimen-value small text-warning-text">中风险</div>
          <p className="text-sm text-muted-foreground">
            近 24 小时土壤观测的规则判定
          </p>
          <div className="specimen-foot">
            <span>计算于 07:29 UTC</span>
            <span>规则 v1.2</span>
          </div>
        </>
      );
      break;
    case "metric-card":
      content = (
        <>
          <PanelHeader
            icon={<Activity />}
            title="空气温度"
            description="北侧温室 · T-01"
          />
          <div className="specimen-value">
            {formatTelemetryNumber(normalCardDemo.latest!.value!, 1)}{" "}
            <small>°C</small>
          </div>
          <CatalogTrend />
        </>
      );
      break;
    case "device-card":
      content = (
        <>
          <PanelHeader
            icon={<Cpu />}
            title="北区土壤剖面仪"
            description="北区 / 02 样地"
            status={<DeviceStatus state="online" label="在线" />}
          />
          <div className="specimen-well">
            <span>MQTT</span>
            <SignalStrength rssi={-63} />
          </div>
          <div className="specimen-foot">
            <span>电量 82%</span>
            <span>最近活动 07:21 UTC</span>
          </div>
        </>
      );
      break;
    case "device-status":
      content = (
        <div className="specimen-status-list">
          {["online", "warning", "offline", "provisioning"].map((state, i) => (
            <div key={state}>
              <span>{["网关", "温度探头", "流量计", "新设备"][i]}</span>
              <DeviceStatus state={state as DeviceState} />
            </div>
          ))}
        </div>
      );
      break;
    case "signal-strength":
      content = (
        <>
          <PanelHeader icon={<Radio />} title="链路质量" />
          <div className="specimen-value">
            −63 <small>dBm</small>
          </div>
          <div className="specimen-signal-rows">
            <SignalStrength rssi={-48} />
            <SignalStrength rssi={-75} />
            <SignalStrength rssi={null} />
          </div>
        </>
      );
      break;
    case "control-mode":
      content = (
        <>
          <PanelHeader icon={<Fan />} title="控制模式" />
          <div className="specimen-segments">
            {[
              { Icon: Hand, label: "手动" },
              { Icon: Timer, label: "自动" },
              { Icon: Sparkles, label: "AI" },
            ].map(({ Icon, label }, i) => (
              <span key={label} className={i === 1 ? "selected" : ""}>
                <Icon />
                {label}
              </span>
            ))}
          </div>
          <div className="specimen-well">
            <Timer className="size-4" />
            <span>自动策略运行中</span>
          </div>
        </>
      );
      break;
    case "actuator-switch":
      content = (
        <>
          <PanelHeader icon={<Power />} title="循环泵 P-01" />
          <div className="specimen-switch-row">
            <div>
              <b>运行中</b>
              <p>设备已回读</p>
            </div>
            <span className="specimen-toggle">
              <i />
            </span>
          </div>
          <div className="specimen-foot">
            <span>手动模式</span>
            <CheckCheck className="size-4 text-success" />
          </div>
        </>
      );
      break;
    case "setpoint-control":
      content = (
        <>
          <PanelHeader icon={<Thermometer />} title="目标温度" />
          <div className="specimen-stepper">
            <span>
              <Minus />
            </span>
            <b>
              26.0<small>°C</small>
            </b>
            <span>
              <Plus />
            </span>
          </div>
          <div className="specimen-foot">
            <span>18–32 °C</span>
            <span>步进 0.5</span>
          </div>
          <div className="specimen-apply">应用设定</div>
        </>
      );
      break;
    case "threshold-control":
      content = (
        <>
          <PanelHeader icon={<Thermometer />} title="温度上下限" />
          <div className="specimen-range">
            <i />
            <b />
            <b />
          </div>
          <div className="specimen-limits">
            <span>
              <small>下限</small>18 °C
            </span>
            <span>
              <small>上限</small>30 °C
            </span>
          </div>
        </>
      );
      break;
    case "actuator-control":
      content = (
        <>
          <PanelHeader
            icon={<MoveVertical />}
            title="顶窗 M-01"
            status="已停止"
          />
          <p className="specimen-muted">实际开度 45%</p>
          <div className="specimen-segments direction">
            <span>开</span>
            <span className="selected">停</span>
            <span>关</span>
          </div>
          <p className="specimen-muted centered">先停止，再切换方向</p>
        </>
      );
      break;
    case "command-status":
      content = (
        <>
          <PanelHeader icon={<Clock3 />} title="指令反馈" status="等待回执" />
          <div className="specimen-command">
            <span>
              <small>请求值</small>
              <b>
                60<em>%</em>
              </b>
            </span>
            <span>
              <small>设备回读</small>
              <b>
                45<em>%</em>
              </b>
            </span>
          </div>
          <div className="specimen-progress">
            <i />
          </div>
        </>
      );
      break;
    case "alert-card":
      content = (
        <>
          <PanelHeader
            icon={<CircleAlert />}
            title="温度偏高"
            description="14:02 · 演示快照"
          />
          <p className="specimen-muted">一号温室 · 31.2 °C</p>
          <div className="specimen-well text-left">
            检查通风设备与目标温度。
          </div>
          <div className="specimen-foot">
            <span>待确认</span>
            <b>确认告警</b>
          </div>
        </>
      );
      break;
    case "event-timeline":
      content = (
        <>
          <PanelHeader icon={<Clock3 />} title="操作记录" />
          <div className="specimen-timeline">
            {["目标温度改为 26 °C", "顶窗切换至手动", "网关恢复连接"].map(
              (text, i) => (
                <div key={text}>
                  <i />
                  <span>
                    <b>{text}</b>
                    <small>
                      {["14:32 · 张工", "14:10 · 张工", "13:50 · 系统"][i]}
                    </small>
                  </span>
                </div>
              ),
            )}
          </div>
        </>
      );
      break;
    default:
      content = (
        <>
          <PanelHeader
            icon={<Sparkles />}
            title="AI 建议"
            description="14:02 · 演示快照"
          />
          <p className="specimen-note-title">将遮阳幕展开至 60%</p>
          <p className="specimen-muted">光照持续增强，预计温度上升。</p>
          <div className="specimen-note-actions">
            <span>忽略</span>
            <b>采纳建议</b>
          </div>
        </>
      );
  }
  return (
    <div
      className={`catalog-specimen specimen-${name} surface-raised`}
      aria-hidden="true"
    >
      {content}
    </div>
  );
}
