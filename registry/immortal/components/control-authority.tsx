"use client";
import { Panel } from "@/components/iot/internal/panel";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandStatus } from "@/components/iot/command-status";
import { useDeviceCommand } from "@/components/iot/use-device-command";
import { timeLabel, type CommandAction } from "@/lib/iot-model";
export function ControlAuthority({
  location,
  operatingMode,
  owner,
  source,
  overrideExpiresAt,
  now,
  canRequest = false,
  canRelease = false,
  reason,
  onChange,
}: {
  location: "local" | "remote" | "unknown";
  operatingMode: "manual" | "strategy" | "unknown";
  owner: string | null;
  source: string;
  overrideExpiresAt?: number | null;
  now: number;
  canRequest?: boolean;
  canRelease?: boolean;
  reason?: string;
  onChange?: CommandAction<"request" | "release">;
}) {
  const command = useDeviceCommand();
  const locationLabel = {
    local: "本地控制",
    remote: "远程控制",
    unknown: "控制位置未知",
  }[location];
  const operation = {
    manual: "手动操作",
    strategy: "策略运行",
    unknown: "运行模式未知",
  }[operatingMode];
  return (
    <Panel icon={<KeyRound />} title="控制权">
      <div className="surface-inset space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-lg">{locationLabel}</span>
          <span className="text-lg text-muted-foreground">· {operation}</span>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">当前持有者</dt>
            <dd className="mt-1">{owner ?? "未知"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">状态来源</dt>
            <dd className="mt-1">{source}</dd>
          </div>
        </dl>
        {overrideExpiresAt != null && (
          <p className="text-sm text-warning">
            {overrideExpiresAt <= now
              ? "覆盖期限已到，等待设备确认释放"
              : "临时覆盖到 " + timeLabel(overrideExpiresAt) + " UTC"}
          </p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {reason ||
          (location === "local"
            ? "现场已接管，远程请求不可用。"
            : "可用操作由权限与设备能力共同提供。")}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={
            !onChange || !canRequest || location !== "remote" || command.busy
          }
          onClick={() =>
            onChange && command.run("申请临时控制权", "request", onChange)
          }
        >
          申请控制权
        </Button>
        <Button
          variant="secondary"
          disabled={!onChange || !canRelease || command.busy}
          onClick={() =>
            onChange && command.run("释放临时控制权", "release", onChange)
          }
        >
          释放控制权
        </Button>
      </div>
      <CommandStatus
        record={command.record}
        reported={locationLabel + " · " + (owner ?? "持有者未知")}
      />
    </Panel>
  );
}
