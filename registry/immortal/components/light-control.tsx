"use client";
import { useId, useState } from "react";
import { Lightbulb, Power } from "lucide-react";
import { Panel } from "@/components/iot/internal/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { CommandStatus } from "@/components/iot/command-status";
import { useDeviceCommand } from "@/components/iot/use-device-command";
import { numericError, type CommandAction } from "@/lib/iot-model";
export type LightTarget = {
  power?: boolean;
  brightness?: number;
  temperature?: number;
  color?: string;
  sceneId?: string;
};
export type LightCapabilities = {
  brightness?: boolean;
  temperature?: { min: number; max: number; step: number };
  color?: boolean;
  scenes?: { id: string; label: string }[];
};
export function LightControl({
  label,
  reported,
  capabilities,
  online = true,
  disabledReason,
  members,
  onApply,
}: {
  label: string;
  reported: {
    power: boolean | null;
    brightness?: number | null;
    temperature?: number | null;
    color?: string | null;
  };
  capabilities: LightCapabilities;
  online?: boolean;
  disabledReason?: string;
  members?: {
    id: string;
    label: string;
    state: "confirmed" | "pending" | "failed" | "offline";
  }[];
  onApply: CommandAction<LightTarget>;
}) {
  const id = useId(),
    command = useDeviceCommand();
  const [draft, setDraft] = useState<LightTarget>({});
  const brightness = draft.brightness ?? reported.brightness ?? 50;
  const temperature =
    draft.temperature ??
    reported.temperature ??
    capabilities.temperature?.min ??
    2700;
  const blocked = !online || !!disabledReason || command.busy;
  const error =
    (capabilities.brightness && numericError(brightness, 0, 100, 1)) ||
    (capabilities.temperature &&
      numericError(
        temperature,
        capabilities.temperature.min,
        capabilities.temperature.max,
        capabilities.temperature.step,
      ));
  const apply = async (value: LightTarget, description: string) => {
    if (blocked) return;
    const receipt = await command.run(description, value, onApply);
    if (receipt?.phase === "verified") setDraft({});
  };
  const stateLabels = {
    confirmed: "回读已验证",
    pending: "等待回读",
    failed: "失败",
    offline: "离线",
  };
  return (
    <Panel
      icon={<Lightbulb />}
      title={label}
      description={online ? "设备回读" : "离线 · 最后回读"}
      status={
        reported.power === null
          ? "开关未知"
          : reported.power
            ? "已开启"
            : "已关闭"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm">灯光开关</span>
        <Button
          size="icon"
          variant={reported.power ? "default" : "secondary"}
          aria-label={reported.power ? "关闭灯光" : "开启灯光"}
          disabled={blocked || reported.power === null}
          onClick={() =>
            apply(
              { power: !reported.power },
              reported.power ? "关闭灯光" : "开启灯光",
            )
          }
        >
          <Power />
        </Button>
      </div>
      <fieldset disabled={blocked} className="surface-inset space-y-5 p-4">
        {capabilities.brightness && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={id + "-brightness"}>亮度</label>
              <span className="text-sm tabular-nums text-muted-foreground">
                回读 {reported.brightness ?? "—"}%
              </span>
            </div>
            <div className="grid grid-cols-1 items-center gap-3 @sm:grid-cols-[minmax(0,1fr)_6rem] @sm:gap-4">
              <Slider
                className="flex-1"
                aria-label="亮度滑块"
                min={0}
                max={100}
                step={1}
                value={[Number.isFinite(brightness) ? brightness : 0]}
                disabled={blocked}
                onValueChange={(v) => setDraft({ ...draft, brightness: v[0] })}
              />
              <Input
                id={id + "-brightness"}
                aria-label="亮度百分比"
                className="w-24 justify-self-end text-right tabular-nums"
                type="number"
                min={0}
                max={100}
                step={1}
                value={Number.isFinite(brightness) ? brightness : ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    brightness:
                      e.target.value === "" ? NaN : Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        )}
        {capabilities.temperature && (
          <div className="space-y-3">
            <div className="flex flex-wrap justify-between gap-2">
              <label htmlFor={id + "-temperature"}>色温</label>
              <span className="text-sm tabular-nums text-muted-foreground">
                回读 {reported.temperature ?? "—"} K
              </span>
            </div>
            <div className="grid grid-cols-1 items-center gap-3 @sm:grid-cols-[minmax(0,1fr)_6rem] @sm:gap-4">
              <Slider
                className="flex-1"
                aria-label="色温滑块"
                min={capabilities.temperature.min}
                max={capabilities.temperature.max}
                step={capabilities.temperature.step}
                value={[
                  Number.isFinite(temperature)
                    ? temperature
                    : capabilities.temperature.min,
                ]}
                disabled={blocked}
                onValueChange={(v) => setDraft({ ...draft, temperature: v[0] })}
              />
              <Input
                id={id + "-temperature"}
                className="w-24 justify-self-end text-right tabular-nums"
                type="number"
                {...capabilities.temperature}
                value={Number.isFinite(temperature) ? temperature : ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    temperature:
                      e.target.value === "" ? NaN : Number(e.target.value),
                  })
                }
              />
            </div>
            <div
              className="h-1.5 rounded-full"
              aria-hidden="true"
              style={{
                background: "linear-gradient(90deg,#eeb876,#e8e5d9,#aec9ee)",
              }}
            />
          </div>
        )}
        {capabilities.color && (
          <label className="flex items-center justify-between gap-3 text-sm">
            灯光颜色
            <input
              type="color"
              aria-label="灯光颜色"
              value={draft.color ?? reported.color ?? "#ffffff"}
              onChange={(e) => setDraft({ ...draft, color: e.target.value })}
              className="h-9 w-14 rounded-md border-0 bg-transparent"
            />
          </label>
        )}
        {!capabilities.brightness &&
          !capabilities.temperature &&
          !capabilities.color && (
            <p className="text-sm text-muted-foreground">
              此设备支持开关控制。
            </p>
          )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {Object.keys(draft).length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!!error}
              onClick={() =>
                apply(
                  draft,
                  [
                    draft.brightness !== undefined &&
                      "亮度 " + draft.brightness + "%",
                    draft.temperature !== undefined &&
                      "色温 " + draft.temperature + "K",
                    draft.color,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                )
              }
            >
              应用灯光
            </Button>
            <Button variant="ghost" onClick={() => setDraft({})}>
              采用设备值
            </Button>
          </div>
        )}
      </fieldset>
      {capabilities.scenes?.length ? (
        <div className="flex flex-wrap gap-2" aria-label="灯光场景">
          {capabilities.scenes.map((scene) => (
            <Button
              key={scene.id}
              variant="secondary"
              disabled={blocked}
              onClick={() => apply({ sceneId: scene.id }, scene.label)}
            >
              {scene.label}
            </Button>
          ))}
        </div>
      ) : null}
      {members && (
        <ul className="space-y-2 text-sm" aria-label="群组逐项结果">
          {members.map((member) => (
            <li key={member.id} className="flex justify-between gap-3">
              <span>{member.label}</span>
              <span
                className={
                  member.state === "failed" || member.state === "offline"
                    ? "text-warning"
                    : "text-muted-foreground"
                }
              >
                {stateLabels[member.state]}
              </span>
            </li>
          ))}
        </ul>
      )}
      <CommandStatus
        record={command.record}
        reported={
          (reported.power === null
            ? "未知"
            : reported.power
              ? "开启"
              : "关闭") +
          (capabilities.brightness
            ? " · " + (reported.brightness ?? "—") + "%"
            : "") +
          (capabilities.temperature
            ? " · " + (reported.temperature ?? "—") + " K"
            : "")
        }
        message={!online ? "设备离线，控制不可用" : disabledReason}
      />
    </Panel>
  );
}
