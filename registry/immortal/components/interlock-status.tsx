import { Panel } from "@/components/iot/internal/panel";
import { ShieldCheck } from "lucide-react";
import { timeLabel } from "@/lib/iot-model";
export type InterlockCondition = {
  id: string;
  label: string;
  state: "satisfied" | "blocked" | "unknown" | "stale";
  source: string;
  at: number | null;
  detail?: string;
};
const labels = {
  satisfied: "满足",
  blocked: "未满足",
  unknown: "未知",
  stale: "数据陈旧",
};
export function InterlockStatus({
  decision,
  reason,
  conditions,
  evaluatedAt,
}: {
  decision: "permitted" | "blocked" | "unknown";
  reason: string;
  conditions: InterlockCondition[];
  evaluatedAt: number | null;
}) {
  const title = {
    permitted: "许可已满足",
    blocked: "联锁阻止操作",
    unknown: "许可状态未知",
  }[decision];
  return (
    <Panel
      icon={<ShieldCheck />}
      title="许可与联锁"
      status={
        <span
          className={
            decision === "permitted" ? "text-success" : "text-warning-text"
          }
        >
          {title}
        </span>
      }
      aria-label="许可与联锁"
    >
      <p className="text-sm text-muted-foreground">{reason}</p>
      <div className="surface-inset p-4">
        <ul className="divide-y divide-border/40">
          {conditions.map((condition) => (
            <li key={condition.id} className="py-3 first:pt-0 last:pb-0">
              <details>
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                  <span>{condition.label}</span>
                  <span
                    className={
                      condition.state === "satisfied"
                        ? "text-success"
                        : "text-warning"
                    }
                  >
                    {labels[condition.state]}
                  </span>
                </summary>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>{condition.detail || "未提供补充说明"}</p>
                  <p>
                    {condition.source} · {timeLabel(condition.at)} UTC
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
        {!conditions.length && (
          <p className="text-sm text-muted-foreground">
            没有可显示的条件，不能据此视为许可。
          </p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        判定来源：设备 / 控制服务 · {timeLabel(evaluatedAt)}{" "}
        UTC。界面展示上游判定，不自行授权。
      </p>
    </Panel>
  );
}
