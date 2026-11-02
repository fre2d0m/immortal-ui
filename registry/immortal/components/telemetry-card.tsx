import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DeviceStatus, type DeviceState } from "@/components/iot/device-status";
import {
  TelemetryChart,
  type TelemetryPoint,
} from "@/components/iot/telemetry-chart";
import { cn } from "cn";

export function TelemetryCard({
  label,
  value,
  unit,
  description,
  state = "online",
  data,
  loading = false,
  className,
}: {
  label: string;
  value: number | null;
  unit: string;
  description?: string;
  state?: DeviceState;
  data?: TelemetryPoint[];
  loading?: boolean;
  className?: string;
}) {
  const available = value !== null && Number.isFinite(value);
  return (
    <Card className={className} aria-busy={loading}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-medium">{label}</h3>
          <DeviceStatus state={state} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="surface-inset p-5">
          <div
            className={cn(
              "flex items-baseline gap-2 tabular-nums",
              loading && "opacity-40",
            )}
          >
            <span className="text-4xl font-medium tracking-[-0.06em]">
              {loading
                ? "···"
                : available
                  ? value.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
                  : "—"}
            </span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {loading
              ? "Loading readings…"
              : !available
                ? "No reading available"
                : description}
          </p>
          {data && !loading && (
            <TelemetryChart
              data={data}
              label={label}
              unit={unit}
              className="mt-6"
              showTable={false}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
