"use client";

import { MetricCard } from "@/components/iot/metric-card";
import { DeviceProfile, type Device } from "@/components/iot/device-profile";

import { ArrowUpRight, ChartLine } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type MeasurementTrust } from "@/components/iot/data-freshness";

import {
  EventTimeline,
  type TimelineEvent,
} from "@/components/iot/event-timeline";
import { timeLabel } from "@/lib/iot-model";

export type DeviceIdentity = Pick<Device, "id" | "name"> &
  Partial<Omit<Device, "id" | "name" | "state">> & {
    online: boolean | null;
    lastSeenAt?: number | null;
    interfaceName?: string;
  };
export type DeviceReading = MeasurementTrust & {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  precision?: number;
  historyHref?: string;
};
export type DeviceProperty = {
  id: string;
  label: string;
  value: string | null;
};

export function DeviceDetail({
  device,
  readings,
  properties = [],
  events = [],
  now,
  historyHref,
  profileHref,
  onConfigure,
}: {
  device: DeviceIdentity;
  readings: DeviceReading[];
  properties?: DeviceProperty[];
  events?: TimelineEvent[];
  now: number;
  historyHref?: string;
  profileHref?: string;
  onConfigure?: (device: Device) => void;
}) {
  return (
    <div className="@container min-w-0 space-y-8">
      <DeviceProfile
        headingLevel="h2"
        device={{
          ...device,
          state:
            device.online === null
              ? "unknown"
              : device.online
                ? "online"
                : "offline",
          location: device.location ?? "",
          protocol: device.interfaceName ?? device.protocol ?? "",
          rssi: device.rssi ?? null,
          battery: device.battery ?? null,
          lastSeen:
            device.lastSeen ??
            (device.lastSeenAt == null
              ? "未知"
              : timeLabel(device.lastSeenAt) + " UTC"),
        }}
        onConfigure={onConfigure}
      />

      <section className="space-y-5" aria-label="设备数据">
        <Tabs defaultValue="telemetry" className="min-w-0 gap-5">
          <TabsList
            className="h-auto! max-w-full flex-wrap"
            aria-label="设备详情"
          >
            <TabsTrigger className="min-h-10" value="telemetry">
              遥测
            </TabsTrigger>
            <TabsTrigger className="min-h-10" value="properties">
              静态属性
            </TabsTrigger>
            <TabsTrigger className="min-h-10" value="events">
              事件
            </TabsTrigger>
          </TabsList>
          <TabsContent value="telemetry" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-medium">
                {device.online === false ? "最后观测快照" : "最近观测"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileHref && (
                  <Button asChild variant="outline" className="min-h-10">
                    <a href={profileHref}>
                      土壤剖面 <ArrowUpRight aria-hidden="true" />
                    </a>
                  </Button>
                )}
                {historyHref && (
                  <Button asChild className="min-h-10">
                    <a href={historyHref}>
                      <ChartLine aria-hidden="true" /> 历史查询
                    </a>
                  </Button>
                )}
              </div>
            </div>
            {readings.length ? (
              <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
                {readings.map((reading) => (
                  <MetricCard
                    key={reading.id}
                    definition={{
                      id: reading.id,
                      label: reading.label,
                      subject: device.name,
                      type: "number",
                      unit: reading.unit,
                      precision: reading.precision,
                      expectedInterval: reading.expectedInterval,
                    }}
                    observation={{
                      value: reading.value,
                      sampledAt: reading.sampledAt ?? null,
                      receivedAt: reading.receivedAt,
                      quality: reading.quality,
                      reason: reading.reason,
                    }}
                    source={{
                      device: reading.source || device.name,
                      offline: device.online === false,
                    }}
                    now={now}
                    historyHref={reading.historyHref}
                  />
                ))}
              </div>
            ) : (
              <p className="surface-inset p-5 text-muted-foreground">
                暂无观测读数
              </p>
            )}
          </TabsContent>
          <TabsContent value="properties">
            {properties.length ? (
              <dl className="surface-inset grid gap-5 p-5 @xl:grid-cols-2 @4xl:grid-cols-3">
                {properties.map((property) => (
                  <div key={property.id} className="min-w-0">
                    <dt className="text-sm text-muted-foreground">
                      {property.label}
                    </dt>
                    <dd className="mt-1.5 font-medium wrap-break-word">
                      {property.value ?? "未提供"}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="surface-inset p-5 text-muted-foreground">
                暂无静态属性
              </p>
            )}
          </TabsContent>
          <TabsContent value="events">
            <div className="surface-inset p-5">
              <EventTimeline label="设备事件" events={events} />
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
