"use client";

import { useId } from "react";
import { Hand, Timer } from "lucide-react";
import { cn } from "cn";

export type ControlModeValue = "manual" | "auto";
const modes = [
  { value: "manual", label: "手动", Icon: Hand },
  { value: "auto", label: "自动", Icon: Timer },
] as const;
export function ControlMode({
  value,
  onValueChange,
  disabled = false,
  description,
  label = "运行模式",
}: {
  value: ControlModeValue;
  onValueChange: (value: ControlModeValue) => void;
  disabled?: boolean;
  description?: string;
  label?: string;
}) {
  const id = useId();
  return (
    <fieldset
      disabled={disabled}
      className="@container space-y-3"
      aria-describedby={description ? `${id}-hint` : undefined}
    >
      <legend className="mb-3 text-sm font-medium">{label}</legend>
      <div className="surface-inset grid grid-cols-2 gap-1 p-1">
        {modes.map(({ value: mode, label: text, Icon }) => (
          <label
            key={mode}
            data-slot="segmented-control-item"
            data-state={value === mode ? "checked" : "unchecked"}
            data-disabled={disabled ? "" : undefined}
            className={cn(
              "relative flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg px-1 text-sm transition-colors @sm:min-h-10 @sm:flex-row @sm:gap-2 @sm:px-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
              value === mode
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name={id}
              value={mode}
              checked={value === mode}
              onChange={() => onValueChange(mode)}
              className="sr-only"
            />
            <Icon aria-hidden="true" className="size-4" />
            <span className="whitespace-nowrap">{text}</span>
          </label>
        ))}
      </div>
      {description && (
        <p
          id={`${id}-hint`}
          className="text-xs leading-relaxed text-muted-foreground"
        >
          {description}
        </p>
      )}
    </fieldset>
  );
}
