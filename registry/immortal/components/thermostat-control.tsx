"use client";
import { Panel } from "@/components/iot/internal/panel";
import { useId, useState } from "react";
import { Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommandStatus } from "@/components/iot/command-status";
import { useDeviceCommand } from "@/components/iot/use-device-command";
import { numericError, timeLabel, type CommandAction } from "@/lib/iot-model";
export type ThermostatMode = "off" | "heat" | "cool" | "auto";
export type ThermostatTarget = {
  mode: ThermostatMode;
  setpoint: number;
  heat: number;
  cool: number;
  holdMinutes: number | null;
};
const modes = { off: "关闭", heat: "制热", cool: "制冷", auto: "自动" };
export function ThermostatControl({
  label,
  measured,
  reported,
  supportedModes,
  operatingState,
  min = 5,
  max = 35,
  step = 0.5,
  deadband = 1,
  online = true,
  disabledReason,
  holdUntil,
  onApply,
}: {
  label: string;
  measured: number | null;
  reported: Omit<ThermostatTarget, "holdMinutes">;
  supportedModes: ThermostatMode[];
  operatingState: "heating" | "cooling" | "idle" | "unknown";
  min?: number;
  max?: number;
  step?: number;
  deadband?: number;
  online?: boolean;
  disabledReason?: string;
  holdUntil?: number | null;
  onApply: CommandAction<ThermostatTarget>;
}) {
  const id = useId(),
    command = useDeviceCommand();
  const [edit, setEdit] = useState<{
    target: ThermostatTarget;
    baseline: string;
  } | null>(null);
  const value: ThermostatTarget = edit?.target ?? {
    ...reported,
    holdMinutes: null,
  };
  const baseline = JSON.stringify(reported);
  const matchesReadback =
    edit !== null &&
    (["mode", "setpoint", "heat", "cool"] as const).every(
      (key) => edit.target[key] === reported[key],
    );
  const conflict =
    edit !== null && edit.baseline !== baseline && !matchesReadback;
  const change = (patch: Partial<ThermostatTarget>) =>
    setEdit({
      target: { ...value, ...patch },
      baseline: edit?.baseline ?? baseline,
    });
  const error =
    !Number.isFinite(deadband) || deadband < 0
      ? "冷热间隔配置无效"
      : !supportedModes.includes(value.mode)
        ? "设备不支持此模式"
        : value.mode === "off"
          ? null
          : value.mode === "auto"
            ? numericError(value.heat, min, max, step) ||
              numericError(value.cool, min, max, step) ||
              (value.cool - value.heat < deadband
                ? "冷热目标至少间隔 " + deadband + " °C"
                : null)
            : numericError(value.setpoint, min, max, step);
  const blocked = !online || !!disabledReason || command.busy;
  const field = (key: "setpoint" | "heat" | "cool", fieldLabel: string) => (
    <label className="space-y-2" htmlFor={id + key}>
      <span className="text-sm text-muted-foreground">{fieldLabel} °C</span>
      <Input
        id={id + key}
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value[key]) ? value[key] : ""}
        aria-invalid={!!error}
        onChange={(e) =>
          change({
            [key]: e.target.value === "" ? NaN : Number(e.target.value),
          })
        }
        className="tabular-nums"
      />
    </label>
  );
  const targetLabel = (v: typeof reported) =>
    v.mode === "auto"
      ? v.heat + "–" + v.cool + " °C"
      : v.mode === "off"
        ? "关闭"
        : v.setpoint + " °C";
  return (
    <Panel
      icon={<Thermometer />}
      title={label}
      status={
        {
          heating: "正在制热",
          cooling: "正在制冷",
          idle: "待机",
          unknown: "运行状态未知",
        }[operatingState]
      }
    >
      <div className="surface-inset grid grid-cols-1 gap-4 p-4 @xs:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">
            {online ? "实测温度" : "离线快照"}
          </p>
          <p className="mt-2 text-3xl tabular-nums">
            {measured !== null && Number.isFinite(measured)
              ? measured.toFixed(1)
              : "—"}
            <span className="ml-1 text-sm text-muted-foreground">°C</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            生效目标 · {modes[reported.mode]}
          </p>
          <p className="mt-2 text-xl tabular-nums">{targetLabel(reported)}</p>
        </div>
      </div>
      <fieldset disabled={blocked} className="space-y-4">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="温控模式"
        >
          {supportedModes.map((mode) => (
            <button
              type="button"
              data-slot="filter-chip"
              key={mode}
              aria-pressed={value.mode === mode}
              onClick={() => change({ mode })}
            >
              {modes[mode]}
            </button>
          ))}
        </div>
        {value.mode !== "off" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {value.mode === "auto" ? (
              <>
                {field("heat", "制热下限")}
                {field("cool", "制冷上限")}
              </>
            ) : (
              field("setpoint", "目标温度")
            )}
          </div>
        )}
        <div>
          <p className="mb-2 text-sm text-muted-foreground">临时覆盖期限</p>
          <div className="flex flex-wrap gap-2">
            {([null, 30, 60] as const).map((minutes) => (
              <button
                type="button"
                key={String(minutes)}
                data-slot="filter-chip"
                aria-pressed={value.holdMinutes === minutes}
                onClick={() => change({ holdMinutes: minutes })}
              >
                {minutes === null ? "跟随日程" : minutes + " 分钟"}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {conflict && (
          <p role="alert" className="text-sm text-warning">
            设备目标已变化，请先采用设备值再编辑。
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!edit || !!error || conflict}
            onClick={async () => {
              const receipt = await command.run(
                modes[value.mode] +
                  " · " +
                  targetLabel(value) +
                  " · " +
                  (value.holdMinutes ? value.holdMinutes + "分钟" : "跟随日程"),
                value,
                onApply,
              );
              if (receipt?.phase === "verified") setEdit(null);
            }}
          >
            应用温控
          </Button>
          {edit && (
            <Button variant="ghost" onClick={() => setEdit(null)}>
              采用设备值
            </Button>
          )}
        </div>
      </fieldset>
      <p className="text-sm text-muted-foreground">
        {holdUntil
          ? "设备报告覆盖到 " + timeLabel(holdUntil) + " UTC"
          : "设备未报告临时覆盖"}{" "}
        · 模式与当前运行状态分别显示
      </p>
      <CommandStatus
        record={command.record}
        reported={modes[reported.mode] + " · " + targetLabel(reported)}
        message={!online ? "设备离线，控制不可用" : disabledReason}
      />
    </Panel>
  );
}
