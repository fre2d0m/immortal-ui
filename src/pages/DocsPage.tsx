import { CodeSnippet, installCommand } from "@/components/CodeSnippet";
export function DocsPage() {
  const namespace = JSON.stringify(
    { registries: { "@immortal": `${window.location.origin}/r/{name}.json` } },
    null,
    2,
  );
  return (
    <div className="docs-page">
      <div className="page-heading">
        <p className="eyebrow">Documentation / Getting started</p>
        <h1>Make it yours.</h1>
        <p>
          Immortal UI is a source registry for React, Tailwind CSS v4, and
          shadcn/ui. Install the code into your app, connect your data, and
          adapt it freely.
        </p>
      </div>
      <h2 className="doc-heading">1. Start with shadcn/ui</h2>
      <p className="doc-copy">
        Use an existing React project with Tailwind v4 and a configured import
        alias. Initialize shadcn if you have not already. This showcase uses the
        Radix Nova style.
      </p>
      <CodeSnippet code="npx shadcn@latest init" />
      <h2 className="doc-heading">2. Add the Graphite theme</h2>
      <p className="doc-copy">
        The theme adds light and dark tokens and material rules to the global
        stylesheet configured in components.json. It changes matching shadcn
        controls throughout your app. Add the dark class to your HTML element
        for the reference appearance.
      </p>
      <CodeSnippet code={installCommand("graphite")} />
      <h2 className="doc-heading">3. Add a component or block</h2>
      <p className="doc-copy">
        Related components and official shadcn primitives are resolved
        automatically. Your own aliases determine where the files are written.
      </p>
      <CodeSnippet code={installCommand("fleet-overview")} />
      <h2 className="doc-heading">Optional: use a namespace</h2>
      <p className="doc-copy">
        Merge this entry into the registries object in your components.json,
        then use the shorter install command.
      </p>
      <CodeSnippet code={namespace} label="namespace configuration" />
      <div className="mt-3">
        <CodeSnippet code="npx shadcn@latest add @immortal/telemetry-card" />
      </div>
      <h2 className="doc-heading">Connect your data</h2>
      <p className="doc-copy">
        Components receive typed data through props. Blocks expose callbacks for
        configuration and alert acknowledgement. The registry has no MQTT
        client, credentials, backend, or polling loop. Keep authorization and
        transport in your application.
      </p>
      <CodeSnippet
        code={
          "<DeviceControl\n  deviceId={device.id}\n  deviceName={device.name}\n  online={device.online}\n  configuration={configuration}\n  onApply={async (next) => {\n    await api.saveConfiguration(device.id, next)\n    setConfiguration(next)\n  }}\n/>"
        }
        label="integration example"
      />
      <p className="doc-copy">
        Reject callbacks on failure. Represent missing readings as null, use
        epoch milliseconds for telemetry timestamps, and pass explicit device
        states. Demo snapshots belong to the showcase and are not installed with
        registry items.
      </p>
      <h2 className="doc-heading">Registry endpoints</h2>
      <div className="doc-links">
        <a href="./r/registry.json" target="_blank" rel="noreferrer">
          Registry catalog JSON
        </a>
        <a href="./themes/graphite.css" download>
          Graphite stylesheet
        </a>
        <a
          href="https://ui.shadcn.com/docs/registry"
          target="_blank"
          rel="noreferrer"
        >
          shadcn registry documentation
        </a>
        <a
          href="https://github.com/fre2d0m/immortal-ui"
          target="_blank"
          rel="noreferrer"
        >
          Source on GitHub
        </a>
      </div>
    </div>
  );
}
