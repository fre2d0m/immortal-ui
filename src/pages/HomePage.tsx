import { Radio, SlidersHorizontal, Layers3, Activity, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FleetOverview } from "@/components/blocks/fleet-overview";
import { DeviceControl } from "@/components/blocks/device-control";
import { AlertConsole } from "@/components/blocks/alert-console";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  demoDevices,
  demoTraffic,
  demoConfiguration,
  demoAlerts,
} from "@/lib/demo-data";
import { CodeSnippet, installCommand } from "@/components/CodeSnippet";
import { useState } from "react";

export function HomePage() {
  const [configuration, setConfiguration] = useState(demoConfiguration);
  const [alerts, setAlerts] = useState(demoAlerts);
  return (
    <>
      <section className="home-hero">
        <div className="eyebrow">
          <span className="status-led" /> Built on shadcn/ui · Made for IoT
        </div>
        <h1>
          Interfaces for
          <br />
          <span>the physical world.</span>
        </h1>
        <p>
          Tactile components for connected devices.
          <br className="hidden sm:block" /> From a single sensor to your entire
          fleet.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <a href="#/components">Explore components</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="#/docs">Start building</a>
          </Button>
        </div>
      </section>
      <section
        className="home-workspace"
        aria-label="Interactive IoT workspace"
      >
        <Tabs defaultValue="fleet">
          <div className="workspace-bar">
            <TabsList aria-label="Workspace example">
              <TabsTrigger value="fleet">
                <Radio className="mr-1.5 size-3.5" />
                Fleet
              </TabsTrigger>
              <TabsTrigger value="control">
                <SlidersHorizontal className="mr-1.5 size-3.5" />
                Control
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <Activity className="mr-1.5 size-3.5" />
                Alerts
              </TabsTrigger>
            </TabsList>
            <span className="demo-caption">
              <span className="size-1 rounded-full bg-muted-foreground" />
              Demo data · local interactions
            </span>
          </div>
          <TabsContent value="fleet">
            <FleetOverview
              devices={demoDevices}
              telemetry={demoTraffic}
              title="North facility"
              subtitle="Device network · 28 October 2026, 10:00 UTC"
            />
          </TabsContent>
          <TabsContent value="control">
            <div className="mx-auto max-w-xl">
              <DeviceControl
                deviceId="ENV-001"
                deviceName="Ambient sensor"
                online
                configuration={configuration}
                onApply={async (next) => setConfiguration(next)}
              />
            </div>
          </TabsContent>
          <TabsContent value="alerts">
            <div className="mx-auto max-w-2xl">
              <AlertConsole
                alerts={alerts}
                onAcknowledge={async (id) =>
                  setAlerts((current) =>
                    current.map((alert) =>
                      alert.id === id
                        ? { ...alert, acknowledged: true }
                        : alert,
                    ),
                  )
                }
              />
            </div>
          </TabsContent>
        </Tabs>
      </section>
      <section className="home-library">
        <div className="section-intro">
          <p className="eyebrow">A system you can make your own</p>
          <h2>One foundation. Built for your domain.</h2>
        </div>
        <div className="foundation-grid">
          {[
            {
              icon: Layers3,
              title: "shadcn/ui at the core",
              text: "Familiar APIs and accessible primitives. Source code lives in your project.",
              path: "/components/button",
            },
            {
              icon: SlidersHorizontal,
              title: "A considered material",
              text: "Raised surfaces, recessed content, and controls that feel ready to use.",
              path: "/theme",
            },
            {
              icon: Cpu,
              title: "Connected by design",
              text: "Device states, time series, operating ranges, and complete IoT workflows.",
              path: "/blocks",
            },
          ].map(({ icon: Icon, title, text, path }) => (
            <a href={`#${path}`} key={title}>
              <Icon className="mb-5 size-5 text-muted-foreground" />
              <h3>{title}</h3>
              <p>{text}</p>
            </a>
          ))}
        </div>
      </section>
      <section className="home-install">
        <div>
          <p className="eyebrow">Your code. Your product.</p>
          <h2>Start with the material.</h2>
          <p>Install Graphite, then add only the pieces you need.</p>
        </div>
        <CodeSnippet
          code={installCommand("graphite")}
          label="theme installation"
        />
      </section>
    </>
  );
}
