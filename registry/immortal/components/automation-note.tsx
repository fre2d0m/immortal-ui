"use client";

import { Panel } from "@/components/iot/internal/panel";
import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AutomationNote({
  title,
  reason,
  source,
  time,
  status = "proposed",
  onAccept,
  onDismiss,
  disabled = false,
}: {
  title: string;
  reason: string;
  source: string;
  time: string;
  status?: "proposed" | "accepted" | "dismissed";
  disabled?: boolean;
  onAccept: () => Promise<void>;
  onDismiss: () => Promise<void>;
}) {
  const busy = useRef(false);
  const [pending, setPending] = useState<"accept" | "dismiss" | null>(null);
  const [error, setError] = useState("");
  async function act(action: "accept" | "dismiss") {
    if (busy.current || disabled || status !== "proposed") return;
    busy.current = true;
    setPending(action);
    setError("");
    try {
      await (action === "accept" ? onAccept() : onDismiss());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "操作失败，请重试。");
    } finally {
      busy.current = false;
      setPending(null);
    }
  }
  return (
    <Panel
      icon={<Sparkles />}
      title={title}
      description="AI 建议"
      status={
        { proposed: "待人决策", accepted: "已采纳", dismissed: "已忽略" }[
          status
        ]
      }
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        生成时间 · {time}
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">{reason}</p>
      <p className="text-xs text-muted-foreground">依据：{source}</p>
      <div aria-live="polite">
        {status === "proposed" ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              className="min-h-10"
              disabled={disabled || pending !== null}
              onClick={() => act("dismiss")}
            >
              {pending === "dismiss" ? "处理中…" : "忽略"}
            </Button>
            <Button
              className="min-h-10"
              disabled={disabled || pending !== null}
              onClick={() => act("accept")}
            >
              {pending === "accept" ? "等待确认…" : "采纳建议"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {status === "accepted"
              ? "建议已采纳，执行进度请查看命令回执。"
              : "建议已忽略，设备保持原有设定。"}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </Panel>
  );
}
