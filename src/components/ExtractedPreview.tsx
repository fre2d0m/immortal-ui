import { SlidersHorizontal, History, Thermometer } from "lucide-react";
import { Panel } from "@/components/iot/internal/panel";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import {
  ControlMode,
  type ControlModeValue,
} from "@/components/iot/control-mode";
import { ActuatorSwitch } from "@/components/iot/actuator-switch";
import { SetpointControl } from "@/components/iot/setpoint-control";
import {
  ActuatorControl,
  type ActuatorDirection,
} from "@/components/iot/actuator-control";
import { CommandStatus } from "@/components/iot/command-status";
import { AlertCard, type AlertRecord } from "@/components/iot/alert-card";
import { EventTimeline } from "@/components/iot/event-timeline";
import { AutomationNote } from "@/components/iot/automation-note";

const greenhouseAlert: AlertRecord = {
  id: "gh-temperature",
  title: "二号区温度偏高",
  deviceName: "一号温室 · ENV-002",
  severity: "warning",
  time: "14:02",
  description: "室温 31.2 °C，超过 30 °C 上限。请检查通风设备与目标温度。",
  acknowledged: false,
};
const events = [
  {
    id: "event-1",
    time: "14:32",
    actor: "张工 · 手动",
    title: "目标温度已更新",
    detail: "25.0 调整为 26.0 °C · 设备已确认",
    tone: "success" as const,
  },
  {
    id: "event-2",
    time: "14:10",
    actor: "系统 · 自动",
    title: "顶窗切换至手动模式",
    detail: "操作人：张工 · 用于现场通风检查",
    tone: "warning" as const,
  },
  {
    id: "event-3",
    time: "13:50",
    actor: "网关 GW-001",
    title: "设备连接恢复",
    detail: "离线持续 2 分钟，历史采样已补传。",
  },
];
export function ExtractedPreview({ name }: { name: string }) {
  const [offline, setOffline] = useState(false);
  const [failure, setFailure] = useState(false);
  const [mode, setMode] = useState<ControlModeValue>("manual");
  const [pump, setPump] = useState(false);
  const [setpoint, setSetpoint] = useState(26);
  const [direction, setDirection] = useState<ActuatorDirection>("stop");
  const [empty, setEmpty] = useState(false);
  const [alert, setAlert] = useState(greenhouseAlert);
  const [advice, setAdvice] = useState<"proposed" | "accepted" | "dismissed">(
    "proposed",
  );
  const request = async (commit: () => void) => {
    await new Promise((resolve) => setTimeout(resolve, 650));
    if (failure) throw new Error("演示请求失败，设备状态未改变。请重试。");
    commit();
  };
  const interactive = [
    "actuator-switch",
    "setpoint-control",
    "actuator-control",
    "alert-card",
    "automation-note",
  ].includes(name);
  const remoteControl = [
    "actuator-switch",
    "setpoint-control",
    "actuator-control",
  ].includes(name);
  const controls = interactive && (
    <div className="preview-controls">
      {remoteControl && (
        <Button
          variant={offline ? "default" : "secondary"}
          aria-pressed={offline}
          onClick={() => setOffline(!offline)}
        >
          模拟离线
        </Button>
      )}
      <Button
        variant={failure ? "default" : "secondary"}
        aria-pressed={failure}
        onClick={() => setFailure(!failure)}
      >
        模拟请求失败
      </Button>
      {(name === "alert-card" || name === "automation-note") && (
        <Button
          variant="ghost"
          onClick={() => {
            setAlert(greenhouseAlert);
            setAdvice("proposed");
          }}
        >
          重置示例
        </Button>
      )}
    </div>
  );
  let content;
  switch (name) {
    case "control-mode":
      content = (
        <div className="mx-auto max-w-md space-y-5">
          <Button
            variant="secondary"
            aria-pressed={offline}
            onClick={() => setOffline(!offline)}
          >
            切换只读
          </Button>
          <Panel icon={<SlidersHorizontal />} title="控制模式">
            <ControlMode
              value={mode}
              onValueChange={setMode}
              disabled={offline}
              description={
                mode === "manual"
                  ? "手动接管：由操作者调整设备输出。"
                  : mode === "auto"
                    ? "自动模式：按已配置的目标值与排程运行。"
                    : "AI 辅助：展示带依据的建议，由操作者确认。"
              }
            />
          </Panel>
        </div>
      );
      break;
    case "actuator-switch":
      content = (
        <ActuatorSwitch
          label="循环泵 P-01"
          reported={pump}
          online={!offline}
          onCommand={(next) => request(() => setPump(next))}
        />
      );
      break;
    case "setpoint-control":
      content = (
        <SetpointControl
          label="目标温度"
          value={setpoint}
          min={18}
          max={32}
          step={0.5}
          unit="°C"
          disabled={offline}
          onApply={(next) => request(() => setSetpoint(next))}
        />
      );
      break;
    case "actuator-control":
      content = (
        <ActuatorControl
          label="顶窗 M-01"
          direction={direction}
          position={45}
          online={!offline}
          onCommand={(next) => request(() => setDirection(next))}
        />
      );
      break;
    case "command-status":
      content = (
        <div className="grid gap-4 sm:grid-cols-2">
          {(["idle", "pending", "confirmed", "failed"] as const).map(
            (phase) => (
              <CommandStatus
                key={phase}
                phase={phase}
                requested={phase === "idle" ? "—" : "60 %"}
                reported={phase === "confirmed" ? "60 %" : "45 %"}
                message={
                  phase === "failed"
                    ? "等待回执超时，设备仍保持原状态。"
                    : undefined
                }
              />
            ),
          )}
        </div>
      );
      break;
    case "alert-card":
      content = (
        <div className="space-y-4">
          <AlertCard
            alert={alert}
            onAcknowledge={() =>
              request(() => setAlert({ ...alert, acknowledged: true }))
            }
          />
          <AlertCard
            alert={{
              ...greenhouseAlert,
              id: "critical",
              title: "流量计心跳丢失",
              deviceName: "FLW-005",
              severity: "critical",
              description: "超过 30 分钟未收到心跳。检查设备供电与总线连接。",
            }}
          />
          <AlertCard
            alert={{
              ...greenhouseAlert,
              id: "info",
              title: "网关恢复连接",
              severity: "info",
              description: "积压采样已补传，可以继续检查环境趋势。",
              acknowledged: true,
            }}
          />
        </div>
      );
      break;
    case "event-timeline":
      content = (
        <div className="mx-auto max-w-lg space-y-5">
          <Button
            variant="secondary"
            aria-pressed={empty}
            onClick={() => setEmpty(!empty)}
          >
            {empty ? "恢复记录" : "预览空记录"}
          </Button>
          <Panel icon={<History />} title="设备事件">
            <EventTimeline events={empty ? [] : events} />
          </Panel>
        </div>
      );
      break;
    case "automation-note":
      content = (
        <AutomationNote
          title="建议将遮阳幕展开至 60%"
          reason="光照持续增强，未来一小时室温可能继续上升。适度遮阳可降低午后热负荷。"
          source="光照趋势 + 室外温度 · 演示建议"
          time="14:02"
          status={advice}
          onAccept={() => request(() => setAdvice("accepted"))}
          onDismiss={() => request(() => setAdvice("dismissed"))}
        />
      );
      break;
    default:
      return null;
  }
  return (
    <>
      {controls}
      {name === "setpoint-control" ? (
        <div className="mx-auto max-w-lg">
          <Panel icon={<Thermometer />} title="设定值控制">
            {content}
          </Panel>
        </div>
      ) : (
        content
      )}
    </>
  );
}
