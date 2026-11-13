import type { DeviceState } from "@/components/iot/device-status";

export type Device = {
  id: string;
  name: string;
  location: string;
  state: DeviceState;
  protocol: string;
  rssi: number | null;
  lastSeen: string;
  battery: number | null;
  product?: string;
  serialNumber?: string;
  model?: string;
  description?: string;
  tags?: string[];
  image?: { src: string; alt: string };
  hardwareVersion?: string;
  firmwareVersion?: string;
  installedAt?: string;
  batteryVoltage?: number | null;
  power?: "normal" | "low" | "critical" | "charging" | "external";
  operational?: "normal" | "degraded" | "faulty" | "silent" | "unknown";
  deployment?: "undeployed" | "deployed" | "inMaintenance" | "retired";
  admission?: "active" | "suspended" | "revoked";
};

export type DeviceService = {
  id: string;
  label: string;
  disabledReason?: string;
};
