import type { FleetDevice } from "@/components/blocks/fleet-overview";
import type {
  DeviceGroup,
  GroupMember,
} from "@/components/blocks/device-groups";
import type { DeviceAlert } from "@/components/blocks/alert-console";
import type { DeviceReading } from "@/components/blocks/device-detail";
import type { SoilLayer } from "@/components/blocks/soil-profile";
import type {
  TelemetryMetric,
  TelemetryQuery,
  TelemetryQueryResult,
} from "@/components/blocks/telemetry-explorer";

export const demoNow = Date.UTC(2026, 10, 10, 7, 30);
export const soilSample = demoNow - 10 * 60_000;
export const hour = 60 * 60_000;
export const profileDeviceId = "SOIL-N02";

export function deviceLink(id: string) {
  return "#/blocks/device-detail?device=" + encodeURIComponent(id);
}

export function telemetryLink(metric?: string) {
  return (
    "#/blocks/telemetry-explorer" +
    (metric ? "?metric=" + encodeURIComponent(metric) : "")
  );
}

type DemoDevice = FleetDevice & {
  online: boolean | null;
  lastSeenAt: number | null;
};

export const stationDevices: DemoDevice[] = [
  {
    id: profileDeviceId,
    name: "北区二号土壤剖面仪",
    product: "多层土壤监测仪",
    serialNumber: "SP-2025-N02",
    model: "SP-3D",
    description:
      "观测地表以下多个深度的含水率与土壤温度，用于灌溉判断和土壤水分剖面分析。",
    tags: ["土壤监测", "北区 02 样地", "滴灌对照"],
    hardwareVersion: "Rev. B",
    installedAt: "2025-04-13",
    deployment: "deployed",
    location: "青禾试验站 / 北区 / 02 样地",
    groups: ["北区 02 样地"],
    state: "online",
    online: true,
    protocol: "MQTT",
    rssi: -61,
    battery: 82,
    lastSeen: "07:21 UTC",
    lastSeenAt: soilSample + 60_000,
  },
  {
    id: "WX-N01",
    name: "北区田间气象站",
    product: "伏羲一体化农情监测站",
    serialNumber: "WS-2025-N01",
    model: "FX-003",
    description:
      "集成气温、湿度、风速、风向与降雨观测，为田间环境评估和农事决策提供连续数据。",
    tags: ["气象监测", "户外", "重点观测"],
    image: {
      src: "./examples/weather-station.png",
      alt: "一体化农情监测站实物图",
    },
    hardwareVersion: "Rev. B",
    firmwareVersion: "2.4.1",
    installedAt: "2025-04-13",
    operational: "normal",
    deployment: "deployed",
    power: "normal",
    location: "青禾试验站 / 北区",
    groups: ["北区"],
    state: "online",
    online: true,
    protocol: "MQTT",
    rssi: -68,
    battery: 96,
    lastSeen: "07:27 UTC",
    lastSeenAt: demoNow - 3 * 60_000,
  },
  {
    id: "IRR-N04",
    name: "北区四号灌溉阀",
    product: "灌溉控制器",
    location: "青禾试验站 / 北区 / 02 样地",
    groups: ["北区 02 样地"],
    state: "warning",
    online: true,
    protocol: "MQTT",
    rssi: -84,
    battery: 28,
    lastSeen: "07:18 UTC",
    lastSeenAt: demoNow - 12 * 60_000,
  },
  {
    id: "SOIL-S01",
    name: "南区一号土壤剖面仪",
    product: "多层土壤监测仪",
    location: "青禾试验站 / 南区",
    groups: ["南区"],
    state: "offline",
    online: false,
    protocol: "MQTT",
    rssi: null,
    battery: 32,
    lastSeen: "05:16 UTC",
    lastSeenAt: demoNow - 134 * 60_000,
  },
  {
    id: "GW-N01",
    name: "北区边缘网关",
    product: "边缘网关",
    location: "青禾试验站 / 北区",
    groups: ["北区"],
    state: "online",
    online: true,
    protocol: "TCP",
    rssi: null,
    battery: null,
    lastSeen: "07:29 UTC",
    lastSeenAt: demoNow - 60_000,
  },
  {
    id: "LVL-S01",
    name: "南区蓄水罐液位计",
    product: "液位计",
    location: "青禾试验站 / 南区",
    groups: ["南区"],
    state: "online",
    online: true,
    protocol: "MQTT",
    rssi: -63,
    battery: 70,
    lastSeen: "07:28 UTC",
    lastSeenAt: demoNow - 2 * 60_000,
  },
  {
    id: "WX-S01",
    name: "南区田间气象站",
    product: "田间气象站",
    location: "青禾试验站 / 南区",
    groups: ["南区"],
    state: "online",
    online: true,
    protocol: "MQTT",
    rssi: -72,
    battery: 88,
    lastSeen: "07:26 UTC",
    lastSeenAt: demoNow - 4 * 60_000,
  },
  {
    id: "RAIN-E01",
    name: "东侧翻斗雨量计",
    product: "雨量计",
    location: "青禾试验站 / 东侧试验区",
    groups: ["东侧试验区"],
    state: "provisioning",
    online: null,
    protocol: "TCP",
    rssi: null,
    battery: null,
    lastSeen: "",
    lastSeenAt: null,
  },
  {
    id: "SOIL-N03",
    name: "北区三号土壤剖面仪",
    product: "多层土壤监测仪",
    location: "青禾试验站 / 北区 / 03 样地",
    groups: ["北区 03 样地"],
    state: "online",
    online: true,
    protocol: "MQTT",
    rssi: -64,
    battery: 78,
    lastSeen: "07:23 UTC",
    lastSeenAt: demoNow - 7 * 60_000,
  },
  {
    id: "PUMP-S01",
    name: "南区一号循环泵",
    product: "灌溉控制器",
    location: "青禾试验站 / 南区",
    groups: ["南区"],
    state: "offline",
    online: false,
    protocol: "TCP",
    rssi: null,
    battery: null,
    lastSeen: "06:52 UTC",
    lastSeenAt: demoNow - 38 * 60_000,
  },
];

function member(id: string): GroupMember {
  const device = stationDevices.find((item) => item.id === id)!;
  return {
    id,
    name: device.name,
    product: device.product,
    href: deviceLink(id),
    online: device.online,
  };
}

export const stationGroups: DeviceGroup[] = [
  {
    id: "station",
    name: "青禾试验站",
    members: [],
    children: [
      {
        id: "north",
        name: "北区",
        description: "北侧田间气象与接入设备。",
        members: [member("WX-N01"), member("GW-N01")],
        children: [
          {
            id: "plot-n02",
            name: "北区 02 样地",
            description: "土壤剖面监测和滴灌对照样地。",
            members: [member(profileDeviceId), member("IRR-N04")],
          },
          {
            id: "plot-n03",
            name: "北区 03 样地",
            members: [member("SOIL-N03")],
          },
        ],
      },
      {
        id: "south",
        name: "南区",
        description: "土壤观测、气象和储水设施。",
        members: ["SOIL-S01", "LVL-S01", "WX-S01", "PUMP-S01"].map(member),
      },
      { id: "east", name: "东侧试验区", members: [member("RAIN-E01")] },
    ],
  },
  { id: "staging", name: "待安装设备", members: [] },
];

export const soilLayers: SoilLayer[] = [
  {
    id: "10",
    depthCm: 10,
    moisture: 19.3,
    temperature: 20.6,
    historyHref: telemetryLink("water-10"),
  },
  {
    id: "30",
    depthCm: 30,
    moisture: 24.7,
    temperature: 18.1,
    historyHref: telemetryLink("water-30"),
  },
  {
    id: "60",
    depthCm: 60,
    moisture: null,
    temperature: 16.8,
    historyHref: telemetryLink("water-60"),
  },
];

export const soilMetrics: TelemetryMetric[] = [
  { id: "water-10", label: "含水率 · 10 cm", unit: "%" },
  { id: "water-30", label: "含水率 · 30 cm", unit: "%" },
  { id: "water-60", label: "含水率 · 60 cm", unit: "%" },
  { id: "temp-30", label: "土壤温度 · 30 cm", unit: "°C" },
];

export const soilReadings: DeviceReading[] = [
  {
    id: "water-30",
    label: "含水率 · 30 cm",
    value: 24.7,
    unit: "%",
    quality: "good",
  },
  {
    id: "temp-30",
    label: "土壤温度 · 30 cm",
    value: 18.1,
    unit: "°C",
    quality: "good",
  },
  {
    id: "water-60",
    label: "含水率 · 60 cm",
    value: null,
    unit: "%",
    quality: "bad",
    reason: "探针返回无效值",
  },
].map((reading): DeviceReading => ({
  ...reading,
  quality: reading.value === null ? "bad" : "good",
  sampledAt: soilSample,
  expectedInterval: 600,
  source: "埋地探针",
  historyHref: telemetryLink(reading.id),
}));

const seriesEndValues = [19.3, 24.7, 29.6, 18.1];

export function soilHistory(query: TelemetryQuery): TelemetryQueryResult {
  return {
    series: soilMetrics
      .filter((metric) => query.metricIds.includes(metric.id))
      .map((metric) => {
        const index = soilMetrics.indexOf(metric);
        const data = Array.from({ length: 7 * 24 + 1 }, (_, offset) => {
          const timestamp = soilSample - offset * hour;
          const drift =
            Math.sin(offset / 4) * (1.4 - index * 0.25) +
            (Math.cos(offset / 8) - 1) * 2.2;
          const missing = index === 2 && offset === 0;
          return {
            timestamp,
            value: missing
              ? null
              : Number((seriesEndValues[index] + drift).toFixed(1)),
          };
        }).filter(
          (point, offset) =>
            point.timestamp >= query.from &&
            point.timestamp <= query.to &&
            !(index === 0 && offset >= 8 && offset <= 10),
        );
        return {
          ...metric,
          data,
          precision: 1,
          styleIndex: index,
          domain:
            metric.unit === "%" ? { min: 10, max: 35 } : { min: 10, max: 25 },
        };
      }),
    maxGapMs: 2 * hour,
    events: [
      { id: "drip", at: soilSample - 13 * hour, label: "北区 02 样地灌溉开始" },
    ],
  };
}

export const stationAlerts: DeviceAlert[] = [
  {
    id: "A-103",
    title: "南区土壤探针停止上报",
    deviceName: "南区一号土壤剖面仪",
    deviceId: "SOIL-S01",
    deviceHref: deviceLink("SOIL-S01"),
    severity: "critical",
    status: "active",
    active: true,
    acknowledged: false,
    time: "05:46 UTC",
    occurredAt: Date.UTC(2026, 10, 10, 5, 46),
    source: "采样中断监测",
    description: "设备已超过两个采样周期没有上报。请检查网关连接和探针供电。",
  },
  {
    id: "A-104",
    title: "60 cm 探针读数无效",
    deviceName: "北区二号土壤剖面仪",
    deviceId: profileDeviceId,
    deviceHref: deviceLink(profileDeviceId),
    severity: "warning",
    status: "active",
    acknowledged: false,
    time: "07:20 UTC",
    occurredAt: soilSample,
    source: "土壤测点质量检查",
    description: "60 cm 含水率读数未通过设备校验。其余探针仍在上报。",
  },
  {
    id: "A-102",
    title: "灌溉阀电量偏低",
    deviceName: "北区四号灌溉阀",
    deviceId: "IRR-N04",
    deviceHref: deviceLink("IRR-N04"),
    severity: "warning",
    status: "acknowledged",
    active: true,
    acknowledged: true,
    time: "07:02 UTC",
    occurredAt: Date.UTC(2026, 10, 10, 7, 2),
    acknowledgedAt: Date.UTC(2026, 10, 10, 7, 8),
    acknowledgedBy: "值班员",
    source: "执行器低电量监测",
    description: "最近回读电量为 28%，待现场巡检。",
  },
  {
    id: "A-101",
    title: "北区网关连接中断",
    deviceName: "北区边缘网关",
    deviceId: "GW-N01",
    deviceHref: deviceLink("GW-N01"),
    severity: "info",
    status: "cleared",
    active: false,
    acknowledged: false,
    time: "06:12 UTC",
    occurredAt: Date.UTC(2026, 10, 10, 6, 12),
    clearedAt: Date.UTC(2026, 10, 10, 6, 30),
    source: "网关心跳监测",
    description: "网关已重新连接，最近一轮心跳正常。",
  },
];
