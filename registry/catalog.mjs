// Canonical install metadata. Custom dependencies are resolved by build-registry.mjs.
// Internal layout file travels with each owning component; it has no registry entry.
const panelFiles = [
  {
    path: "registry/immortal/components/internal/panel-header.tsx",
    type: "registry:component",
    target: "@components/iot/internal/panel-header.tsx",
  },
  {
    path: "registry/immortal/components/internal/panel.tsx",
    type: "registry:component",
    target: "@components/iot/internal/panel.tsx",
  },
];

const deviceFile = {
  path: "registry/immortal/components/device.ts",
  type: "registry:component",
  target: "@components/iot/device.ts",
};

const dataCardFiles = [
  ...panelFiles,
  {
    path: "registry/immortal/components/internal/telemetry-sparkline.tsx",
    type: "registry:component",
    target: "@components/iot/internal/telemetry-sparkline.tsx",
  },
  {
    path: "registry/immortal/components/internal/data-card-model.ts",
    type: "registry:component",
    target: "@components/iot/internal/data-card-model.ts",
  },
  {
    path: "registry/immortal/components/internal/data-card.tsx",
    type: "registry:component",
    target: "@components/iot/internal/data-card.tsx",
  },
];

export const items = [
  {
    name: "metric-card",
    title: "Metric Card",
    type: "registry:component",
    description:
      "测量定义、设备来源与实际观测组成完整卡片；趋势和范围是卡片内的可视化，质量与时效是数据上下文。",
    categories: ["iot", "data"],
    registryDependencies: [
      "button",
      "immortal:data-freshness",
      "immortal:range-gauge",
      "immortal:telemetry",
      "immortal:iot-model",
    ],
    dependencies: ["lucide-react", "radix-ui@^1.8.1"],
    files: [
      ...dataCardFiles,
      {
        path: "registry/immortal/components/metric-card.tsx",
        type: "registry:component",
        target: "@components/iot/metric-card.tsx",
      },
    ],
  },
  {
    name: "indicator-card",
    title: "Indicator Card",
    type: "registry:component",
    description:
      "指标定义、计算结果和计算依据组成完整卡片，支持数值、分级状态和结构化结果；计算时间与输入统计窗口分别表达。",
    categories: ["iot", "data"],
    registryDependencies: [
      "button",
      "immortal:range-gauge",
      "immortal:telemetry",
      "immortal:iot-model",
    ],
    dependencies: ["lucide-react", "radix-ui@^1.8.1"],
    files: [
      ...dataCardFiles,
      {
        path: "registry/immortal/components/indicator-card.tsx",
        type: "registry:component",
        target: "@components/iot/indicator-card.tsx",
      },
    ],
  },
  {
    name: "tabs",
    title: "Tabs",
    description:
      "Radix tabs with a shared sliding selection indicator, keyboard navigation and reduced-motion support.",
    type: "registry:ui",
    categories: ["navigation"],
    dependencies: ["radix-ui@^1.8.1", "class-variance-authority@^0.7.1", "cn"],
    files: [
      {
        path: "src/components/ui/tabs.tsx",
        type: "registry:ui",
        target: "@components/ui/tabs.tsx",
      },
    ],
  },
  {
    name: "iot-icons",
    title: "IoT icon extensions",
    description:
      "Ten original SVG icons for flow, air quality, pumps, valves, motors, field buses, pipes, tanks, enclosures and heat. Compatible with Lucide props.",
    type: "registry:component",
    categories: ["icons", "iot"],
    dependencies: ["lucide-react"],
    files: [
      {
        path: "registry/immortal/icons/iot-icons.ts",
        type: "registry:component",
        target: "@components/icons/iot-icons.ts",
      },
    ],
  },
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
  {
    name: "device-status",
    title: "Device status",
    description:
      "Readable online, attention, offline, and provisioning states.",
    type: "registry:component",
    categories: ["iot", "devices"],
    registryDependencies: [],
    dependencies: ["cn"],
    files: [
      {
        path: "registry/immortal/components/device-status.tsx",
        type: "registry:component",
        target: "@components/iot/device-status.tsx",
      },
    ],
  },
  {
    name: "signal-strength",
    title: "Signal strength",
    description:
      "RSSI bars with a numeric dBm reading and an explicit unavailable state.",
    type: "registry:component",
    categories: ["iot", "devices"],
    registryDependencies: [],
    dependencies: ["cn"],
    files: [
      {
        path: "registry/immortal/components/signal-strength.tsx",
        type: "registry:component",
        target: "@components/iot/signal-strength.tsx",
      },
    ],
  },
  {
    name: "telemetry-chart",
    meta: { internal: true, replacement: "telemetry-explorer" },
    title: "Trend inspector",
    description:
      "多序列共用时间游标，同单位共轴、异单位分图。目标带、事件标记、采样断点和精确数据表一起保留。",
    type: "registry:component",
    categories: ["iot", "visualization"],
    registryDependencies: [
      "button",
      "immortal:telemetry",
      "immortal:iot-model",
    ],
    dependencies: ["lucide-react", "cn", "radix-ui@^1.8.1", "recharts@^3.10.1"],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/internal/telemetry-series-style.ts",
        type: "registry:component",
        target: "@components/iot/internal/telemetry-series-style.ts",
      },
      {
        path: "registry/immortal/components/internal/telemetry-plot.tsx",
        type: "registry:component",
        target: "@components/iot/internal/telemetry-plot.tsx",
      },
      {
        path: "registry/immortal/components/telemetry-chart.tsx",
        type: "registry:component",
        target: "@components/iot/telemetry-chart.tsx",
      },
    ],
  },
  {
    name: "telemetry-card",
    meta: { internal: true, replacement: "metric-card" },
    title: "Sensor data panel",
    description:
      "指标、测点、读数与单位构成传感器数据面板，质量、采样时效、量程和来源用于判断数据是否可用。",
    type: "registry:component",
    categories: ["iot", "sensors"],
    registryDependencies: [
      "immortal:device-status",
      "immortal:telemetry-chart",
      "immortal:data-freshness",
      "immortal:iot-model",
    ],
    dependencies: ["cn", "lucide-react"],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/telemetry-card.tsx",
        type: "registry:component",
        target: "@components/iot/telemetry-card.tsx",
      },
    ],
  },
  {
    name: "device-card",
    title: "Device overview",
    description:
      "实物图、分类、序列号、型号与用途，连接、电源、位置和生命周期，以及配置与设备服务入口。",
    type: "registry:component",
    categories: ["iot", "devices"],
    registryDependencies: [
      "button",
      "badge",
      "dropdown-menu",
      "immortal:device-status",
      "immortal:signal-strength",
    ],
    dependencies: ["lucide-react"],
    files: [
      ...panelFiles,
      deviceFile,
      {
        path: "registry/immortal/components/device-card.tsx",
        type: "registry:component",
        target: "@components/iot/device-card.tsx",
      },
    ],
  },
  {
    name: "device-profile",
    title: "Device Profile",
    description:
      "独立的设备档案布局：实物图、名称与分类、序列号与型号、用途、运行摘要，以及配置和服务入口。",
    type: "registry:component",
    categories: ["iot", "devices"],
    registryDependencies: [
      "button",
      "dropdown-menu",
      "immortal:device-status",
      "immortal:signal-strength",
    ],
    dependencies: ["lucide-react"],
    files: [
      deviceFile,
      {
        path: "registry/immortal/components/device-profile.tsx",
        type: "registry:component",
        target: "@components/iot/device-profile.tsx",
      },
    ],
  },
  {
    name: "threshold-control",
    title: "Threshold control",
    description:
      "A controlled operating range with numeric inputs, keyboard sliders, and validation.",
    type: "registry:component",
    categories: ["iot", "configuration"],
    registryDependencies: ["input", "label", "slider", "immortal:telemetry"],
    dependencies: ["cn"],
    files: [
      {
        path: "registry/immortal/components/threshold-control.tsx",
        type: "registry:component",
        target: "@components/iot/threshold-control.tsx",
      },
    ],
  },
  {
    name: "data-freshness",
    meta: { internal: true, replacement: "metric-card" },
    title: "Measurement trust",
    description:
      "分别呈现测量质量和数据年龄，展开来源、采样时间与接收时间。新鲜数据也可能无效，离线数据也可能保留有效历史。",
    type: "registry:component",
    categories: ["iot", "sensors"],
    registryDependencies: ["immortal:iot-model"],
    dependencies: ["cn", "lucide-react"],
    files: [
      {
        path: "registry/immortal/components/data-freshness.tsx",
        type: "registry:component",
        target: "@components/iot/data-freshness.tsx",
      },
    ],
  },
  {
    name: "range-gauge",
    meta: { internal: true, replacement: "metric-card" },
    title: "Range gauge",
    description:
      "A position track with a reference range, target interval and explicit out-of-range readings.",
    type: "registry:component",
    categories: ["iot", "visualization"],
    registryDependencies: ["immortal:telemetry"],
    dependencies: ["cn", "lucide-react"],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/range-gauge.tsx",
        type: "registry:component",
        target: "@components/iot/range-gauge.tsx",
      },
    ],
  },
  {
    name: "daily-histogram",
    meta: { internal: true, replacement: "indicator-card" },
    title: "Interval histogram",
    description:
      "Caller-ordered interval bars with a zero baseline, signed values and an accessible table; no implicit aggregation.",
    type: "registry:component",
    categories: ["iot", "visualization"],
    registryDependencies: ["immortal:telemetry"],
    dependencies: ["cn", "lucide-react"],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/daily-histogram.tsx",
        type: "registry:component",
        target: "@components/iot/daily-histogram.tsx",
      },
    ],
  },
  {
    name: "control-mode",
    title: "Control mode",
    description:
      "Keyboard-accessible manual and strategy operating mode selection; authority is a separate component.",
    type: "registry:component",
    categories: ["iot", "controls"],
    registryDependencies: [],
    dependencies: ["cn", "lucide-react"],
    files: [
      {
        path: "registry/immortal/components/control-mode.tsx",
        type: "registry:component",
        target: "@components/iot/control-mode.tsx",
      },
    ],
  },
  {
    name: "command-status",
    title: "Command lifecycle",
    description:
      "从发送、接收、执行到回读验证，保留请求 ID、时间和期望值。超时明确标为结果未知，旧回执不能覆盖新指令。",
    type: "registry:component",
    categories: ["iot", "controls"],
    registryDependencies: ["button", "immortal:iot-model"],
    dependencies: ["cn", "lucide-react"],
    files: [
      {
        path: "registry/immortal/components/command-status.tsx",
        type: "registry:component",
        target: "@components/iot/command-status.tsx",
      },
    ],
  },
  {
    name: "actuator-switch",
    title: "Actuator switch",
    description:
      "Readback-driven binary device control with async acknowledgement, offline, and lock states.",
    type: "registry:component",
    categories: ["iot", "controls"],
    registryDependencies: ["switch", "immortal:command-status"],
    dependencies: ["cn", "lucide-react"],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/actuator-switch.tsx",
        type: "registry:component",
        target: "@components/iot/actuator-switch.tsx",
      },
    ],
  },
  {
    name: "setpoint-control",
    title: "Setpoint editor",
    description:
      "生效值与草稿分开。范围、精度和步进校验在提交前完成；外部更新不会覆盖正在编辑的草稿。",
    type: "registry:component",
    categories: ["iot", "controls"],
    registryDependencies: [
      "button",
      "input",
      "immortal:command-status",
      "immortal:use-device-command",
      "immortal:iot-model",
    ],
    dependencies: ["cn", "lucide-react"],
    files: [
      {
        path: "registry/immortal/components/setpoint-control.tsx",
        type: "registry:component",
        target: "@components/iot/setpoint-control.tsx",
      },
    ],
  },
  {
    name: "actuator-control",
    title: "Position control",
    description:
      "开、停、关保持固定位置。实际位置和目标分离，加入端限位、未校准、卡滞、控制权限制与反馈时间。",
    type: "registry:component",
    categories: ["iot", "controls"],
    registryDependencies: [
      "button",
      "immortal:command-status",
      "immortal:use-device-command",
      "immortal:iot-model",
    ],
    dependencies: ["cn", "lucide-react"],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/actuator-control.tsx",
        type: "registry:component",
        target: "@components/iot/actuator-control.tsx",
      },
    ],
  },
  {
    name: "alert-card",
    title: "Alarm state",
    description:
      "条件是否仍然存在，与人工是否已确认形成四种状态。严重度、来源、发生/恢复/确认时间及确认人分别记录。",
    type: "registry:component",
    categories: ["iot", "events"],
    registryDependencies: ["button", "immortal:iot-model"],
    dependencies: ["cn", "lucide-react"],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/alert-card.tsx",
        type: "registry:component",
        target: "@components/iot/alert-card.tsx",
      },
    ],
  },
  {
    name: "event-timeline",
    title: "Event timeline",
    description:
      "An ordered timeline of actors, changes, and device events with an empty state.",
    type: "registry:component",
    categories: ["iot", "events"],
    registryDependencies: [],
    dependencies: ["cn", "lucide-react"],
    files: [
      {
        path: "registry/immortal/components/event-timeline.tsx",
        type: "registry:component",
        target: "@components/iot/event-timeline.tsx",
      },
    ],
  },
  {
    name: "automation-note",
    title: "Automation note",
    description:
      "Explainable suggestions with explicit human acceptance or dismissal and failure feedback.",
    type: "registry:component",
    categories: ["iot", "events"],
    registryDependencies: ["button"],
    dependencies: ["cn", "lucide-react"],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/automation-note.tsx",
        type: "registry:component",
        target: "@components/iot/automation-note.tsx",
      },
    ],
  },
  {
    name: "data-workflow",
    title: "Data processing workflow",
    description:
      "React Flow editor for event triggers, multiple data sources, processing, conditional routing, parallel branches, joins and delivery. Execution is provided by the host application.",
    type: "registry:block",
    categories: ["iot", "blocks", "workflows"],
    registryDependencies: ["button", "immortal:tabs"],
    dependencies: ["@xyflow/react@^12.12.1", "lucide-react", "radix-ui@^1.8.1"],
    files: [
      {
        path: "registry/immortal/blocks/data-workflow.tsx",
        type: "registry:component",
        target: "@components/blocks/data-workflow.tsx",
      },
      {
        path: "registry/immortal/blocks/workflow-parts.tsx",
        type: "registry:component",
        target: "@components/blocks/workflow-parts.tsx",
      },
      {
        path: "registry/immortal/blocks/workflow-model.ts",
        type: "registry:lib",
        target: "@components/blocks/workflow-model.ts",
      },
      {
        path: "registry/immortal/blocks/data-workflow.css",
        type: "registry:file",
        target: "@components/blocks/data-workflow.css",
      },
    ],
  },
  {
    name: "greenhouse-control",
    title: "Greenhouse control",
    description:
      "A composable greenhouse workspace for environmental readings, temperature setpoints, pumps, vents, and alerts.",
    type: "registry:block",
    categories: ["iot", "blocks", "agriculture"],
    registryDependencies: [
      "immortal:device-status",
      "immortal:telemetry-chart",
      "immortal:control-mode",
      "immortal:setpoint-control",
      "immortal:actuator-switch",
      "immortal:actuator-control",
      "immortal:alert-card",
    ],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/blocks/greenhouse-control.tsx",
        type: "registry:component",
        target: "@components/blocks/greenhouse-control.tsx",
      },
    ],
    dependencies: ["lucide-react", "cn"],
  },
  {
    name: "fleet-overview",
    title: "Device inventory",
    description:
      "Browse devices by status or product, page through the inventory, and inspect a device in context.",
    type: "registry:block",
    categories: ["iot", "blocks", "operations"],
    registryDependencies: [
      "button",
      "input",
      "select",
      "dialog",
      "immortal:device-status",
      "immortal:signal-strength",
      "immortal:telemetry-chart",
      "immortal:device-card",
    ],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/blocks/fleet-overview.tsx",
        type: "registry:component",
        target: "@components/blocks/fleet-overview.tsx",
      },
    ],
    dependencies: ["lucide-react", "cn"],
  },
  {
    name: "device-control",
    title: "Device configuration",
    description:
      "An editable configuration with pending, offline, validation, and request failure states.",
    type: "registry:block",
    categories: ["iot", "blocks", "operations"],
    registryDependencies: [
      "button",
      "input",
      "label",
      "switch",
      "select",
      "immortal:device-status",
      "immortal:threshold-control",
    ],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/blocks/device-control.tsx",
        type: "registry:component",
        target: "@components/blocks/device-control.tsx",
      },
    ],
    dependencies: ["lucide-react", "cn"],
  },
  {
    name: "alert-console",
    title: "Alert console",
    description:
      "Review a filtered alarm queue, inspect its device and event history, then acknowledge or clear via application callbacks.",
    type: "registry:block",
    categories: ["iot", "blocks", "operations"],
    registryDependencies: [
      "button",
      "dialog",
      "select",
      "immortal:alert-card",
      "immortal:event-timeline",
      "immortal:iot-model",
    ],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/blocks/alert-console.tsx",
        type: "registry:component",
        target: "@components/blocks/alert-console.tsx",
      },
    ],
    dependencies: ["lucide-react", "cn"],
  },
  {
    name: "device-detail",
    title: "Device detail",
    description:
      "Inspect device identity, connection, measurements, static properties and events.",
    type: "registry:block",
    categories: ["iot", "blocks", "operations"],
    registryDependencies: [
      "immortal:device-profile",
      "button",
      "badge",
      "immortal:tabs",
      "immortal:metric-card",
      "immortal:device-status",
      "immortal:event-timeline",
      "immortal:iot-model",
    ],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/blocks/device-detail.tsx",
        type: "registry:component",
        target: "@components/blocks/device-detail.tsx",
      },
    ],
    dependencies: ["lucide-react"],
  },
  {
    name: "telemetry-explorer",
    title: "Telemetry explorer",
    description:
      "Query time ranges and metrics, compare trends, inspect raw samples, and optionally export the applied result.",
    type: "registry:block",
    categories: ["iot", "blocks", "observation"],
    registryDependencies: [
      "button",
      "input",
      "immortal:tabs",
      "immortal:telemetry-chart",
    ],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/blocks/telemetry-explorer.tsx",
        type: "registry:component",
        target: "@components/blocks/telemetry-explorer.tsx",
      },
    ],
    dependencies: ["lucide-react"],
  },
  {
    name: "device-groups",
    title: "Device groups",
    description:
      "Browse hierarchical device groups and the devices directly assigned to each group.",
    type: "registry:block",
    categories: ["iot", "blocks", "observation"],
    registryDependencies: ["card", "immortal:device-status"],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/blocks/device-groups.tsx",
        type: "registry:component",
        target: "@components/blocks/device-groups.tsx",
      },
    ],
    dependencies: ["lucide-react"],
  },
  {
    name: "soil-profile",
    title: "Soil profile",
    description:
      "Locate physical probes by installation depth, inspect layer readings, and open their history.",
    type: "registry:block",
    categories: ["iot", "blocks", "observation"],
    registryDependencies: ["button", "card", "immortal:telemetry"],
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/blocks/soil-profile.tsx",
        type: "registry:component",
        target: "@components/blocks/soil-profile.tsx",
      },
    ],
    dependencies: ["lucide-react"],
  },
  {
    name: "soil-water-explorer",
    title: "Soil water explorer",
    description:
      "Inspect hourly soil moisture across depths and a full year, with shared time windows, interval climate records, concurrent events and raw-data export.",
    type: "registry:block",
    categories: ["iot", "blocks", "agriculture"],
    registryDependencies: [
      "button",
      "input",
      "immortal:tabs",
      "immortal:telemetry",
    ],
    dependencies: ["echarts@^6.0.0", "lucide-react", "radix-ui@^1.8.1"],
    files: [
      {
        path: "registry/immortal/blocks/soil-water-explorer.tsx",
        type: "registry:component",
        target: "@components/blocks/soil-water-explorer.tsx",
      },
      {
        path: "registry/immortal/blocks/soil-water-model.ts",
        type: "registry:lib",
        target: "@components/blocks/soil-water-model.ts",
      },
      {
        path: "registry/immortal/blocks/soil-water-plots.tsx",
        type: "registry:component",
        target: "@components/blocks/soil-water-plots.tsx",
      },
      {
        path: "registry/immortal/blocks/soil-water-explorer.css",
        type: "registry:file",
        target: "@components/blocks/soil-water-explorer.css",
      },
    ],
  },
  {
    name: "light-control",
    type: "registry:component",
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/light-control.tsx",
        type: "registry:component",
        target: "@components/iot/light-control.tsx",
      },
    ],
    title: "Light control",
    description:
      "按设备能力提供开关、亮度、色温、颜色与场景。逐设备结果揭示群组的部分失败，草稿不会冒充设备回读。",
    categories: ["iot", "controls"],
    registryDependencies: [
      "button",
      "input",
      "slider",
      "immortal:command-status",
      "immortal:use-device-command",
      "immortal:iot-model",
    ],
    dependencies: ["cn", "lucide-react"],
  },
  {
    name: "thermostat-control",
    type: "registry:component",
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/thermostat-control.tsx",
        type: "registry:component",
        target: "@components/iot/thermostat-control.tsx",
      },
    ],
    title: "Thermostat",
    description:
      "实测温度、目标温度、模式与当前运行状态分别显示。支持双设定点、临时覆盖、能力限制和外部更新冲突。",
    categories: ["iot", "controls"],
    registryDependencies: [
      "button",
      "input",
      "immortal:command-status",
      "immortal:use-device-command",
      "immortal:iot-model",
    ],
    dependencies: ["cn", "lucide-react"],
  },
  {
    name: "control-authority",
    type: "registry:component",
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/control-authority.tsx",
        type: "registry:component",
        target: "@components/iot/control-authority.tsx",
      },
    ],
    title: "Control authority",
    description:
      "区分本地/远程、手动/策略、当前持有者和临时覆盖期限。期限到达只提示待确认，不擅自宣告控制权已释放。",
    categories: ["iot", "controls"],
    registryDependencies: [
      "button",
      "immortal:command-status",
      "immortal:use-device-command",
      "immortal:iot-model",
    ],
    dependencies: ["cn", "lucide-react"],
  },
  {
    name: "interlock-status",
    type: "registry:component",
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/interlock-status.tsx",
        type: "registry:component",
        target: "@components/iot/interlock-status.tsx",
      },
    ],
    title: "Permissives & interlocks",
    description:
      "将阻止操作的原因拆成可追溯条件，逐项呈现满足、未满足、未知与陈旧。总判定由设备或控制服务提供。",
    categories: ["iot", "controls"],
    registryDependencies: ["immortal:iot-model"],
    dependencies: ["cn", "lucide-react"],
  },
  {
    name: "irrigation-run",
    type: "registry:component",
    files: [
      ...panelFiles,
      {
        path: "registry/immortal/components/irrigation-run.tsx",
        type: "registry:component",
        target: "@components/iot/irrigation-run.tsx",
      },
    ],
    title: "Irrigation run",
    description:
      "围绕任务、分区、计划量、累计量和实际流量组织信息。暂停与结束任务分开；缺少总量或累计量时不伪造完成百分比。",
    categories: ["iot", "controls"],
    registryDependencies: [
      "button",
      "immortal:command-status",
      "immortal:use-device-command",
      "immortal:iot-model",
    ],
    dependencies: ["cn", "lucide-react"],
  },
  {
    name: "iot-model",
    title: "IoT state contracts",
    type: "registry:lib",
    categories: ["utilities"],
    files: [
      {
        path: "registry/immortal/components/iot-model.ts",
        type: "registry:lib",
        target: "@lib/iot-model.ts",
      },
    ],
  },
  {
    name: "use-device-command",
    title: "Device command hook",
    type: "registry:hook",
    categories: ["utilities"],
    registryDependencies: ["immortal:iot-model"],
    files: [
      {
        path: "registry/immortal/components/use-device-command.ts",
        type: "registry:hook",
        target: "@components/iot/use-device-command.ts",
      },
    ],
  },
];
