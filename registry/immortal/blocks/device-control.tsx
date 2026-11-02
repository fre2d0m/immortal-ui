"use client";

import { useEffect, useId, useState } from "react";
import { SlidersHorizontal, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
export function DeviceControl({
  deviceId,
  deviceName,
  online,
  configuration,
  onApply,
}: {
  deviceId: string;
  deviceName: string;
  online: boolean;
  configuration: DeviceConfiguration;
  onApply: (configuration: DeviceConfiguration) => Promise<void>;
}) {
  const id = useId();
  const [draft, setDraft] = useState(configuration);
  const [phase, setPhase] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  useEffect(() => {
    setDraft(configuration);
  }, [configuration, deviceId]);
  useEffect(() => {
    setPhase("idle");
    setError("");
  }, [deviceId]);
  const valid =
    Number.isInteger(draft.interval) &&
    draft.interval >= 5 &&
    draft.interval <= 3600 &&
    isValidThreshold(draft.threshold, -20, 80);
  const dirty = JSON.stringify(draft) !== JSON.stringify(configuration);
  const update = (next: Partial<DeviceConfiguration>) => {
    setDraft((current) => ({ ...current, ...next }));
    setPhase("idle");
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !online || phase === "saving" || !dirty) return;
    setPhase("saving");
    try {
      await onApply(draft);
      setPhase("saved");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The configuration could not be saved. Please retry.",
      );
      setPhase("error");
    }
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <span className="surface-control flex size-10 items-center justify-center">
            <SlidersHorizontal className="size-4" />
          </span>
          <DeviceStatus state={online ? "online" : "offline"} />
        </div>
        <h2 className="mt-3 text-lg font-medium">{deviceName}</h2>
        <p className="text-xs text-muted-foreground">
          Configuration · {deviceId}
        </p>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent>
          <fieldset
            disabled={phase === "saving" || !online}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${id}-mode`}>Operating mode</Label>
                <Select
                  value={draft.mode}
                  onValueChange={(value) =>
                    update({ mode: value as DeviceConfiguration["mode"] })
                  }
                  disabled={phase === "saving" || !online}
                >
                  <SelectTrigger id={`${id}-mode`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="low-power">Low power</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-interval`}>
                  Report interval (seconds)
                </Label>
                <Input
                  id={`${id}-interval`}
                  type="number"
                  min="5"
                  max="3600"
                  step="1"
                  value={Number.isFinite(draft.interval) ? draft.interval : ""}
                  onChange={(event) =>
                    update({ interval: event.target.valueAsNumber })
                  }
                />
              </div>
            </div>
            <div className="surface-inset p-5">
              <ThresholdControl
                min={-20}
                max={80}
                unit="°C"
                value={draft.threshold}
                onValueChange={(threshold) => update({ threshold })}
                disabled={!online || phase === "saving"}
              />
            </div>
            <div className="flex min-h-12 items-center justify-between gap-6">
              <div>
                <Label htmlFor={`${id}-watchdog`}>Connection watchdog</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reconnect when the heartbeat is lost.
                </p>
              </div>
              <Switch
                id={`${id}-watchdog`}
                checked={draft.watchdog}
                onCheckedChange={(watchdog) => update({ watchdog })}
                disabled={!online || phase === "saving"}
              />
            </div>
          </fieldset>
          <div className="my-4 min-h-5 text-xs" aria-live="polite">
            {!online ? (
              <p className="text-warning">
                Device is offline. Configuration is read-only.
              </p>
            ) : phase === "error" ? (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            ) : phase === "saved" ? (
              <p className="flex items-center gap-2 text-success">
                <Check className="size-3" />
                Configuration saved.
              </p>
            ) : !valid ? (
              <p className="text-destructive">
                Use a whole-number interval from 5 to 3,600 seconds and a valid
                range.
              </p>
            ) : (
              <p className="text-muted-foreground">
                {dirty
                  ? "You have unapplied changes."
                  : "Configuration is up to date."}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!dirty || phase === "saving"}
            onClick={() => {
              setDraft(configuration);
              setPhase("idle");
            }}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={!online || !valid || !dirty || phase === "saving"}
          >
            {phase === "saving" && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            {phase === "saving" ? "Applying…" : "Apply configuration"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
