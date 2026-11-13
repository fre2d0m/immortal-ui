"use client";
import { useRef, useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  timeLabel,
  type CommandRecord,
  type LifecyclePhase,
} from "@/lib/iot-model";
export type CommandPhase =
  "idle" | "pending" | "confirmed" | "failed" | LifecyclePhase;
export const commandLabels: Record<CommandPhase, string> = {
  idle: "等待操作",
  pending: "等待设备回执",
  confirmed: "设备已确认",
  queued: "已排队",
  sending: "发送中",
  accepted: "已接收 · 待设备回读",
  running: "执行中",
  verified: "回读已验证",
  rejected: "设备拒绝",
  failed: "执行失败",
  timeout: "回执超时 · 结果未知",
  cancelled: "已取消",
};
export function CommandStatus({
  record,
  phase = "idle",
  requested = "—",
  reported,
  message,
  className,
  onRetry,
  onCancel,
}: {
  record?: CommandRecord | null;
  phase?: CommandPhase;
  requested?: string;
  reported: string;
  message?: string;
  className?: string;
  onRetry?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
}) {
  const lock = useRef<string | null>(null);
  const [operation, setOperation] = useState<{
    id: string;
    pending: boolean;
    error: string;
  } | null>(null);
  const pending = operation?.id === record?.id && operation?.pending === true;
  const error = operation?.id === record?.id ? operation?.error : "";
  const state = record?.phase ?? phase;
  const tone = ["verified", "confirmed"].includes(state)
    ? "text-success"
    : ["failed", "rejected"].includes(state)
      ? "text-destructive"
      : state === "idle" || state === "cancelled"
        ? "text-muted-foreground"
        : "text-warning-text";
  async function action(callback: (id: string) => Promise<void>) {
    if (!record || lock.current === record.id) return;
    const id = record.id;
    lock.current = id;
    setOperation({ id, pending: true, error: "" });
    try {
      await callback(id);
    } catch (e) {
      setOperation((previous) =>
        previous?.id === id
          ? { ...previous, error: e instanceof Error ? e.message : "操作失败" }
          : previous,
      );
    } finally {
      if (lock.current === id) lock.current = null;
      setOperation((previous) =>
        previous?.id === id ? { ...previous, pending: false } : previous,
      );
    }
  }
  return (
    <section
      className={cn("surface-inset space-y-3 p-4 text-sm", className)}
      aria-label="指令反馈"
      aria-busy={pending}
    >
      <p role="status" className={cn("flex items-center gap-2", tone)}>
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
        {commandLabels[state]}
      </p>
      <dl className="grid grid-cols-2 gap-4 tabular-nums">
        <div>
          <dt className="text-muted-foreground">请求值</dt>
          <dd className="mt-1 break-words">{record?.requested ?? requested}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">设备回读</dt>
          <dd className="mt-1 break-words">{reported}</dd>
        </div>
      </dl>
      {(message || record?.message) && (
        <p className="text-muted-foreground leading-relaxed">
          {message || record?.message}
        </p>
      )}
      {record && (
        <details>
          <summary className="cursor-pointer py-1 text-muted-foreground">
            指令记录 · {record.id.slice(0, 8)}
          </summary>
          <p className="my-2 break-all text-muted-foreground">
            请求 ID：{record.id}
          </p>
          <ol className="space-y-2">
            {record.events.map((event, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2">
                <span>
                  {commandLabels[event.phase]}
                  {event.detail && ` · ${event.detail}`}
                </span>
                <time className="text-muted-foreground tabular-nums">
                  {timeLabel(event.at)} UTC
                </time>
              </li>
            ))}
          </ol>
        </details>
      )}
      {(onCancel || onRetry) && (
        <div className="flex flex-wrap gap-2">
          {record && onCancel && ["queued", "accepted"].includes(state) && (
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => action(onCancel)}
            >
              取消请求
            </Button>
          )}
          {record && onRetry && ["failed", "rejected"].includes(state) && (
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => action(onRetry)}
            >
              重新提交
            </Button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
