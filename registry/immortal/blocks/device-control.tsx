"use client";

import { Panel } from "@/components/iot/internal/panel";
import { useId, useState, type FormEvent } from "react";
import { Check, LoaderCircle, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeviceStatus } from "@/components/iot/device-status";
import {
  ThresholdControl,
  type Threshold,
} from "@/components/iot/threshold-control";
import { isValidThreshold } from "@/lib/telemetry";

export type DeviceConfiguration = {
  interval: number;
  mode: "balanced" | "performance" | "low-power";
  watchdog: boolean;
  threshold: Threshold;
};
type DeviceControlProps = {
  deviceId: string;
  deviceName: string;
  online: boolean;
  configuration: DeviceConfiguration;
  onApply: (configuration: DeviceConfiguration) => Promise<void>;
};
const minTemperature = -20;
const maxTemperature = 80;

function sameConfiguration(a: DeviceConfiguration, b: DeviceConfiguration) {
  return (
    Object.is(a.interval, b.interval) &&
    a.mode === b.mode &&
    a.watchdog === b.watchdog &&
    Object.is(a.threshold.low, b.threshold.low) &&
    Object.is(a.threshold.high, b.threshold.high)
  );
}

export function DeviceControl(props: DeviceControlProps) {
  return <ConfigurationForm key={props.deviceId} {...props} />;
}

function ConfigurationForm({
  deviceId,
  deviceName,
  online,
  configuration,
  onApply,
}: DeviceControlProps) {
  const id = useId();
  const [draft, setDraft] = useState<{
    baseline: DeviceConfiguration;
    value: DeviceConfiguration;
  } | null>(null);
  const [phase, setPhase] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const value = draft?.value ?? configuration;
  const dirty = draft !== null && !sameConfiguration(value, draft.baseline);
  const changedRemotely =
    dirty && !sameConfiguration(configuration, draft.baseline);
  const saving = phase === "saving";
  const disabled = !online || saving;
  const validInterval =
    Number.isInteger(value.interval) &&
    value.interval >= 5 &&
    value.interval <= 3600;
  const validRange = isValidThreshold(
    value.threshold,
    minTemperature,
    maxTemperature,
  );

  function update(next: Partial<DeviceConfiguration>) {
    setDraft((current) => {
      const baseline = current?.baseline ?? configuration;
      const updated = { ...(current?.value ?? configuration), ...next };
      return sameConfiguration(updated, baseline)
        ? null
        : { baseline, value: updated };
    });
    setPhase("idle");
  }

  function reset() {
    setDraft(null);
    setPhase("idle");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || changedRemotely || !validInterval || !validRange || !dirty)
      return;
    setPhase("saving");
    try {
      await onApply(value);
      setDraft(null);
      setPhase("saved");
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "配置保存失败。请重试。",
      );
      setPhase("error");
    }
  }

  return (
    <Panel
      as="h2"
      icon={<SlidersHorizontal />}
      title={deviceName}
      description={deviceId}
      status={
        <DeviceStatus
          state={online ? "online" : "offline"}
          label={online ? "在线" : "离线"}
        />
      }
      className="@container min-w-0"
    >
      <form noValidate onSubmit={submit} className="min-w-0">
        <div className="pb-5">
          <fieldset
            disabled={disabled}
            className="grid min-w-0 gap-5 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <section className="min-w-0 space-y-4">
              <h3 className="font-medium">采集与连接</h3>
              <div className="space-y-2">
                <Label htmlFor={id + "-mode"}>运行模式</Label>
                <Select
                  value={value.mode}
                  disabled={disabled}
                  onValueChange={(mode) =>
                    update({ mode: mode as DeviceConfiguration["mode"] })
                  }
                >
                  <SelectTrigger
                    id={id + "-mode"}
                    className="min-h-10 w-full"
                    aria-label="运行模式"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="balanced">均衡</SelectItem>
                    <SelectItem value="performance">性能优先</SelectItem>
                    <SelectItem value="low-power">低功耗</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={id + "-interval"}>上报间隔（秒）</Label>
                <Input
                  id={id + "-interval"}
                  type="number"
                  min={5}
                  max={3600}
                  step={1}
                  className="min-h-10 tabular-nums"
                  value={Number.isFinite(value.interval) ? value.interval : ""}
                  aria-invalid={!validInterval || undefined}
                  aria-describedby={id + "-interval-hint"}
                  onChange={(event) =>
                    update({ interval: event.target.valueAsNumber })
                  }
                />
                <p
                  id={id + "-interval-hint"}
                  className={
                    "text-sm " +
                    (validInterval
                      ? "text-muted-foreground"
                      : "text-destructive")
                  }
                >
                  输入 5–3,600 之间的整数。
                </p>
              </div>
              <div className="flex min-h-12 items-center justify-between gap-4 pt-1">
                <div>
                  <Label htmlFor={id + "-watchdog"}>自动重连</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    心跳中断后尝试恢复连接。
                  </p>
                </div>
                <Switch
                  id={id + "-watchdog"}
                  checked={value.watchdog}
                  disabled={disabled}
                  onCheckedChange={(watchdog) => update({ watchdog })}
                />
              </div>
            </section>
            <div className="surface-inset min-w-0 self-start p-4 @sm:p-5">
              <ThresholdControl
                min={minTemperature}
                max={maxTemperature}
                unit="°C"
                value={value.threshold}
                onValueChange={(threshold) => update({ threshold })}
                disabled={disabled}
                labels={{
                  range: "温度告警范围",
                  low: "下限",
                  high: "上限",
                  invalid: "下限应低于上限，且两者均在 −20 至 80 °C 内。",
                }}
              />
            </div>
          </fieldset>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            {!online ? (
              <p role="status" className="text-warning-text">
                设备离线。重新连接后可以提交。
              </p>
            ) : saving ? (
              <p role="status" className="text-muted-foreground">
                正在提交配置…
              </p>
            ) : changedRemotely ? (
              <p role="status" className="text-warning-text">
                设备配置已更新。载入最新配置后可继续编辑。
              </p>
            ) : phase === "error" ? (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            ) : phase === "saved" ? (
              <p role="status" className="flex items-center gap-2 text-success">
                <Check className="size-4" aria-hidden="true" /> 配置已保存
              </p>
            ) : dirty ? (
              <p role="status" className="text-muted-foreground">
                有待提交的更改
              </p>
            ) : null}
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              disabled={!dirty || saving}
              onClick={reset}
            >
              {changedRemotely ? "载入最新配置" : "还原"}
            </Button>
            <Button
              type="submit"
              className="min-h-10"
              disabled={
                disabled ||
                changedRemotely ||
                !validInterval ||
                !validRange ||
                !dirty
              }
            >
              {saving && (
                <LoaderCircle
                  className="size-4 motion-safe:animate-spin"
                  aria-hidden="true"
                />
              )}
              {saving ? "保存中…" : "保存配置"}
            </Button>
          </div>
        </div>
      </form>
    </Panel>
  );
}
