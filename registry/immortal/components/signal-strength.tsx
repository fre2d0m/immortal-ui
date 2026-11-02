import { cn } from "cn";

/** RSSI is in dBm. Null means unavailable, never zero signal. */
export function SignalStrength({
  rssi,
  className,
}: {
  rssi: number | null;
  className?: string;
}) {
  const known = rssi !== null && Number.isFinite(rssi);
  const bars = !known
    ? 0
    : rssi >= -55
      ? 4
      : rssi >= -67
        ? 3
        : rssi >= -80
          ? 2
          : 1;
  const quality = ["Unavailable", "Weak", "Fair", "Good", "Excellent"][bars];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-xs tabular-nums text-muted-foreground",
        className,
      )}
      aria-label={
        known ? `${quality} signal, ${rssi} dBm` : "Signal unavailable"
      }
    >
      <span className="flex h-3.5 items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={cn(
              "w-1 rounded-[1px]",
              level <= bars ? "bg-current" : "bg-current/20",
            )}
            style={{ height: `${level * 25}%` }}
          />
        ))}
      </span>
      <span aria-hidden="true">{known ? `${rssi} dBm` : "—"}</span>
    </span>
  );
}
