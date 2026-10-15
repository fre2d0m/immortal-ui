# Immortal UI

Dark skeuomorphic React components with sculpted surfaces, diagonal specular rims, and optional WebGL metal materials. Inspired by shadcn/ui, Linear, and X.

Immortal UI includes an interactive component showcase, example layouts, and copyable React and HTML/CSS snippets. The repository is a Vite application with reusable component source; it does not currently ship an npm package or an installation CLI.

Live preview: [immortal.build](https://immortal.build/).

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
- **Optical controls** adjust the rim angle, bevel width, highlight intensity, and hover sweep. The default hover behavior is **+90° Quarter Turn**, including after resetting defaults. Buttons support per-component overrides such as `sweepDeg={0}`, `sweepDeg={180}`, and `sweepDeg={360}`.
- **Surface Gradient Amplitude** controls the bright-to-dark range on filled metallic buttons: 0% is flat, 100% is full contrast, and the default is 35%. Adjust it in the Style & Physical Metal Customizer, or use `surfaceGradientAmplitude` and `setSurfaceGradientAmplitude` from `useMetalConfig`. It follows the rim angle while leaving the WebGL edge highlights and Classic Dark buttons unchanged.
- **Audio feedback** uses synthesized Web Audio clicks for buttons, switches, and other controls, with no external audio assets.

## Brand mark

The shared mark is a bevelled platinum **Merkaba**, built from two interpenetrating tetrahedral frames. Its three-dimensional geometry, face occlusion, and metallic reflections are projected into SVG for the navigation, emblem previews, and favicon. Only the homepage wordmark uses the same frame geometry in a WebGL scene: a slow 48-second rotation, a smooth 90° reflection sweep on hover, and a moving studio strip while hovered. It pauses offscreen and in background tabs, and uses the static SVG when reduced motion is requested or WebGL is unavailable.

Edit `src/lib/merkabaMark.ts` and regenerate `public/immortal-mark.svg` and `public/favicon.svg` with:

```bash
node --experimental-strip-types design/scripts/export-mark.ts
```

`design/merkaba-mark.html` is the large master and small-size inspection sheet; `design/merkaba-motion.html` previews the animated homepage version. Both are available through the Vite development server.

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

To use Immortal UI in another React project, copy `ImmortalComponents.tsx`, `ImmortalModal.tsx`, `ImmortalToast.tsx`, `AudioEngine.ts`, and `WebGLMetalEngine.tsx`, together with the shared `src/index.css`. Install `lucide-react`, configure Tailwind CSS 4, and retain your application's React setup. The [getting started guide](https://immortal.build/#/docs/getting-started) walks through the complete integration.

## Explore the showcase

- **Home**: a concise brand hero and an interactive Forma project workspace, built from the existing components. Try Chrome, Gold, and Black Titanium directly in the workspace. Its local material scope inherits the global optical settings while keeping the site-wide material selection independent.
- **Components**: one searchable directory for all 13 components. Each detail page includes a live preview, TSX usage, setup requirements, API reference, and related components.
- **Docs**: a complete manual integration guide, from source files and shared CSS to the first component.
- **Examples**: Cards, Dashboard, Playground, and the original composite configuration form.
- **Materials**: the original material previews and optical controls.

The site uses hash routes so every page can be linked, refreshed, and opened directly on GitHub Pages without a server rewrite. For example:

```text
#/                              Home
#/docs/getting-started           Integration guide
#/components                    Component directory
#/components/button             Button preview, usage, and API
#/examples/cards                Card examples
#/examples/forms                Composite configuration form
#/materials                     Material lab
```

Forms, authentication, payments, and model controls in the showcase are UI demonstrations and are not connected to backend services.

The Hero workspace uses local demo data. Change chart metrics and reporting periods, adjust the monthly target, complete tasks, toggle the weekly digest, and create projects through a native dialog. Project creation and completion update the project list, active-project count, and activity timeline. Search, status filters, and a reset action work on the same state; refreshing the page resets the demo. The previous grass-and-rock landscape and its export sources remain available as design experiments, but are not mounted or loaded by the homepage.

`MetalMaterialScope` in `WebGLMetalEngine.tsx` lets a composed demo inherit optical settings with a local material. It does not write global CSS or change shader defaults. `ImmortalSwitch` also accepts an optional `ariaLabel` for switches whose visible label is outside the component; existing labeled switches use their label as their accessible name.

## Repository structure

```text
src/
  App.tsx                          Shared site navigation and routed layouts
  index.css                        Shared styles and optical effects
  site.css                         Site-only layout and documentation styles
  lib/navigation.ts                GitHub Pages-compatible hash navigation
  content/components.ts            Shared component catalog and API metadata
  pages/
    HomePage.tsx                   Brand hero and interactive workspace
    GettingStarted.tsx             Manual integration tutorial
    ComponentCatalog.tsx           Component directory
  components/
    HeroWorkspace.tsx             Interactive business demo and local state
    HeroWorkspace.css             Responsive workspace layout
    HeroMark3D.tsx                 Homepage-only rotating metal brand mark
    ImmortalComponents.tsx         Core components and prop types
    ImmortalModal.tsx              Modal dialog
    ImmortalToast.tsx              Toast provider and hook
    WebGLMetalEngine.tsx           Material presets, context, and shaders
    AudioEngine.ts                 Synthesized interaction sounds
    ComponentDocs.tsx              Component detail pages and live previews
    DocumentationLayout.tsx        Shared directory, sidebar, and page outline
    CodeBlock.tsx                  Copyable documentation code blocks
    NodeConfigExample.tsx          Original composite form example
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
