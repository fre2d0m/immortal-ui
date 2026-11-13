import { cn } from "cn";

export type TimelineEvent = {
  id: string;
  time: string;
  actor: string;
  title: string;
  detail?: string;
  tone?: "neutral" | "warning" | "success";
};
export function EventTimeline({
  events,
  label = "操作记录",
}: {
  events: TimelineEvent[];
  label?: string;
}) {
  return (
    <section aria-label={label}>
      <h3 className="mb-5 text-sm font-medium">{label}</h3>
      {!events.length ? (
        <p className="py-6 text-sm text-muted-foreground">暂无事件记录</p>
      ) : (
        <ol className="space-y-0">
          {events.map((event, i) => (
            <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
              <div className="relative flex w-3 shrink-0 justify-center">
                <span
                  className={cn(
                    "relative z-10 mt-1.5 size-2 rounded-full",
                    event.tone === "warning"
                      ? "bg-warning"
                      : event.tone === "success"
                        ? "bg-success"
                        : "bg-muted-foreground",
                  )}
                />
                {i < events.length - 1 && (
                  <span className="absolute top-4 bottom-[-4px] w-px bg-border" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>{event.actor}</span>
                  <span className="tabular-nums">{event.time}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{event.title}</p>
                {event.detail && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {event.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
