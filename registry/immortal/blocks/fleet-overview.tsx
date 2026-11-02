"use client";

import { useMemo, useState } from "react";
import { Activity, Cpu, Radio, Search, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DeviceStatus } from "@/components/iot/device-status";
import { SignalStrength } from "@/components/iot/signal-strength";
import {
  TelemetryChart,
  type TelemetryPoint,
} from "@/components/iot/telemetry-chart";
import type { Device } from "@/components/iot/device-card";

export function FleetOverview({
  devices,
  telemetry = [],
  title = "Network overview",
  subtitle,
  onDeviceSelect,
}: {
  devices: Device[];
  telemetry?: TelemetryPoint[];
  title?: string;
  subtitle?: string;
  onDeviceSelect?: (device: Device) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Device | null>(null);
  const shown = useMemo(
    () =>
      devices.filter(
        (device) =>
          (filter === "all" || device.state === filter) &&
          `${device.name} ${device.id} ${device.location}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [devices, query, filter],
  );
  const online = devices.filter((d) => d.state === "online").length;
  const attention = devices.filter((d) => d.state === "warning").length;
  const offline = devices.filter((d) => d.state === "offline").length;
  const metrics = [
    { label: "Registered devices", value: devices.length, icon: Cpu },
    { label: "Online", value: online, icon: Radio },
    { label: "Need attention", value: attention, icon: Activity },
    { label: "Offline", value: offline, icon: WifiOff },
  ];
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-medium tracking-tight">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <span className="surface-inset px-3 py-2 text-xs text-muted-foreground">
            {devices.length} endpoints
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div key={label} className="surface-inset p-4">
              <div className="mb-4 flex items-center justify-between gap-2 text-muted-foreground">
                <span className="text-sm">{label}</span>
                <Icon className="size-3.5" />
              </div>
              <span className="text-3xl font-medium tabular-nums tracking-[-0.05em]">
                {value.toString().padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
        <div className="surface-inset p-5">
          <TelemetryChart
            label="Messages received / minute"
            unit="msg"
            data={telemetry}
            showTable={false}
          />
        </div>
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-medium">
              Device inventory{" "}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {shown.length}
              </span>
            </h3>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-52">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9!"
                  aria-label="Search devices"
                  placeholder="Search devices…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger
                  aria-label="Filter device status"
                  className="w-36"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="warning">Attention</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="provisioning">Provisioning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left text-xs">
              <caption className="sr-only">Device inventory</caption>
              <thead className="text-sm tracking-wider text-muted-foreground uppercase">
                <tr>
                  {["Device", "Status", "Protocol", "Signal", "Last seen"].map(
                    (name) => (
                      <th
                        key={name}
                        className="border-b border-border/60 px-3 py-3 font-normal first:pl-0"
                      >
                        {name}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {shown.map((device) => (
                  <tr
                    key={device.id}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="py-3.5 pr-3">
                      <button
                        type="button"
                        className="flex min-h-10 items-center gap-3 text-left hover:opacity-75"
                        onClick={() => {
                          setSelected(device);
                          onDeviceSelect?.(device);
                        }}
                      >
                        <span className="surface-control flex size-9 shrink-0 items-center justify-center rounded-lg!">
                          <Cpu className="size-4 text-muted-foreground" />
                        </span>
                        <span>
                          <span className="block font-medium">
                            {device.name}
                          </span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {device.id} · {device.location}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3">
                      <DeviceStatus state={device.state} />
                    </td>
                    <td className="px-3 text-muted-foreground">
                      {device.protocol}
                    </td>
                    <td className="px-3">
                      <SignalStrength rssi={device.rssi} />
                    </td>
                    <td className="px-3 whitespace-nowrap text-muted-foreground">
                      {device.lastSeen}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!shown.length && (
            <div className="py-10 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                {devices.length
                  ? "No devices match your filters."
                  : "No devices registered yet."}
              </p>
              {devices.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              {selected?.id} · {selected?.location}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <dl className="surface-inset grid grid-cols-2 gap-y-5 p-5 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <DeviceStatus state={selected.state} />
              </dd>
              <dt className="text-muted-foreground">Connection</dt>
              <dd>{selected.protocol}</dd>
              <dt className="text-muted-foreground">Signal</dt>
              <dd>
                <SignalStrength rssi={selected.rssi} />
              </dd>
              <dt className="text-muted-foreground">Battery</dt>
              <dd>
                {selected.battery === null
                  ? "Unavailable"
                  : `${selected.battery}%`}
              </dd>
              <dt className="text-muted-foreground">Last seen</dt>
              <dd>{selected.lastSeen}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
