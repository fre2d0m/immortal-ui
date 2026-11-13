import { DataCardsPreview } from "@/components/DataCardsPreview";
import { DevicePreview } from "@/components/DevicePreview";
import { firstBatchNames } from "@/content/first-batch";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { FoundationExtensions } from "@/components/FoundationExtensions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceStatus } from "@/components/iot/device-status";
import { SignalStrength } from "@/components/iot/signal-strength";

import { ThresholdControl } from "@/components/iot/threshold-control";

const FirstBatchPreview = lazy(() =>
  import("@/components/FirstBatchPreview").then((module) => ({
    default: module.FirstBatchPreview,
  })),
);
const newNames = new Set([
  "control-mode",
  "actuator-switch",
  "setpoint-control",
  "actuator-control",
  "command-status",
  "alert-card",
  "event-timeline",
  "automation-note",
]);
const hasExtractedPreview = (name: string) => newNames.has(name);

const ExtractedPreview = lazy(() =>
  import("@/components/ExtractedPreview").then((module) => ({
    default: module.ExtractedPreview,
  })),
);

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
      <FoundationExtensions />
    </div>
  );
}

export function RegistryPreview({ name }: { name: string }) {
  const [range, setRange] = useState({ low: 10, high: 35 });
  if (firstBatchNames.has(name))
    return (
      <Suspense fallback={<p role="status">正在加载组件…</p>}>
        <FirstBatchPreview key={name} name={name} />
      </Suspense>
    );
  if (hasExtractedPreview(name))
    return (
      <Suspense
        fallback={
          <p role="status" className="text-sm text-muted-foreground">
            正在加载组件…
          </p>
        }
      >
        <ExtractedPreview name={name} />
      </Suspense>
    );
  if (name === "device-status")
    return (
      <div className="flex flex-wrap justify-center gap-8 py-10">
        {(
          ["online", "warning", "offline", "provisioning", "unknown"] as const
        ).map((state) => (
          <DeviceStatus key={state} state={state} />
        ))}
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
  if (name === "metric-card") return <DataCardsPreview kind="metric" />;
  if (name === "indicator-card") return <DataCardsPreview kind="indicator" />;
  if (name === "device-card") return <DevicePreview kind="card" />;
  if (name === "device-profile") return <DevicePreview kind="profile" />;
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
  return <FoundationsPreview />;
}
