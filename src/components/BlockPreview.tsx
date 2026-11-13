import { chartCase, chartCaseWindow } from "@/lib/chart-demo-data";
import { lazy, useId, useState, type ReactNode } from "react";
import { FleetOverview } from "@/components/blocks/fleet-overview";
import {
  DeviceDetail,
  type DeviceReading,
} from "@/components/blocks/device-detail";
import { DeviceGroups } from "@/components/blocks/device-groups";
import { SoilProfile } from "@/components/blocks/soil-profile";
import {
  TelemetryExplorer,
  type TelemetryExportRow,
} from "@/components/blocks/telemetry-explorer";
import {
  AlertConsole,
  type DeviceAlert,
} from "@/components/blocks/alert-console";
import { DeviceControl } from "@/components/blocks/device-control";
import { GreenhouseControl } from "@/components/blocks/greenhouse-control";
import type { ControlModeValue } from "@/components/iot/control-mode";
import type { ActuatorDirection } from "@/components/iot/actuator-control";
import {
  demoConfiguration,
  greenhouseTemperature,
  greenhouseAlert,
  greenhouseHistory,
} from "@/lib/demo-data";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  demoNow,
  deviceLink,
  hour,
  profileDeviceId,
  soilHistory,
  soilLayers,
  soilMetrics,
  soilReadings,
  soilSample,
  stationAlerts,
  stationDevices,
  stationGroups,
  telemetryLink,
} from "@/lib/block-demo-data";

const waitForDemo = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 450));

const WorkflowPreview = lazy(() =>
  import("./WorkflowPreview").then((module) => ({
    default: module.WorkflowPreview,
  })),
);
const SoilWaterPreview = lazy(() =>
  import("./SoilWaterPreview").then((module) => ({
    default: module.SoilWaterPreview,
  })),
);

function DemoToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="min-h-10 cursor-pointer font-normal">
        {label}
      </Label>
    </div>
  );
}

function BlockStage({
  controls,
  children,
}: {
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="preview-shell block-preview" aria-label="交互预览">
      <div className="block-preview-bar">
        <p className="block-preview-label">
          交互预览 <span>演示数据</span>
        </p>
        {controls && (
          <div
            className="block-preview-options"
            role="group"
            aria-label="演示选项"
          >
            {controls}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

function FleetPreview() {
  const [empty, setEmpty] = useState(false);
  return (
    <BlockStage
      controls={
        <DemoToggle label="模拟空目录" checked={empty} onChange={setEmpty} />
      }
    >
      <FleetOverview
        devices={empty ? [] : stationDevices}
        title="设备目录"
        subtitle="青禾试验站"
        deviceHref={(device) => deviceLink(device.id)}
      />
    </BlockStage>
  );
}

function DetailPreview({ id }: { id: string }) {
  const item = stationDevices.find((device) => device.id === id);
  if (!item)
    return (
      <p role="status">
        找不到示例设备。
        <a className="underline" href="#/blocks/fleet-overview">
          返回设备目录
        </a>
      </p>
    );

  const primary = item.id === profileDeviceId;
  const online = item.online;
  const readings: DeviceReading[] = primary
    ? soilReadings
    : item.id === "SOIL-S01"
      ? [
          {
            id: "water-30",
            label: "含水率 · 30 cm",
            value: 22.1,
            unit: "%",
            quality: "good",
            sampledAt: item.lastSeenAt,
            expectedInterval: 600,
            source: "埋地探针",
          },
        ]
      : [];
  return (
    <DeviceDetail
      device={{
        ...item,
        id: item.id,
        name: item.name,
        product: item.product,
        location: item.location,
        tags: item.tags ?? item.groups,
        online,
        lastSeenAt: item.lastSeenAt,
        interfaceName: item.protocol + " 接入",
        admission: online === null ? undefined : "active",
      }}
      onConfigure={(selected) => {
        window.location.hash =
          "/blocks/device-control?device=" + encodeURIComponent(selected.id);
      }}
      now={demoNow}
      readings={readings}
      historyHref={primary ? telemetryLink() : undefined}
      profileHref={primary ? "#/blocks/soil-profile" : undefined}
      properties={
        primary
          ? [
              { id: "model", label: "型号", value: "SP-3D" },
              { id: "hardware", label: "硬件版本", value: "Rev. B" },
              { id: "depth", label: "探针安装深度", value: "10 / 30 / 60 cm" },
              { id: "interval", label: "采样间隔", value: "10 分钟" },
              { id: "serial", label: "出厂序列号", value: "QH-SP3D-26092" },
              { id: "commissioned", label: "部署日期", value: "2026-09-18" },
            ]
          : []
      }
      events={
        primary
          ? [
              {
                id: "e-3",
                actor: "数据质量检查",
                time: "11/10 07:20 UTC",
                title: "60 cm 含水率读数无效",
                detail: "设备上报时其他层读数有效。",
                tone: "warning",
              },
              {
                id: "e-2",
                actor: "接入网关",
                time: "11/10 06:51 UTC",
                title: "会话重新连接",
                tone: "success",
              },
              {
                id: "e-1",
                actor: "设备",
                time: "11/10 06:49 UTC",
                title: "采样模块启动",
              },
            ]
          : []
      }
    />
  );
}

function downloadCsv(rows: TelemetryExportRow[]) {
  const csvField = (value: string) => '"' + value.replaceAll('"', '""') + '"';
  const data = rows.map((row) =>
    [
      new Date(row.timestamp).toISOString(),
      csvField(row.metricId),
      csvField(row.label),
      csvField(row.unit),
      row.value ?? "",
      csvField(row.state),
      csvField(row.quality ?? ""),
      csvField(row.qualityReason ?? ""),
    ].join(","),
  );
  const blob = new Blob(
    [
      "\uFEFF" +
        [
          "timestamp_utc,metric_id,label,unit,value,state,quality,quality_reason",
          ...data,
        ].join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = profileDeviceId + "-telemetry.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function HistoryPreview({ metric }: { metric: string | null }) {
  const [scenario, setScenario] = useState("normal");
  const [fail, setFail] = useState(false);
  const metricIds =
    metric && soilMetrics.some((item) => item.id === metric)
      ? [metric]
      : ["water-10", "water-30"];
  const fixture = scenario === "normal" ? null : chartCase(scenario);
  const initialQuery = fixture
    ? { ...chartCaseWindow, metricIds: fixture.series.map((s) => s.id) }
    : { from: demoNow - 24 * hour, to: demoNow, metricIds };
  return (
    <BlockStage
      controls={
        <>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            数据场景
            <select
              aria-label="历史数据场景"
              className="min-h-10 max-w-full rounded-md border border-border bg-card px-2"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
            >
              {[
                ["normal", "土壤观测"],
                ["known", "可手算案例 · 跨年与缺测"],
                ["mixed", "不同单位分图"],
                ["single", "单点零值"],
                ["constant", "常量零值"],
                ["empty", "无记录"],
                ["invalid", "缺测与无效"],
                ["extreme", "极端值"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <DemoToggle label="模拟查询失败" checked={fail} onChange={setFail} />
        </>
      }
    >
      {fixture && (scenario === "known" || scenario === "mixed") && (
        <p className="mb-4 text-sm text-muted-foreground">
          演示数据 · A 的五个时刻为第 0、1、3、10、20 分钟；值为
          0、10、缺测、−10、20。原始输入乱序且末时刻重复，最后收到的 20 生效。
        </p>
      )}
      <TelemetryExplorer
        key={scenario}
        subtitle={
          fixture
            ? "可手算演示 · 跨年采样"
            : profileDeviceId + " · 北区二号土壤剖面仪"
        }
        metrics={fixture?.series ?? soilMetrics}
        now={demoNow}
        initialQuery={initialQuery}
        initialResult={fixture ?? soilHistory(initialQuery)}
        onQuery={async (query) => {
          await waitForDemo();
          if (fail) throw new Error("Simulated query failure");
          return fixture ?? soilHistory(query);
        }}
        onExport={downloadCsv}
      />
    </BlockStage>
  );
}

function AlarmPreview() {
  const [fail, setFail] = useState(false);
  const [alerts, setAlerts] = useState(stationAlerts);

  async function change(id: string, action: "acknowledged" | "cleared") {
    await waitForDemo();
    if (fail) throw new Error("Simulated write failure");
    setAlerts((current) =>
      current.map((alert) => {
        if (alert.id !== id) return alert;
        return action === "acknowledged"
          ? {
              ...alert,
              status: action,
              acknowledged: true,
              acknowledgedAt: demoNow,
              acknowledgedBy: "演示值班员",
            }
          : { ...alert, status: action, clearedAt: demoNow };
      }),
    );
  }
  return (
    <BlockStage
      controls={
        <DemoToggle label="模拟处置失败" checked={fail} onChange={setFail} />
      }
    >
      <AlertConsole
        alerts={alerts}
        onAcknowledge={(id) => change(id, "acknowledged")}
        onClear={(id) => change(id, "cleared")}
      />
    </BlockStage>
  );
}

function ConfigurationPreview({ id = profileDeviceId }: { id?: string }) {
  const device =
    stationDevices.find((item) => item.id === id) ?? stationDevices[0];
  const [configuration, setConfiguration] = useState(demoConfiguration);
  const [offline, setOffline] = useState(device.online === false);
  const [fail, setFail] = useState(false);
  return (
    <BlockStage
      controls={
        <>
          <DemoToggle
            label="模拟离线"
            checked={offline}
            onChange={setOffline}
          />
          <DemoToggle label="模拟保存失败" checked={fail} onChange={setFail} />
        </>
      }
    >
      <div className="mx-auto max-w-4xl">
        <DeviceControl
          deviceId={device.id}
          deviceName={device.name}
          online={!offline}
          configuration={configuration}
          onApply={async (next) => {
            await waitForDemo();
            if (fail) throw new Error("演示保存失败。请重试。");
            setConfiguration(next);
          }}
        />
      </div>
    </BlockStage>
  );
}

function GreenhousePreview() {
  const [offline, setOffline] = useState(false);
  const [fail, setFail] = useState(false);
  const [mode, setMode] = useState<ControlModeValue>("manual");
  const [setpoint, setSetpoint] = useState(26);
  const [pump, setPump] = useState(false);
  const [direction, setDirection] = useState<ActuatorDirection>("stop");
  const [alert, setAlert] = useState(greenhouseAlert);

  async function request(commit: () => void) {
    await waitForDemo();
    if (fail) throw new Error("演示请求失败。请重试。");
    commit();
  }

  return (
    <BlockStage
      controls={
        <>
          <DemoToggle
            label="模拟离线"
            checked={offline}
            onChange={setOffline}
          />
          <DemoToggle label="模拟请求失败" checked={fail} onChange={setFail} />
        </>
      }
    >
      <GreenhouseControl
        title="一号温室 · 番茄花期"
        online={!offline}
        readings={{
          temperature: greenhouseTemperature,
          humidity: 68,
          co2: 812,
          ageSeconds: offline ? 720 : 12,
        }}
        history={greenhouseHistory}
        historyMaxGapMs={450_000}
        mode={mode}
        onModeChange={setMode}
        setpoint={setpoint}
        onSetpointApply={(next) => request(() => setSetpoint(next))}
        pump={pump}
        onPumpCommand={(next) => request(() => setPump(next))}
        vent={{ direction, position: 45 }}
        onVentCommand={(next) => request(() => setDirection(next))}
        alerts={[alert]}
        onAcknowledge={() =>
          request(() =>
            setAlert((current) => ({ ...current, acknowledged: true })),
          )
        }
      />
    </BlockStage>
  );
}

export function BlockPreview({
  name,
  search,
}: {
  name: string;
  search?: string;
}) {
  const params = new URLSearchParams(search);
  switch (name) {
    case "soil-water-explorer":
      return <SoilWaterPreview />;
    case "data-workflow":
      return <WorkflowPreview />;
    case "fleet-overview":
      return <FleetPreview />;
    case "device-detail":
      return (
        <BlockStage>
          <DetailPreview id={params.get("device") ?? profileDeviceId} />
        </BlockStage>
      );
    case "device-control":
      return (
        <ConfigurationPreview
          key={params.get("device")}
          id={params.get("device") ?? undefined}
        />
      );
    case "device-groups":
      return (
        <BlockStage>
          <DeviceGroups groups={stationGroups} initialGroupId="plot-n02" />
        </BlockStage>
      );
    case "soil-profile":
      return (
        <BlockStage>
          <SoilProfile
            title="北区 02 样地土壤剖面"
            location={profileDeviceId + " · 青禾试验站"}
            sampledAt={soilSample}
            layers={soilLayers}
            initialLayerId="30"
          />
        </BlockStage>
      );
    case "telemetry-explorer":
      return <HistoryPreview metric={params.get("metric")} />;
    case "alert-console":
      return <AlarmPreview />;
    case "greenhouse-control":
      return <GreenhousePreview />;
    default:
      return null;
  }
}
