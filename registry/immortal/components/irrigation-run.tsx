"use client";
import { Panel } from "@/components/iot/internal/panel";
import { useState } from "react";
import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandStatus } from "@/components/iot/command-status";
import { useDeviceCommand } from "@/components/iot/use-device-command";
import { irrigationProgress, type CommandAction } from "@/lib/iot-model";
export type IrrigationPhase =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "stopped"
  | "failed"
  | "unknown";
const labels: Record<IrrigationPhase, string> = {
  queued: "等待执行",
  running: "灌溉中",
  paused: "已暂停",
  completed: "已完成",
  stopped: "已停止",
  failed: "运行失败",
  unknown: "状态未知",
};
export function IrrigationRun({
  program,
  zone,
  runId,
  phase,
  plannedVolume,
  deliveredVolume,
  flow,
  remainingSeconds,
  fresh = true,
  online = true,
  reason,
  stages,
  nextZone,
  supportedActions = [],
  onAction,
}: {
  program: string;
  zone: string;
  runId: string;
  phase: IrrigationPhase;
  plannedVolume: number | null;
  deliveredVolume: number | null;
  flow: number | null;
  remainingSeconds?: number | null;
  fresh?: boolean;
  online?: boolean;
  reason?: string;
  stages: {
    id: string;
    label: string;
    state: "pending" | "active" | "done" | "failed";
  }[];
  nextZone?: string;
  supportedActions?: ("pause" | "resume" | "stop")[];
  onAction?: CommandAction<"pause" | "resume" | "stop">;
}) {
  const command = useDeviceCommand(),
    [confirmStop, setConfirmStop] = useState(false);
  const progress = irrigationProgress(deliveredVolume, plannedVolume);
  const amount = (v: number | null) =>
    v !== null && Number.isFinite(v) && v >= 0
      ? v.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : "—";
  const available = online && fresh && !!onAction && !command.busy;
  function send(action: "pause" | "resume" | "stop") {
    if (!available || !supportedActions.includes(action) || !onAction) return;
    setConfirmStop(false);
    void command.run(
      { pause: "暂停本次灌溉", resume: "恢复本次灌溉", stop: "停止本次灌溉" }[
        action
      ],
      action,
      onAction,
    );
  }
  return (
    <Panel
      icon={<Droplets />}
      title={program}
      description={
        <>
          {zone} · {runId}
        </>
      }
      status={
        <span className={phase === "failed" ? "text-destructive" : undefined}>
          {labels[phase]}
        </span>
      }
      aria-label="灌溉运行"
    >
      <div className="surface-inset space-y-5 p-4">
        <dl className="grid grid-cols-2 gap-4 tabular-nums">
          <div>
            <dt className="text-sm text-muted-foreground">
              累计灌溉量{!fresh || !online ? " · 快照" : ""}
            </dt>
            <dd className="mt-2 text-3xl">
              {amount(deliveredVolume)}
              <span className="ml-1 text-sm text-muted-foreground">m³</span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">计划总量</dt>
            <dd className="mt-2 text-3xl">
              {amount(plannedVolume)}
              <span className="ml-1 text-sm text-muted-foreground">m³</span>
            </dd>
          </div>
        </dl>
        {progress !== null ? (
          <div>
            <div
              role="progressbar"
              aria-label="已灌溉量占计划比例"
              aria-valuenow={Number(progress.toFixed(1))}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 overflow-hidden rounded-full bg-foreground/10"
            >
              <div
                className="h-full rounded-full bg-foreground/60"
                style={{ width: progress + "%" }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {progress.toFixed(1)}% · 比例不代表设备已完成任务
              {deliveredVolume! > plannedVolume! ? " · 已超过计划量" : ""}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            总量或累计量未知，暂不计算完成比例。
          </p>
        )}
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">实际流量</dt>
            <dd className="mt-1 tabular-nums">
              {fresh && online ? amount(flow) : "—"} m³/h
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">设备估计剩余</dt>
            <dd className="mt-1 tabular-nums">
              {fresh &&
              online &&
              phase === "running" &&
              remainingSeconds != null &&
              Number.isFinite(remainingSeconds) &&
              remainingSeconds >= 0
                ? Math.ceil(remainingSeconds / 60) + " 分钟"
                : "未知 / 不适用"}
            </dd>
          </div>
        </dl>
      </div>
      <ol
        className="flex flex-wrap gap-x-5 gap-y-2 text-sm"
        aria-label="运行阶段"
      >
        {stages.map((stage, i) => (
          <li
            key={stage.id}
            className={
              stage.state === "failed"
                ? "text-destructive"
                : stage.state === "active"
                  ? "text-foreground"
                  : "text-muted-foreground"
            }
          >
            {i + 1}. {stage.label} ·{" "}
            {
              {
                pending: "等待",
                active: "进行中",
                done: "完成",
                failed: "失败",
              }[stage.state]
            }
          </li>
        ))}
      </ol>
      {(nextZone || reason) && (
        <p className="text-sm text-muted-foreground">
          {nextZone && "下一分区：" + nextZone}
          {nextZone && reason && " · "}
          {reason}
        </p>
      )}
      {(!online || !fresh) && (
        <p className="text-sm text-warning">
          {!online ? "设备离线" : "运行反馈陈旧"}，当前状态需重新确认。
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {supportedActions.includes("pause") && (
          <Button
            variant="secondary"
            disabled={!available || phase !== "running"}
            onClick={() => send("pause")}
          >
            暂停灌溉
          </Button>
        )}
        {supportedActions.includes("resume") && (
          <Button
            disabled={!available || phase !== "paused"}
            onClick={() => send("resume")}
          >
            恢复灌溉
          </Button>
        )}
        {supportedActions.includes("stop") && (
          <Button
            variant="secondary"
            disabled={
              !available || !["running", "paused", "queued"].includes(phase)
            }
            onClick={() => setConfirmStop(true)}
          >
            停止灌溉
          </Button>
        )}
      </div>
      {confirmStop && (
        <div className="surface-inset space-y-3 p-4">
          <p className="text-sm">
            停止将结束本次任务。需要保留当前进度时，请使用暂停。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              disabled={!available}
              onClick={() => send("stop")}
            >
              确认停止本次任务
            </Button>
            <Button variant="ghost" onClick={() => setConfirmStop(false)}>
              继续运行
            </Button>
          </div>
        </div>
      )}
      <CommandStatus record={command.record} reported={labels[phase]} />
    </Panel>
  );
}
