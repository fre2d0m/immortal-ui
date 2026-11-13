import type { ReactNode } from "react";

/** Internal layout shared by domain panels. Shipped with its owning component. */
export function PanelHeader({
  icon,
  title,
  description,
  status,
  action,
  as: Heading = "h3",
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  status?: ReactNode;
  action?: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div data-slot="panel-header" className="min-w-0">
      <div
        data-slot="panel-topline"
        className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2"
      >
        <div
          data-slot="panel-identity"
          className="flex min-w-0 items-start gap-3"
        >
          <span
            data-slot="panel-icon"
            aria-hidden="true"
            className="surface-control grid size-10 shrink-0 place-items-center rounded-full border bg-secondary text-secondary-foreground shadow-sm [&>svg]:size-4"
          >
            {icon}
          </span>
          <div
            data-slot="panel-heading"
            className="flex min-h-12 min-w-0 flex-col"
          >
            <Heading
              data-slot="panel-title"
              className="text-base font-medium leading-snug wrap-anywhere"
            >
              {title}
            </Heading>
            {description && (
              <p
                data-slot="panel-description"
                className="mt-1 text-sm leading-relaxed text-muted-foreground wrap-anywhere"
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {(status != null || action != null) && (
          <div
            data-slot="panel-meta"
            className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2 text-right text-sm text-muted-foreground"
          >
            {status != null && (
              <div data-slot="panel-status" className="min-w-0 wrap-anywhere">
                {status}
              </div>
            )}
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
