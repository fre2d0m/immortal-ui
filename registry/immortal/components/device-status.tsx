import { cn } from "cn";

export type DeviceState = "online" | "warning" | "offline" | "provisioning";
const labels: Record<DeviceState, string> = {
  online: "Online",
  warning: "Attention",
  offline: "Offline",
  provisioning: "Provisioning",
};

/** A status always includes text; color is a secondary cue. */
export function DeviceStatus({
  state,
  label,
  className,
}: {
  state: DeviceState;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap text-xs",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", {
          "bg-success shadow-[0_0_8px_color-mix(in_srgb,var(--success)_35%,transparent)]":
            state === "online",
          "bg-warning": state === "warning",
          "bg-muted-foreground": state === "offline",
          "border border-current bg-transparent": state === "provisioning",
        })}
      />
      {label ?? labels[state]}
    </span>
  );
}
