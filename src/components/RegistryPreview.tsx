import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceStatus } from "@/components/iot/device-status";
import { SignalStrength } from "@/components/iot/signal-strength";
import { TelemetryCard } from "@/components/iot/telemetry-card";
import { TelemetryChart } from "@/components/iot/telemetry-chart";
import { DeviceCard } from "@/components/iot/device-card";
import { ThresholdControl } from "@/components/iot/threshold-control";
import { FleetOverview } from "@/components/blocks/fleet-overview";
import { DeviceControl } from "@/components/blocks/device-control";
import { AlertConsole } from "@/components/blocks/alert-console";
import {
  demoDevices,
  demoTraffic,
  demoTemperature,
  demoConfiguration,
  demoAlerts,
} from "@/lib/demo-data";

export function FoundationsPreview() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap gap-3">
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="foundation-name">Device name</Label>
          <Input id="foundation-name" placeholder="e.g. Ambient sensor" />
        </div>
        <div className="flex items-center justify-between gap-5">
          <Label htmlFor="foundation-switch">Enable reporting</Label>
          <Switch
            id="foundation-switch"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex min-h-10 items-center gap-3">
          <Checkbox id="foundation-alert" defaultChecked />
          <Label htmlFor="foundation-alert">Receive alerts</Label>
        </div>
      </div>
    </div>
  );
}

export function RegistryPreview({ name }: { name: string }) {
  const [range, setRange] = useState({ low: 10, high: 35 });
  const [configuration, setConfiguration] = useState(demoConfiguration);
  const [alerts, setAlerts] = useState(demoAlerts);
  const [offline, setOffline] = useState(false);
  const [fail, setFail] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [message, setMessage] = useState("");
  const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 500));
  if (name === "device-status")
    return (
      <div className="flex flex-wrap justify-center gap-8 py-10">
        {(["online", "warning", "offline", "provisioning"] as const).map(
          (state) => (
            <DeviceStatus key={state} state={state} />
          ),
        )}
      </div>
    );
  if (name === "signal-strength")
    return (
      <div className="flex flex-wrap justify-center gap-9 py-10">
        {[-48, -63, -75, -88, null].map((rssi) => (
          <SignalStrength key={String(rssi)} rssi={rssi} />
        ))}
      </div>
    );
  if (name === "telemetry-chart")
    return (
      <div className="surface-inset p-6">
        <TelemetryChart
          label="Ambient temperature"
          unit="°C"
          data={demoTemperature.map((point, i) =>
            i === 9 || i === 10 ? { ...point, value: null } : point,
          )}
        />
      </div>
    );
  if (name === "telemetry-card")
    return (
      <div className="mx-auto max-w-md">
        <TelemetryCard
          label="Ambient temperature"
          value={23.8}
          unit="°C"
          description="North greenhouse · latest sample"
          data={demoTemperature}
        />
      </div>
    );
  if (name === "device-card")
    return (
      <div className="mx-auto max-w-sm">
        <DeviceCard
          device={demoDevices[0]}
          onOpen={(device) =>
            setMessage(
              `${device.name} selected. The onOpen callback receives the full device.`,
            )
          }
        />
        {message && (
          <p role="status" className="mt-4 text-xs text-muted-foreground">
            {message}
          </p>
        )}
      </div>
    );
  if (name === "threshold-control")
    return (
      <div className="surface-inset mx-auto max-w-lg p-6">
        <ThresholdControl
          value={range}
          onValueChange={setRange}
          min={-20}
          max={80}
          unit="°C"
        />
      </div>
    );
  if (name === "fleet-overview")
    return (
      <div className="space-y-4">
        <div className="flex min-h-10 items-center gap-3">
          <Switch id="empty-fleet" checked={empty} onCheckedChange={setEmpty} />
          <Label htmlFor="empty-fleet">Preview empty inventory</Label>
        </div>
        <FleetOverview
          devices={empty ? [] : demoDevices}
          telemetry={empty ? [] : demoTraffic}
          title="North facility"
          subtitle="Fixed demo snapshot"
        />
      </div>
    );
  if (name === "device-control")
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs">
          <div className="flex min-h-10 items-center gap-3">
            <Switch
              id="demo-offline"
              checked={offline}
              onCheckedChange={setOffline}
            />
            <Label htmlFor="demo-offline">Offline device</Label>
          </div>
          <div className="flex min-h-10 items-center gap-3">
            <Switch
              id="demo-failure"
              checked={fail}
              onCheckedChange={setFail}
            />
            <Label htmlFor="demo-failure">Simulate request failure</Label>
          </div>
        </div>
        <DeviceControl
          deviceId="ENV-001"
          deviceName="Ambient sensor"
          online={!offline}
          configuration={configuration}
          onApply={async (next) => {
            await delay();
            if (fail)
              throw new Error(
                "Demo request failed. Your changes are still available to retry.",
              );
            setConfiguration(next);
          }}
        />
      </div>
    );
  if (name === "alert-console")
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-h-10 items-center gap-3">
            <Switch
              id="alert-failure"
              checked={fail}
              onCheckedChange={setFail}
            />
            <Label htmlFor="alert-failure">Simulate request failure</Label>
          </div>
          <Button variant="ghost" onClick={() => setAlerts(demoAlerts)}>
            Reset demo
          </Button>
        </div>
        <AlertConsole
          alerts={alerts}
          onAcknowledge={async (id) => {
            await delay();
            if (fail)
              throw new Error("Demo acknowledgement failed. Please retry.");
            setAlerts((current) =>
              current.map((alert) =>
                alert.id === id ? { ...alert, acknowledged: true } : alert,
              ),
            );
          }}
        />
      </div>
    );
  return <FoundationsPreview />;
}
