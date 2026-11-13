"use client";
import { Panel } from "@/components/iot/internal/panel";
import { MoveVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandStatus } from "@/components/iot/command-status";
import { useDeviceCommand } from "@/components/iot/use-device-command";
import { timeLabel, type CommandAction } from "@/lib/iot-model";
export type ActuatorDirection = "open" | "stop" | "close";
const labels = { open: "开启中", stop: "已停止", close: "关闭中" };
export function ActuatorControl({
  label,
  direction,
  position,
  target = null,
  online = true,
  locked = false,
  lockReason,
  calibrated = true,
  fault,
  limits,
  feedbackAt,
  onCommand,
}: {
  label: string;
  direction: ActuatorDirection | null;
  position: number | null;
  target?: number | null;
  online?: boolean;
  locked?: boolean;
  lockReason?: string;
  calibrated?: boolean;
  fault?: string;
  limits?: { open: boolean | null; closed: boolean | null };
  feedbackAt?: number;
  onCommand: CommandAction<ActuatorDirection>;
}) {
  const command = useDeviceCommand();
  const actual =
    position !== null && Number.isFinite(position) ? position : null;
  const reason = !online
    ? "设备离线，等待连接恢复"
    : locked
      ? lockReason || "控制权已锁定"
      : fault || (!calibrated ? "未校准，行程位置不可用于定位" : "");
  function blocked(next: ActuatorDirection) {
    return (
      !online ||
      locked ||
      command.busy ||
      (next !== "stop" &&
        (!!fault ||
          !calibrated ||
          direction !== "stop" ||
          (next === "open" && limits?.open === true) ||
          (next === "close" && limits?.closed === true)))
    );
  }
  return (
    <Panel
      icon={<MoveVertical />}
      title={label}
      description={online ? "设备位置反馈" : "离线快照"}
      status={direction ? labels[direction] : "运动状态未知"}
    >
      <div className="surface-inset space-y-4 p-4">
        <dl className="grid grid-cols-2 gap-3 tabular-nums">
          <div>
            <dt className="text-sm text-muted-foreground">实际位置</dt>
            <dd className="mt-2 text-3xl">
              {calibrated && actual !== null ? actual : "—"}
              <span className="ml-1 text-sm text-muted-foreground">%</span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">目标位置</dt>
            <dd className="mt-2 text-3xl">
              {target !== null && Number.isFinite(target) ? target : "—"}
              <span className="ml-1 text-sm text-muted-foreground">%</span>
            </dd>
          </div>
        </dl>
        <div
          role="meter"
          aria-label="实际开度"
          aria-valuenow={
            calibrated && actual !== null && actual >= 0 && actual <= 100
              ? actual
              : undefined
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={
            actual === null || !calibrated ? "未知" : `${actual}%`
          }
          className="h-2 overflow-hidden rounded-full bg-foreground/10"
        >
          {calibrated && actual !== null && (
            <div
              className="h-full rounded-full bg-foreground/60"
              style={{ width: `${Math.max(0, Math.min(100, actual))}%` }}
            />
          )}
        </div>
        {limits && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {[
              ["开端限位", limits.open],
              ["关端限位", limits.closed],
            ].map(([name, state]) => (
              <span key={String(name)}>
                {name} · {state === null ? "未知" : state ? "触发" : "未触发"}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={label}>
        {(["open", "stop", "close"] as const).map((next, i) => (
          <Button
            key={next}
            variant={next === "stop" ? "default" : "secondary"}
            disabled={blocked(next)}
            aria-label={`${label}：${["开", "停", "关"][i]}`}
            onClick={() =>
              command.run(["打开", "停止", "关闭"][i], next, onCommand)
            }
          >
            {["开", "停", "关"][i]}
          </Button>
        ))}
      </div>
      <p
        className={
          reason ? "text-sm text-warning-text" : "text-sm text-muted-foreground"
        }
      >
        {reason || "反向前须先停止并获得停止反馈；前端操作不替代设备联锁。"}
      </p>
      {feedbackAt !== undefined && (
        <p className="text-sm text-muted-foreground">
          反馈时间 {timeLabel(feedbackAt)} UTC
        </p>
      )}
      <CommandStatus
        record={command.record}
        reported={
          direction ? `${labels[direction]} · ${actual ?? "未知"}%` : "未知"
        }
      />
    </Panel>
  );
}
