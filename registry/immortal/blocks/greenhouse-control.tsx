"use client";

import { Panel } from "@/components/iot/internal/panel";

import { Sprout, SlidersHorizontal } from "lucide-react";

import { DeviceStatus } from "@/components/iot/device-status";
import {
  TelemetryChart,
  type TelemetryPoint,
} from "@/components/iot/telemetry-chart";
import {
  ControlMode,
  type ControlModeValue,
} from "@/components/iot/control-mode";
import { SetpointControl } from "@/components/iot/setpoint-control";
import { ActuatorSwitch } from "@/components/iot/actuator-switch";
import {
  ActuatorControl,
  type ActuatorDirection,
} from "@/components/iot/actuator-control";
import { AlertCard, type AlertRecord } from "@/components/iot/alert-card";

export type GreenhouseReadings = {
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
  ageSeconds: number | null;
};
export function GreenhouseControl({
  title,
  online,
  readings,
  history,
  historyMaxGapMs,
  mode,
  onModeChange,
  setpoint,
  onSetpointApply,
  pump,
  onPumpCommand,
  vent,
  onVentCommand,
  alerts,
  onAcknowledge,
}: {
  title: string;
  online: boolean;
  readings: GreenhouseReadings;
  history: TelemetryPoint[];
  historyMaxGapMs?: number;
  mode: ControlModeValue;
  onModeChange: (mode: ControlModeValue) => void;
  setpoint: number;
  onSetpointApply: (value: number) => Promise<void>;
  pump: boolean | null;
  onPumpCommand: (enabled: boolean) => Promise<void>;
  vent: { direction: ActuatorDirection | null; position: number | null };
  onVentCommand: (direction: ActuatorDirection) => Promise<void>;
  alerts: AlertRecord[];
  onAcknowledge: (id: string) => Promise<void>;
}) {
  const readouts = [
    {
      label: "空气温度",
      value: readings.temperature,
      unit: "°C",
      precision: 1,
    },
    { label: "相对湿度", value: readings.humidity, unit: "%", precision: 0 },
    { label: "CO₂ 浓度", value: readings.co2, unit: "ppm", precision: 0 },
  ];
  const age = readings.ageSeconds;
  const sampleAge =
    age == null || !Number.isFinite(age) || age < 0
      ? "采样时间未知"
      : age < 60
        ? Math.floor(age) + " 秒前"
        : Math.floor(age / 60) + " 分钟前";
  const needsReview = alerts.filter((alert) => !alert.acknowledged).length;

  return (
    <div className="@container min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-medium tracking-tight text-balance wrap-break-word">
          {title}
        </h2>
        <DeviceStatus
          state={online ? "online" : "offline"}
          label={online ? "在线" : "离线"}
        />
      </div>
      <div className="grid min-w-0 gap-4 @3xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Panel
          icon={<Sprout />}
          title="环境观测"
          description={online ? undefined : "最后观测快照"}
          status={<span className="tabular-nums">{sampleAge}</span>}
          className="min-w-0"
          contentClassName="space-y-5"
        >
          <dl className="surface-inset grid grid-cols-3 gap-2 p-4 @md:gap-4">
            {readouts.map(({ label, value, unit, precision }) => (
              <div key={label} className="min-w-0">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-1 flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
                  {value != null && Number.isFinite(value) ? (
                    <>
                      <span className="text-xl tracking-tight @md:text-2xl">
                        {value.toFixed(precision)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {unit}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">缺测</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <TelemetryChart
            embedded
            label="空气温度趋势"
            unit="°C"
            data={history}
            precision={1}
            maxGapMs={historyMaxGapMs}
            showTable={false}
          />
        </Panel>
        <Panel
          icon={<SlidersHorizontal />}
          title="气候控制"
          status={
            online ? undefined : (
              <span role="status" className="text-warning-text">
                离线
              </span>
            )
          }
          className="min-w-0"
          contentClassName="min-w-0 space-y-5"
        >
          <ControlMode
            value={mode}
            onValueChange={onModeChange}
            disabled={!online}
            description={
              mode === "manual"
                ? "手动模式开放循环泵和顶窗操作。"
                : "自动模式下可查看执行器回读。"
            }
          />
          <div className="border-t border-border pt-5">
            <SetpointControl
              label="目标温度"
              value={setpoint}
              min={18}
              max={32}
              step={0.5}
              unit="°C"
              disabled={!online}
              onApply={onSetpointApply}
            />
          </div>
        </Panel>
      </div>
      <section aria-label="执行器" className="space-y-3">
        <h3 className="font-medium">执行器</h3>
        <div className="grid min-w-0 gap-4 @2xl:grid-cols-2">
          <ActuatorSwitch
            label="循环泵 P-01"
            reported={pump}
            online={online}
            locked={mode !== "manual"}
            onCommand={onPumpCommand}
          />
          <ActuatorControl
            label="顶窗 M-01"
            direction={vent.direction}
            position={vent.position}
            online={online}
            locked={mode !== "manual"}
            onCommand={onVentCommand}
          />
        </div>
      </section>
      <section aria-label="温室告警" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-medium">告警</h3>
          {needsReview > 0 && (
            <p className="text-sm text-warning-text tabular-nums">
              {needsReview} 条待确认
            </p>
          )}
        </div>
        {alerts.length ? (
          alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={onAcknowledge}
            />
          ))
        ) : (
          <p className="surface-inset p-5 text-sm text-muted-foreground">
            暂无告警
          </p>
        )}
      </section>
    </div>
  );
}
