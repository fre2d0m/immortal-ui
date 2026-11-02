import { Cpu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { DeviceStatus, type DeviceState } from "@/components/iot/device-status";
import { SignalStrength } from "@/components/iot/signal-strength";

export type Device = {
  id: string;
  name: string;
  location: string;
  state: DeviceState;
  protocol: string;
  rssi: number | null;
  lastSeen: string;
  battery: number | null;
};
export function DeviceCard({
  device,
  onOpen,
}: {
  device: Device;
  onOpen?: (device: Device) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <span className="surface-control flex size-10 items-center justify-center">
            <Cpu className="size-4" />
          </span>
          <DeviceStatus state={device.state} />
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="font-medium">{device.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{device.location}</p>
        <div className="surface-inset mt-5 grid grid-cols-2 gap-4 p-4 text-xs">
          <div>
            <p className="mb-2 text-muted-foreground">Connection</p>
            <SignalStrength rssi={device.rssi} />
          </div>
          <div>
            <p className="mb-2 text-muted-foreground">Battery</p>
            <span className="tabular-nums">
              {device.battery !== null && Number.isFinite(device.battery)
                ? `${Math.max(0, Math.min(100, device.battery))}%`
                : "Unavailable"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <span className="font-mono text-[10px] text-muted-foreground">
          {device.id}
        </span>
        {onOpen && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Open ${device.name}`}
            onClick={() => onOpen(device)}
          >
            <ChevronRight />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
