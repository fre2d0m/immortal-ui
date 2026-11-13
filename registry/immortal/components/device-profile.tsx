"use client";

import { useId, useState } from "react";
import {
  Battery,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  MapPin,
  Settings2,
  Tag,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DeviceStatus, type DeviceState } from "@/components/iot/device-status";
import { SignalStrength } from "@/components/iot/signal-strength";
import type { Device, DeviceService } from "@/components/iot/device";

export type { Device, DeviceService } from "@/components/iot/device";

const stateLabels: Record<DeviceState, string> = {
  online: "在线",
  warning: "需关注",
  offline: "离线",
  provisioning: "接入中",
  unknown: "连接未知",
};

/** A page-level device identity, with its own layout and no panel surface. */
export function DeviceProfile({
  device,
  onConfigure,
  services = [],
  onService,
  headingLevel: Heading = "h2",
}: {
  device: Device;
  onConfigure?: (device: Device) => void;
  services?: DeviceService[];
  /** Opens the service workflow; the host owns confirmation and execution. */
  onService?: (serviceId: string, device: Device) => void;
  headingLevel?: "h1" | "h2" | "h3";
}) {
  const titleId = useId();
  const [copyFeedback, setCopyFeedback] = useState<{
    deviceId: string;
    value: string;
    label: string;
    ok: boolean;
  }>();
  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback({ deviceId: device.id, value, label, ok: true });
    } catch {
      setCopyFeedback({ deviceId: device.id, value, label, ok: false });
    }
  };
  const currentFeedback =
    copyFeedback?.deviceId === device.id &&
    (copyFeedback.value === device.serialNumber ||
      copyFeedback.value === device.id)
      ? copyFeedback
      : undefined;
  const hasActions = !!onConfigure || (services.length > 0 && !!onService);
  const metadata = [
    ["产品", device.product],
    ["硬件", device.hardwareVersion],
    ["固件", device.firmwareVersion],
    ["安装日期", device.installedAt],
    [
      "部署",
      device.deployment &&
        {
          undeployed: "未部署",
          deployed: "已部署",
          inMaintenance: "维护中",
          retired: "已退役",
        }[device.deployment],
    ],
    [
      "工作状态",
      device.operational &&
        {
          normal: "运行正常",
          degraded: "性能下降",
          faulty: "故障",
          silent: "未上报业务数据",
          unknown: "未知",
        }[device.operational],
    ],
    [
      "准入",
      device.admission &&
        {
          active: "已启用",
          suspended: "已暂停",
          revoked: "已吊销",
        }[device.admission],
    ],
  ].filter(([, value]) => value);
  const copyButton = (value: string, label: string) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="min-h-10 min-w-10 shrink-0"
      aria-label={`复制${label}`}
      onClick={() => copy(value, label)}
    >
      {currentFeedback?.value === value && currentFeedback.ok ? (
        <Check aria-hidden="true" />
      ) : (
        <Copy aria-hidden="true" />
      )}
    </Button>
  );

  return (
    <section
      data-slot="device-profile"
      aria-labelledby={titleId}
      className="@container min-w-0 py-2"
    >
      <div
        className={`grid min-w-0 items-start gap-x-6 gap-y-4 ${
          device.image
            ? "grid-cols-[64px_minmax(0,1fr)] @2xl:grid-cols-[136px_minmax(0,1fr)_auto]"
            : "grid-cols-[minmax(0,1fr)] @2xl:grid-cols-[minmax(0,1fr)_auto]"
        }`}
      >
        {device.image && (
          <img
            data-slot="device-profile-image"
            src={device.image.src}
            alt={device.image.alt}
            className="col-start-1 row-start-1 size-16 self-center object-contain @2xl:row-span-2 @2xl:h-44 @2xl:w-34"
          />
        )}
        <div className={`min-w-0 ${!hasActions ? "@2xl:col-span-2" : ""}`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Heading
              id={titleId}
              className="min-w-0 text-xl leading-snug font-semibold tracking-tight wrap-anywhere @2xl:text-2xl"
            >
              {device.name}
            </Heading>
            <DeviceStatus
              state={device.state}
              label={stateLabels[device.state]}
            />
          </div>
          {!!device.tags?.length && (
            <ul
              aria-label="设备标签"
              className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground"
            >
              {device.tags.map((tag) => (
                <li
                  key={tag}
                  className="inline-flex min-w-0 items-center gap-1.5"
                >
                  <Tag className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="wrap-anywhere">{tag}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {hasActions && (
          <div
            data-slot="control-row"
            className={`col-span-full flex flex-wrap gap-2 @2xl:col-span-1 @2xl:row-start-1 ${device.image ? "@2xl:col-start-3" : "@2xl:col-start-2"}`}
          >
            {onConfigure && (
              <Button
                type="button"
                variant="outline"
                className="min-h-10"
                onClick={() => onConfigure(device)}
              >
                <Settings2 aria-hidden="true" /> 配置
              </Button>
            )}
            {services.length > 0 && onService && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="min-h-10">
                    <Wrench aria-hidden="true" /> 服务{" "}
                    <ChevronDown aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {services.map((service) => (
                    <DropdownMenuItem
                      key={service.id}
                      disabled={!!service.disabledReason}
                      onSelect={() => onService(service.id, device)}
                    >
                      <span className="flex flex-col gap-1">
                        <span>{service.label}</span>
                        {service.disabledReason && (
                          <span className="text-xs text-muted-foreground">
                            {service.disabledReason}
                          </span>
                        )}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
        <div
          className={`col-span-full min-w-0 space-y-4 @2xl:col-span-2 ${device.image ? "@2xl:col-start-2" : "@2xl:col-start-1"}`}
        >
          <dl className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <dt className="shrink-0">序列号</dt>
              <dd className="flex min-w-0 items-center gap-1 font-mono">
                <span className="wrap-anywhere">
                  {device.serialNumber || "未提供"}
                </span>
                {device.serialNumber &&
                  copyButton(device.serialNumber, "序列号")}
              </dd>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <dt className="shrink-0">型号</dt>
              <dd className="font-mono wrap-anywhere">
                {device.model || "未提供"}
              </dd>
            </div>
          </dl>
          {device.description && (
            <p className="text-sm leading-relaxed wrap-anywhere text-muted-foreground">
              {device.description}
            </p>
          )}
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <dt className="flex shrink-0 items-center gap-2 text-muted-foreground">
                <Clock3 className="size-4" aria-hidden="true" /> 最近活动
              </dt>
              <dd className="tabular-nums wrap-anywhere">
                {device.lastSeen || "未知"}
              </dd>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <dt>
                <Battery
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="sr-only">电源</span>
              </dt>
              <dd className="flex flex-wrap gap-x-2 tabular-nums">
                <span>
                  {device.battery !== null && Number.isFinite(device.battery)
                    ? `${Math.max(0, Math.min(100, device.battery))}%`
                    : device.batteryVoltage != null &&
                        Number.isFinite(device.batteryVoltage)
                      ? `${device.batteryVoltage} V`
                      : "未提供"}
                </span>
                {device.power && (
                  <span className="text-muted-foreground">
                    {
                      {
                        normal: "正常",
                        low: "电量偏低",
                        critical: "电量极低",
                        charging: "充电中",
                        external: "外接电源",
                      }[device.power]
                    }
                  </span>
                )}
              </dd>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <dt className="sr-only">信号与协议</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <SignalStrength
                  rssi={device.rssi}
                  className="text-sm text-foreground"
                />
                <span className="text-muted-foreground">
                  {device.protocol || "接入方式未知"}
                </span>
              </dd>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <dt>
                <MapPin
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="sr-only">安装位置</span>
              </dt>
              <dd className="wrap-anywhere">{device.location || "未提供"}</dd>
            </div>
          </dl>
          <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <dt className="shrink-0">平台标识</dt>
              <dd className="flex min-w-0 items-center gap-1 font-mono">
                <span className="wrap-anywhere">{device.id}</span>
                {copyButton(device.id, "平台标识")}
              </dd>
            </div>
            {metadata.map(([label, value]) => (
              <div key={label} className="flex min-w-0 flex-wrap gap-x-2">
                <dt>{label}</dt>
                <dd className="wrap-anywhere">{value}</dd>
              </div>
            ))}
          </dl>
          <p role="status" className="sr-only">
            {currentFeedback
              ? currentFeedback.ok
                ? `${currentFeedback.label}已复制`
                : "复制失败，请选择标识后手动复制。"
              : ""}
          </p>
          {currentFeedback && !currentFeedback.ok && (
            <p className="text-sm text-destructive">
              复制失败，请选择标识后手动复制。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
