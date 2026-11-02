import { useState } from "react";
import {
  Activity,
  Cpu,
  Radio,
  SlidersHorizontal,
  Bell,
  ChartNoAxesCombined,
  Gauge,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { catalog } from "@/content/catalog";
import { DeviceStatus } from "@/components/iot/device-status";
import { SignalStrength } from "@/components/iot/signal-strength";
const icons = {
  "device-status": Radio,
  "signal-strength": Radio,
  "telemetry-chart": ChartNoAxesCombined,
  "telemetry-card": Gauge,
  "device-card": Cpu,
  "threshold-control": SlidersHorizontal,
  "fleet-overview": Cpu,
  "device-control": SlidersHorizontal,
  "alert-console": Bell,
};
export function CatalogPage({ kind }: { kind: "component" | "block" }) {
  const [query, setQuery] = useState("");
  const items = catalog.filter(
    (item) =>
      item.kind === kind &&
      `${item.title} ${item.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">
          The registry / {kind === "block" ? "Workflows" : "Building blocks"}
        </p>
        <h1>{kind === "block" ? "IoT Blocks" : "IoT components"}</h1>
        <p>
          {kind === "block"
            ? "Complete interfaces for everyday device operations. Bring your own data and service adapters."
            : "Purpose-built for device identity, connectivity, telemetry, and control. Styled with Graphite."}
        </p>
      </div>
      <Input
        aria-label="Search registry"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Find a ${kind}…`}
        className="mb-8 max-w-sm"
      />
      <div className="catalog-grid">
        {items.map((item) => {
          const Icon = icons[item.name as keyof typeof icons] ?? Activity;
          return (
            <a
              key={item.name}
              href={`#/${kind === "block" ? "blocks" : "components"}/${item.name}`}
              className="catalog-tile"
            >
              <div className="catalog-art surface-inset">
                <div className="catalog-mini surface-raised">
                  <div className="flex items-center justify-between gap-8">
                    <Icon className="size-5 text-muted-foreground" />
                    <DeviceStatus
                      state={
                        item.name === "alert-console" ? "warning" : "online"
                      }
                    />
                  </div>
                  {item.name.includes("telemetry") ? (
                    <div className="mt-6">
                      <span className="text-3xl font-medium tracking-tight">
                        23.8{" "}
                        <small className="text-xs text-muted-foreground">
                          °C
                        </small>
                      </span>
                      <div className="mini-bars mt-5">
                        {[32, 48, 42, 65, 58, 78, 62, 86, 72, 60, 76, 88].map(
                          (height, i) => (
                            <i key={i} style={{ height: `${height}%` }} />
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="surface-inset mt-6 flex items-center justify-between gap-4 p-3">
                      <span className="text-[11px] text-muted-foreground">
                        {item.name === "threshold-control"
                          ? "10 — 35 °C"
                          : "ENV-001"}
                      </span>
                      <SignalStrength rssi={-63} />
                    </div>
                  )}
                </div>
              </div>
              <div className="catalog-text">
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </a>
          );
        })}
      </div>
      {!items.length && (
        <p className="py-12 text-muted-foreground">No matching {kind}s.</p>
      )}
    </>
  );
}
