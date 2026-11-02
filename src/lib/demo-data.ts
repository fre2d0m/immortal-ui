import type { Device } from "@/components/iot/device-card";
import type { TelemetryPoint } from "@/components/iot/telemetry-chart";
import type { DeviceAlert } from "@/components/blocks/alert-console";
import type { DeviceConfiguration } from "@/components/blocks/device-control";

// Fixed, visibly labelled demo data. No network, polling, or invented live connection.
export const demoDevices: Device[] = [
  {
    id: "ENV-001",
    name: "Ambient sensor",
    location: "North greenhouse",
    state: "online",
    protocol: "LoRaWAN",
    rssi: -52,
    lastSeen: "12 sec ago",
    battery: 94,
  },
  {
    id: "PWR-002",
    name: "Energy meter",
    location: "Main distribution",
    state: "online",
    protocol: "MQTT",
    rssi: -63,
    lastSeen: "8 sec ago",
    battery: null,
  },
  {
    id: "VIB-003",
    name: "Vibration sensor",
    location: "Pump station A",
    state: "warning",
    protocol: "LoRaWAN",
    rssi: -76,
    lastSeen: "24 sec ago",
    battery: 18,
  },
  {
    id: "GW-004",
    name: "Edge gateway",
    location: "West building",
    state: "online",
    protocol: "MQTT",
    rssi: -45,
    lastSeen: "3 sec ago",
    battery: null,
  },
  {
    id: "FLW-005",
    name: "Flow meter",
    location: "Irrigation line",
    state: "offline",
    protocol: "Modbus",
    rssi: null,
    lastSeen: "42 min ago",
    battery: 61,
  },
  {
    id: "ENV-006",
    name: "Soil sensor",
    location: "East greenhouse",
    state: "online",
    protocol: "LoRaWAN",
    rssi: -66,
    lastSeen: "18 sec ago",
    battery: 82,
  },
];
export const demoTraffic: TelemetryPoint[] = [
  44, 49, 45, 68, 62, 65, 51, 58, 49, 55, 72, 68, 92, 84, 89, 72, 78, 62, 70,
  66, 85, 91, 82, 94,
].map((value, i) => ({ timestamp: Date.UTC(2026, 9, 28, 8, i * 5), value }));
export const demoTemperature = demoTraffic.map((point, i) => ({
  ...point,
  value: Number((22 + Math.sin(i / 4) * 1.2 + i / 30).toFixed(1)),
}));
export const demoAlerts: DeviceAlert[] = [
  {
    id: "alert-1",
    title: "Battery running low",
    deviceName: "VIB-003 · Vibration sensor",
    severity: "warning",
    time: "09:42 UTC",
    description:
      "Battery is at 18%. Schedule a replacement at the next maintenance visit.",
    acknowledged: false,
  },
  {
    id: "alert-2",
    title: "Heartbeat missing",
    deviceName: "FLW-005 · Flow meter",
    severity: "critical",
    time: "09:18 UTC",
    description:
      "No heartbeat was received within the configured 30-minute interval.",
    acknowledged: false,
  },
  {
    id: "alert-3",
    title: "Gateway reconnected",
    deviceName: "GW-004 · Edge gateway",
    severity: "info",
    time: "08:56 UTC",
    description:
      "The gateway connection was restored and buffered readings were received.",
    acknowledged: true,
  },
];
export const demoConfiguration: DeviceConfiguration = {
  mode: "balanced",
  interval: 30,
  watchdog: true,
  threshold: { low: 10, high: 35 },
};
