"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { isValidThreshold } from "@/lib/telemetry";

export type Threshold = { low: number; high: number };
export function ThresholdControl({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  disabled = false,
}: {
  value: Threshold;
  onValueChange: (value: Threshold) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const valid = isValidThreshold(value, min, max);
  const sliderValues = [value.low, value.high]
    .map((number, index) =>
      Number.isFinite(number)
        ? Math.max(min, Math.min(max, number))
        : index === 0
          ? min
          : max,
    )
    .sort((a, b) => a - b);
  return (
    <fieldset disabled={disabled} className="space-y-5">
      <legend className="mb-4 text-sm font-medium">
        Operating range {unit && `(${unit})`}
      </legend>
      <Slider
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={1}
        value={sliderValues}
        disabled={disabled}
        aria-label="Operating range"
        onValueChange={([low, high]) => onValueChange({ low, high })}
      />
      <div className="grid grid-cols-2 gap-3">
        {(["low", "high"] as const).map((key) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`${id}-${key}`}>
              {key === "low" ? "Lower limit" : "Upper limit"}
            </Label>
            <Input
              id={`${id}-${key}`}
              type="number"
              min={min}
              max={max}
              step={step}
              value={Number.isFinite(value[key]) ? value[key] : ""}
              aria-invalid={!valid}
              aria-describedby={!valid ? `${id}-error` : undefined}
              onChange={(event) =>
                onValueChange({ ...value, [key]: event.target.valueAsNumber })
              }
            />
          </div>
        ))}
      </div>
      {!valid && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          Set a lower limit below the upper limit, between {min} and {max}.
        </p>
      )}
    </fieldset>
  );
}
