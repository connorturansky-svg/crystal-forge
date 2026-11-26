# WT-024 candidate coverage

In this draft, Hover Notes and Detailed Explanations are independent toolbar checkboxes. Hover or focus a control to see its short note. Use its question-mark button on a touch screen. Press Escape to close a short note. Turn on Detailed Explanations to read longer guidance next to controls with authored copy. Choices apply to the browser and persist between visits when browser storage is available.

The shared renderer lives in [tooltips.js](../tooltips.js). Add authored entries in [contextual-help-copy.js](../contextual-help-copy.js), using the setting's semantic key or explicit generated attribute. Update the original tooltip registry for classic short text. The generated renderer decorates inserted controls when workspace content changes.

## Source inventory

| Surface | Detailed copy | Open coverage |
| --- | --- | --- |
| Classic Crystal settings | 109 of 112 distinct `data-state` keys | 3 hidden legacy edge-finishing fields |
| Native builder parameters | All 69 catalogue literal keys and 6 additional Tactile Tile keys | Static test checks every registered schema directly |
| Dynamic settings | 161 explicit selectors (including proposed density control) | Includes tool finder, batch selection, Models drawer and visible file fields |

Classic fields intentionally excluded because they are hidden and normalised to the supported finishing mode: `edgeFinishStyle`, `edgeFinishScope`, `edgeFinishSteps`.

The registered-schema test covers the separate Tactile Tile schema alongside the main catalogue and import generators.

## Drawer density follow-up (candidate #169)

The new thumbnail-size slider adds authored short and detailed help through the existing registry. Its browser preference is separate from project data. The new focused test checks the guidance and keyboard changes alongside the existing drawer filter. Exact-head results remain required; the earlier 786-instance count is historical evidence, not a claim about the new build.

## Reconciled runtime evidence

The focused Chromium audit checks 786 visible setting instances across all seven builder families and eight workspace destinations, opening visible collapsed sections and requiring an authored detailed description on every discovered setting. It also checks the four preference combinations, cross-tab updates, reload, the drawer filter, the naming dialog, the SVG/mesh import and measured-profile editors, narrow layouts and touch activation. The drawer's repeated actions expose short notes on hover or keyboard focus; the filter and naming input also have inline explanations.

The legacy model bar now wraps its help blocks and keeps the model tab list scrollable, avoiding the intercepted pointer failure found in the earlier hosted Chromium run. The tool finder also scrolls with the sidebar when detailed guidance is enabled, so it does not cover controls beneath it. The runtime matrix covers default family settings and the modal cases above. It is not exhaustive proof of every possible conditional state or a screen-reader evaluation.

The Help audit runs in the native-precision browser workflow on pull requests so the manufacturing browser suite retains its full time budget. The complete local browser script includes the Help audit and edge-finishing checks. The touch fixture releases the preceding seven-builder browser context first.

Generated coverage now includes native pixel fields, mount recesses, patterns, project and print-job settings, the measured profile editor and common import and backup settings. Runtime review remains open for generated actions and conditional controllers. Quick controls reuse the same semantic copy as Precision settings. Targeted review remains open for specialised generated editors and presentation-only actions. The global help toggles, hidden file input behind Open, and Help dialog’s own search and category controls are excluded from the setting inventory. The classic registry retains short notes for the three hidden legacy fields. Continue discovery with `node tests/helpers/wt024-help-audit.mjs`. Review live controls across all eight workspaces, including profile editors, hardware coordinates, advanced manufacturing controls, Library actions, print jobs and modal editors. Check native copy against each family and mode before counting shared keys as complete coverage. This source inventory is a starting point for that runtime review.
