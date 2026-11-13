# Immortal UI

**shadcn/ui + material + IoT.** A source registry for device identity, signal quality, telemetry, operating ranges, fleet operations, and alert review.

The name and platinum Merkaba mark continue from the previous visual exploration. **Graphite Instrument** uses the supplied Tailwind v4 and shadcn stylesheet as its baseline. The preset uses 14px body text, 34px shared control height, 24px card padding, circular standalone icon buttons, 6px text-button and field corners, and 12px panel and navigation corners. Tabs use 18px corners with 14px horizontal and 4px vertical padding. Light and dark modes share the same depth and interaction rules.

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
- **Foundation:** `tabs` — Radix keyboard behavior with a shared sliding indicator. Install `@immortal/tabs`; Blocks that use Tabs include this dependency automatically. Graphite styles upstream Tabs too, but sliding requires this component implementation.
- **Utilities:** `telemetry` (time-series geometry), `iot-model` (quality, validation and lifecycle contracts), `use-device-command` (request correlation, timeout and concurrent-submit protection).
- **数据与指标 / Metrics & indicators:** `metric-card` (reported observations) and `indicator-card` (derived results). Definitions and source metadata are separate from observations/results. Trends, ranges and quality are capabilities inside the cards; a result can be numeric, categorical or a structured table.
- **控制与执行 / Control & execution:** `light-control`, `thermostat-control`, `actuator-control`, `setpoint-control`, `control-authority`, `interlock-status`, `command-status`, `irrigation-run`, `control-mode`, `actuator-switch`.
- **事件与告警 / Events & alarms:** `alert-card`, `event-timeline`, `automation-note`.
- **设备与空间 / Devices & spaces:** `device-profile` (page-level device identity), `device-card` (device overview card), `device-status`, `signal-strength`.
- **配置与运维 / Configuration & maintenance:** `threshold-control`.
- **Installable Blocks:** `fleet-overview`, `device-detail`, `telemetry-explorer`, `device-groups`, `soil-profile`, `soil-water-explorer`, `alert-console`, `device-control`, `greenhouse-control`, `data-workflow`.
- **Planned scenarios (showcase only):** zone irrigation, cold-chain monitoring, energy management.

Components are grouped by interface type. Blocks cover device operations, data and physical spaces, agriculture, and facilities and energy. Installable scenarios include a live preview, usage, and links to the IoT components they use. See the [ThingVerse source mapping and integration notes](design-notes/thingverse-blocks.md) for the shared station example.

Chart behavior, data contracts and verification are documented in [图表展示重构](design-notes/data-visualization-refactor-20261112.md). Trends use real elapsed time, explicit gaps and shared scales; numeric examples and aggregates are reproducible presentation-only fixtures.

The [chart visual review](design-notes/data-visualization-visual-review-20261113.md) and [interaction refinement](outputs/chart-interaction-20261113/verification.md) document the Recharts analysis view, chart palette, grouped legends, sample tooltips, screenshots and current verification limits.

[土壤水分年度分析](design-notes/soil-water-explorer.md) adds an ECharts workbench for 20 hourly depth series over a year, interval climate quantities, concurrent events, shared range navigation and original-record inspection. Its deterministic fixtures are separate from installed code; [verification](outputs/soil-water-20261113/verification.md) records the tested scope and measurements.

The **Icons** library contains **36 usable icons** across sensing, actuation, connectivity, spaces/assets, energy/resources and states/events: **26 curated Lucide icons** and **10 original SVG extensions**. Search by Chinese/English name, use case or protocol; filter by source; inspect 16/20/24/32px previews; copy React usage or copy/download SVG files. Lucide SVG exports retain upstream notices.

The extensions cover flow measurement, air quality, water pumps, valves, electric motors, field buses, pipelines, storage tanks, device enclosures and heat energy. They use a 24px grid, 2px strokes, rounded joins/caps and `currentColor`, with Lucide-compatible props. Install `@immortal/iot-icons` (or the local `/r/iot-icons.json`) and import named components from `@/components/icons/iot-icons`. The curated Lucide icons are imported directly from `lucide-react`. The [icon mapping and acceptance record](design-notes/icons-lucide-20261104.md) explains the selection.

The showcase uses flat specimen backgrounds, short surface shadows, plain headings without eyebrow labels, and restrained scrollbars. The sharper surface tokens are shared with the installable Graphite theme.

Both modes define recessed wells with `inset 0 2px 4px rgb(0 0 0 / 0.07), inset 0 0 0 0.5px rgb(0 0 0 / 0.08)`. Navigation and segmented selection reuse the raised control material. Press preserves the current material, with a 4% light change and a shallow edge shadow. Tabs move one selection surface between labels; line Tabs move one underline. Dropdowns, submenus, and select lists put `shadow-menu` on the floating shell. Rows keep flat fills and markers through hover, selection and press. Dialogs use `shadow-overlay`. Badges present metadata on a flat surface with optional semantic colors. Filtering uses interactive chips. See the [foundation consistency rules](design-notes/foundation-consistency.md).

The current catalog has **20 interface components and 9 installable blocks**. The registry also includes sliding Tabs, an SVG icon extension set, a theme, two utilities and a command hook. Five previous entries (`telemetry-card`, `data-freshness`, `telemetry-chart`, `range-gauge`, `daily-histogram`) remain as internal dependencies or compatibility endpoints, marked `meta.internal`; they are not presented or counted as independent business components. There are 40 registry endpoints including these helpers. Previous showcase URLs redirect to the corresponding card or query workspace. See the [earlier implementation report](design-notes/first-batch-implementation-20261104.md) for the original control and lifecycle verification. See the [greenhouse extraction decisions](design-notes/greenhouse-component-extraction.md) for source mapping, scope and deferred patterns.

The 14 original local foundation primitives come from the official shadcn CLI; the menu preview adds a small Radix DropdownMenu adapter with the same data-slot contract. Registry dependencies resolve upstream primitives directly, except Tabs, which use the local sliding implementation. Custom files use `@components/` and `@lib/` target placeholders to respect consumer aliases. DeviceProfile owns a flat, responsive device identity layout: product image, name and tags, serial/model, purpose, runtime metadata and top-right actions. It is used at the top of DeviceDetail and does not use the internal Panel structure. Complete panels own their surface, padding, header and content spacing. Do not wrap them in another Card. TelemetryChart uses `embedded` for a flat section inside an existing panel; field editors and status indicators remain embeddable. Internal layout helpers are bundled as files inside the owning components; they have no standalone catalog or install entry. See the [business panel rules](design-notes/foundation-consistency.md#业务面板). Showcase routes, fixtures, branding, and global providers are not installed as dependencies.

## Theme Studio

Open [Theme](https://immortal.build/#/theme) to use the configuration panel migrated from the Slopevia Design Lab. Changes preview across the showcase and save in this browser. Light/dark palettes remain separate; fonts, dimensions, component radii, spacing, tabs and shadows share the same export logic as the preview. Desktop uses a side panel; narrow screens use a collapsible bottom panel.

Download or copy the full customized CSS for Tailwind v4 and shadcn/ui. Export or import JSON to continue editing elsewhere. Valid Design Lab v1 exports can still be imported. Body and supporting text have a 14px minimum, and the Graphite preset uses 12px type for compact badges. Reset restores the Graphite preset, including its independent navigation, panel, and badge values. The shared control height derives matching button, input, select, navigation, menu, and Tab heights. Compact sizes reserve room for text and padding; touch targets have a 40px minimum, including the equal width and height of icon-button targets. A flex row marked `data-slot="control-row"` aligns direct text buttons, inputs, selects and Tab tracks to the tallest control on that line. Standalone icon actions stay circular and vertically centered; input steppers match their field in both dimensions. Standalone category overrides and deliberate size variants remain independent. XS/SM/default/LG buttons and icon buttons follow the same scale. Standalone icon buttons keep a circular outline across themes; the capsule option applies to text buttons and joined button groups. Each category exposes relevant height, spacing, type, and radius options. Clearing a component override restores its automatic value. The Theme page includes a live cross-component comparison. CSS export contains the resolved values, and JSON stores the shared settings and explicit overrides.

The editor reads `registry/immortal/styles/graphite.css` directly. Its UI, browser storage and settings helpers live under `src/` and are not installed with registry components.

## Integration contracts

Components receive typed data. `Device` includes identity, location, status, protocol, RSSI, battery, and display-ready last-seen text. Status is always accompanied by a label. RSSI uses dBm; its thresholds are display heuristics to adapt for your radio technology. Use `null` for unavailable RSSI and battery readings.

`TelemetryPoint` is `{ timestamp: number; value: number | null }`. Timestamps are epoch milliseconds; chart time zones are explicit and default to UTC. Same-unit series share a scale; different units use separate plots. Null/non-finite samples and excessive sample gaps split the line. Empty windows, target bands, event markers, a shared keyboard-accessible cursor and a precise data table are supported. Provide the aggregation description and aggregate dense streams upstream. Display precision is shared between the cursor and table.

Configuration and acknowledgement callbacks are async. Reject on failure and update parent data from authoritative device feedback. First-batch command callbacks receive a request ID and AbortSignal; return a typed receipt for accepted, running, verified, rejected, failed, timeout or cancelled. A legacy `Promise<void>` resolves to **accepted**, never verified. Requested values, reported values and command outcome remain separate. Timeouts mean an unknown result, and do not automatically retry. The UI cannot substitute for device interlocks or application authorization.

Sensor readings accept display precision, source quality, sample/receive timestamps and a caller-maintained clock (or legacy age). Zero and negative readings are valid. Invalid source quality hides the numeric value; offline readings may retain an explicitly marked last snapshot. Freshness and quality are independent. Alarm acknowledgement and recovery form four distinct states. Interlocks display the supplied controller decision; an empty list does not imply permission. Control authority distinguishes local/remote, manual/strategy and owner. `ControlModeValue` now uses only `manual | auto`; AI suggestions are not a control-ownership mode.

```tsx
import { DeviceControl } from "@/components/blocks/device-control";

<DeviceControl
  deviceId={device.id}
  deviceName={device.name}
  online={device.online}
  configuration={configuration}
  onApply={async (next) => {
    await api.saveConfiguration(device.id, next);
    setConfiguration(next);
  }}
/>;
```

The registry supplies UI and integration boundaries. MQTT transport, authorization, command delivery, and storage belong to the application. Showcase data is a fixed, labelled snapshot and its interactions update local state only.

## Data processing workflows

`data-workflow` adds a React Flow editor for ecological IoT data processing: event/scheduled/manual triggers, multiple sources, quality checks, transformations, aggregation, model adapters, conditional branches, parallel fan-out, ALL/ANY joins, delivery and failure routing. Its independent workspace keeps the canvas visible while contextual configuration and a collapsible debug area support editing and inspection. Shared Graphite controls, undo/redo, draft saving, structural validation, a searchable endpoint picker with keyboard and touch access and JSON import/export are included. An empty canvas starts with a dashed trigger placeholder. Endpoint plus buttons and dropped connections create compatible, connected steps; insertion preserves the existing path, and parallel branches can connect to an existing join. Host-specific configuration forms can replace the basic parameter editor. Adapters derive structured node summaries from current configuration: up to three labeled fields or a comparison expression, with consistent node dimensions and separate run results. React Flow, shared Tabs and the Block’s styles/model install together; Panel, showcase templates, observations and the demo scheduler do not.

Open `#/blocks/data-workflow`. The fixed demo computes 20 °C or 26 °C from known input records and changes its distribution branch accordingly. Production execution, scheduling, credentials, concurrency, retries and delivery belong to the host callbacks. See the [workflow contract and demonstrable cases](design-notes/data-workflow.md).

## Source and authoring

```text
registry/catalog.mjs             Metadata, files, and dependency definitions
registry/immortal/styles/        Graphite CSS source of truth
registry/immortal/components/    Installable IoT components and helpers
registry/immortal/blocks/        Installable operational blocks
registry/immortal/icons/         Original Lucide-compatible SVG extensions
registry.json                   Generated canonical registry
scripts/build-registry.mjs       CSS schema conversion + official CLI build
scripts/build-icons.mjs          SVG assets and attribution from canonical sources
public/r/                       Generated install payloads (gitignored)
public/themes/                  Generated manual stylesheet (gitignored)
public/icons/                   Generated SVG downloads and metadata (gitignored)
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
