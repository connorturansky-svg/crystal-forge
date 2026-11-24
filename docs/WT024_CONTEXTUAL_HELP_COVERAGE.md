# WT-024 candidate coverage

In this draft, Hover Notes and Detailed Explanations are independent toolbar checkboxes. Hover or focus a control to see its short note. Use its question-mark button on a touch screen. Press Escape to close a short note. Turn on Detailed Explanations to read longer guidance next to controls with authored copy. Choices apply to the browser and persist between visits when browser storage is available.

The shared renderer lives in [tooltips.js](../tooltips.js). Add authored entries in [contextual-help-copy.js](../contextual-help-copy.js), using the setting's semantic key or explicit generated attribute. Update the original tooltip registry for classic short text. The generated renderer decorates inserted controls when workspace content changes.

## Source inventory

| Surface | Detailed copy | Open coverage |
| --- | --- | --- |
| Classic Crystal settings | 109 of 112 distinct `data-state` keys | 3 hidden legacy edge-finishing fields |
| Native builder parameters | All 69 catalogue literal keys and 6 additional Tactile Tile keys | Static test checks every registered schema directly |
| Dynamic settings | 147 explicit selectors | Remaining generated inputs and per-field variants |

Classic fields intentionally excluded because they are hidden and normalised to the supported finishing mode: `edgeFinishStyle`, `edgeFinishScope`, `edgeFinishSteps`.

The registered-schema test covers the separate Tactile Tile schema alongside the main catalogue and import generators.

Generated coverage now includes native pixel fields, mount recesses, patterns, project and print-job settings, the measured profile editor and common import and backup settings. Runtime review remains open for generated actions and conditional controllers. Quick controls reuse the same semantic copy as Precision settings. Targeted review remains open for specialised generated editors and presentation-only actions. The global help toggles, hidden file input behind Open, and Help dialog’s own search and category controls are excluded from the setting inventory. The classic registry retains short notes for the three hidden legacy fields. Continue discovery with `node tests/helpers/wt024-help-audit.mjs`. Review live controls across all eight workspaces, including profile editors, hardware coordinates, advanced manufacturing controls, Library actions, print jobs and modal editors. Check native copy against each family and mode before counting shared keys as complete coverage. This source inventory is a starting point for that runtime review.
