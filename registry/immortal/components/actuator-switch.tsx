"use client";

import { Panel } from "@/components/iot/internal/panel";
import { useId, useRef, useState } from "react";
import { Power, LockKeyhole } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  CommandStatus,
  type CommandPhase,
} from "@/components/iot/command-status";

/** Resolve onCommand only on device acknowledgement; reported is owned by the caller. */
export function ActuatorSwitch({
  label,
  reported,
  online = true,
  locked = false,
  onCommand,
}: {
  label: string;
  reported: boolean | null;
  online?: boolean;
  locked?: boolean;
  onCommand: (enabled: boolean) => Promise<void>;
}) {
  const id = useId();
  const busy = useRef(false);
  const [requested, setRequested] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<CommandPhase>("idle");
  const [error, setError] = useState("");
  const disabled =
    !online || locked || reported === null || phase === "pending";
  async function command(next: boolean) {
    if (disabled || busy.current) return;
    busy.current = true;
    setRequested(next);
    setPhase("pending");
    setError("");
    try {
      await onCommand(next);
      setPhase("confirmed");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "发送失败，请重试。");
      setPhase("failed");
    } finally {
      busy.current = false;
    }
  }
  return (
    <Panel
      icon={<Power />}
      title={label}
      status={reported === null ? "状态未知" : reported ? "运行中" : "已关闭"}
    >
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm">
          {label}开关
        </label>
        <Switch
          id={id}
          checked={reported === true}
          disabled={disabled}
          onCheckedChange={command}
        />
      </div>
      {(!online || locked) && (
        <p className="flex items-center gap-2 text-xs text-warning-text">
          <LockKeyhole aria-hidden="true" className="size-3.5" />
          {!online ? "设备离线，控制不可用" : "控制已锁定，仍可查看回读"}
        </p>
      )}
      <CommandStatus
        phase={phase}
        requested={requested === null ? "—" : requested ? "开启" : "关闭"}
        reported={reported === null ? "未知" : reported ? "开启" : "关闭"}
        message={error || undefined}
      />
    </Panel>
  );
}
