# 014 — Pixel Model Maker: Compact Header, Left Design Panel and Bottom Model Rail

> **Status:** OWNER-REQUESTED next Codex UI milestone. Owner directly asked for the next prompt after providing screenshots and specific layout feedback. This is an implementation **handoff**, not evidence that Codex was launched.
> **Issue:** [WT-014 / #55](https://github.com/connorturansky-svg/crystal-forge/issues/55).
> **Planning branch:** `planning/prompts`; full immutable approved 40-character commit SHA pinned on Issue #55.
> **Verified source baseline:** main `26023f595a5c67cbe061be59816bcc2c483524fa` after merged WT-012 [PR #53](https://github.com/connorturansky-svg/crystal-forge/pull/53). Fetch latest main before implementing.
> **Dependency/coordination:** WT-013 optical inspector [Issue #54](https://github.com/connorturansky-svg/crystal-forge/issues/54) is an approved separate task with no implementation PR or issue claim observed at the time this brief was authored; **if WT-013 has started by execution time, do not implement concurrent overlapping `studio-v3.js`/shell edits**. Wait for merge or explicitly coordinate non-overlap. WT-011 [Issue #51](https://github.com/connorturansky-svg/crystal-forge/issues/51) modular splitting remains LOW/ON HOLD, unchanged. Jordan's external SVG importer [PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) remains open/draft, independent.
> **Owner & PR:** Connor's Codex, one `feat/WT-014-compact-shell` branch from then-current main and **one draft PR**; no auto-merge, direct push to main or Pages deploy. Do not involve other contributors or produce multiple conflicting UI branches.
> **Priority:** Direct usability feedback from screenshots; this should be a **focused layout task**, not another major fabrication/geometry phase.

## 1. Owner's supplied UI feedback (authoritative)

The owner saw the current unified Studio at `v0.16.0-dev.13` and explicitly requested:

- “the more and panels boxes should not be needed, the more options should be always available on the top row”
- “all of this title/info stuff can be way reduced. look into how making it smaller”
- “call it Pixel Model Maker, version number appears under it”
- “pannel option is not needed, just let me click and drag panels bigger and smaller, and have a lil icon at the top of each panel, like hamburger menu that makes em bigger or smaller”
- “in the third image, this slider to make the bottom menu bigger or smaller is an insane choice”
- “move those design choices back to the left hand side, and then the model rail is on the bottom instead”

**Treat these as the target experience, not vague design inspiration.** The resulting UI should feel like a clean creative tool: controls to the **left**, a large uninterrupted 3D model in the **centre**, contextual precision on the **right**, and **models along the bottom**. The top should be small, readable and direct.

## 2. Verified implementation state: avoid duplicating/rebuilding

- `sensory-studio.js::setupShell()` creates a **left vertical `.sms-rail`** containing `#smsTabs` and `#smsNew`, a centre `.sms-centre` containing `.viewarea`, the `input.sms-split[aria-label="3D viewport height"]`, and `.sms-palette` (the **Design choices** area); a right `.sms-settings` contains search plus legacy `.left` and `.right` regions.
- The same function creates `details.sms-more` summaries **More** and **Panels** and currently puts Simple/Advanced/theme/help/descriptions/changelog controls in More. The Panels dropdown contains rail/settings/palette hide/toggle controls and range sliders for side panel widths. Stored preferences are under `wt-workspace-panels-v1`; the centre split has a separate `wt-viewport-height` key.
- `sensory-studio.css` defines `.sms-centre` as viewport + 22 px range slider + lower palette; the layout uses `--sms-rail-width` and `--sms-settings-width`, and mobile stacks rail/centre/settings. The `.sms-palette` contains actual live Design/Build chooser content, not static decorative text.
- `index.html` currently displays `Sensory Model Studio`, `.version` with dev version, a `#projectName` label and the original `#smsProjectTitle` edit field relocated by setupShell. Do **not** alter the repository name, persisted project type/schema, library identity or real file/export prefixes as part of this visible rename.
- `tests/unified-studio-browser.test.mjs` currently **tests the controls the owner wants removed**, including `#smsToggleRail`, `summary Panels`, `#smsToggleSettings`, `#smsTogglePalette`, and the 3D viewport-height slider. These assertions must be **replaced with equivalent functional new-layout interaction tests**, not blindly deleted. It also tests new model, live Build pixel fitting, Library, Print and saved state, which must survive.
- The old `studio-v3.js` already has actual Crystal renderer/camera and active UI bindings. Keep these mounted and working; avoid touching geometry, Workers, Print Centre internals or established source-of-truth state.

## 3. New layout architecture — a clear minimum, not a docking system

Use the **existing single unified Studio shell**, moving existing DOM nodes and preserving handlers rather than cloning controls or maintaining two separate layouts.

### 3A. Compact product header

- Display app branding as **Pixel Model Maker** (not Sensory Model Studio) in the visible application title and relevant page/title/header accessibility label.
- Put the existing **actual app version** in small secondary text **under** the product name. Do not hardcode a fake version or change the release number just for appearance. For this UI release, bump version once according to the release gate; keep changelog and in-app What's New consistent.
- Reduce top row heights/padding and visual clutter significantly at desktop, e.g. target visually compact ~40–54 px combined product/action content where reasonable, with a restrained workspace nav. No oversized “Development preview” badge.
- Keep the real editable project name and save state present but compact and secondary: one clear project name input, truncation on narrow screens, exact accessible label and full text on focus/hover, sensible persistence; do not silently rename a stored project or discard “Recovered Crystal Forge” legacy values.
- Preserve meaningful preparation/result status in small readable status area near viewport without giant pill overlays or forcing the viewport down. Make keyboard/screen-reader status clear; don't permanently hide errors.
- **Remove** global `More` and `Panels` details. Give existing essential actions permanent direct access in top area: Home, Design/Build/Print, Library, New model, Save/Open, Undo/Redo, Simple/Advanced, theme, Help, Descriptions and What's New (plus current Reload if supported). Reorganise as sensible groups and short labels/icons, **not** another overflow menu. For narrow view, let groups wrap or horizontally scroll with obvious visible focus; no unreachably clipped/hard-hidden actions.
- Avoid duplicating “Print” in several different nav locations with contradictory behaviour. Keep current workspace navigation and current Print Centre operational.

### 3B. Body grid

On desktop (e.g. 1440×900) use an explicit three-column workspace, and **two rows**:

```
┌──────────────────────────────────────────────────────────────┐
│ Pixel Model Maker              global actions  workspace    │
│ v0.16.0-dev.X                compact project/save status     │
├─────────────────┬──────────────────────────┬─────────────────┤
│ LEFT            │  CENTRE                  │ RIGHT           │
│ Design choices  │  3D MODEL                 │ Precision       │
│ visual presets  │  orbit / focus            │ controls/search │
│ contextual edit │  status / camera          │ settings/report │
│ legacy controls │  *no lower design slider* │                 │
├─────────────────┴──────────────────────────┴─────────────────┤
│ BOTTOM HORIZONTAL MODEL STRIP  [model] [model] [+ New]       │
└──────────────────────────────────────────────────────────────┘
```

- **Left** panel contains **actual** `.sms-palette` (Design choices / Build tools) AND the applicable original `.left` Crystal/generic controls, sequenced appropriately. Keep the shared `#smsEditor` inside the live legacy left subtree so the `.sms-sidebar-mode` handlers still operate. Avoid nested scroll traps where possible.
- **Centre** contains only the `.viewarea` renderer (and current `#smsOverlay` for Home/Library/Print where applicable), not a lower palette.
- **Right** contains the existing search and precision/settings/report original `.right` (not both unrelated left/right legacy control trees). Keep whichever settings currently provide exact values and validation.
- **Bottom strip** contains the existing `#smsTabs` + `#smsNew`, moved out of the left rail. Cards/tabs have clear selected state, model name, distinct family tint/thumbnail where already cached, close action and keyboard support. Scroll horizontally; model count cannot force a second giant column or huge panel height. Maintain current Create Model picker and reopen/close semantics.
- Remove `input.sms-split[aria-label="3D viewport height"]`, `wt-viewport-height` driven layout and the lower-centre `--sms-view-height` grid entirely. **No replacement giant range slider.**
- If resizable bottom strip height is needed, use a quiet edge grip at bounded height (min 46, max ~140 px) with direct pointer drag/keyboard resize. Otherwise fix an appropriate compact height. Do not reintroduce large lower-middle Design choices panel.

### 3C. Direct panel sizing and compact per-panel controls

- Add **pointer-draggable visible boundary handles** between LEFT↔CENTRE and CENTRE↔RIGHT, using either existing small splitters adapted to new grid or minimal purpose-built handlers. Pointer down/move/up with `setPointerCapture`, clamped widths, nonnegative central viewport minimum, no accidental viewport canvas drag while resizing, no weird jump on first drag, and proper cleanup.
- Also support keyboard resizing (ArrowLeft/ArrowRight, Shift for larger step, Home/End optional) with role `separator`, `aria-orientation=vertical`, accessible label, current/min/max values, visible focus and small tooltips. Use CSS `col-resize` cursor, not a new sliders panel.
- Each SIDE PANEL has a compact header icon, e.g. `≡`, `chevron` or `panel-left-close`, that toggles **normal ↔ compact/collapsed**. The icon must have accessible title/label, `aria-expanded` and an obvious restore affordance even when collapsed. **Do not** create another global Panels manager.
- Persist left/right width and collapse state under a clear `v2` preference key; **safely migrate** meaningful legacy `wt-workspace-panels-v1` settings (railWidth should not be incorrectly interpreted as new bottom model rail height; settingsWidth can seed new right width), and gracefully ignore obsolete `wt-viewport-height`. Nothing should mutate local models or delete historic autosaves.
- Clamp saved widths to viewport changes and keep minimum usable central viewport (e.g. 420 px at desktop). On narrow viewport, prefer clean stacked/panel-drawer behaviour with visible restore and controls, rather than squeezed 3 columns. The model strip remains reachable without covering the viewport.
- Don't reimplement an entire docking framework; no dragging panels to arbitrary locations or unlimited panels. Exactly left/centre/right/bottom.

### 3D. Home, Library, Print and special modes

- The overlay modes `Home`, `Library`, `Print Centre` should still behave as before; the bottom rail may remain visible or collapse appropriately on full-screen overlay, but should not trap focus or break navigation.
- Maintain `?layout=legacy` classic mode; the UI rename may apply globally if safe, but don't silently remove classic bindings. Preserve `sms-focused` full-screen camera mode and Escape.
- Build must display the existing real pixel palette and live 3D selected fitting interactions on the LEFT, without duplicate controls or destroying the current Design controls. No screens should render zero-height/missing canvas due to reparented nodes.
- Preserve saved project title, project switching, model-tab switching and model history even when collapsing a panel or resizing during a preparation. Rendering should resize to its actual central canvas area and maintain camera target/orbit.

## 4. User-visible interactions and acceptance matrix

**WT014-01 — Header/name:** On desktop, visible product name exactly `Pixel Model Maker`; real version underneath smaller than the name; top/project/status footprint visibly reduced vs baseline screenshot. Project name remains editable/saved. No obsolete “Sensory Model Studio” visible in active branded header.

**WT014-02 — No overflow:** No visible `More` or `Panels` dropdowns. Existing top actions **directly available** via visible top controls at desktop; keyboard and a narrow/mobile viewport can still reach *all* actions without opening a hidden overflow clone.

**WT014-03 — Left design:** Start a fresh Crystal and native Tile/Gear; the **Design choices** and contextual Build controls actually render in the **left column** with functional parameter/preset/edit buttons. They no longer occupy area under the 3D viewer. Repeated model switch doesn't duplicate handlers/DOM or reset model values.

**WT014-04 — Centre:** No `3D viewport height` range slider and no old `.sms-split` in DOM; centre viewer fills its workspace area, stays correctly sized after resizing/collapse/model switch, with preserved orbit target. Focus 3D and section/camera controls still work.

**WT014-05 — Bottom rail:** Tab strip is horizontal along bottom, selectable, scrollable, keyboard reachable and has working new/close/reorder actions. Create 4 model families, switch, close and reopen from Library without losing data. Small screens show tabs, not an inaccessible off-screen vertical rail.

**WT014-06 — Direct resize:** Real pointer drag at both vertical separators increases/decreases side panel widths within caps; central renderer remains usable and canvas pointer orbit does not activate during resize. Reload preserves dimensions. Keyboard Arrow keys change splitter width too.

**WT014-07 — Per-panel icons:** Header controls collapse/expand left and right independently, give a visible restore path, preserve panel scroll and model state, and expose correct `aria-expanded` and usable labels. No dead control when a panel is minimized.

**WT014-08 — Layout migration:** With legacy `wt-workspace-panels-v1` and `wt-viewport-height` set, loading the app succeeds; valid right width is used safely where sensible; obsolete palette/rail visibility values don't hide the new controls; no project/Library save records are overwritten. With empty, malformed, huge and old stored sizes, layout remains sane. New layout persists.

**WT014-09 — Functional workflows:** Save/Open/Reload, Help/What's New/theme/descriptions, Simple/Advanced, Home/Design/Build/Print, Undo/Redo, tabs, Pixel Builder add/select/drag/reorder and Print Centre current-model multi-job queue still work after DOM relocation. Crystal Clusters are the main benchmark. No duplicate hidden controls.

**WT014-10 — Responsive/visual:** Screenshots at ~1440 px desktop and 390–430 px narrow viewport show compact header, left controls, large viewer, right precision (accessible), bottom model tray, collapsed/restored states. No horizontal overflow clipping important controls, no browser console errors or overlapping fixed popups.

**WT014-11 — Tests:** Replace obsolete `tests/unified-studio-browser.test.mjs` tests for More/Panels/viewport slider with *positive* pointer/keyboard resize and panel/menu tests. Run `npm run test:static`, real Chromium browser tests and normal hosted exact-head CI. If no geometry changed, avoid rerunning expensive local full Manifold loops; report hosted fabrication CI if triggered rather than falsely claiming it passed.

**WT014-12 — Delivery:** One app version increment, consistent `CHANGELOG.md`, in-app What's New, brief `docs/AI_HANDOVER.md` and relevant `docs/ROADMAP.md`/testing notes. PR links exact-head runs, real screenshots, migration/performance risks and known limitations. No merge/deployment without owner review.

## 5. Scope, implementation approach and stopping rule

Prefer **`sensory-studio.js`, `sensory-studio.css`, `index.html`, existing `tests/unified-studio-browser.test.mjs`**, plus mandatory release/handover files. Keep `studio-v3.js` changes negligible, only if renderer resize integration truly requires them. Do not change any of these core modules for this task: `geometry-v3.js`, `fabrication-v1.js`, `studio-model-worker.js`, `pixel-string-routing.js`, `studio-native-wire-routing.js`, `cura-profiles.js`, `studio-vault.js`, `studio-documents.js` storage schema, nor `svg-import/**`. No new dependencies or UI framework.

This is a **substantial practical UI patch**, but **not** a complete redesign: precisely compact title/header/actions, left Design/Build, centre unobstructed, right precision, bottom models, direct resize and panel collapse. Minimise CSS cascade duplication; remove obsolete rules/handlers rather than leaving dead old sliders and hidden menus. Good mobile usability is required, but no speculative extra docking features or desktop electron app.

### Stage A — inspect/coordinate

1. Fetch latest main, check Issues #54 and #55 and open PRs. If WT-013 has already been claimed or a PR modifying overlapping files exists, **do not work in parallel**; wait for merge or explicitly coordinate.
2. Read `AGENTS.md`, current `docs/AI_HANDOVER.md`, this exact pinned brief, actual shell JS/CSS/header and browser test. Record only relevant constraints, do not scan entire historical roadmap.
3. Capture baseline UI screenshot for desktop/narrow; use exact source version. Confirm preserved `?layout=legacy` path.

### Stage B — move existing DOM correctly

4. Rename product header, collapse top chrome, remove overflow dropdowns and rehome actions.
5. Reparent existing live `.sms-palette`, legacy `.left` and `.right` once, restructure grid and move `#smsTabs/#smsNew` into bottom model rail. Destroy old `.sms-split` and its storage usage.
6. Verify all existing controls still find their IDs. Fix CSS for top/bottom clipping and responsive layout. The active model viewer should not rebuild on panel movement.

### Stage C — direct resize/state

7. Implement side boundary drag handlers and keyboard separators, per-panel collapse icons, safe v2 migration/persistence and viewport clamping. No global panel manager and no unintended camera pan during resize.
8. Verify the bottom rail tabs and drag/switch/close navigation.

### Stage D — test and handoff

9. Update Chromium suite to assert each new feature via *actual* clicks, keyboard and pointer drag with snapshots for desktop, expanded/collapsed, Build/Print and narrow.
10. Static and hosted CI, version/changelog/What's New, handover, one draft PR.

**Stop rule:** If responsive layout or legacy compatibility reveals complex app coupling, protect current Design/Build/Print **working controls first**; keep scope bounded, document a specific remaining visual refinement in the draft PR, **do not** introduce a new competing UI system or alter geometry to make this UI pass.

## 6. Exact Codex contract

When the owner runs this prompt in Codex, claim Issue #55:

`CLAIM WT-014 — @connorturansky-svg Codex — feat/WT-014-compact-shell — Pixel Model Maker header/panels/bottom model rail`

Branch from latest main:

`feat/WT-014-compact-shell`

Open one **draft** PR titled:

`[WT-014] Pixel Model Maker compact shell and bottom model rail`

PR description required metadata:

```
Task issue: #55
Approved spec: prompts/014-pixel-model-maker-layout.md @ <FULL_40_CHARACTER_PINNED_SHA_ON_ISSUE_55>
Scope: Pixel Model Maker compact product header, direct top actions, left Design/Build, centre viewer, right precision, bottom model rail, panel edge resizing and collapse icons.
Related PRs/duplicates: WT-012 #53 merged; WT-013 #54 separate task (check conflict); WT-011 #51 ON HOLD; WT-003 #37 SVG isolated.
Test evidence: <actual exact head SHA, latest hosted static/Chromium checks, current screenshot artifacts and direct click/drag results>
Handover: docs/AI_HANDOVER.md
Risks: <layout preference migration, mobile clipping, any deferred edge cases>
```

No direct push to main, no merge/deploy, no editing the approved planning branch from the implementation PR, no assumptions that screenshot visual review alone proves user interaction. Finish with draft PR and genuine test evidence.
