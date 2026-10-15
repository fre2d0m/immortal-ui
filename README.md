# Immortal UI

Dark skeuomorphic React components with sculpted surfaces, diagonal specular rims, and optional WebGL metal materials. Inspired by shadcn/ui, Linear, and X.

Immortal UI includes an interactive component showcase, example layouts, and copyable React and HTML/CSS snippets. The repository is a Vite application with reusable component source; it does not currently ship an npm package or an installation CLI.

## Quick start

Use **Node.js 22.22 or later in the Node.js 22 release line**, matching the Node.js 22 environment used by the deployment workflow.

```bash
git clone https://github.com/fre2d0m/immortal-ui.git
cd immortal-ui
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The showcase runs entirely in the browser and does not require an API key.

```bash
npm run lint     # TypeScript checks
npm run build    # Production assets in dist/
npm run preview  # Preview the production build locally
```

## Materials and interactions

- **Classic Dark** is the default pure CSS material. Convex buttons and cards sit alongside recessed inputs and switch tracks, with 1px diagonal specular rims.
- **Six WebGL metals** are available globally or through a component's `material` prop: Royal Gold (`gold`), Platinum Chrome (`platinum`), Obsidian Titanium (`obsidian`), Cobalt Blue (`cobalt`), Rose Gold (`rosegold`), and Emerald Titanium (`emerald`).
- **Optical controls** adjust the rim angle, bevel width, highlight intensity, and optional hover sweep. Buttons support `sweepDeg={90}`, `sweepDeg={180}`, and `sweepDeg={360}`.
- **Audio feedback** uses synthesized Web Audio clicks for buttons, switches, and other controls, with no external audio assets.

## Components

The core components are exported from `src/components/ImmortalComponents.tsx`:

- `ImmortalButton` — button variants, sizes, loading state, and material overrides.
- `ImmortalInput` and `ImmortalTextarea` — recessed text fields.
- `ImmortalSelect` — dropdown with labels and option descriptions.
- `ImmortalSwitch`, `ImmortalCheckbox`, and `ImmortalRadioGroup` — selection controls.
- `ImmortalSlider` — numeric slider with optional label and unit.
- `ImmortalTabs` — segmented navigation.
- `ImmortalBadge` — capsule badge with a status dot.
- `ImmortalCard` — container with optional title, description, badge, and header action.

`ImmortalModal` is exported from `src/components/ImmortalModal.tsx`. Toast notifications use `ToastProvider` and `useToast` from `src/components/ImmortalToast.tsx`.

## Use the components

Inside this repository, import components from their source files and wrap the interface in `MetalConfigProvider`. Add `ToastProvider` when using toast notifications. The application entry point imports `src/index.css` for the shared surface styles, optical effects, and Tailwind utilities.

```tsx
import { ImmortalButton, ImmortalCard } from './components/ImmortalComponents';
import { ToastProvider, useToast } from './components/ImmortalToast';
import { MetalConfigProvider } from './components/WebGLMetalEngine';

function Example() {
  const { toast } = useToast();

  return (
    <ImmortalCard title="Immortal UI">
      <ImmortalButton
        variant="metallic"
        material="gold"
        onClick={() => toast({ title: 'Welcome to Immortal UI', type: 'success' })}
      >
        Get started
      </ImmortalButton>
    </ImmortalCard>
  );
}

export default function App() {
  return (
    <MetalConfigProvider>
      <ToastProvider>
        <Example />
      </ToastProvider>
    </MetalConfigProvider>
  );
}
```

To use Immortal UI in another React project, copy the component source and shared CSS, install the dependencies those files import, and configure Tailwind CSS. The component files depend on the shared `AudioEngine` and `WebGLMetalEngine`; copy these alongside the components.

## Explore the showcase

- **Examples · Cards**: authentication, payment methods, team members, document sharing, notification preferences, and settings.
- **Dashboard**: metric cards, a throughput chart, and deployment rows using example data.
- **Playground**: an example prompt workspace with model and parameter controls.
- **Components**: live controls and a composite configuration form.
- **Metal Lab**: material previews and optical adjustments.
- **Code & Docs**: component previews with copyable TSX and HTML/CSS snippets.

Forms, authentication, payments, and model controls in the showcase are UI demonstrations and are not connected to backend services.

## Repository structure

```text
src/
  App.tsx                          Showcase and navigation
  index.css                        Shared styles and optical effects
  components/
    ImmortalComponents.tsx         Core components and prop types
    ImmortalModal.tsx              Modal dialog
    ImmortalToast.tsx              Toast provider and hook
    WebGLMetalEngine.tsx           Material presets, context, and shaders
    AudioEngine.ts                 Synthesized interaction sounds
    ComponentDocs.tsx              Live previews and code snippets
    ShadcnExamplesGrid.tsx         Cards, dashboard, and playground
    LightingLab.tsx                Global optical controls
    LiquidChromeLab.tsx            Material lab
    HeroEmblem.tsx                 Interactive hero emblem
docs/                              Checked-in static showcase build
.github/workflows/deploy.yml        GitHub Pages deployment
```

## GitHub Pages

The deployment workflow builds `dist/` and publishes it through GitHub Actions on pushes to `main` or `master`, or when started manually. In the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

Vite uses `base: './'`, so asset URLs remain relative to the deployed repository path. The deployed site URL is shown in the Pages settings and the workflow's deployment result.

The checked-in `docs/` directory is a separate static snapshot. To refresh it after changing the source:

```bash
npm run build -- --outDir docs
touch docs/.nojekyll
```
