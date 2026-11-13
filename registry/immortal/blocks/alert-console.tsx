"use client";

import { Panel } from "@/components/iot/internal/panel";
import { useRef, useState } from "react";
import { ArrowUpRight, Bell, CircleAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AlertRecord } from "@/components/iot/alert-card";
import {
  EventTimeline,
  type TimelineEvent,
} from "@/components/iot/event-timeline";
import { timeLabel } from "@/lib/iot-model";

type AlertStatus = "active" | "acknowledged" | "cleared";
export type DeviceAlert = AlertRecord & {
  status?: AlertStatus;
  deviceId?: string;
  deviceHref?: string;
};
type AlertAction = "acknowledge" | "clear";

const statusLabel = {
  active: "待确认",
  acknowledged: "已确认",
  cleared: "已清除",
};
const severityLabel = { critical: "严重", warning: "预警", info: "提示" };
const severityColor = {
  critical: "text-destructive",
  warning: "text-warning",
  info: "text-muted-foreground",
};
const statusOf = (alert: DeviceAlert) =>
  alert.status ?? (alert.acknowledged ? "acknowledged" : "active");
const displayTime = (at: number | null | undefined) =>
  at == null ? "时间未知" : timeLabel(at) + " UTC";

export function AlertConsole({
  alerts,
  onAcknowledge,
  onClear,
}: {
  alerts: DeviceAlert[];
  onAcknowledge?: (id: string) => Promise<void>;
  onClear?: (id: string) => Promise<void>;
}) {
  const [filter, setFilter] = useState<AlertStatus | "all">("all");
  const [severity, setSeverity] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    id: string;
    action: AlertAction;
  } | null>(null);
  const [feedback, setFeedback] = useState<{
    id: string;
    action: AlertAction;
    error: boolean;
    text: string;
  } | null>(null);
  const clearTrigger = useRef<HTMLButtonElement | null>(null);
  const selectedRow = useRef<HTMLButtonElement | null>(null);
  const selectedFilter = useRef<HTMLButtonElement | null>(null);
  const confirmTrigger = useRef<HTMLButtonElement | null>(null);
  const visible = alerts.filter(
    (alert) =>
      (filter === "all" || statusOf(alert) === filter) &&
      (severity === "all" || alert.severity === severity),
  );
  const selected =
    visible.find((alert) => alert.id === selectedId) ?? visible[0];
  const target = alerts.find(
    (alert) => alert.id === confirmId && statusOf(alert) !== "cleared",
  );
  const statuses = ["active", "acknowledged", "cleared"] as const;
  const events: TimelineEvent[] = [];
  if (selected) {
    events.push({
      id: "raised",
      title: "告警触发",
      actor: selected.source || "来源未知",
      time:
        selected.occurredAt == null
          ? selected.time
          : displayTime(selected.occurredAt),
    });
    if (
      selected.acknowledgedAt != null ||
      statusOf(selected) === "acknowledged" ||
      selected.acknowledged
    ) {
      events.push({
        id: "ack",
        title: "已确认",
        actor: selected.acknowledgedBy || "确认人未知",
        time: displayTime(selected.acknowledgedAt),
      });
    }
    if (
      selected.active === false &&
      !selected.status &&
      selected.clearedAt != null
    ) {
      events.push({
        id: "recovered",
        title: "已报告恢复",
        actor: selected.source || "现场观测",
        time: displayTime(selected.clearedAt),
      });
    }
    if (statusOf(selected) === "cleared") {
      events.push({
        id: "cleared",
        title: "告警已清除",
        actor: "告警记录",
        time: displayTime(selected.clearedAt),
      });
    }
  }

  async function submit(alert: DeviceAlert, action: AlertAction) {
    const callback = action === "clear" ? onClear : onAcknowledge;
    if (pending || !callback) return;
    const trigger = confirmTrigger.current;
    const returnFocus =
      action === "acknowledge" && document.activeElement === trigger;
    setPending({ id: alert.id, action });
    setFeedback(null);
    try {
      await callback(alert.id);
      setFeedback({
        id: alert.id,
        action,
        error: false,
        text:
          (action === "clear" ? "已提交清除" : "已提交确认") +
          " · " +
          alert.title,
      });
      if (action === "clear") setConfirmId(null);
    } catch {
      setFeedback({
        id: alert.id,
        action,
        error: true,
        text: action === "clear" ? "清除失败，请重试。" : "确认失败，请重试。",
      });
    } finally {
      setPending(null);
      if (returnFocus) {
        requestAnimationFrame(() => {
          if (document.activeElement === document.body) {
            (trigger?.isConnected
              ? trigger
              : (selectedRow.current ?? selectedFilter.current)
            )?.focus();
          }
        });
      }
    }
  }

  return (
    <Panel
      as="h2"
      icon={<Bell />}
      title="告警中心"
      status={
        <span className="tabular-nums">
          {alerts.filter((alert) => statusOf(alert) === "active").length}{" "}
          条待确认
        </span>
      }
      className="@container min-w-0"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            role="group"
            aria-label="告警状态"
            className="surface-inset flex flex-wrap gap-1 p-1.5"
          >
            {(["all", ...statuses] as const).map((state) => (
              <button
                key={state}
                type="button"
                data-slot="filter-chip"
                ref={filter === state ? selectedFilter : undefined}
                aria-pressed={filter === state}
                onClick={() => setFilter(state)}
              >
                {state === "all" ? "全部" : statusLabel[state]}
              </button>
            ))}
          </div>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger aria-label="告警级别" className="min-h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">全部级别</SelectItem>
              {Object.entries(severityLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {feedback && !feedback.error && (
          <p role="status" className="text-sm text-muted-foreground">
            {feedback.text}
          </p>
        )}
        {selected ? (
          <div className="grid min-w-0 gap-4 @2xl:grid-cols-[minmax(13rem,0.68fr)_minmax(0,1fr)]">
            <div className="surface-inset min-w-0 self-start p-2">
              <p className="px-2 py-1.5 text-sm text-muted-foreground tabular-nums">
                {visible.length} 条告警
              </p>
              <ul
                aria-label="告警队列"
                className="max-h-56 space-y-1 overflow-auto @2xl:max-h-96"
              >
                {visible.map((alert) => {
                  const Icon = alert.severity === "info" ? Info : CircleAlert;
                  return (
                    <li key={alert.id}>
                      <button
                        type="button"
                        data-slot="navigation-link"
                        ref={alert.id === selected.id ? selectedRow : undefined}
                        aria-pressed={alert.id === selected.id}
                        className="min-h-14! w-full items-start! gap-2! px-2! py-2.5! text-left"
                        onClick={() => setSelectedId(alert.id)}
                      >
                        <Icon
                          className={
                            "mt-0.5 size-4 shrink-0 " +
                            severityColor[alert.severity]
                          }
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium wrap-break-word">
                            {alert.title}
                          </span>
                          <span className="mt-1 flex flex-wrap justify-between gap-x-2 text-sm wrap-break-word text-muted-foreground">
                            <span>
                              {severityLabel[alert.severity]} ·{" "}
                              {statusLabel[statusOf(alert)]}
                            </span>
                            {alert.time && (
                              <span className="tabular-nums">{alert.time}</span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <section
              key={selected.id}
              aria-label="告警详情"
              className="min-w-0 space-y-4"
            >
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <CircleAlert
                    className={"size-4 " + severityColor[selected.severity]}
                    aria-hidden="true"
                  />
                  <span>
                    {severityLabel[selected.severity]} ·{" "}
                    {statusLabel[statusOf(selected)]}
                  </span>
                </p>
                <h3 className="text-lg font-medium text-balance wrap-break-word">
                  {selected.title}
                </h3>
                <p className="text-sm wrap-break-word text-muted-foreground">
                  {selected.description}
                </p>
              </div>
              <dl className="surface-inset grid gap-3 p-4 text-sm @md:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-muted-foreground">设备</dt>
                  <dd className="mt-1 wrap-break-word">
                    {selected.deviceHref ? (
                      <a
                        href={selected.deviceHref}
                        className="inline-flex min-h-10 items-center gap-1 underline-offset-4 hover:underline"
                      >
                        {selected.deviceName}{" "}
                        <ArrowUpRight
                          className="size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                      </a>
                    ) : (
                      selected.deviceName
                    )}
                    {selected.deviceId && (
                      <span className="block font-mono text-muted-foreground">
                        {selected.deviceId}
                      </span>
                    )}
                  </dd>
                </div>
                {selected.source && (
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">触发规则</dt>
                    <dd className="mt-1 wrap-break-word">{selected.source}</dd>
                  </div>
                )}
                <div className="min-w-0">
                  <dt className="text-muted-foreground">现场条件</dt>
                  <dd className="mt-1">
                    {selected.active === undefined
                      ? "未知"
                      : selected.active
                        ? "仍在发生"
                        : "已报告恢复"}
                  </dd>
                </div>
                {selected.updatedAt != null && (
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">最近更新</dt>
                    <dd className="mt-1 tabular-nums">
                      {displayTime(selected.updatedAt)}
                    </dd>
                  </div>
                )}
                {selected.shelvedUntil != null && (
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">搁置至</dt>
                    <dd className="mt-1 tabular-nums">
                      {displayTime(selected.shelvedUntil)}
                      {selected.shelvedBy && " · " + selected.shelvedBy}
                    </dd>
                  </div>
                )}
              </dl>
              {((onAcknowledge && statusOf(selected) === "active") ||
                (onClear &&
                  selected.status &&
                  selected.status !== "cleared")) && (
                <div className="flex flex-wrap gap-2">
                  {onAcknowledge && statusOf(selected) === "active" && (
                    <Button
                      className="min-h-10"
                      ref={confirmTrigger}
                      disabled={!!pending}
                      onClick={() => submit(selected, "acknowledge")}
                    >
                      {pending?.id === selected.id &&
                      pending.action === "acknowledge"
                        ? "确认中…"
                        : "确认告警"}
                    </Button>
                  )}
                  {onClear &&
                    selected.status &&
                    selected.status !== "cleared" && (
                      <Button
                        variant="outline"
                        className="min-h-10"
                        disabled={!!pending}
                        onClick={(event) => {
                          clearTrigger.current = event.currentTarget;
                          setConfirmId(selected.id);
                          setFeedback(null);
                        }}
                      >
                        清除告警
                      </Button>
                    )}
                </div>
              )}
              {feedback?.error && feedback.id === selected.id && !target && (
                <p role="alert" className="text-sm text-destructive">
                  {feedback.text}
                </p>
              )}
              <div className="surface-inset p-4">
                <EventTimeline label="处置记录" events={events} />
              </div>
            </section>
          </div>
        ) : (
          <p
            role="status"
            className="surface-inset p-5 text-sm text-muted-foreground"
          >
            {alerts.length ? "没有符合条件的告警" : "暂无告警"}
          </p>
        )}
      </div>

      <Dialog
        open={!!target}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirmId(null);
        }}
      >
        <DialogContent
          showCloseButton={!pending}
          onCloseAutoFocus={(event) => {
            const next = clearTrigger.current?.isConnected
              ? clearTrigger.current
              : (selectedRow.current ?? selectedFilter.current);
            if (next) {
              event.preventDefault();
              next.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>清除这条告警？</DialogTitle>
            <DialogDescription>
              {target?.title}
              。清除会将告警记录移入「已清除」。现场恢复以设备观测为准。
            </DialogDescription>
          </DialogHeader>
          {feedback?.error &&
            feedback.action === "clear" &&
            feedback.id === target?.id && (
              <p role="alert" className="text-sm text-destructive">
                {feedback.text}
              </p>
            )}
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-10"
              disabled={!!pending}
              onClick={() => setConfirmId(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              className="min-h-10"
              disabled={!!pending}
              onClick={() => target && submit(target, "clear")}
            >
              {pending?.action === "clear" ? "清除中…" : "确认清除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
