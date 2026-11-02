export type CatalogItem = {
  name: string;
  title: string;
  kind: "component" | "block";
  description: string;
  code: string;
  props: string[];
};
export const catalog: CatalogItem[] = [
  {
    name: "device-status",
    title: "Device status",
    kind: "component",
    description:
      "Give connectivity a clear, consistent language. Every state pairs a light with a readable label.",
    code: '<DeviceStatus state="online" />',
    props: [
      'state: "online" | "warning" | "offline" | "provisioning"',
      "label?: string — override the visible label",
      "className?: string",
    ],
  },
  {
    name: "signal-strength",
    title: "Signal strength",
    kind: "component",
    description:
      "Show radio signal strength with dBm values. Missing measurements have their own state.",
    code: "<SignalStrength rssi={-63} />",
    props: [
      "rssi: number | null — radio signal in dBm",
      "className?: string",
      "RSSI ranges are display heuristics; adapt them to your radio technology.",
    ],
  },
  {
    name: "telemetry-chart",
    title: "Telemetry chart",
    kind: "component",
    description:
      "Lightweight time-series graphics. Missing samples stay visible as gaps; readings remain accessible as a table.",
    code: '<TelemetryChart label="Temperature" unit="°C" data={readings} />',
    props: [
      "data: { timestamp: number; value: number | null }[]",
      "label: string; unit?: string",
      "showTable?: boolean — default true",
      "Timestamps are milliseconds; the displayed time zone is UTC.",
    ],
  },
  {
    name: "telemetry-card",
    title: "Telemetry card",
    kind: "component",
    description:
      "One measurement, its unit, and the context needed to understand it. Includes loading and unavailable states.",
    code: '<TelemetryCard label="Temperature" value={23.8} unit="°C" state="online" />',
    props: [
      "label: string; value: number | null; unit: string",
      "state?: DeviceState; loading?: boolean",
      "description?: string; data?: TelemetryPoint[]",
    ],
  },
  {
    name: "device-card",
    title: "Device card",
    kind: "component",
    description:
      "A compact device identity with connectivity, battery, and a detail action.",
    code: "<DeviceCard device={device} onOpen={openDevice} />",
    props: [
      "device: Device — identity, location, state, protocol, signal, battery, lastSeen",
      "onOpen?: (device: Device) => void",
      "Use null for unavailable battery and RSSI values.",
    ],
  },
  {
    name: "threshold-control",
    title: "Threshold control",
    kind: "component",
    description:
      "Set an operating range with a dual-handle slider and precise numeric inputs. Validation stays in view.",
    code: '<ThresholdControl value={range} onValueChange={setRange} min={-20} max={80} unit="°C" />',
    props: [
      "value: { low: number; high: number }",
      "onValueChange: (value: Threshold) => void",
      "min?: number; max?: number; step?: number; unit?: string; disabled?: boolean",
    ],
  },
  {
    name: "fleet-overview",
    title: "Fleet overview",
    kind: "block",
    description:
      "An operational starting point: throughput, inventory, filters, and device details in one composable block.",
    code: '<FleetOverview devices={devices} telemetry={traffic} title="North facility" />',
    props: [
      "devices: Device[]; telemetry?: TelemetryPoint[]",
      "title?: string; subtitle?: string",
      "onDeviceSelect?: (device: Device) => void",
      "Search and status filters run locally. Pass only the authorized device inventory.",
    ],
  },
  {
    name: "device-control",
    title: "Device control",
    kind: "block",
    description:
      "Apply device configuration through your own adapter. Includes validation, pending, failure, and offline states.",
    code: "<DeviceControl deviceId={device.id} deviceName={device.name} online={true} configuration={config} onApply={saveConfig} />",
    props: [
      "configuration: DeviceConfiguration",
      "deviceId: string; deviceName: string; online: boolean",
      "onApply: (configuration: DeviceConfiguration) => Promise<void>",
      "Resolve only after persistence; reject on failure. Update configuration after success.",
    ],
  },
  {
    name: "alert-console",
    title: "Alert console",
    kind: "block",
    description:
      "Turn device events into a focused review queue with explicit acknowledgement and accessible severity labels.",
    code: "<AlertConsole alerts={alerts} onAcknowledge={acknowledgeAlert} />",
    props: [
      "alerts: DeviceAlert[]",
      "onAcknowledge: (id: string) => Promise<void>",
      "The parent updates acknowledged after the request succeeds.",
    ],
  },
];
