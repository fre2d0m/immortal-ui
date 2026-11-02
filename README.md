# Immortal UI

**shadcn/ui + material + IoT.** A source registry for device identity, signal quality, telemetry, operating ranges, fleet operations, and alert review.

The name and platinum Merkaba mark continue from the previous visual exploration. **Graphite Instrument** adapts the supplied Tailwind v4 / shadcn stylesheet, with consistent type sizing and the exported material settings: neutral graphite primary actions, 16px body typography with a 14px minimum for labels, supporting text, and code, 32px visual control height, 24px card padding, 8px button corners, 22.4px panel corners, and a 1440px content width. Tab corners are 15px with 14px horizontal / 5px vertical padding. Light and dark modes share the same depth and interaction rules.

## Local development

Use Node.js **22.22 or newer**.

```bash
npm ci
npm run dev
```

Open **http://127.0.0.1:4177**. The dev command builds registry dependencies against this local origin, so the install commands displayed in the UI work before publication.

```bash
npm run registry:build  # Official shadcn build → public/r/
npm run lint            # Strict TypeScript checks
npm test                # Registry contracts and telemetry regression checks
npm run build           # Production registry + showcase → dist/
npm run preview         # Preview dist/ on port 4177; stop dev first
```

Override the generated dependency origin with `REGISTRY_BASE_URL=http://127.0.0.1:4180 npm run registry:build`. The canonical root `registry.json` always uses the production origin; local URL rewriting only affects generated install payloads.

## Install into a product

Start with a React + Tailwind CSS v4 project and a configured import alias. The showcase uses the current shadcn **Radix Nova** style.

```bash
npx shadcn@latest init
npx shadcn@latest add http://127.0.0.1:4177/r/graphite.json
npx shadcn@latest add http://127.0.0.1:4177/r/fleet-overview.json
```

Add `class="dark"` to the HTML root for the dark appearance. Graphite is an explicit global theme installation: it updates tokens and state rules in the stylesheet configured by `components.json`. Components can also be installed without Graphite to use an existing shadcn theme.

For a namespace, merge this entry into the consuming application's `components.json`:

```json
{
  "registries": {
    "@immortal": "http://127.0.0.1:4177/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @immortal/telemetry-card
```

The production build targets `https://immortal.build/r/{name}.json`. Use this origin for production installations and the local URLs during development. Discovery is available at `/r/registry.json`. The manual stylesheet at `/themes/graphite.css` imports `tailwindcss`, `tw-animate-css`, and `shadcn/tailwind.css`.

## Registry contents

- **Style:** `graphite` — material, typography, light/dark colors, interaction states, reduced motion, and forced colors.
- **Utility:** `telemetry` — gap-aware time-series geometry and operating-range validation.
- **Components:** `device-status`, `signal-strength`, `telemetry-chart`, `telemetry-card`, `device-card`, `threshold-control`.
- **Blocks:** `fleet-overview`, `device-control`, `alert-console`.

The 14 local foundation primitives come from the official shadcn CLI. Registry dependencies resolve upstream primitives directly. Custom files use `@components/` and `@lib/` target placeholders to respect consumer aliases. Showcase routes, fixtures, branding, and global providers are not installed as dependencies.

## Integration contracts

Components receive typed data. `Device` includes identity, location, status, protocol, RSSI, battery, and display-ready last-seen text. Status is always accompanied by a label. RSSI uses dBm; its thresholds are display heuristics to adapt for your radio technology. Use `null` for unavailable RSSI and battery readings.

`TelemetryPoint` is `{ timestamp: number; value: number | null }`. Timestamps are epoch milliseconds, displayed in UTC. Missing/non-finite readings split the line; empty and single-point inputs are supported. An optional table exposes readings without requiring a pointer. Aggregate dense streams before passing them to a compact chart.

Configuration and acknowledgement callbacks are async. Reject on failure and update parent data after success. Pending, validation, offline, empty, and error states are included.

```tsx
import { DeviceControl } from "@/components/blocks/device-control"

<DeviceControl
  deviceId={device.id}
  deviceName={device.name}
  online={device.online}
  configuration={configuration}
  onApply={async (next) => {
    await api.saveConfiguration(device.id, next)
    setConfiguration(next)
  }}
/>
```

The registry supplies UI and integration boundaries. MQTT transport, authorization, command delivery, and storage belong to the application. Showcase data is a fixed, labelled snapshot and its interactions update local state only.

## Source and authoring

```text
registry/catalog.mjs             Metadata, files, and dependency definitions
registry/immortal/styles/        Graphite CSS source of truth
registry/immortal/components/    Installable IoT components and helpers
registry/immortal/blocks/        Installable operational blocks
registry.json                   Generated canonical registry
scripts/build-registry.mjs       CSS schema conversion + official CLI build
public/r/                       Generated install payloads (gitignored)
public/themes/                  Generated manual stylesheet (gitignored)
src/components/ui/              Official shadcn foundation primitives
src/pages/                      Showcase, previews, theme, and install docs
src/lib/demo-data.ts             Showcase-only fixtures
tests/                          Dependency and telemetry regression checks
docs/                           Checked-in production mirror
```

The showcase imports registry sources directly. Add an entry to `registry/catalog.mjs`, use `immortal:<name>` for a custom dependency, and rebuild. The shorthand expands into an absolute URL before publishing. The CSS parser preserves final exported overrides in `cssVars` and carries material selectors through the supported `css` schema.

## Backup and delivery

The complete previous visual exploration is preserved on GitHub:

- Branch: [`backup/visual-exploration-2026-10-28`](https://github.com/fre2d0m/immortal-ui/tree/backup/visual-exploration-2026-10-28)
- Snapshot: `f5415041e507fe274cb6effecb97e8863d86a787`
- Refactor branch: `codex/iot-registry`

The backup includes the WebGL materials, metal audio, rotating mark, and previous hero studies. This branch keeps the brand artwork and uses the new Graphite foundation.

GitHub Pages runs `npm ci`, type checks, registry tests, and a production build on pushes to `main`/`master`. It publishes `dist/`, including the registry endpoints, under the existing `immortal.build` domain. Hash routes work without static-host rewrites. Refresh the separate `docs/` mirror from `dist/` after a production build.

## Attribution

Official shadcn/ui source is MIT licensed; preserve its upstream notice when redistributing those files. Other dependencies retain their own licenses. Graphite was supplied from the owner's Slopevia visual exploration and rebranded for Immortal UI.

Registry format follows the official [getting started guide](https://ui.shadcn.com/docs/registry/getting-started) and [registry item schema](https://ui.shadcn.com/docs/registry/registry-item-json).
