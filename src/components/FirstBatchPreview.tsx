import { SlidersHorizontal, Radio } from "lucide-react";
import { Panel } from "@/components/iot/internal/panel";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LightControl, type LightTarget } from "@/components/iot/light-control";
import {
  ThermostatControl,
  type ThermostatTarget,
} from "@/components/iot/thermostat-control";
import {
  ActuatorControl,
  type ActuatorDirection,
} from "@/components/iot/actuator-control";
import { SetpointControl } from "@/components/iot/setpoint-control";
import { ControlAuthority } from "@/components/iot/control-authority";
import {
  InterlockStatus,
  type InterlockCondition,
} from "@/components/iot/interlock-status";
import { CommandStatus, commandLabels } from "@/components/iot/command-status";
import { AlertCard } from "@/components/iot/alert-card";
import {
  IrrigationRun,
  type IrrigationPhase,
} from "@/components/iot/irrigation-run";
import type {
  CommandContext,
  CommandReceipt,
  LifecyclePhase,
} from "@/lib/iot-model";

const clock = Date.UTC(2026, 10, 4, 6, 32, 0);
const names: Record<string, string> = {
  normal: "正常",
  offline: "离线",
  readonly: "只读",
  failed: "请求失败",
  accepted: "已接收未生效",
  timeout: "回执超时",
  stale: "陈旧",
  partial: "群组部分失败",
  binary: "仅开关能力",
  color: "彩色灯",
  heat: "仅支持制热",
  moving: "正在开启",
  limit: "端限位",
  uncalibrated: "未校准",
  stalled: "卡滞",
  unknown: "未知",
  local: "本地接管",
  expired: "覆盖到期",
  blocked: "联锁阻止",
  empty: "空条件",
  recovered: "已恢复未确认",
  acknowledged: "活动已确认",
  resolved: "已恢复已确认",
  shelved: "已搁置",
  queued: "排队",
  running: "执行中",
  verified: "回读已验证",
  rejected: "被拒绝",
  cancelled: "已取消",
  paused: "已暂停",
  completed: "已完成",
  stopped: "已停止",
};
const common = [
  "normal",
  "offline",
  "readonly",
  "failed",
  "accepted",
  "timeout",
];
const scenarios: Record<string, string[]> = {
  "light-control": [...common, "partial", "binary", "color"],
  "thermostat-control": [...common, "heat", "unknown"],
  "actuator-control": [
    ...common,
    "moving",
    "limit",
    "uncalibrated",
    "stalled",
    "unknown",
  ],
  "setpoint-control": common,
  "control-authority": [
    "normal",
    "local",
    "readonly",
    "expired",
    "unknown",
    "failed",
    "accepted",
  ],
  "interlock-status": ["normal", "blocked", "unknown", "stale", "empty"],
  "command-status": [
    "queued",
    "running",
    "accepted",
    "verified",
    "rejected",
    "failed",
    "timeout",
    "cancelled",
  ],
  "alert-card": [
    "normal",
    "acknowledged",
    "recovered",
    "resolved",
    "unknown",
    "shelved",
    "failed",
    "readonly",
  ],
  "irrigation-run": [
    ...common,
    "queued",
    "paused",
    "completed",
    "stopped",
    "missing",
    "stale",
    "unknown",
  ],
};
function ScenarioPreview({
  name,
  scenario,
}: {
  name: string;
  scenario: string;
}) {
  const [setpoint, setSetpoint] = useState(26);
  const [light, setLight] = useState({
    power: true,
    brightness: 72,
    temperature: 4000,
    color: "#efc98e",
  });
  const [thermostat, setThermostat] = useState<
    Omit<ThermostatTarget, "holdMinutes">
  >({
    mode: scenario === "heat" ? "heat" : "auto",
    setpoint: 24,
    heat: 22,
    cool: 26,
  });
  const [hold, setHold] = useState<number | null>(null);
  const [direction, setDirection] = useState<ActuatorDirection | null>(
    scenario === "moving" ? "open" : scenario === "unknown" ? null : "stop",
  );
  const [position, setPosition] = useState<number | null>(
    scenario === "unknown" ? null : scenario === "limit" ? 100 : 35,
  );
  const [owner, setOwner] = useState("气候策略");
  const [ack, setAck] = useState(
    scenario === "acknowledged" || scenario === "resolved",
  );
  const [active, setActive] = useState(
    scenario !== "recovered" && scenario !== "resolved",
  );
  const [runPhase, setRunPhase] = useState<IrrigationPhase>(
    ["queued", "paused", "completed", "stopped", "unknown"].includes(scenario)
      ? (scenario as IrrigationPhase)
      : "running",
  );
  const [lifecycle, setLifecycle] = useState<LifecyclePhase>(
    scenario as LifecyclePhase,
  );
  const [groupPartial, setGroupPartial] = useState(false);
  const offline = scenario === "offline",
    readonly = scenario === "readonly";
  async function request(
    commit: () => void,
    context?: CommandContext,
  ): Promise<CommandReceipt> {
    await new Promise((resolve) => setTimeout(resolve, 650));
    if (context?.signal.aborted) throw new Error("请求已中止");
    if (scenario === "failed")
      throw new Error("演示：控制服务拒绝连接，设备状态未改变。草稿已保留。");
    if (scenario === "accepted")
      return { phase: "accepted", message: "请求已排队；设备尚未回读新值。" };
    if (scenario === "timeout")
      return {
        phase: "timeout",
        message: "演示：回执超时，执行结果未知。请先查询设备状态。",
      };
    commit();
    return { phase: "verified", message: "演示回读与本次请求一致。" };
  }
  let content;
  switch (name) {
    case "light-control":
      content = (
        <LightControl
          label="育苗区 · 补光灯组"
          reported={light}
          online={!offline}
          disabledReason={readonly ? "本地配电柜接管，远程只读" : undefined}
          capabilities={
            scenario === "binary"
              ? {}
              : {
                  brightness: true,
                  temperature:
                    scenario === "color"
                      ? undefined
                      : { min: 2700, max: 6500, step: 100 },
                  color: scenario === "color",
                  scenes: [
                    { id: "morning", label: "晨间补光" },
                    { id: "inspect", label: "巡检照明" },
                  ],
                }
          }
          members={[
            {
              id: "l1",
              label: "灯组 01",
              state: offline ? "offline" : "confirmed",
            },
            {
              id: "l2",
              label: "灯组 02",
              state: offline
                ? "offline"
                : groupPartial
                  ? "failed"
                  : "confirmed",
            },
          ]}
          onApply={async (target: LightTarget, context) => {
            const result = await request(() => {
              setLight((previous) => ({
                ...previous,
                ...target,
                ...(target.sceneId
                  ? {
                      brightness: target.sceneId === "morning" ? 85 : 100,
                      power: true,
                    }
                  : {}),
              }));
              setGroupPartial(scenario === "partial");
            }, context);
            return scenario === "partial"
              ? {
                  phase: "failed",
                  message:
                    "1 / 2 个灯组已生效；灯组 02 无响应，请查看逐项结果。",
                }
              : result;
          }}
        />
      );
      break;
    case "thermostat-control":
      content = (
        <ThermostatControl
          label="育苗区 · 恒温控制"
          measured={scenario === "unknown" ? null : 24.6}
          reported={thermostat}
          supportedModes={
            scenario === "heat"
              ? ["off", "heat"]
              : ["off", "heat", "cool", "auto"]
          }
          operatingState={scenario === "unknown" ? "unknown" : "idle"}
          online={!offline}
          disabledReason={readonly ? "区域策略占用，只读" : undefined}
          holdUntil={hold}
          onApply={(target, context) =>
            request(() => {
              const { holdMinutes, ...next } = target;
              setThermostat(next);
              setHold(
                holdMinutes === null ? null : clock + holdMinutes * 60000,
              );
            }, context)
          }
        />
      );
      break;
    case "actuator-control":
      content = (
        <ActuatorControl
          label="北侧通风窗"
          direction={direction}
          position={position}
          target={60}
          online={!offline}
          locked={readonly}
          lockReason="雨保护联锁生效，禁止远程操作"
          calibrated={scenario !== "uncalibrated"}
          fault={
            scenario === "stalled"
              ? "电机电流异常，疑似卡滞；请停止并检查。"
              : undefined
          }
          feedbackAt={clock - 12000}
          limits={{
            open: scenario === "limit",
            closed: scenario === "unknown" ? null : false,
          }}
          onCommand={(next, context) =>
            request(() => {
              setDirection(next);
              if (next === "open") setPosition(38);
              if (next === "close") setPosition(32);
            }, context)
          }
        />
      );
      break;
    case "setpoint-control":
      content = (
        <Panel icon={<SlidersHorizontal />} title="设定值控制">
          <SetpointControl
            label="目标温度"
            value={setpoint}
            min={10}
            max={40}
            step={0.5}
            unit="°C"
            disabled={offline || readonly}
            disabledReason={offline ? "设备离线，控制不可用" : "本地控制权占用"}
            onApply={(value, context) =>
              request(() => setSetpoint(value), context)
            }
          />
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={() => setSetpoint((value) => (value === 28 ? 27 : 28))}
            >
              模拟外部更新
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              先修改草稿，再触发外部更新，可检查冲突处理。
            </p>
          </div>
        </Panel>
      );
      break;
    case "control-authority":
      content = (
        <ControlAuthority
          location={
            scenario === "local"
              ? "local"
              : scenario === "unknown"
                ? "unknown"
                : "remote"
          }
          operatingMode={owner === "张工" ? "manual" : "strategy"}
          owner={scenario === "unknown" ? null : owner}
          source="PLC-01 · 控制权服务"
          overrideExpiresAt={
            scenario === "expired"
              ? clock - 60000
              : owner === "张工"
                ? clock + 1800000
                : undefined
          }
          now={clock}
          canRequest={!readonly && owner !== "张工"}
          canRelease={!readonly && owner === "张工"}
          reason={readonly ? "当前账号只有查看权限" : undefined}
          onChange={(action, context) =>
            request(
              () => setOwner(action === "request" ? "张工" : "气候策略"),
              context,
            )
          }
        />
      );
      break;
    case "interlock-status": {
      const conditions: InterlockCondition[] = [
        {
          id: "mode",
          label: "远程控制许可",
          state: "satisfied",
          source: "PLC-01 / DI-01",
          at: clock - 1000,
          detail: "现场选择开关处于远程位置。",
        },
        {
          id: "rain",
          label: "雨保护",
          state:
            scenario === "blocked"
              ? "blocked"
              : scenario === "unknown"
                ? "unknown"
                : "satisfied",
          source: "气象站 WS-01",
          at: scenario === "unknown" ? null : clock - 4000,
          detail:
            scenario === "blocked" ? "检测到降雨，禁止开窗。" : "未报告降雨。",
        },
        {
          id: "wind",
          label: "风速限制",
          state: scenario === "stale" ? "stale" : "satisfied",
          source: "风速计 W-01",
          at: clock - (scenario === "stale" ? 600000 : 8000),
          detail: "控制服务负责阈值与数据年龄判定。",
        },
      ];
      content = (
        <InterlockStatus
          decision={
            scenario === "normal"
              ? "permitted"
              : scenario === "blocked"
                ? "blocked"
                : "unknown"
          }
          reason={
            scenario === "normal"
              ? "上游报告所有开窗许可均满足。"
              : scenario === "blocked"
                ? "雨保护触发，开窗请求将被阻止。"
                : "条件证据不足，等待控制服务更新。"
          }
          conditions={scenario === "empty" ? [] : conditions}
          evaluatedAt={clock}
        />
      );
      break;
    }
    case "command-status":
      content = (
        <Panel icon={<Radio />} title="指令反馈">
          <CommandStatus
            record={{
              id: "cmd-20261104-0042",
              phase: lifecycle,
              requested: "通风窗目标 60%",
              events: [
                { phase: "queued", at: clock - 15000 },
                ...(lifecycle === "queued"
                  ? []
                  : [
                      { phase: "sending" as const, at: clock - 13000 },
                      { phase: lifecycle, at: clock - 12000 },
                    ]),
              ],
              message:
                lifecycle === "timeout"
                  ? "执行结果未知，请查询设备回读。不要直接重复执行。"
                  : undefined,
            }}
            reported={
              lifecycle === "verified" ? "60% · 已停止" : "35% · 已停止"
            }
            onCancel={async () => {
              await new Promise((resolve) => setTimeout(resolve, 650));
              setLifecycle("cancelled");
            }}
            onRetry={async () => {
              await new Promise((resolve) => setTimeout(resolve, 650));
              setLifecycle("queued");
            }}
          />
        </Panel>
      );
      break;
    case "alert-card":
      content = (
        <>
          <AlertCard
            alert={{
              id: "ALM-GH-042",
              title: "北侧温室温度超限",
              deviceName: "GH-01 · ENV-T01",
              severity: "warning",
              time: "14:02",
              description:
                "温度超过已配置的上限并持续满足触发条件。确认只记录人工知晓。",
              acknowledged: ack,
              active: scenario === "unknown" ? undefined : active,
              occurredAt: clock - 1800000,
              clearedAt: active ? null : clock - 60000,
              acknowledgedAt: ack ? clock : null,
              acknowledgedBy: ack ? "张工" : undefined,
              source: "气候规则 / TEMP-HIGH",
              updatedAt: clock,
              shelvedUntil: scenario === "shelved" ? clock + 3600000 : null,
              shelvedBy: "李工",
            }}
            disabledReason={readonly ? "只有查看告警权限" : undefined}
            onAcknowledge={async () => {
              await request(() => setAck(true));
            }}
          />
          <Button variant="secondary" onClick={() => setActive((v) => !v)}>
            {active ? "模拟条件恢复" : "模拟条件再触发"}
          </Button>
        </>
      );
      break;
    case "irrigation-run":
      content = (
        <IrrigationRun
          program="晨间灌溉 · 配方 A"
          zone="一号温室 / 育苗区"
          runId="RUN-042"
          phase={runPhase}
          plannedVolume={scenario === "missing" ? null : 12}
          deliveredVolume={8.2}
          flow={scenario === "unknown" ? null : 6.4}
          remainingSeconds={2140}
          fresh={scenario !== "stale"}
          online={!offline}
          reason={
            runPhase === "queued"
              ? "等待泵站获得运行许可"
              : readonly
                ? "当前账号只有查看权限"
                : "下一分区等待当前阀组结束"
          }
          stages={[
            { id: "fill", label: "管路充水", state: "done" },
            {
              id: "water",
              label: "定量灌溉",
              state: runPhase === "completed" ? "done" : "active",
            },
            {
              id: "flush",
              label: "清水冲洗",
              state: runPhase === "completed" ? "done" : "pending",
            },
          ]}
          nextZone="育苗区 B"
          supportedActions={readonly ? [] : ["pause", "resume", "stop"]}
          onAction={(action, context) =>
            request(
              () =>
                setRunPhase(
                  action === "pause"
                    ? "paused"
                    : action === "resume"
                      ? "running"
                      : "stopped",
                ),
              context,
            )
          }
        />
      );
      break;
  }
  return content;
}
export function FirstBatchPreview({ name }: { name: string }) {
  const [scenario, setScenario] = useState(scenarios[name]?.[0] ?? "normal");
  const [revision, setRevision] = useState(0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">演示场景</span>
          <Select value={scenario} onValueChange={setScenario}>
            <SelectTrigger aria-label="演示场景" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scenarios[name].map((value) => (
                <SelectItem key={value} value={value}>
                  {names[value] || commandLabels[value as LifecyclePhase]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" onClick={() => setRevision((v) => v + 1)}>
          重置示例
        </Button>
      </div>
      <div className="mx-auto w-full max-w-2xl">
        <ScenarioPreview
          key={name + scenario + revision}
          name={name}
          scenario={scenario}
        />
      </div>
    </div>
  );
}
