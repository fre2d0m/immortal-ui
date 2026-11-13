import { useState } from "react";
import {
  MetricCard,
  type MetricDefinition,
} from "@/components/iot/metric-card";
import {
  IndicatorCard,
  type IndicatorDefinition,
} from "@/components/iot/indicator-card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { demoNow } from "@/lib/block-demo-data";
import {
  dataCardDemo,
  comparableTemperatureDomain,
} from "@/lib/data-card-demo-data";

export function DataCardsPreview({ kind }: { kind: "metric" | "indicator" }) {
  const [example, setExample] = useState("number");
  const [visualization, setVisualization] = useState<
    "value" | "trend" | "range"
  >("trend");
  const [scenario, setScenario] = useState("normal");
  const demo = dataCardDemo(scenario);
  const choices =
    kind === "metric"
      ? [
          ["number", "空气温度 · 数值"],
          ["state", "门磁状态 · 枚举"],
        ]
      : [
          ["number", "温室均温 · 聚合数值"],
          ["state", "干旱风险 · 分级结果"],
          ["table", "虫情识别 · 结构化结果"],
        ];
  const metricDefinition: MetricDefinition =
    example === "state"
      ? {
          id: "doorContact",
          label: "检修门",
          subject: "北区泵房 · 门磁 DC-01",
          type: "state",
          description: "设备上报的接点状态",
          states: [
            { value: false, label: "关闭" },
            { value: true, label: "打开", tone: "warning" },
          ],
          expectedInterval: 60,
        }
      : {
          id: "airTemperature",
          label: "空气温度",
          subject: "北侧温室 · 测点 T-01",
          type: "number",
          unit: "°C",
          precision: 1,
          description: "探头最近一次上报的观测值",
          range: { min: -10, max: 50, target: { low: 18, high: 28 } },
          expectedInterval: 60,
        };
  const indicatorDefinition: IndicatorDefinition =
    example === "state"
      ? {
          id: "droughtRisk",
          label: "干旱风险",
          subject: "北区 02 样地 · 根区",
          type: "state",
          description: "近 24 小时土壤观测的规则判定",
          states: [
            { value: "low", label: "低风险", tone: "positive" },
            { value: "medium", label: "中风险", tone: "warning" },
            { value: "high", label: "高风险", tone: "negative" },
          ],
        }
      : example === "table"
        ? {
            id: "insectIdentification",
            label: "虫情识别",
            subject: "北区诱捕点 · 相机 CAM-02",
            type: "table",
            description: "本次图像识别的分类结果",
            columns: [
              { key: "category", label: "识别类别" },
              { key: "count", label: "数量", unit: "只", precision: 0 },
              { key: "score", label: "模型得分", precision: 2 },
            ],
          }
        : {
            id: "meanTemperature",
            label: "温室均温",
            subject: "北侧温室 · 3 个测点",
            type: "number",
            unit: "°C",
            precision: 1,
            description: "最近 15 分钟有效样本的算术平均值",
            range: { min: -10, max: 50, target: { low: 18, high: 28 } },
          };
  const missing = scenario === "missing";
  const quality =
    scenario === "bad"
      ? "bad"
      : scenario === "estimated"
        ? "estimated"
        : "good";
  const numericValue = demo.latest?.value ?? null;
  const common = {
    visualization,
    loading: scenario === "loading",
    error: scenario === "error" ? "数据读取失败，请稍后重试。" : undefined,
    history: {
      points: demo.observations,
      label: `${scenario === "estimated" ? "估算记录" : "原始观测"} · 预期间隔 60 秒`,
      maxGapMs: 90_000,
      domain: comparableTemperatureDomain,
    },
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">数据对象</p>
          <Select
            value={example}
            onValueChange={(value) => {
              setExample(value);
              setScenario("normal");
            }}
          >
            <SelectTrigger aria-label="数据对象" className="w-64 max-w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {choices.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {example === "number" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">卡片内可视化</p>
            <Select
              value={visualization}
              onValueChange={(value) =>
                setVisualization(value as typeof visualization)
              }
            >
              <SelectTrigger aria-label="卡片内可视化" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value">数值</SelectItem>
                <SelectItem value="trend">趋势</SelectItem>
                <SelectItem value="range">范围</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">数据场景</p>
          <Select value={scenario} onValueChange={setScenario}>
            <SelectTrigger aria-label="数据场景" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                ["normal", "正常"],
                ["missing", "无数据"],
                ["bad", "无效数据"],
                ["estimated", "估算值"],
                ["loading", "加载中"],
                ["error", "读取失败"],
                ...(example === "number"
                  ? [
                      ["zero", "零值"],
                      ["negative", "负值"],
                      ["outside", "超出范围"],
                      ["single", "单点"],
                      ["constant", "常量"],
                      ["irregular", "不规则采样与长缺口"],
                      ["cross-year", "跨年窗口"],
                    ]
                  : []),
                ...(kind === "metric"
                  ? [
                      ["offline", "离线快照"],
                      ["stale", "陈旧观测"],
                    ]
                  : []),
              ].map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mx-auto max-w-xl">
        {kind === "metric" ? (
          <MetricCard
            {...common}
            definition={metricDefinition}
            observation={{
              value: missing
                ? null
                : example === "state"
                  ? false
                  : numericValue,
              sampledAt: missing ? null : (demo.latest?.timestamp ?? null),
              receivedAt: missing
                ? null
                : (demo.latest?.timestamp ?? demoNow) + 3_000,
              quality,
            }}
            source={{
              device: example === "state" ? "门磁 DC-01" : "环境传感器 ENV-001",
              channel: example === "state" ? "DI-01" : "温度通道 T-01",
              offline: scenario === "offline",
            }}
            now={demoNow}
            comparison={
              example === "number"
                ? {
                    label: "较前一采样",
                    referenceValue: demo.previous?.value ?? NaN,
                    mode: "absolute",
                    tone: "neutral",
                  }
                : undefined
            }
          />
        ) : (
          <IndicatorCard
            {...common}
            definition={indicatorDefinition}
            result={{
              value: missing
                ? null
                : example === "state"
                  ? "medium"
                  : example === "table"
                    ? [
                        { category: "鳞翅目", count: 12, score: 0.92 },
                        { category: "鞘翅目", count: 4, score: 0.86 },
                      ]
                    : (demo.result?.value ?? null),
              calculatedAt: missing
                ? null
                : (demo.result?.timestamp ?? demoNow - 60_000),
              window:
                example === "number"
                  ? demo.result?.window
                  : example !== "table"
                    ? {
                        from:
                          demoNow -
                          60_000 -
                          (example === "state" ? 86_400_000 : 900_000),
                        to: demoNow - 60_000,
                      }
                    : undefined,
              quality,
            }}
            method={{
              label:
                example === "state"
                  ? "土壤水分分级规则"
                  : example === "table"
                    ? "虫情图像分类模型"
                    : "有效样本算术平均",
              version: "v1.2",
              inputs:
                example === "state"
                  ? ["10 / 20 / 30 cm 土壤含水率", "土壤类型与阈值"]
                  : example === "table"
                    ? ["CAM-02 · 本次采样图像"]
                    : ["T-01、T-02、T-03 的有效温度样本"],
            }}
            history={
              example === "number"
                ? {
                    points: demo.calculations,
                    label: "15 分钟均值 · 每分钟计算一次",
                    maxGapMs: 90_000,
                    domain: comparableTemperatureDomain,
                  }
                : undefined
            }
            historyHref={undefined}
            comparison={
              example === "number"
                ? {
                    label: "较上一窗口",
                    referenceValue: demo.previousResult?.value ?? NaN,
                    mode: "absolute",
                  }
                : undefined
            }
            secondary={
              example === "number" && !missing && quality !== "bad"
                ? [
                    {
                      label: "有效样本",
                      value: `${demo.result?.sampleCount ?? 0} / ${demo.result?.expectedCount ?? 0}`,
                    },
                    { label: "参与测点", value: "3 个" },
                  ]
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
