# Workflow header status consistency

| Before | After |
| --- | --- |
| Publication was an icon without a visible value. | The same compact metric structure shows Draft, Published, Unpublished changes or Unknown from the supplied publication metadata. |
| Node and validation counts had numbers without units, while publication had no text. | All three use an icon and an explicit value: Draft, 11 nodes, 0 issues. Singular/plural labels and zero values follow the actual counts. |
| Publication and node count were buttons; validation was a span. | All three use the same internal read-only status component, focus treatment and tooltip. Click and Enter perform no action and open no drawer. |
| Click-to-open hints and hover fills made metadata look actionable. | Hints use hover, keyboard focus or a 450ms touch hold. Tap has no action; dragging cancels a pending hold. There is no button fill or press transform. |
| Text and color treatment varied across the three values. | Shared 14px icons with 1.75px strokes, 6px internal gaps, 16px between metrics and tabular numerals. Metadata text is neutral; semantic colors primarily identify status icons, with multiple issues highlighted in red. Draft is neutral. |
| Different markup could drift independently. | `WorkflowStatusIndicator` owns the common markup and hint behavior. Narrow layouts wrap complete status items; touch targets remain at least 40px under Graphite. |

## Evidence

- `npm run check`: type check, **85 tests** and production build passed. Existing large-bundle warning remains.
- Installed through the registry into a separate shadcn consumer. Three changed files match their source byte for byte. Consumer type check and build passed.
- `check.mjs`: **3 browser scenario groups passed**, with no captured page errors or console warnings. Covered dark/light geometry, identical hover/focus/click behavior, pointer movement into the tooltip, Escape dismissal, four publication states, 0/1/2 issue values, 0/1/11 node values, invalid execution blocking, and a valid demo execution producing **20 °C**.
- Touch simulation at 390px with 20px text verified inert taps, long-press hints for all three metrics, dismissal, gesture cancellation, long publication text, non-overlapping target bounds and no page overflow.
- `contrast-check.mjs`: **10 state/theme samples**. Lowest measured text contrast **5.44:1**, lowest icon contrast **5.39:1**. Keyboard focus remained visible under forced colors and reduced motion.
- Inspected `showcase-header.png`, `header-dark.png`, `header-light.png` and `header-touch-20px.png` for visual consistency.
- Synchronized production `dist/` to `docs/` after backing up the prior mirror; directory comparison passed.

Publication state tests use host-provided fixtures; run data is the fixed demo. This verifies interface behavior, not a publication backend or real IoT delivery. Touch checks are simulated in Chrome.
