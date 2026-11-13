import type { WorkflowDefinition } from "../../registry/immortal/blocks/workflow-model.ts";

// Exact labels from the previous built-in examples. Custom content is preserved.
const legacyLabels: Record<string, string> = {
  "流域观测 · 多源数据处理": "Watershed monitoring · Multi-source processing",
  "事件触发 → 并行采集 → 质量与聚合 → 按条件分发":
    "Event trigger → Parallel collection → Quality and aggregation → Conditional delivery",
  观测数据上报: "Observation received",
  "设备上报、告警或业务事件": "Device reports, alarms or business events",
  事件类型: "Event type",
  事件来源: "Event source",
  "流域 / 北岸断面": "Watershed / North bank",
  并行采集: "Parallel collection",
  同时派发独立处理分支: "Dispatch independent branches concurrently",
  北岸水温观测: "North bank temperature",
  读取传感器原始观测: "Read raw sensor observations",
  连接引用: "Connection reference",
  "使用连接标识；凭据由宿主管理。":
    "Use a connection ID. The host manages credentials.",
  演示数据源: "Demo data source",
  河道水温: "River water temperature",
  气象降雨: "Rainfall",
  "实验室 pH": "Laboratory pH",
  气象背景数据: "Weather observations",
  "气象、遥感或外部服务": "Weather, remote sensing or external services",
  合并多源观测: "Merge observations",
  全部完成或任一成功后继续: "Continue after all inputs or any successful input",
  质量校验: "Quality check",
  "核对缺测、无效与非有限值": "Check missing, invalid and nonfinite values",
  无效数据处理: "Invalid data policy",
  剔除并记录: "Drop and record",
  中止并进入失败出口: "Stop and route to failure",
  水温窗口聚合: "Temperature aggregate",
  "按指标核对窗口、样本与单位": "Check windows, samples and units by metric",
  指标标识: "Metric ID",
  聚合方法: "Aggregation method",
  算术平均: "Mean",
  最大值: "Maximum",
  最小值: "Minimum",
  "窗口开始（ISO 8601）": "Window start (ISO 8601)",
  "窗口结束（ISO 8601）": "Window end (ISO 8601)",
  水温复核条件: "Temperature review",
  命中与未命中分开流转: "Route matches and nonmatches separately",
  比较方式: "Comparison",
  大于等于: "Greater than or equal to",
  大于: "Greater than",
  小于: "Less than",
  比较阈值: "Threshold",
  "仅为交互演示，不代表水质标准或正式告警阈值。":
    "For demonstration only. This is not a water-quality standard or an operational alarm threshold.",
  提交人工复核: "Send for review",
  "告警中心、消息订阅或人工复核":
    "Alarm centers, subscriptions or manual review",
  目标引用: "Destination reference",
  常规结果归档: "Archive observations",
  "时序库、对象存储或数据仓库":
    "Time-series database, object storage or warehouse",
  失败归档: "Failure archive",
  错误上下文进入待重放队列: "Send error context to a replay queue",
  异常队列: "Error queue",
  事件触发: "Event trigger",
  定时触发: "Scheduled trigger",
  周期采样与批处理任务: "Periodic sampling and batch jobs",
  "Cron 表达式": "Cron expression",
  "实际调度由宿主服务解析；演示仅手动触发一次。":
    "The host service schedules this expression. The demo runs once when started manually.",
  调度时区: "Schedule timezone",
  手动触发: "Manual trigger",
  人工复核与历史补算: "Manual review and historical reprocessing",
  任务类型: "Task type",
  设备数据: "Device data",
  "HTTP 数据源": "HTTP source",
  数据库查询: "Database query",
  历史数据与台账关联: "Historical data and reference records",
  文件输入: "File input",
  "CSV / 实验室检测结果": "CSV files or laboratory results",
  文件引用: "File reference",
  字段与单位转换: "Field and unit conversion",
  "显式线性换算，保留采样时间":
    "Explicit linear conversion with sample timestamps preserved",
  作用指标: "Target metric",
  来源单位: "Source unit",
  "仅转换该指标；其他指标保持原样，来源单位不符时拒绝转换。":
    "Convert only this metric and preserve the others. Reject mismatched source units.",
  换算系数: "Scale factor",
  偏移量: "Offset",
  目标单位: "Target unit",
  "系数、偏移与目标单位由业务定义。":
    "The application defines the scale, offset and target unit.",
  窗口聚合: "Window aggregate",
  模型计算: "Model inference",
  由已注册模型处理输入: "Process input with a registered model",
  模型标识: "Model ID",
  模型版本: "Model version",
  条件分支: "Condition",
  并行分发: "Parallel split",
  汇合等待: "Join",
  数据存储: "Data storage",
  "Webhook 分发": "Webhook delivery",
  将处理结果交给下游服务: "Send processed results to a downstream service",
  通知与订阅: "Notifications",
  新的数据处理流程: "New data workflow",
};

const label = (value: string) => legacyLabels[value] ?? value;

export function migrateWorkflowDemoLanguage(
  workflow: WorkflowDefinition,
): WorkflowDefinition {
  return {
    ...workflow,
    name: label(workflow.name),
    ...(workflow.description === undefined
      ? {}
      : { description: label(workflow.description) }),
    nodes: workflow.nodes.map((node) => ({
      ...node,
      label: label(node.label),
      ...(node.description === undefined
        ? {}
        : { description: label(node.description) }),
      parameters: node.parameters.map((field) => ({
        ...field,
        label: label(field.label),
        value:
          node.operation === "event" &&
          field.key === "scope" &&
          field.value === "流域 / 北岸断面"
            ? "Watershed / North bank"
            : field.value,
        ...(field.description === undefined
          ? {}
          : { description: label(field.description) }),
        ...(field.options === undefined
          ? {}
          : {
              options: field.options.map((option) => ({
                ...option,
                label: label(option.label),
              })),
            }),
      })),
    })),
  };
}
