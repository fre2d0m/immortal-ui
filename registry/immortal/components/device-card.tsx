"use client";

import { useState } from "react";
import {
  Battery,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Cpu,
  MapPin,
  Settings2,
  Tag,
  Wrench,
} from "lucide-react";
import { Panel } from "@/components/iot/internal/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
export function DeviceCard({
  device,
  onOpen,
  onConfigure,
  services = [],
  onService,
  headingLevel = "h3",
}: {
  device: Device;
  onOpen?: (device: Device) => void;
  onConfigure?: (device: Device) => void;
  services?: DeviceService[];
  /** Opens the selected service's workflow; the host owns confirmation and execution. */
  onService?: (serviceId: string, device: Device) => void;
  headingLevel?: "h2" | "h3";
}) {
  const [copyFeedback, setCopyFeedback] = useState<{
    value: string;
    ok: boolean;
  }>();
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback({ value, ok: true });
    } catch {
      setCopyFeedback({ value, ok: false });
    }
  };
  const identity = [
    ["序列号", device.serialNumber, true],
    ["平台标识", device.id, true],
    ["型号", device.model, false],
  ] as const;
  const lifecycle = [
    [
      "准入",
      device.admission &&
        { active: "已启用", suspended: "已暂停", revoked: "已吊销" }[
          device.admission
        ],
    ],
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
  ].filter(([, value]) => value);
  return (
    <Panel
      as={headingLevel}
      icon={<Cpu />}
      title={device.name}
      description={device.product}
      status={
        <DeviceStatus state={device.state} label={stateLabels[device.state]} />
      }
      action={
        (onConfigure || (services.length > 0 && onService)) && (
          <div className="flex flex-wrap gap-2">
            {onConfigure && (
              <Button
                variant="outline"
                className="min-h-10"
                onClick={() => onConfigure(device)}
              >
                <Settings2 aria-hidden="true" />
                配置
              </Button>
            )}
            {services.length > 0 && onService && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-h-10">
                    <Wrench aria-hidden="true" />
                    服务
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
        )
      }
    >
      <div
        className={`grid min-w-0 gap-5 ${device.image ? "@lg:grid-cols-[120px_minmax(0,1fr)]" : ""}`}
      >
        {device.image && (
          <img
            src={device.image.src}
            alt={device.image.alt}
            className="size-28 object-contain @lg:size-30"
            loading="lazy"
          />
        )}
        <div className="min-w-0 space-y-4">
          {!!device.tags?.length && (
            <div className="flex flex-wrap gap-2" aria-label="设备标签">
              {device.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="max-w-full whitespace-normal"
                >
                  <Tag aria-hidden="true" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <dl className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {identity.map(([label, value, copyable]) => (
              <div key={label} className="min-w-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="mt-1 flex min-h-10 items-center gap-2">
                  <span className="min-w-0 font-mono wrap-anywhere">
                    {value || "未提供"}
                  </span>
                  {copyable && value && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 shrink-0"
                      aria-label={`复制${label}`}
                      onClick={() => copy(value)}
                    >
                      {copyFeedback?.value === value && copyFeedback.ok ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <Copy aria-hidden="true" />
                      )}
                    </Button>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {copyFeedback &&
            (copyFeedback.value === device.id ||
              copyFeedback.value === device.serialNumber) && (
              <p role="status" className="text-sm text-muted-foreground">
                {copyFeedback.ok
                  ? "已复制"
                  : "复制失败，请选择标识后手动复制。"}
              </p>
            )}
          {device.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {device.description}
            </p>
          )}
        </div>
      </div>
      <dl className="surface-inset grid grid-cols-2 gap-x-6 gap-y-4 p-4 text-sm @3xl:grid-cols-4">
        <div>
          <dt className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Clock3 className="size-4" aria-hidden="true" />
            最近活动
          </dt>
          <dd className="tabular-nums wrap-anywhere">
            {device.lastSeen || "未知"}
          </dd>
        </div>
        <div>
          <dt className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Battery className="size-4" aria-hidden="true" />
            电源
          </dt>
          <dd className="tabular-nums">
            {device.battery !== null && Number.isFinite(device.battery)
              ? `${Math.max(0, Math.min(100, device.battery))}%`
              : device.batteryVoltage != null &&
                  Number.isFinite(device.batteryVoltage)
                ? `${device.batteryVoltage} V`
                : "未提供"}
            {device.power && (
              <span className="ml-2 text-muted-foreground">
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
        <div>
          <dt className="mb-2 text-muted-foreground">
            信号 · {device.protocol || "接入方式未知"}
          </dt>
          <dd>
            <SignalStrength
              rssi={device.rssi}
              className="max-w-full flex-wrap"
            />
          </dd>
        </div>
        <div>
          <dt className="mb-2 flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            安装位置
          </dt>
          <dd className="wrap-anywhere break-keep">
            {device.location || "未提供"}
          </dd>
        </div>
      </dl>
      {(lifecycle.length > 0 || onOpen) && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {lifecycle.map(([label, value]) => (
              <div className="flex flex-wrap gap-x-2" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {onOpen && (
            <Button
              variant="ghost"
              className="ml-auto shrink-0"
              aria-label={`查看 ${device.name} 详情`}
              onClick={() => onOpen(device)}
            >
              查看详情
            </Button>
          )}
        </div>
      )}
    </Panel>
  );
}
