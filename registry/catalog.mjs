const component = (name, title, description, dependencies, extra = {}) => ({
  name,
  title,
  description,
  type: "registry:component",
  categories: ["iot"],
  registryDependencies: dependencies,
  dependencies: ["cn"],
  files: [
    {
      path: `registry/immortal/components/${name}.tsx`,
      type: "registry:component",
      target: `@components/iot/${name}.tsx`,
    },
  ],
  ...extra,
});
const block = (name, title, description, dependencies) => ({
  name,
  title,
  description,
  type: "registry:block",
  categories: ["iot", "blocks"],
  registryDependencies: dependencies,
  files: [
    {
      path: `registry/immortal/blocks/${name}.tsx`,
      type: "registry:component",
      target: `@components/blocks/${name}.tsx`,
    },
  ],
  dependencies: ["lucide-react", "cn"],
});
// `immortal:` is expanded into an absolute URL by the build, never shipped to consumers.
export const items = [
  {
    name: "graphite",
    title: "Graphite Instrument",
    type: "registry:style",
    description:
      "A tactile light and dark theme for shadcn/ui. Raised panels, recessed wells, and quiet controls.",
    categories: ["theme"],
    dependencies: ["tw-animate-css", "shadcn@^4.23.0"],
  },
  {
    name: "telemetry",
    title: "Telemetry utilities",
    type: "registry:lib",
    description:
      "Gap-aware time-series geometry and operating-range validation.",
    categories: ["utilities"],
    files: [
      {
        path: "registry/immortal/components/telemetry.ts",
        type: "registry:lib",
        target: "@lib/telemetry.ts",
      },
    ],
  },
  component(
    "device-status",
    "Device status",
    "Readable online, attention, offline, and provisioning states.",
    [],
  ),
  component(
    "signal-strength",
    "Signal strength",
    "RSSI bars with a numeric dBm reading and an explicit unavailable state.",
    [],
  ),
  component(
    "telemetry-chart",
    "Telemetry chart",
    "A lightweight SVG time series with real data gaps and an accessible readings table.",
    ["immortal:telemetry"],
  ),
  component(
    "telemetry-card",
    "Telemetry card",
    "A current measurement with units, device status, and optional history.",
    ["card", "immortal:device-status", "immortal:telemetry-chart"],
  ),
  component(
    "device-card",
    "Device card",
    "A device identity, connectivity, battery, and optional detail action.",
    ["button", "card", "immortal:device-status", "immortal:signal-strength"],
    { dependencies: ["lucide-react"] },
  ),
  component(
    "threshold-control",
    "Threshold control",
    "A controlled operating range with numeric inputs, keyboard sliders, and validation.",
    ["input", "label", "slider", "immortal:telemetry"],
  ),
  block(
    "fleet-overview",
    "Fleet overview",
    "Search and filter a device inventory, inspect device details, and view message throughput.",
    [
      "button",
      "card",
      "input",
      "select",
      "dialog",
      "immortal:device-status",
      "immortal:signal-strength",
      "immortal:telemetry-chart",
      "immortal:device-card",
    ],
  ),
  block(
    "device-control",
    "Device control",
    "An editable configuration with pending, offline, validation, and request failure states.",
    [
      "button",
      "card",
      "input",
      "label",
      "switch",
      "select",
      "immortal:device-status",
      "immortal:threshold-control",
    ],
  ),
  block(
    "alert-console",
    "Alert console",
    "Acknowledge device alerts through an async adapter, with open/all filters and empty states.",
    ["button", "card", "tabs"],
  ),
];
