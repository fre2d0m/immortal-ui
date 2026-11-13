/** Device facts come from the application; helpers never infer physical success. */
export type Quality = "good" | "uncertain" | "bad" | "estimated" | "unknown";
export const qualityLabels: Record<Quality, string> = {
  good: "有效",
  uncertain: "不确定",
  bad: "无效",
  estimated: "估算",
  unknown: "质量未知",
};
export function sampleAge(now: number, sampledAt?: number | null) {
  return sampledAt != null &&
    Number.isFinite(sampledAt) &&
    Number.isFinite(now) &&
    sampledAt <= now
    ? (now - sampledAt) / 1000
    : null;
}
export function numericError(
  value: number,
  min: number,
  max: number,
  step: number,
) {
  if (![min, max, step].every(Number.isFinite) || max <= min || step <= 0)
    return "量程配置无效";
  if (!Number.isFinite(value)) return "请输入有效数值";
  if (value < min || value > max) return `范围为 ${min}–${max}`;
  const ticks = (value - min) / step;
  return Math.abs(ticks - Math.round(ticks)) < 1e-6
    ? null
    : `步进为 ${step}，起点为 ${min}`;
}
export type LifecyclePhase =
  | "queued"
  | "sending"
  | "accepted"
  | "running"
  | "verified"
  | "rejected"
  | "failed"
  | "timeout"
  | "cancelled";
export type CommandEvent = {
  phase: LifecyclePhase;
  at: number;
  detail?: string;
};
export type CommandRecord = {
  id: string;
  phase: LifecyclePhase;
  requested: string;
  events: CommandEvent[];
  message?: string;
};
export type CommandReceipt = { phase: LifecyclePhase; message?: string };
export type CommandContext = { requestId: string; signal: AbortSignal };
export type CommandAction<T> = (
  value: T,
  context: CommandContext,
) => Promise<CommandReceipt | void>;
const rank: Record<LifecyclePhase, number> = {
  queued: 0,
  sending: 1,
  accepted: 2,
  running: 3,
  verified: 4,
  rejected: 4,
  failed: 4,
  timeout: 4,
  cancelled: 4,
};
export function applyCommandEvent(
  record: CommandRecord,
  id: string,
  event: CommandEvent,
): CommandRecord {
  if (
    record.id !== id ||
    !Number.isFinite(event.at) ||
    event.at < (record.events.at(-1)?.at ?? 0)
  )
    return record;
  if (
    rank[event.phase] < rank[record.phase] ||
    (rank[record.phase] === 4 &&
      !(record.phase === "timeout" && event.phase === "verified"))
  )
    return record;
  return {
    ...record,
    phase: event.phase,
    message: event.detail,
    events: [...record.events, event],
  };
}
export function alarmState(active: boolean | undefined, acknowledged: boolean) {
  return `${active === undefined ? "条件未知" : active ? "仍在发生" : "已恢复"} · ${acknowledged ? "已确认" : "未确认"}`;
}
export function irrigationProgress(
  delivered: number | null,
  planned: number | null,
) {
  if (
    delivered === null ||
    planned === null ||
    !Number.isFinite(delivered) ||
    !Number.isFinite(planned) ||
    delivered < 0 ||
    planned <= 0
  )
    return null;
  return Math.min(100, (delivered / planned) * 100);
}
export function timeLabel(timestamp?: number | null, timeZone = "UTC") {
  if (timestamp == null || !Number.isFinite(timestamp)) return "时间未知";
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone,
      hour12: false,
    }).format(timestamp);
  } catch {
    return "时区无效";
  }
}
