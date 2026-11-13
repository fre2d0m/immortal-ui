import { ThemeCoveragePreview } from "@/components/ThemeCoveragePreview";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { FoundationsPreview } from "@/components/RegistryPreview";
import { MetricCard } from "@/components/iot/metric-card";
import { IndicatorCard } from "@/components/iot/indicator-card";
import { TelemetryChart } from "@/components/iot/telemetry-chart";
import { chartCase, chartCaseWindow } from "@/lib/chart-demo-data";
import {
  normalCardDemo,
  comparableTemperatureDomain,
} from "@/lib/data-card-demo-data";
import { DeviceProfile } from "@/components/iot/device-profile";
import { CodeSnippet, installCommand } from "@/components/CodeSnippet";
import { demoNow, stationDevices } from "@/lib/block-demo-data";

import { themeOverrides, type ThemeSettings } from "@/lib/theme-settings";
const SoilWaterPreview = lazy(() =>
  import("@/components/SoilWaterPreview").then((m) => ({
    default: m.SoilWaterPreview,
  })),
);

export function ThemePage({
  settings,
  panelOpen,
  onOpen,
}: {
  settings: ThemeSettings;
  panelOpen: boolean;
  onOpen: () => void;
}) {
  const overrides = themeOverrides(settings);
  const [annualPreview, setAnnualPreview] = useState(false);
  return (
    <>
      <div className="page-heading">
        <h1>Graphite Instrument</h1>
        <p>
          One light source. Three layers of depth. A quiet, tactile theme for
          interfaces that work with the physical world.
        </p>
      </div>
      <div className="mb-6">
        <Button
          id="open-theme-editor"
          onClick={onOpen}
          aria-expanded={panelOpen}
          aria-controls="theme-editor"
        >
          样式配置
        </Button>
      </div>
      <div className="preview-shell mb-8 p-5 sm:p-7">
        <ThemeCoveragePreview />
      </div>
      <section
        className="mb-8 space-y-5"
        aria-labelledby="business-panels-title"
      >
        <h2 id="business-panels-title" className="text-xl font-medium">
          业务组件 · 演示数据
        </h2>
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <MetricCard
              definition={{
                id: "airTemperature",
                label: "空气温度",
                subject: "北侧温室 · T-01",
                type: "number",
                unit: "°C",
                precision: 1,
                range: { min: -10, max: 50 },
                expectedInterval: 30,
              }}
              visualization="trend"
              history={{
                points: normalCardDemo.observations,
                label: "演示数据 · 原始观测",
                maxGapMs: 90_000,
                domain: comparableTemperatureDomain,
              }}
              observation={{
                value: normalCardDemo.latest!.value,
                sampledAt: normalCardDemo.latest!.timestamp,
                quality: "good",
              }}
              source={{ device: "环境传感器 ENV-001" }}
              now={demoNow}
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <a
                className="underline underline-offset-4"
                href="#/components/metric-card"
              >
                Metric Card · 观测卡片
              </a>
              ：读数与单位是主体，质量、采样时间和来源紧随读数。
            </p>
          </div>
          <div className="space-y-4">
            <IndicatorCard
              definition={{
                id: "droughtRisk",
                label: "干旱风险",
                subject: "北区 02 样地 · 根区",
                type: "state",
                states: [{ value: "medium", label: "中风险", tone: "warning" }],
              }}
              result={{
                value: "medium",
                calculatedAt: demoNow - 60_000,
                quality: "good",
                window: { from: demoNow - 86_400_000, to: demoNow - 60_000 },
              }}
              method={{
                label: "土壤水分分级规则",
                version: "v1.2",
                inputs: ["10 / 20 / 30 cm 含水率", "土壤类型与阈值"],
              }}
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <a
                className="underline underline-offset-4"
                href="#/components/indicator-card"
              >
                Indicator Card · 衍生指标卡片
              </a>
              ：计算结果、作用对象与计算依据共同支持判断。
            </p>
          </div>
        </div>
        <TelemetryChart
          label="多序列比较 · 演示数据"
          series={chartCase("mixed").series}
          window={chartCaseWindow}
          maxGapMs={720_000}
        />
        <div className="space-y-4">
          <Button
            variant="outline"
            aria-expanded={annualPreview}
            onClick={() => setAnnualPreview((value) => !value)}
          >
            {annualPreview ? "收起年度分析预览" : "预览年度多要素分析"}
          </Button>
          {annualPreview && (
            <Suspense fallback={<p role="status">正在加载年度分析…</p>}>
              <SoilWaterPreview />
            </Suspense>
          )}
        </div>
        <div className="pt-6 space-y-4">
          <DeviceProfile
            headingLevel="h3"
            device={stationDevices[1]}
            onConfigure={(device) => {
              window.location.hash =
                "/blocks/device-control?device=" +
                encodeURIComponent(device.id);
            }}
          />
          <p className="text-sm leading-relaxed text-muted-foreground">
            <a
              className="underline underline-offset-4"
              href="#/components/device-profile"
            >
              Device Profile · 设备档案
            </a>
            ：实物图、身份与运行摘要组成页面级档案，直接使用页面底色。
          </p>
        </div>
      </section>
      <div className="material-swatches">
        {[
          {
            name: "Raised surface",
            cls: "surface-raised",
            description: "Panels and dialogs",
          },
          {
            name: "Recessed well",
            cls: "surface-inset",
            description: "Content and measurements",
          },
          {
            name: "Tactile control",
            cls: "surface-control",
            description: "Actions and selected states",
          },
        ].map((swatch) => (
          <div key={swatch.name}>
            <div className={`${swatch.cls} swatch`} />
            <h2>{swatch.name}</h2>
            <p>{swatch.description}</p>
          </div>
        ))}
      </div>
      <div className="theme-preview">
        <div className="preview-shell">
          <div className="preview-label">
            <span>Theme preview</span>
            <span>Live preview · changes saved in this browser</span>
          </div>
          <div className="p-5 sm:p-7">
            <FoundationsPreview />
          </div>
        </div>
      </div>
      <h2 className="doc-heading">Install the full theme</h2>
      <CodeSnippet code={installCommand("graphite")} />
      <p className="doc-copy">
        The CLI installs the tokens and shared state rules together. For manual
        integration,{" "}
        <a href="./themes/graphite.css" download>
          download the full stylesheet
        </a>{" "}
        and use it as your Tailwind v4 global CSS. It imports Tailwind,
        tw-animate-css, and shadcn/tailwind.css; install those packages first.
      </p>
      <h2 className="doc-heading">Your overrides</h2>
      <CodeSnippet code={overrides} label="theme overrides" />
    </>
  );
}
