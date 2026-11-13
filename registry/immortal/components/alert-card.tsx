"use client";
import { Panel } from "@/components/iot/internal/panel";
import { useRef, useState } from "react";
import { CircleAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alarmState, timeLabel } from "@/lib/iot-model";
export type AlertRecord = {
  id: string;
  title: string;
  deviceName: string;
  severity: "critical" | "warning" | "info";
  time: string;
  description: string;
  acknowledged: boolean;
  active?: boolean;
  occurredAt?: number;
  clearedAt?: number | null;
  acknowledgedAt?: number | null;
  acknowledgedBy?: string;
  updatedAt?: number;
  source?: string;
  shelvedUntil?: number | null;
  shelvedBy?: string;
};
const labels = { critical: "严重", warning: "预警", info: "提示" };
export function AlertCard({
  alert,
  onAcknowledge,
  disabledReason,
}: {
  alert: AlertRecord;
  onAcknowledge?: (id: string) => Promise<void>;
  disabledReason?: string;
}) {
  const lock = useRef(false),
    latest = useRef(alert.id);
  latest.current = alert.id;
  const [pending, setPending] = useState(false),
    [feedback, setFeedback] = useState<{
      id: string;
      error: boolean;
      message: string;
    } | null>(null);
  async function acknowledge() {
    if (!onAcknowledge || lock.current || alert.acknowledged || disabledReason)
      return;
    const id = alert.id;
    lock.current = true;
    setPending(true);
    setFeedback(null);
    try {
      await onAcknowledge(id);
      if (latest.current === id)
        setFeedback({
          id,
          error: false,
          message: "确认请求已提交；确认人与时间以服务回读为准。",
        });
    } catch (e) {
      if (latest.current === id)
        setFeedback({
          id,
          error: true,
          message: e instanceof Error ? e.message : "确认失败，请重试。",
        });
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  const Icon = alert.severity === "info" ? Info : CircleAlert;
  return (
    <Panel
      icon={<Icon />}
      title={alert.title}
      description={alert.deviceName}
      status={
        <span
          className={
            alert.severity === "critical"
              ? "text-destructive"
              : alert.severity === "warning"
                ? "text-warning-text"
                : undefined
          }
        >
          {labels[alert.severity]}
        </span>
      }
      aria-label={alert.title}
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        发生时间 · {alert.time}
      </p>
      <p
        role="status"
        className={
          "text-sm " +
          (alert.active === true
            ? "text-warning-text"
            : "text-muted-foreground")
        }
      >
        {alarmState(alert.active, alert.acknowledged)}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {alert.description}
      </p>
      <details>
        <summary className="cursor-pointer py-1 text-sm text-muted-foreground">
          状态记录与来源
        </summary>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          {[
            ["发生", timeLabel(alert.occurredAt)],
            [
              "恢复",
              alert.active === false
                ? timeLabel(alert.clearedAt)
                : "尚未报告恢复",
            ],
            [
              "确认",
              alert.acknowledged
                ? (alert.acknowledgedBy || "确认人未知") +
                  " · " +
                  timeLabel(alert.acknowledgedAt)
                : "未确认",
            ],
            ["最近更新", timeLabel(alert.updatedAt)],
            ["来源", alert.source || alert.deviceName],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-1 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">
          时间采用 UTC · {alert.id}
        </p>
      </details>
      {alert.shelvedUntil != null && (
        <p className="text-sm text-warning-text">
          搁置到 {timeLabel(alert.shelvedUntil)} UTC ·{" "}
          {alert.shelvedBy || "操作者未知"}。搁置不改变告警条件。
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {alert.acknowledged
            ? "确认已记录，恢复由条件决定。"
            : disabledReason || "确认表示已知晓，不会清除异常。"}
        </p>
        {!alert.acknowledged && onAcknowledge && (
          <Button
            variant="secondary"
            disabled={pending || !!disabledReason}
            onClick={acknowledge}
            aria-label={"确认告警：" + alert.title}
          >
            {pending ? "正在确认…" : "确认告警"}
          </Button>
        )}
      </div>
      {feedback?.id === alert.id && (
        <p
          role={feedback.error ? "alert" : "status"}
          className={
            "text-sm " +
            (feedback.error ? "text-destructive" : "text-muted-foreground")
          }
        >
          {feedback.message}
        </p>
      )}
    </Panel>
  );
}
