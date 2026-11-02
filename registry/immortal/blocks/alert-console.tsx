"use client";

import { useState } from "react";
import { Check, CircleAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "cn";

export type DeviceAlert = {
  id: string;
  title: string;
  deviceName: string;
  severity: "critical" | "warning" | "info";
  time: string;
  description: string;
  acknowledged: boolean;
};
/** The parent owns acknowledgement state; success is never assumed before its callback resolves. */
export function AlertConsole({
  alerts,
  onAcknowledge,
}: {
  alerts: DeviceAlert[];
  onAcknowledge: (id: string) => Promise<void>;
}) {
  const [filter, setFilter] = useState("open");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const visible = alerts.filter(
    (alert) => filter === "all" || !alert.acknowledged,
  );
  async function acknowledge(id: string) {
    if (pending) return;
    setPending(id);
    setError("");
    try {
      await onAcknowledge(id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Acknowledgement failed. Please retry.",
      );
    } finally {
      setPending(null);
    }
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Alert inbox</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {alerts.filter((alert) => !alert.acknowledged).length} alerts need
              a review
            </p>
          </div>
          <Tabs
            value={filter}
            onValueChange={setFilter}
            aria-label="Alert filter"
          >
            <TabsList>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="space-y-3">
          {visible.map((alert) => (
            <article key={alert.id} className="surface-inset p-4">
              <div className="flex items-start gap-3">
                <CircleAlert
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    alert.severity === "critical"
                      ? "text-destructive"
                      : alert.severity === "warning"
                        ? "text-warning"
                        : "text-muted-foreground",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{alert.title}</h3>
                    <span className="text-[10px] text-muted-foreground">
                      {alert.time}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {alert.deviceName} · {alert.severity}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {alert.description}
                  </p>
                  <div className="mt-3 flex justify-end">
                    {alert.acknowledged ? (
                      <span className="flex min-h-10 items-center gap-1.5 text-xs text-success">
                        <Check className="size-3.5" />
                        Acknowledged
                      </span>
                    ) : (
                      <Button
                        variant="secondary"
                        disabled={pending !== null}
                        onClick={() => acknowledge(alert.id)}
                        aria-label={`Acknowledge ${alert.title}`}
                      >
                        {pending === alert.id
                          ? "Acknowledging…"
                          : "Acknowledge"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!visible.length && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <ShieldCheck className="size-8 text-muted-foreground" />
            <h3 className="font-medium">
              {filter === "open" ? "All caught up" : "No alerts yet"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {filter === "open"
                ? "There are no unacknowledged alerts."
                : "New device alerts will appear here."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
