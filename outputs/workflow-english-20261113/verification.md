# Workflow English interface and status refinement

## Changes

| Before | After |
| --- | --- |
| Clicking the validation count opened a separate issues drawer. | Validation is a read-only icon and count. Hover and keyboard focus explain the status. The issues drawer and its layout rules are removed. Testing still validates the definition, reports the first issue and locates the relevant configuration. |
| Four header actions shared a capsule after being counted as one group. | Save, Test, More and Expand retain independent circular controls and their existing visual weights. Undo/redo remain separate; the three zoom actions still share a capsule. |
| Built-in editor text, templates, errors and execution messages were Chinese. | The workflow title, node types, sample names, configuration, menus, tooltips, empty states, import errors and execution results use English. The workflow regions declare `lang="en"`. |
| Short field-label columns truncated common English labels. | Summary and definition labels have a 6.5em column. Long business values retain their full content and remain available in configuration. |
| A previously saved built-in demo could keep its old Chinese labels. | Known built-in metadata is migrated when read. Custom names, parameter values, identifiers, positions and connections are preserved. The known example scope text is translated explicitly. |

## Verification

- `npm run check`: type check, **85 tests**, production build passed. The build still reports the existing large-chunk warning.
- Installed through the local shadcn registry into an independent consumer. Consumer type check and build passed. Three installed files match byte for byte; the model differs only because the CLI removes its opening documentation comment. See `installation-parity.json`.
- `check.mjs`: **9 browser groups passed**. Covers dark/light themes; read-only validation at 0/1/2 issues; unchanged canvas geometry after clicking status; blocked invalid execution; header controls with 2/3/4 actions; keyboard toolbar navigation; undo/redo; node and workflow configuration; expanded workspace; right-click menu; edge insertion; new/existing candidates; empty trigger selection; invalid JSON import; touch simulation at 390px with 20px text; long titles; legacy draft migration on the actual showcase.
- Four known demo inputs checked in the browser: normal **20 °C**, warmer **26 °C**, missing values **20 °C**, weather failure with the actual English error. These are deterministic demo executions, not device or backend validation.
- Additional picker checks at **390 × 844** and **820 × 480**, 20px text: both tabs stay inside the picker, selected/hovered states remain distinct, list starts below tabs, and the popover stays within the viewport. See `picker-layout.json`.
- UI scan across visible text, accessible labels, input values and popovers found no Chinese text in the built-in scenarios. A source AST scan also found no Chinese interface strings in the six editor/demo owners; the historical-label migration table and custom-data fixtures intentionally retain Chinese input text.
- Browser checks reported **no page errors**. Desktop console listeners recorded no warnings; the temporary server logged React Flow 004 size warnings during the multi-page automation. A fresh touch-context follow-up covering menu, empty canvas, restored workflow and execution recorded no warnings and measured a rendered 356 × 540 canvas (`console-followup.json`). Screenshots were inspected for node summaries, header actions, configuration, insertion menus, touch trigger selection and run results.
- Generated `dist/` and checked-in `docs/` mirror match. Existing mirror backed up before synchronization.

Evidence uses Chrome and simulated pointer/touch input. It does not establish physical-device, screen-reader, backend scheduling or real IoT connectivity coverage.

## Screenshots

- `workflow-dark.png`, `workflow-light.png`: complete editor and independent header controls.
- `configuration-dark.png`, `configuration-light.png`: English node configuration.
- `insert-picker.png`, `picker-390.png`, `picker-820.png`: insertion and connection menus.
- `results-normal.png`, `results-warm.png`, `results-missing.png`, `results-failure.png`: data-driven outcomes.
- `touch-menu.png`, `touch-trigger.png`, `touch-results.png`: narrow-screen controls and results.
- `showcase-migrated-draft.png`: previous built-in draft displayed in English on the actual showcase.
