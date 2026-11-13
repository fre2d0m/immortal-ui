import { firstBatch } from "./first-batch.ts";
export type ComponentGroup =
  "data" | "controls" | "events" | "devices" | "configuration";
export type BlockGroup =
  "operations" | "observation" | "workflows" | "agriculture" | "facilities";
export type CatalogGroup = {
  id: ComponentGroup | BlockGroup;
  title: string;
  english: string;
  description: string;
};
export const componentGroups: CatalogGroup[] = [
  {
    id: "data",
    title: "数据与指标",
    english: "Metrics & indicators",
    description:
      "围绕观测与计算结果组织定义、来源和实际数据；按数据形态选择卡片内的可视化。",
  },
  {
    id: "controls",
    title: "控制与执行",
    english: "Controls & feedback",
    description: "选择模式、调整设定、下发指令，并清楚地看到设备回执。",
  },
  {
    id: "events",
    title: "事件与告警",
    english: "Events & alerts",
    description: "从发现异常到人工决策，为每一次变化补齐上下文。",
  },
  {
    id: "devices",
    title: "设备与空间",
    english: "Devices & spaces",
    description: "设备身份、连接与链路状态；与测量质量分开查看。",
  },
  {
    id: "configuration",
    title: "配置与运维",
    english: "Configuration & operations",
    description: "校验参数与运行范围，为设备配置提供明确的反馈。",
  },
];
export const blockGroups: CatalogGroup[] = [
  {
    id: "workflows",
    title: "数据处理",
    english: "Data workflows",
    description:
      "从事件与多源输入到处理、并发汇合和结果分发，编排完整的数据链路。",
  },
  {
    id: "operations",
    title: "设备运维",
    english: "Device operations",
    description: "查找设备、核对观测与接入状态、配置参数和处理告警。",
  },
  {
    id: "observation",
    title: "数据与空间",
    english: "Data & physical spaces",
    description: "按时间、群组和安装位置查找传感器及其读数。",
  },
  {
    id: "agriculture",
    title: "农业与种植",
    english: "Agriculture",
    description: "把环境感知与设备控制组合成种植现场的工作界面。",
  },
  {
    id: "facilities",
    title: "设施与能源",
    english: "Facilities & energy",
    description: "面向冷链、楼宇和能源的监测场景。",
  },
];
export type CatalogItem = {
  name: string;
  title: string;
  caption: string;
  kind: "component" | "block";
  group: ComponentGroup | BlockGroup;
  description: string;
  code: string;
  props: string[];
  states: string[];
  status?: "planned";
  firstBatch?: boolean;
  components?: string[];
  outline?: string[];
};
const component = (
  name: string,
  title: string,
  caption: string,
  group: ComponentGroup,
  description: string,
  code: string,
  props: string[],
  states: string[],
): CatalogItem => ({
  name,
  title,
  caption,
  kind: "component",
  group,
  description,
  code,
  props,
  states,
});
const block = (
  name: string,
  title: string,
  caption: string,
  group: BlockGroup,
  description: string,
  components: string[],
  code: string,
  props: string[],
  options?: { outline?: string[]; states?: string[] },
): CatalogItem => ({
  name,
  title,
  caption,
  kind: "block",
  group,
  description,
  components,
  code,
  props,
  states: options?.states ?? [],
  ...(options?.outline
    ? { status: "planned" as const, outline: options.outline }
    : {}),
});

const existingCatalog: CatalogItem[] = [
  component(
    "metric-card",
    "Metric Card",
    "观测卡片",
    "data",
    "围绕一项观测组织测量定义、设备来源、当前记录、质量与时间。数值、趋势和范围是同一卡片内的呈现方式。",
    'import { MetricCard } from "@/components/iot/metric-card";\n\n<MetricCard\n  definition={measurementDefinition}\n  observation={latestObservation}\n  source={deviceSource}\n  now={snapshotTime}\n  visualization="trend"\n  history={observations}\n/>',
    [
      "definition: MetricDefinition — id、label、subject 与 type；number 带单位、精度、范围，state 声明状态映射，text 保留文本。",
      "observation: MetricObservation — 实际 value、sampledAt、receivedAt、quality 与 reason；空值为 null，零值与 false 都是有效数据。",
      "source: { device, channel?, offline? }；now 用于判断时效，expectedInterval 是定义中的预期采样间隔（秒）。",
      "visualization: value | trend | range；history: { points, label, maxGapMs?, window?, domain? }。趋势用于概览；并列比较传同一 domain。超出参考尺度会扩展并说明，缺测断线。",
      "comparison: { label, referenceValue, mode, tone? }；mode 区分绝对差、相对变化和百分点，tone 由业务决定。",
      "secondary / historyHref / loading / error：辅助信息、历史入口、加载与失败；来源与测量定义可在卡片内展开。",
    ],
    ["数值观测", "枚举状态", "趋势 / 范围", "质量与时效", "离线快照", "缺测"],
  ),
  component(
    "indicator-card",
    "Indicator Card",
    "衍生指标卡片",
    "data",
    "围绕一个计算结果组织指标定义、作用对象、计算方法与输入依据。区分计算时间和统计窗口，按结果类型呈现数值、等级或结构化记录。",
    'import { IndicatorCard } from "@/components/iot/indicator-card";\n\n<IndicatorCard\n  definition={indicatorDefinition}\n  result={calculatedResult}\n  method={calculationMethod}\n  visualization="range"\n/>',
    [
      "definition: IndicatorDefinition — id、label、subject、description 与 type；支持 number / state / text / table。表格 columns 声明 key、label、unit?、precision?；数值列右对齐。",
      "result: IndicatorResult — value、calculatedAt、window?、quality?、reason?；结果表为空数组时表示本次没有结果，null 表示暂无数据。",
      "method: { label, version?, inputs? } — 说明计算方法及输入依据；组件展示宿主结果，不执行算法或补造置信度。",
      "window: { from, to } 表示输入统计窗口，calculatedAt 表示计算时间，均为毫秒；不能用计算时间冒充观测时间。",
      "数值结果可用 value / trend / range；分级结果按 states 显示，结构化结果按 columns 展示表格。",
      "comparison / secondary / historyHref / loading / error 与 Metric Card 共用呈现约定。",
    ],
    ["聚合数值", "风险等级", "结构化结果", "计算口径", "缺失 / 无效"],
  ),
  component(
    "device-profile",
    "Device Profile",
    "设备档案",
    "devices",
    "面向设备详情的完整身份档案：实物图、名称与分类、序列号与型号、用途说明及运行摘要，配置与服务位于右上角。",
    'import { DeviceProfile } from "@/components/iot/device-profile";\n\n<DeviceProfile\n  device={device}\n  onConfigure={openConfiguration}\n  services={availableServices}\n  onService={openService}\n/>',
    [
      "device: Device — 与 DeviceCard 共用设备数据；序列号与平台标识分别显示、独立复制。",
      "image?: { src, alt }; tags / product / model / description：实物、分类、产品及用途。无图时收回图片列。",
      "lastSeen 明确表示最近活动；battery 为百分比，batteryVoltage 为伏特，未知值不互相推断。",
      "hardwareVersion / firmwareVersion / installedAt / operational / deployment / admission：次级档案信息，按实际数据提供。",
      "onConfigure?: (device) => void；services?: DeviceService[]；onService?: (serviceId, device) => void。服务流程由宿主管理。",
      "headingLevel?: h1 | h2 | h3 — 默认 h2。组件自有响应式布局，使用页面底色，无面板外壳、图标底座或凹槽。",
    ],
    ["完整档案", "离线设备", "资料缺失", "复制标识", "配置与服务"],
  ),
  component(
    "device-card",
    "Device overview",
    "设备概览卡片",
    "devices",
    "识别设备实物与型号，核对序列号、分类标签和用途，查看连接、电源、位置及生命周期信息，再进入配置或设备服务。",
    "<DeviceCard device={device} onOpen={openDevice} onConfigure={openConfiguration} services={availableServices} onService={openService} />",
    [
      "device: Device — 名称、平台标识、位置、连接状态、协议、RSSI、电量与最近活动",
      "serialNumber / product / model / image / tags / description：实物、出厂身份、分类及用途；序列号不以平台标识代填",
      "hardwareVersion / firmwareVersion / installedAt / operational / deployment / admission：版本与生命周期，按实际数据提供",
      "battery 为百分比；batteryVoltage 为伏特；power 只显示数据源报告的电源状态，不互相推算",
      "onOpen / onConfigure?: (device: Device) => void；services + onService(serviceId, device) 打开由宿主管理的服务流程",
      "卡片拥有自己的面板外壳；页面顶部的完整设备档案使用独立的 DeviceProfile。",
      "无值传 null；缺失档案显示未提供，未知连接状态使用 unknown。",
    ],
    ["在线", "预警", "离线"],
  ),
  component(
    "device-status",
    "Device status",
    "连接状态",
    "devices",
    "使用状态点和文字共同表达在线、异常、离线和初始化状态。",
    '<DeviceStatus state="online" label="在线" />',
    [
      'state: "online" | "warning" | "offline" | "provisioning" | "unknown"',
      "label?: string; className?: string",
    ],
    ["在线", "异常", "离线", "初始化"],
  ),
  component(
    "signal-strength",
    "Signal strength",
    "信号强度",
    "devices",
    "以信号格和 dBm 数值表达无线链路质量，支持无信号读数。",
    "<SignalStrength rssi={-63} />",
    [
      "rssi: number | null; className?: string",
      "信号分级为显示启发式，可根据无线协议调整。",
    ],
    ["强", "中", "弱", "不可用"],
  ),
  component(
    "control-mode",
    "Control mode",
    "控制模式",
    "controls",
    "手动与策略运行的受控选择。此选择器不代表控制权，也不直接执行远程操作。",
    '<ControlMode value={mode} onValueChange={setMode} description="自动策略运行中" />',
    [
      'value: "manual" | "auto"',
      "onValueChange: (value: ControlModeValue) => void; disabled?: boolean",
      "label?: string; description?: string — 当前模式说明。模式持久化由应用负责。",
    ],
    ["手动", "自动", "禁用"],
  ),
  component(
    "actuator-switch",
    "Actuator switch",
    "二态执行器",
    "controls",
    "用于泵、阀与加热设备的启停操作，开关始终反映设备回读状态。",
    '<ActuatorSwitch label="循环泵" reported={running} onCommand={sendCommand} />',
    [
      "label: string; reported: boolean | null; online?: boolean; locked?: boolean",
      "onCommand: (enabled: boolean) => Promise<void>",
      "回调在设备确认后 resolve，并更新 reported；失败时 reject。",
    ],
    ["关闭", "运行", "待回执", "失败", "离线"],
  ),
  component(
    "setpoint-control",
    "Setpoint control",
    "目标值设定",
    "controls",
    "用步进按钮和数值输入精确调整单个设定值，校验通过后才可应用。",
    '<SetpointControl label="目标温度" value={target} min={18} max={32} step={0.5} unit="°C" onApply={applyTarget} />',
    [
      "label: string; value: number; min: number; max: number; step?: number; unit: string",
      "onApply: (value: number) => Promise<void>; disabled?: boolean",
      "步进以 min 为起点。回调在确认后 resolve，并更新 value；越界不静默修正。",
    ],
    ["未修改", "待应用", "越界", "等待回执", "失败"],
  ),
  component(
    "threshold-control",
    "Threshold control",
    "上下限范围",
    "controls",
    "通过双滑块和数值输入设置目标区间，保持上下限关系可见。",
    '<ThresholdControl value={range} onValueChange={setRange} min={-20} max={80} unit="°C" />',
    [
      "value: { low: number; high: number }; onValueChange: (value: Threshold) => void",
      "min?: number; max?: number; step?: number; unit?: string; disabled?: boolean",
    ],
    ["有效区间", "无效区间", "只读"],
  ),
  component(
    "actuator-control",
    "Directional control",
    "三段式执行器",
    "controls",
    "适用于窗、幕布与行程电机；反向操作需要先停止并等到回读确认。",
    '<ActuatorControl label="顶窗" direction={direction} position={45} onCommand={moveVent} />',
    [
      'direction: "open" | "stop" | "close" | null; position: number | null',
      "label: string; online?: boolean; locked?: boolean",
      "onCommand: (direction: ActuatorDirection) => Promise<void> — 确认后更新回读；真正联锁由设备实现。",
    ],
    ["开", "停", "关", "锁定", "失败"],
  ),
  component(
    "command-status",
    "Command status",
    "命令回执",
    "controls",
    "将请求值与设备回读并排展示，清楚地区分正在发送和已确认。",
    '<CommandStatus phase="pending" requested="60 %" reported="45 %" />',
    [
      'phase: "idle" | "pending" | "confirmed" | "failed"',
      "requested: string; reported: string; message?: string",
      "展示状态由真实命令生命周期驱动。",
    ],
    ["等待", "待回执", "已确认", "失败"],
  ),
  component(
    "alert-card",
    "Alert card",
    "告警条目",
    "events",
    "每条告警带等级、来源、时间与处置说明，确认与恢复是不同状态。",
    "<AlertCard alert={alert} onAcknowledge={acknowledge} />",
    [
      "alert: AlertRecord — id, title, deviceName, severity, time, description, acknowledged",
      "onAcknowledge?: (id: string) => Promise<void>",
      "父组件在服务端确认后更新 acknowledged。",
    ],
    ["严重", "预警", "提示", "已确认", "失败"],
  ),
  component(
    "event-timeline",
    "Event timeline",
    "事件时间线",
    "events",
    "按时间组织操作人、动作与变更值，让设备变化有可追溯的上下文。",
    '<EventTimeline events={events} label="操作记录" />',
    [
      "events: TimelineEvent[] — id, time, actor, title, detail?, tone?",
      'tone?: "neutral" | "warning" | "success"',
      "label?: string; 按传入顺序展示，不在界面中生成审计事实。",
    ],
    ["操作", "系统事件", "空记录"],
  ),
  component(
    "automation-note",
    "Automation note",
    "可解释建议",
    "events",
    "把建议、依据和时间一起交给操作者，再由人选择采纳或忽略。",
    '<AutomationNote title="建议调整遮阳幕" reason="光照持续增强" source="光照趋势" time="14:02" status={status} onAccept={accept} onDismiss={dismiss} />',
    [
      "title: string; reason: string; source: string; time: string",
      'status?: "proposed" | "accepted" | "dismissed"; disabled?: boolean',
      "onAccept / onDismiss: () => Promise<void> — 成功后由父组件更新 status；采纳不等于设备执行。",
    ],
    ["待决策", "处理中", "已采纳", "已忽略", "失败"],
  ),
  block(
    "greenhouse-control",
    "Greenhouse control",
    "温室控制系统",
    "agriculture",
    "将环境读数、气候趋势、目标温度和泵窗控制组合成一个温室工作台。",
    [
      "device-status",
      "control-mode",
      "setpoint-control",
      "actuator-switch",
      "actuator-control",
      "alert-card",
    ],
    'import { GreenhouseControl } from "@/components/blocks/greenhouse-control";\n\n<GreenhouseControl\n  title="一号温室"\n  online={online}\n  readings={readings}\n  history={history}\n  mode={mode}\n  onModeChange={setMode}\n  setpoint={target}\n  onSetpointApply={applyTarget}\n  pump={pump}\n  onPumpCommand={controlPump}\n  vent={vent}\n  onVentCommand={controlVent}\n  alerts={alerts}\n  onAcknowledge={acknowledge}\n/>',
    [
      "readings: GreenhouseReadings; history: TelemetryPoint[]; online: boolean; title: string",
      "mode: ControlModeValue; onModeChange: (mode) => void",
      "setpoint + onSetpointApply; pump + onPumpCommand; vent + onVentCommand",
      "alerts: AlertRecord[]; onAcknowledge: (id) => Promise<void>",
      "手动模式开放执行器操作。自动模式展示回读。模式、权限、设备联锁和策略由应用管理。",
    ],
  ),
  block(
    "irrigation-scheduling",
    "Zone irrigation",
    "分区灌溉调度",
    "agriculture",
    "按种植区查看含水率、灌溉用量和阀门状态，预留排程与任务队列。",
    ["metric-card", "indicator-card", "actuator-switch", "event-timeline"],
    "",
    [],
    {
      outline: [
        "分区概览 · 含水率与需水状态",
        "灌溉排程 · 时段、时长与计划用量",
        "执行反馈 · 阀门、流量与任务队列",
      ],
    },
  ),
  block(
    "cold-chain-monitoring",
    "Cold-chain monitoring",
    "冷链环境监测",
    "facilities",
    "围绕温度合规与异常处置，预留库区监测、越限趋势和告警工作区。",
    ["metric-card", "threshold-control", "alert-card"],
    "",
    [],
    {
      outline: [
        "库区总览 · 温度与连接状态",
        "温度趋势 · 目标范围与历史越限",
        "异常处置 · 告警确认与操作记录",
      ],
    },
  ),
  block(
    "energy-management",
    "Energy management",
    "能源与设备负载",
    "facilities",
    "按设施汇总用电、负载和运行状态，预留能耗对比与维护入口。",
    ["metric-card", "indicator-card", "device-card", "event-timeline"],
    "",
    [],
    {
      outline: [
        "设施概览 · 当日用电与负载",
        "时段分析 · 峰谷用电与设备分布",
        "设备维护 · 运行事件与维护记录",
      ],
    },
  ),
  block(
    "data-workflow",
    "Data processing workflow",
    "Data processing workflow",
    "workflows",
    "Build ecological IoT workflows with event triggers, multiple sources, processing and delivery. Supports parallel branches, joins and failure routes.",
    [],
    'import { DataWorkflow } from "@/components/blocks/data-workflow";\n\n<DataWorkflow\n  workflow={workflow}\n  onChange={setWorkflow}\n  templates={nodeTemplates}\n  getNodeSummary={summarizeNode}\n  onSave={saveWorkflow}\n  onRun={(definition, { signal, onUpdate }) =>\n    executionService.run(definition, { signal, onUpdate })\n  }\n/>',
    [
      "workflow: WorkflowDefinition — schemaVersion: 1. The host provides nodes, configuration, connections and concurrency limits. No built-in business data.",
      "onChange: (workflow) => void — Controlled editing; omit for read-only use. templates supplies node types and parameters. Demo templates are not installed.",
      "onSave?: (workflow) => Promise<void> — Save incomplete drafts; validate separately before execution. Includes undo, redo, duplicate and JSON import/export.",
      "onRun?: (workflow, { signal, onUpdate }) => Promise<WorkflowRun> — The host handles events, scheduling, permissions, concurrency, retries and delivery. AbortSignal requests cancellation without confirming that execution stopped.",
      "parallel dispatches input to independent branches. joinMode: all waits for all branches to succeed; any continues after the first success while other branches keep running. maxConcurrency limits concurrent nodes per run.",
      "run?: WorkflowRun — Include workflowId and definitionSignature: workflowSignature(definition) to match results to their definition. Times use ISO 8601 and display in UTC. The host supplies status, input and output.",
      "renderNodeConfiguration?: (node, { readOnly, onChange }) => ReactNode — Provide connector selection, field mapping or other custom forms. saveLabel / runLabel define action tooltips and accessible names.",
      "getNodeSummary?: (node, { workflow }) => WorkflowNodeSummary — Derive up to three labeled fields or a comparison from current configuration. Without an adapter, only parameter counts and built-in branch/join policies are shown.",
      "Start an empty canvas with a trigger. Use an output plus or drag to empty space to choose a compatible node. Supports insertion, existing-node connections and single-step undo. Failure routes use the error type.",
      "Structural validation checks required parameters, triggers, duplicate connections, cycles and declared types. It does not replace business validation. The demo does not fabricate model results.",
    ],
    {
      states: [
        "Multiple sources",
        "Node editing",
        "Parallel branches",
        "ALL / ANY joins",
        "Conditional delivery",
        "Failure routes",
        "Execution inspection",
        "Empty states",
      ],
    },
  ),
  block(
    "fleet-overview",
    "Device inventory",
    "设备目录",
    "operations",
    "按名称、标识、群组、产品和设备状态定位设备，在列表内快速核对身份和最近活动。",
    ["device-status", "signal-strength"],
    'import { FleetOverview } from "@/components/blocks/fleet-overview";\n\n<FleetOverview\n  devices={devices}\n  pageSize={10}\n  deviceHref={getDeviceHref}\n/>',
    [
      "devices: FleetDevice[] — 支持在 Device 上增加 product 和 groups；已有 Device[] 可直接传入。",
      "title / subtitle：目录名称及其所在站点。",
      "deviceHref / onDeviceSelect：设备详情链接与打开快速预览时的回调。",
      "pageSize 控制本地分页；telemetry 可提供独立的消息趋势。",
    ],
    { states: ["组合筛选", "分页", "快速预览", "空目录"] },
  ),
  block(
    "device-detail",
    "Device detail",
    "设备详情",
    "operations",
    "同一处核对设备身份、接入、最近观测、静态属性和事件，沿读数进入对应的历史查询。",
    ["device-profile", "metric-card", "event-timeline"],
    'import { DeviceDetail } from "@/components/blocks/device-detail";\n\n<DeviceDetail\n  device={identity}\n  readings={readings}\n  properties={properties}\n  events={events}\n  now={snapshotTime}\n  historyHref={historyHref}\n/>',
    [
      "device: DeviceIdentity — online 可为 true、false 或 null；lastSeenAt 独立传入。",
      "readings: DeviceReading[] — 读数、单位、采样时间、质量和来源。",
      "properties / events：已格式化的静态属性与事件记录。",
      "now 用于判断数据时效；historyHref / profileHref 对应调用方的页面地址。",
    ],
    { states: ["离线快照", "连接未知", "无效读数", "静态属性", "事件"] },
  ),
  block(
    "device-control",
    "Device configuration",
    "设备参数配置",
    "operations",
    "将采样间隔、连接策略和告警范围放在一个可校验的配置流程里。",
    ["device-status", "threshold-control"],
    'import { DeviceControl } from "@/components/blocks/device-control";\n\n<DeviceControl\n  deviceId={device.id}\n  deviceName={device.name}\n  online={online}\n  configuration={config}\n  onApply={saveConfig}\n/>',
    [
      "configuration: DeviceConfiguration; deviceId: string; deviceName: string; online: boolean",
      "onApply: (configuration: DeviceConfiguration) => Promise<void>",
      "持久化成功后更新 configuration。失败时 reject，保留当前草稿。",
    ],
  ),
  block(
    "alert-console",
    "Alert console",
    "告警处置工作台",
    "operations",
    "在队列中按状态和级别找告警，核对触发规则与设备，再确认或清除告警记录。",
    ["event-timeline"],
    'import { AlertConsole } from "@/components/blocks/alert-console";\n\n<AlertConsole\n  alerts={alerts}\n  onAcknowledge={acknowledgeAlert}\n  onClear={clearAlert}\n/>',
    [
      "alerts: DeviceAlert[] — status 取 active、acknowledged 或 cleared；active 单独表达现场条件。",
      "onAcknowledge / onClear: (id) => Promise<void>；权限与状态回读由调用方管理。",
      "只有明确提供 status 的记录显示清除操作；deviceHref 可链接到设备详情。",
    ],
    { states: ["待确认", "已确认", "已清除", "操作失败"] },
  ),
  block(
    "telemetry-explorer",
    "Telemetry explorer",
    "遥测历史查询",
    "observation",
    "选择指标和 UTC 时间范围，在同一查询结果中比较趋势、核对原始样本并导出。",
    [],
    'import { TelemetryExplorer } from "@/components/blocks/telemetry-explorer";\n\n<TelemetryExplorer\n  metrics={metrics}\n  now={referenceTime}\n  initialQuery={initialQuery}\n  onQuery={queryTelemetry}\n  onExport={exportSamples}\n/>',
    [
      "metrics: TelemetryMetric[]；initialQuery 包含 metricIds、from、to（UTC epoch ms，边界包含）。",
      "onQuery: (query) => Promise<TelemetryQueryResult>；由数据源返回原始序列，可附事件和 maxGapMs。序列可提供 precision、domain、稳定 styleIndex 及逐点 quality；同单位共用尺度。",
      "initialResult 可提供首屏结果；onExport 仅在有结果时开放，收到已应用查询的去重样本、原始值及 state / quality。图表、表格统一精度；导出保留原值。",
    ],
    { states: ["自定义时间", "多指标", "采样缺口", "空结果", "查询失败"] },
  ),
  block(
    "device-groups",
    "Device groups",
    "场景与群组",
    "observation",
    "沿站点、区域和样地展开群组，核对当前群组直接绑定的设备，再进入单台设备。",
    ["device-status"],
    'import { DeviceGroups } from "@/components/blocks/device-groups";\n\n<DeviceGroups groups={groupTree} initialGroupId={siteGroupId} />',
    [
      "groups: DeviceGroup[] — children 可继续嵌套；members 只包含本群组直接绑定的设备。",
      "成员的 online 可为 null，href 可提供设备详情入口。",
      "initialGroupId 定位初始群组，并展开它的祖先。",
    ],
    { states: ["多级群组", "直接绑定", "空群组"] },
  ),
  block(
    "soil-profile",
    "Soil profile",
    "土壤观测剖面",
    "observation",
    "把含水率、土壤温度和可选盐分对应到地表以下的真实安装深度，逐层读数并追查历史。",
    [],
    'import { SoilProfile } from "@/components/blocks/soil-profile";\n\n<SoilProfile\n  title={plotName}\n  sampledAt={sampleTime}\n  layers={layers}\n  initialLayerId={layerId}\n/>',
    [
      "layers: SoilLayer[] — depthCm 为距地表向下的深度，moisture 使用百分数，temperature 使用 °C。",
      "用 null 表示缺测；可提供带单位的 salinity 和对应层的 historyHref。",
      "sampledAt 表示这一组剖面读数的采样时间；剖面比例由安装深度决定。",
    ],
    { states: ["深度选择", "同层多参数", "缺测", "按层追查"] },
  ),
  block(
    "soil-water-explorer",
    "Soil water explorer",
    "土壤水分年度分析",
    "agriculture",
    "沿同一时间轴核对多深度水分、降雨、参考蒸散、作物系数及持续或瞬时事件，逐时追查原始记录。",
    [],
    'import { SoilWaterExplorer } from "@/components/blocks/soil-water-explorer";\n\n<SoilWaterExplorer\n  data={soilDataset}\n  initialDepthIds={["10cm", "50cm", "150cm"]}\n  onExport={downloadCurrentWindow}\n/>',
    [
      "data: SoilWaterDataset — 深度与采样记录、时区、单位、精度、采样间隔及参考范围均由调用方提供；时间范围为 [from,to)。组件不生成观测。",
      "超过 14 天用 24 h 分箱均值与 min–max；较短范围按采样间隔分箱。缺测、无效与质量标记保留；原始数据表和导出不降采样。",
      "rainfall / et0 为带实际起止时刻的区间水量，单位与区间长度应一致；Kc 是独立无量纲参数，不自动计算耗水量。事件区分 instant / interval，持续事件缺少结束时间表示持续中。",
      "initialWindow / initialDepthIds / initialCursorAt 设置首次视图；onExport 收到当前范围、所选深度、相交气象区间与完整事件边界。",
    ],
    {
      states: [
        "20 深度全年小时数据",
        "共享时间范围",
        "持续与瞬时事件",
        "缺测与故障",
        "原始核查与导出",
      ],
    },
  ),
];
export const catalog: CatalogItem[] = [
  ...firstBatch,
  ...existingCatalog
    .filter((item) => !firstBatch.some((ready) => ready.name === item.name))
    .map((item) => ({
      ...item,
      group: (["device-card", "device-status", "signal-strength"].includes(
        item.name,
      )
        ? "devices"
        : item.name === "threshold-control"
          ? "configuration"
          : item.group) as CatalogItem["group"],
    })),
];
export const itemHref = (item: CatalogItem) =>
  `#/${item.kind === "block" ? "blocks" : "components"}/${item.name}`;

// Previous showcase URLs keep working; rendering helpers are no longer catalog products.
export const componentRedirects: Record<string, string> = {
  "telemetry-card": "/components/metric-card",
  "data-freshness": "/components/metric-card",
  "range-gauge": "/components/metric-card",
  "daily-histogram": "/components/indicator-card",
  "telemetry-chart": "/blocks/telemetry-explorer",
};
