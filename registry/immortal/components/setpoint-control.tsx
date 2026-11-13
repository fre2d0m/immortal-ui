"use client";
import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommandStatus } from "@/components/iot/command-status";
import { useDeviceCommand } from "@/components/iot/use-device-command";
import { numericError, type CommandAction } from "@/lib/iot-model";
export function SetpointControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  disabledReason,
  onApply,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  disabled?: boolean;
  disabledReason?: string;
  onApply: CommandAction<number>;
}) {
  const id = useId();
  const command = useDeviceCommand();
  const [edit, setEdit] = useState<{ text: string; baseline: number } | null>(
    null,
  );
  const draft = edit?.text ?? (Number.isFinite(value) ? String(value) : "");
  const number = draft.trim() ? Number(draft) : NaN;
  const error = numericError(number, min, max, step);
  const conflict =
    edit !== null && !Object.is(edit.baseline, value) && number !== value;
  const update = (text: string) =>
    setEdit({ text, baseline: edit?.baseline ?? value });
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (error || conflict || disabled || command.busy || number === value)
          return;
        void command.run(`${number} ${unit}`, number, onApply);
      }}
    >
      <div className="flex flex-wrap justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="text-sm text-muted-foreground tabular-nums">
          {min}–{max} {unit} · 步进 {step}
        </span>
      </div>
      <fieldset disabled={disabled || command.busy} className="space-y-4">
        <div data-slot="control-row" className="flex gap-3">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={`降低${label}`}
            disabled={!!error || number - step < min}
            onClick={() => update(String(Number((number - step).toFixed(8))))}
          >
            <Minus />
          </Button>
          <Input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={(event) => update(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={`${id}-hint`}
            className="min-w-0 text-center tabular-nums"
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={`提高${label}`}
            disabled={!!error || number + step > max}
            onClick={() => update(String(Number((number + step).toFixed(8))))}
          >
            <Plus />
          </Button>
        </div>
        <p
          id={`${id}-hint`}
          className={
            error ? "text-sm text-destructive" : "text-sm text-muted-foreground"
          }
        >
          {error || (number === value ? "当前设定与设备一致" : "草稿尚未生效")}
        </p>
        {conflict && (
          <div className="surface-inset space-y-3 p-4">
            <p role="alert" className="text-sm text-warning-text">
              设备设定已被外部更新为 {value} {unit}，你的草稿仍保留。
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEdit(null)}
              >
                采用设备值
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEdit({ text: draft, baseline: value })}
              >
                保留草稿并重新确认
              </Button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={!!error || conflict || number === value}
          >
            {command.busy ? "等待回执…" : "应用设定"}
          </Button>
          {edit && (
            <Button type="button" variant="ghost" onClick={() => setEdit(null)}>
              撤销编辑
            </Button>
          )}
        </div>
      </fieldset>
      <CommandStatus
        record={command.record}
        reported={Number.isFinite(value) ? `${value} ${unit}` : "未知"}
        message={
          disabled ? disabledReason || "控制不可用，设定只读" : undefined
        }
      />
    </form>
  );
}
