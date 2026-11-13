"use client";

import { Panel } from "@/components/iot/internal/panel";
import { useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Device } from "@/components/iot/device-card";
import { DeviceStatus, type DeviceState } from "@/components/iot/device-status";
import { SignalStrength } from "@/components/iot/signal-strength";
import {
  TelemetryChart,
  type TelemetryPoint,
} from "@/components/iot/telemetry-chart";

export type FleetDevice = Device & { product?: string; groups?: string[] };

const statuses = [
  { value: "online", label: "在线" },
  { value: "warning", label: "需关注" },
  { value: "offline", label: "离线" },
  { value: "provisioning", label: "待接入" },
  { value: "unknown", label: "连接未知" },
] as const;
const statusLabel = (state: DeviceState) =>
  statuses.find((status) => status.value === state)?.label;

export function FleetOverview({
  devices,
  telemetry,
  telemetryMaxGapMs,
  title = "设备目录",
  subtitle,
  onDeviceSelect,
  deviceHref,
  pageSize = 6,
}: {
  devices: FleetDevice[];
  telemetry?: TelemetryPoint[];
  telemetryMaxGapMs?: number;
  title?: string;
  subtitle?: string;
  onDeviceSelect?: (device: FleetDevice) => void;
  deviceHref?: (device: FleetDevice) => string | undefined;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DeviceState | "all">("all");
  const [product, setProduct] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const search = useRef<HTMLInputElement>(null);

  const products = [
    ...new Set(
      devices.flatMap((device) => (device.product ? [device.product] : [])),
    ),
  ];
  const selectedProduct = products.includes(product) ? product : "";
  const keyword = query.trim().toLowerCase();
  const matching = devices.filter(
    (device) =>
      (!selectedProduct || device.product === selectedProduct) &&
      [device.name, device.id, device.location, ...(device.groups ?? [])].some(
        (value) => value.toLowerCase().includes(keyword),
      ),
  );
  const filtered =
    status === "all"
      ? matching
      : matching.filter((device) => device.state === status);
  const size = Number.isFinite(pageSize)
    ? Math.max(1, Math.floor(pageSize))
    : 6;
  const pageCount = Math.ceil(filtered.length / size);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const shown = filtered.slice(currentPage * size, (currentPage + 1) * size);
  const selected = devices.find((device) => device.id === selectedId);
  const href = selected && deviceHref?.(selected);
  const summary = [
    { value: "all" as const, label: "全部设备", count: matching.length },
    ...statuses
      .map((item) => ({
        ...item,
        count: matching.filter((device) => device.state === item.value).length,
      }))
      .filter(
        (item) =>
          item.value !== "provisioning" ||
          devices.some((device) => device.state === item.value) ||
          status === item.value,
      ),
  ];

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setProduct("");
    setPage(0);
  }

  return (
    <Panel
      as="h2"
      icon={<Cpu />}
      title={title}
      description={subtitle}
      className="@container min-w-0"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-0 flex-[1_1_14rem]">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={search}
              type="search"
              className="min-h-10 pl-9!"
              aria-label="搜索设备"
              placeholder="搜索设备名、标识或群组"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
            />
          </div>
          {products.length > 0 && (
            <Select
              value={selectedProduct ? "product:" + selectedProduct : "all"}
              onValueChange={(value) => {
                setProduct(value === "all" ? "" : value.slice(8));
                setPage(0);
              }}
            >
              <SelectTrigger
                className="min-h-10 w-full max-w-full @md:w-48"
                aria-label="筛选产品"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">全部产品</SelectItem>
                {products.map((name) => (
                  <SelectItem key={name} value={"product:" + name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div
            className="flex min-w-0 flex-wrap gap-1"
            role="group"
            aria-label="按设备状态筛选"
          >
            {summary.map((item) => (
              <button
                key={item.value}
                type="button"
                data-slot="filter-chip"
                aria-pressed={status === item.value}
                onClick={() => {
                  setStatus(item.value);
                  setPage(0);
                }}
              >
                <span>{item.label}</span>
                <span className="tabular-nums">{item.count}</span>
              </button>
            ))}
          </div>
          <p
            role="status"
            className="px-1 text-sm text-muted-foreground tabular-nums"
          >
            共 {filtered.length} 台设备
          </p>
        </div>

        {shown.length ? (
          <div className="surface-inset p-1 @md:p-2">
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">设备列表</caption>
              <thead className="text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th
                    scope="col"
                    className="px-2 py-2.5 font-normal @md:w-[42%]"
                  >
                    设备
                  </th>
                  <th
                    scope="col"
                    className="hidden px-2 font-normal @md:table-cell"
                  >
                    {products.length ? "产品" : "通信协议"}
                  </th>
                  <th
                    scope="col"
                    className="w-19 px-1 text-right font-normal @md:w-[18%] @md:text-left"
                  >
                    状态<span className="sr-only @lg:hidden">与最近活动</span>
                  </th>
                  <th
                    scope="col"
                    className="hidden w-[18%] px-2 font-normal @lg:table-cell"
                  >
                    最近活动
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((device) => (
                  <tr
                    key={device.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <th scope="row" className="px-2 py-1.5 font-normal">
                      <button
                        type="button"
                        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md py-1 text-left hover:underline"
                        aria-haspopup="dialog"
                        onClick={(event) => {
                          trigger.current = event.currentTarget;
                          setSelectedId(device.id);
                          onDeviceSelect?.(device);
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block font-medium wrap-break-word">
                            {device.name}
                          </span>
                          <span className="mt-0.5 block text-xs wrap-break-word text-muted-foreground">
                            {device.id}
                          </span>
                          {(device.product || device.protocol) && (
                            <span className="block text-xs wrap-break-word text-muted-foreground @md:hidden">
                              {device.product || device.protocol}
                            </span>
                          )}
                        </span>
                        <ChevronRight
                          className="hidden size-4 shrink-0 text-muted-foreground @md:block"
                          aria-hidden="true"
                        />
                      </button>
                    </th>
                    <td className="hidden px-2 py-2 wrap-break-word text-muted-foreground @md:table-cell">
                      {(products.length ? device.product : device.protocol) ||
                        "—"}
                    </td>
                    <td className="px-1 text-right @md:text-left">
                      <DeviceStatus
                        state={device.state}
                        label={statusLabel(device.state)}
                      />
                      <span className="mt-0.5 block text-sm wrap-break-word text-muted-foreground tabular-nums @lg:hidden">
                        {device.lastSeen || "活动未知"}
                      </span>
                    </td>
                    <td className="hidden px-2 tabular-nums wrap-break-word text-muted-foreground @lg:table-cell">
                      {device.lastSeen || "未知"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="surface-inset space-y-3 px-4 py-9 text-center">
            <p>{devices.length ? "没有符合条件的设备" : "暂无设备"}</p>
            {devices.length > 0 && (
              <Button
                variant="secondary"
                className="min-h-10"
                onClick={clearFilters}
              >
                清除筛选
              </Button>
            )}
          </div>
        )}

        {pageCount > 1 && (
          <nav
            className="flex flex-wrap items-center justify-end gap-2 text-sm text-muted-foreground"
            aria-label="设备列表分页"
          >
            <Button
              variant="outline"
              size="icon"
              className="size-10!"
              aria-label="上一页"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <span aria-live="polite" className="tabular-nums">
              第 {currentPage + 1} / {pageCount} 页
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-10!"
              aria-label="下一页"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </nav>
        )}

        {telemetry !== undefined && (
          <details className="surface-inset px-4">
            <summary className="flex min-h-10 cursor-pointer items-center text-sm">
              消息接收趋势
            </summary>
            <TelemetryChart
              embedded
              className="pb-4"
              label="每分钟接收消息"
              unit="条"
              data={telemetry}
              precision={0}
              maxGapMs={telemetryMaxGapMs}
              showTable={false}
            />
          </details>
        )}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent
          onCloseAutoFocus={(event) => {
            const next = trigger.current?.isConnected
              ? trigger.current
              : search.current;
            if (next) {
              event.preventDefault();
              next.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="wrap-break-word">
              {selected?.name}
            </DialogTitle>
            <DialogDescription className="wrap-break-word">
              {selected?.id}
              {selected?.location && " · " + selected.location}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <dl className="surface-inset grid grid-cols-2 gap-x-3 gap-y-4 p-4 text-sm">
                {[
                  ["产品", selected.product || "—"],
                  [
                    "设备状态",
                    <DeviceStatus
                      state={selected.state}
                      label={statusLabel(selected.state)}
                    />,
                  ],
                  ["通信协议", selected.protocol || "未知"],
                  ["最近活动", selected.lastSeen || "未知"],
                  ["信号强度", <SignalStrength rssi={selected.rssi} />],
                  [
                    "电量",
                    selected.battery == null ||
                    !Number.isFinite(selected.battery)
                      ? "未提供"
                      : selected.battery + "%",
                  ],
                  ...(selected.groups?.length
                    ? [["所属群组", selected.groups.join("、")]]
                    : []),
                ].map(([label, value], index) => (
                  <div key={index} className="min-w-0 wrap-break-word">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              {href && (
                <Button asChild className="min-h-10 justify-self-end">
                  <a href={href}>
                    查看设备详情 <ArrowRight aria-hidden="true" />
                  </a>
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
