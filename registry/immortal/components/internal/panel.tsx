import type { ComponentProps } from "react";
import { PanelHeader } from "@/components/iot/internal/panel-header";

type PanelProps = ComponentProps<typeof PanelHeader> &
  Omit<ComponentProps<"section">, "title"> & {
    contentClassName?: string;
  };

/** Owns the surface, all four insets, header alignment and the content boundary. */
export function Panel({
  icon,
  title,
  description,
  status,
  action,
  as,
  className = "",
  contentClassName = "",
  children,
  ...props
}: PanelProps) {
  return (
    <section
      data-slot="panel"
      data-panel-layout=""
      className={`@container surface-raised grid min-w-0 gap-[var(--card-padding,24px)] rounded-xl border bg-card p-[var(--card-padding,24px)] text-card-foreground shadow-sm ${className}`}
      {...props}
    >
      <PanelHeader
        icon={icon}
        title={title}
        description={description}
        status={status}
        action={action}
        as={as}
      />
      <div
        data-slot="panel-content"
        className={`min-w-0 ${contentClassName || "space-y-5"}`}
      >
        {children}
      </div>
    </section>
  );
}
