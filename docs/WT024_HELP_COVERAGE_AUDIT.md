# WT-024 — Source coverage audit (research snapshot)

> **Research-only baseline:** main `d2ee1ab84ea41d363d9448df436732a286bf2c54` on 23 November 2026. Does not claim runtime/visual pass, physical UI test or implementation. Recompute all counts after WT-023 integration; these are code-source observations, **not** proof of 100% control coverage.

## Static facts inspected

- `tooltips.js`: `SETTINGS` has **113 explicit keys**; `BUTTONS` has **36 explicit keys**; `TABS` / `VIEWS` / `TOOLS` / `LOOKS` / `OTHER` add smaller groups. `lookup` checks `data-tooltip-*`, `data-state`, `id` and some navigation attributes, then native `title`. Existing fallbacks do not equal a human-reviewed two-tier explanation. `installTooltips` returns an enable/disable interface but `studio-v3.js` doesn't retain it for a global Hover preference.
- `index.html`: **112 distinct `data-state` keys** in classic static HTML; **91 button IDs** statically present (not necessarily 91 independent settings). The right-hand `#contextHelp` is the current persistent Description destination. `.control-tooltip` has `pointer-events:none`, contrary to the intended hoverable popup behaviour.
- Exact classic `data-state` keys **lacking a matching `SETTINGS` entry** at this snapshot (15): `tipStyle`, `edgeFinishEnabled`, `edgeFinishStyle`, `edgeFinishScope`, `edgeFinishAmount`, `edgeFinishSteps`, `requireAccessiblePassages`, `wireDirectionArrows`, `wireShowLengths`, `wireVaulted`, `wireAllowOverLength`, `socketConical`, `edgeManualMounts`, `autoBedSplit`, `curaQualityType`.
- `studio-catalogue.js` contains **at least 69 distinct literal parameter keys** from constructor calls `numeric` / `choice` / `boolean`; because some fields arise from composed arrays and generators, this is a lower-bound discovery, not a complete runtime inventory. These are rendered by `sensory-studio.js` `control(schema,p)` as `data-model-param` inputs; current `lookup` has no matching branch for that attribute.
- `sensory-studio.js` contains >100 distinct literal `data-*` names, including native pixel backing, pixel profiles, mount fields/recesses/patterns, wire configuration, jobs and contextual controls. This is **not** equivalent to >100 user settings: each selector needs classification.
- Existing `tests/browser-smoke.mjs` currently assumes `#descriptionsBtn` toggles `aria-pressed` and updates `#contextHelpBody`. `tests/unified-studio-browser.test.mjs` asserts the same old button is present. Those must change with the actual product PR, preserving comparable positive checks. The existing tooltip test verifies hover for a particular edge-tab slider, not all families.


## Coverage matrix to create before shipping

| Interface | Existing locator / owner | Required coverage |
|---|---|---|
| Home, Library, project/saved revisions, template destination | `sensory-studio.js` / current WT-023 work | All real choice/settings fields and consequential actions; preserve modal semantics, project versions, focus and rollback |
| Crystal Design | `index.html` classic `data-state` and Crystal side controls | All Simple/Advanced fields and conditional selected-object controls |
| Native Design × 6 additional families | `studio-catalogue.js` `parameterSchema` → `control(schema,p)` | Every visible schema item, family-scoped meanings, units and conditional fields |
| Build and centre contexts | `sensory-studio.js` palette/precision, `index.html` and feature renderers | Geometry, backing, materials, edge finishing and preview vs manufacturing distinctions |
| Pixels | dynamic `data-pixel-*`, profiles and fit panels | Physical LED dimensions, bores, measured fit, backing and print coupons |
| Wiring | dynamic `data-build-wire-*` and classic wire controls | Actual groove vs visual guide, lengths, bends and invalid route diagnostics |
| Mounting | `data-mount-*`, pattern UI, classic mount presets | Real hole sizes, group/ring/grid placement, material clearance, hardware safety |
| Print Centre | `data-print-job`, Cura/printer/material forms, `index.html` print controls | Prepared mesh vs preview, source revisions, printer matching and physical caveats |
| Modals/overlays | `#smsOverlay`, `#smsPicker`, `#pixelProfileOverlay` and other editor roots | Inline help on form controls, no hidden/inert content, preserved dialog focus and close |

## Planned automatic manifest and meaningful-coverage gate

An implementation test (suggested `tests/context-help-coverage.test.mjs`) should:
1. Parse or import actual production `SETTINGS` and the new help registry without relying on a handwritten count.
2. Extract all declared classic `data-state` fields from `index.html`, all actual generator schema fields from the registered seven generators, and hand-classified dynamic selector families from renderers.
3. Require stable matching help IDs for every *applicable setting* with non-empty independently reviewed summary and detail (not identical to label, not generic repeated fallback), plus keyed family overrides where semantics differ.
4. Require explicit, reviewed non-setting exceptions (save, close, decorative, assistive or menu actions) and changes to those exception lists in code review.
5. Run live Chromium DOM coverage across each reachable workspace, family, mode and conditional path, including 390 px and dialog opening. Report `found / explained / explicitly excluded / missing` for each, not a flat percentage that includes hidden template fields.
6. Exercise key identity across project/model switches so a dynamically reused input never shows stale content.
7. Expose missing entries as a test failure in the final implementation PR; planning-only PR intentionally adds **no misleading test**.

## Reproducible source-audit snippet for Codex (diagnostic, not a release test)

Run this in a checkout of the **current** repository from its root. It prints the latest literal classic gaps; it cannot see all runtime conditional native controls, so **never** treat a zero-gap result as completion.

```bash
node --input-type=module <<'NODE'
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8');
const tips=fs.readFileSync('tooltips.js','utf8');
const settings=tips.split('const SETTINGS=')[1]?.split('const BUTTONS=')[0]||'';
const keys=new Set([...settings.matchAll(/^\s*"([^"]+)"\s*:\s*\[/gm)].map(m=>m[1]));
const controls=new Set([...index.matchAll(/\bdata-state="([^"]+)"/g)].map(m=>m[1]));
const missing=[...controls].filter(key=>!keys.has(key)).sort();
console.log(JSON.stringify({controls:controls.size,keys:keys.size,missing},null,2));
NODE
```

This is intentionally a **legacy mapping inventory**, not a specification for the future registry. With the audited main head, it should show **112 classic data-state keys, 113 explicit SETTINGS keys and 15 missing exact names**. Any discrepancy means main has changed: update the issue with the new source evidence, not the code to force old numbers.

### Required runtime coverage report

A real Chromium audit must iterate the actual rendered controls in every reachable workspace/model/mode and produce a machine-readable table (never only a screenshot):

```text
family | workspace | mode | section/dialog | semantic help key | label | short? | inline? | excluded + reason | current visibility
```

Classification: `explained`, `explicitly excluded (not a setting)`, `missing`, `not reachable`. **Absent or generic-template copy is missing, not explained.** Include conditional controls discovered by clicking options, created pixel/mount rows, profile editors and Print Centre forms. Separate a currently hidden field from one with no text. The final shipping gate is **zero missing for all applicable controls**, along with human review of content quality, not a high percentage alone.

### Manual QA script for owner / non-coding agent

1. Choose Crystal → Design; turn both preferences **off** and confirm there are no transient or inline explanations but ordinary warnings remain. Turn Hover on: hover and then move the pointer into a tooltip; Escape must close it. Focus the same field with Tab; Help appears without changing its value.
2. Turn Detailed on: explanation appears **below the setting**, not in `#contextHelp` or a right floating card. Change the model parameter, switch to another workspace then back and verify the control value and explanation persist.
3. Switch to a different native family (Gear then Wave then another family). Explain identically named **Depth** controls differently when their physical meaning is different; verify long text follows the correct field when sections rebuild.
4. At a 390 px viewport, touch-help and both checkboxes are operable; at 400% browser zoom, normal explanatory prose reflows. Test high-contrast light/dark text, pointer placement and reduced-motion preference.
5. Save/reload a project containing seven models, existing print jobs and measured pixel profiles. Toggling help must not update any project value, job status, model ID, last saved revision or private vault hash.
6. Open/close the pixel profile editor, mounting patterns and print controls; no duplicate/stranded inline help or trapped focus. Run global search and Enter to navigate to the actual control.

## Companion automated source inventory (separate QA PR #156)

A focused **test-only** utility now exists in [PR #156](https://github.com/connorturansky-svg/crystal-forge/pull/156): `scripts/wt024-help-audit.mjs`, `tests/wt024-help-audit.test.mjs` and the `npm run help:audit` command.

**Only run it on a branch that actually contains #156**; the command does not exist on the base main until that QA PR is approved/merged or deliberately incorporated. It reports classic exact legacy gaps, literal native schema keys and likely dynamic selectors, in deterministic JSON, **without changing a project or any DOM**. Static CI runs the parser regression; the separate `--fail-on-legacy-gaps` argument is deliberately *not* in CI because the existing app is known incomplete.

This is a productivity tool, **not** the release gate. Codex must still supply a runtime Chromium control census, human-reviewed detailed copy and the final zero-missing gate for all visible settings and relevant dialogs. Never count an attribute selector as an actual setting until its rendered role is inspected.

## Risk register

| Risk | Mitigation |
|---|---|
| Tooltip is not hoverable | Correct pointer handling with W3C's Escape/hoverable/persistent lifecycle; add real Chromium hover-crossing test |
| Bad label-to-control match | Semantic IDs from `data-state`, `data-model-param` and scoped dynamic selectors, not relying on DOM-adjacent text |
| Generic or repetitive explanations | Editorial acceptance checklist and curated examples; explicit uncovered state rather than claim success |
| Growing all workspaces enormous | Render in-flow detail only for active/visible controls, no permanent all-app mutation or giant reflow |
| Pointer/focus conflicts | Preserve original label, error `aria-describedby` chain, keyboard shortcuts and focus when help toggled |
| Pages release mistakenly advertises planned UI | In-app Help/What’s New/CHANGELOG update only with working implementation; documentation hub clearly marks planned |
| WT-023 file collisions | Don't alter #147/#148/#151 or #149-owned status files; fresh branches and changed-file check |
| Overconfident print guidance | Verify control semantics, avoid unsupported safe defaults, keep print fit under issue #10 |

Related: [WT-024 issue #152](https://github.com/connorturansky-svg/crystal-forge/issues/152) and [main blueprint](WT024_HELP_SYSTEM_BLUEPRINT.md).
