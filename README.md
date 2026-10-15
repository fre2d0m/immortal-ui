# Dark Tactile UI (`tactile/ui`)

A dark light-skeuomorphic & WebGL physical metal React component library inspired by `shadcn/ui`, Linear, and X.

---

## ✨ Key Features

### 1. Dual Rendering Architecture: Classic Dark Tactile (Default) + 6 WebGL Physical Metals
- **Classic Dark Tactile (`classic` · Default)**:
  - Pure CSS `1px 135°` dual-specular micro-bevel (`padding-box, border-box` dual-layer background clipping) with top-left primary light (`rgba(255,255,255,0.42)`) and bottom-right ambient bounce (`rgba(255,255,255,0.22)`).
  - Elevated **Convex** surfaces for buttons and cards, paired with carved **Concave** slots for inputs, textareas, and switch tracks.
- **Solution C · WebGL GLSL Physical Metal Shaders (6 Selectable Metals)**:
  - Powered by a shared offscreen WebGL fragment shader (`src/components/WebGLMetalEngine.tsx`) calibrated to a crisp `1px` hairline bezel and asymmetric `135°` specular falloff.
  - Supports **6 physical alloys** globally or per component:
    1. **24K Royal Gold (`gold`)**
    2. **Platinum Chrome (`platinum`)**
    3. **Obsidian Titanium (`obsidian`)**
    4. **Cobalt Blue Metal (`cobalt`)**
    5. **Rose Gold Copper (`rosegold`)**
    6. **Emerald Titanium (`emerald`)**

### 2. Clean 135° Static Specular Rim & Optional Hover Sweep
- **Restrained by Default**: Components maintain a static `135°` diagonal dual-specular highlight with smooth in-place brightening on hover (`hoverSweepDeg = 0`, `autoFlow = false`).
- **On-Demand Angular Sweep**: Pass `sweepDeg={90 | 180 | 360}` to any `TactileButton` or customize globally via the Optical & Shader Customizer.

### 3. `shadcn/ui` Inspired Landing Page & Interactive Examples
- **Examples · Cards**: Authentication, Payment Method selector, Team Members & Roles, Share Document, Notification Preferences, Cookie & Optical Settings, Issue Reporter, and Compute Goal.
- **Dashboard**: KPI metric cards, monthly compute throughput bar chart, and recent enterprise deployments.
- **Playground**: Multi-line system prompt workspace with model selector and tactile parameter sliders (`Temperature`, `Max Length`, `Top P`).
- **Components & Docs**: Interactive component catalog and one-click copyable React (TSX) & vanilla HTML/CSS code snippets.

---

## 📦 Component Catalog

| Component | Description | Key Props |
| :--- | :--- | :--- |
| **`TactileButton`** | Convex tactile button | `variant` (`default` \| `metallic` \| `recessed` \| `danger`), `size` (`sm` \| `md` \| `lg` \| `icon`), `material`, `sweepDeg`, `loading` |
| **`TactileInput`** | Recessed input slot | `icon`, `kbd`, `material` |
| **`TactileTextarea`** | Recessed multi-line textarea | `material`, standard textarea attributes |
| **`TactileSelect`** | Beveled dropdown menu | `options`, `value`, `onChange`, `label`, `material` |
| **`TactileSwitch`** | Physical toggle switch | `checked`, `onChange`, `label`, `hint`, `material` |
| **`TactileCheckbox`** | Recessed checkbox socket | `checked`, `onChange`, `label`, `hint`, `material` |
| **`TactileRadioGroup`** | Tactile radio group | `name`, `options`, `value`, `onChange`, `material` |
| **`TactileSlider`** | Recessed groove slider | `value`, `min`, `max`, `step`, `unit`, `label`, `onChange` |
| **`TactileTabs`** | Segmented control bar | `tabs`, `activeId`, `onChange`, `material` |
| **`TactileBadge`** | Capsule badge with LED dot | `dotColor` (`white` \| `green` \| `amber` \| `crimson`), `material` |
| **`TactileCard`** | Elevated obsidian card | `title`, `description`, `badge`, `headerAction` |
| **`TactileModal`** | Beveled modal dialog | `isOpen`, `onClose`, `title`, `description`, `footer` |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server (http://localhost:3000)
npm run dev

# 3. Build for production
npm run build
```
