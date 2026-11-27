# WT-023C2 — Compact Models drawer and toolbar refinement
**Implementation packet | 27 November 2026 | Owner dispatch for Codex | Draft, not implemented**

## Executive summary and authority

The 26 November owner refinement is a follow-up to merged #164, #166 and #169, not another drawer implementation. The owner requests much smaller thumbnails, names and actions, less wasted card space, a fully scrollable drawer without a header infringing on the scroll area, and Hover Notes / Detailed Explanations tick boxes styled to fit the toolbar. Earlier approved constraints: drawer collapsed by default, limited to the centre 3D viewport, approximately one-third of its height when expanded, genuine model thumbnails, adjustable thumbnail size, compact responsive three/four-wide layout where room permits, no deletion of saved models from Close. Keep the merged independent help behaviour from #163/#174. Preserve #172/#175 Library experience, #181 grip tools, all seven builders and the legacy route.

The product owner approved preparation of this dedicated PR on 27 November. This packet proposes numeric layout targets and engineering choices; they are not previously approved exact pixel measurements. Codex may tune them using visual evidence while retaining the intent and acceptance below. Do not claim the UI is already built or merge this specification alone as feature delivery.

**Verified starting point:** main was identical to #175 merge commit f50a424faf1a3e333aabcc5c9062246ba0dc9074 at preparation. Re-fetch before implementation. #182 is a separate documentation/handover lane; #176 owns appearance and viewport Layers, #177 resources/backups, #178 software assurance, #179 fabrication. Do not change their branches; coordinate shared files and stacking. #140 is closed historical acceptance, not permission to restart #164. #175 is merged, not a new assignment. No automatic merge or deployment.

## 1. Research and design rationale

| Reference | Pattern observed in official documentation | Apply here | Deliberately omit |
| --- | --- | --- | --- |
| [Blender Outliner](https://docs.blender.org/manual/en/5.3/editors/outliner/interface.html) | Compact object navigation, selection synchronized with viewport, filterable list, action columns | Name-first compact rows, predictable selection and secondary actions | Object hierarchy, new collections, visibility toggles in Models drawer |
| [Unity Project window](https://docs.unity.com/en-us/engine/6000.3/manual/unity-editor/editor-windows-views-reference/project-view) | Icon size slider and list presentation at minimum, layout variants | Five density positions from compact horizontal rows to comfortable previews | Second project store, folders or separate mode toggles |
| [Unreal Content Browser](https://dev.epicgames.com/documentation/en-us/unreal-engine/content-browser-settings-in-unreal-engine) / [bottom docking](https://dev.epicgames.com/documentation/en-us/unreal-engine/content-browser-in-unreal-engine) | List/tile views, thumbnails in five sizes, bottom-docked browser | Compact card grid, single drawer scroll area, sizes under user's control | Asset management, import, new content navigation |
| [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) / [focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum) | 24 CSS px minimum target or appropriate spacing; focus must not be fully hidden | Compact icon artwork with adequate hitboxes; visible focus; test at zoom, keyboard/touch | Tiny inaccessible hitboxes or relying only on hover |

Research consulted 27 November 2026. These are design references, not code dependencies or a claim of full WCAG conformance. Do not copy proprietary assets. The app's existing theme and layout are authoritative.

## 2. Current source audit (read on main)

- `src/ui/model-drawer.mjs`: isolated `createModelDrawer`, `modelRows`, `filterRows`, `reorderOpen`, `normaliseDrawerZoom`, `createPreviewQueue`. Current sizes [card min rem, thumb rem] = [13,3.25], [15,3.75], [18,4.5], [21,5.25], [24,6.25]. Default 3; preference key `crystal-forge.models-drawer.zoom.v1`. Slider changes CSS properties; no document writes.
- `src/ui/model-drawer.css`: .md-drawer absolute bottom, z-index 6; .md-open height 33.333%, min-height min(9rem,100%); .md-body flex; .md-controls max-height 50% and overflow auto; .md-grid also overflow auto. The two scroll areas and fixed header reduce useful model space. Every .md-card stacks pick and action row. Thumbnail 4:3, separate status/Retry; global button CSS may inflate height.
- `sensory-studio.js`: imports drawer and queue; `renderTabs()` updates many non-drawer responsibilities before delegating to drawer.update(). Keep these responsibilities. `renameDrawerModel`, `requestModelName`, `showModelInfo`, `modelPicture` own existing interactions and genuine image handling. Do not move document operations into UI module.
- `index.html`: .contextual-help-preferences styles around lines 195–196 and markup near 223; existing #hoverNotes and #detailedExplanations are real inputs in a labelled group next to #helpBtn. Current label min-block-size 28px. Reuse theme tokens and utility-control appearance. Check final DOM after Studio shell mounts, not only static HTML.
- `tooltips.js`: binds both existing checkbox IDs and storage; preserve independent preference, migration, cross-tab updates and critical warnings. `contextual-help-copy.js` supplies authored help; reuse existing registry, do not duplicate.
- `tests/wt023-model-drawer-browser.mjs`: real seven-family previews, naming, info, reorder, close, save/reload, retry, 105 entries, responsive assertions and CSS zoom. Existing assertions explicitly require action row below pick and .md-grid as scroll root. Replace these two structural assumptions with stronger behavioural/geometry assertions, not deleting coverage.
- `tests/wt024-help-browser.mjs`: existing checkbox IDs, four modes, storage/cross-tab and drawer density controls, touch. `tests/studio-documents.test.mjs`: existing drawer document contracts. `tests/wt023b2b-browser.mjs` and compact Library tests protect merged project workflows. See package.json for actual commands.

No live screenshot or browser render was executed in this preparation session. Reproduce owner-reported deficiencies in the real running editor and capture BEFORE evidence before editing CSS. Source paths above verified; any historical source anchors in old handover are subordinate to current code.

## 3. Proposed experience / construction drawings

Collapsed (only centre viewport, no permanent full-width rail):
```text
┌──────────────────────────────────────────────────────────────────┐
│                         3D viewport                              │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ ☰ Models (12)  Project : Crystal A                     + New  ▴  │
└──────────────────────────────────────────────────────────────────┘
```

Open at compact density, illustrative (not actual screenshot):
```text
┌──────────────────────────────────────────────────────────────────┐
│                         3D viewport                              │
├──────────────────────────────────────────────────────────────────┤
│ ☰ Models (12)  Project : Crystal A                     + New  ▾  │
│ ┌─ one normal-flow scroll surface ────────────────────────────┐ │
│ │ Find an open model…                    Thumbnail size ━●━ 2 │ │
│ │ [img] Crystal A ✓ ⋯ ×   [img] Wave B ⋯ ×   [img] Gear C ⋯ × │ │
│ │ [img] Cap D       ⋯ ×   [img] Tile E ⋯ ×   [img] Pod F  ⋯ × │ │
│ │ [img] Model G     ⋯ ×   [img] Model H ⋯ ×   [img] Model I⋯ × │ │
│ │                 additional rows, help and error states ↓    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

Toolbar (same native independent checkboxes, unified appearance):
```text
[Simple | Advanced] [☀ Light] [Info] [☑ Hover Notes] [☐ Detailed Explanations] [Save] [Open]
```
The above deliberately keeps a thin persistent disclosure/New strip outside scrolling, in normal flex layout, not an overlay. All expanded contents including search, density and authored inline help belong to one vertical scrolling surface. Header must never cover or steal a second scroll area from cards. If very short viewport, allow controls to scroll rather than pinning them; never hide the collapse action. This interpretation reconciles whole-panel scrolling with persistent dismissal.

### Density and responsive behaviour
Proposed starting tokens (CSS rem or em so they scale; CSS px equivalents illustrative at 16px root):
| Position | Label | Thumbnail width | Minimum tile width | Normal desktop row target |
| --- | --- | --- | --- | --- |
| 1 | Extra compact | 24px | 140–152px | 32–40px |
| 2 | Compact | 32px | 156–168px | 36–44px |
| 3 | Standard | 40px | 176–192px | 44–52px |
| 4 | Large | 52px | 208–224px | 56–70px |
| 5 | Extra large | 64px | 240–256px | 64–84px |

Keep 4:3 true image aspect (contain, never crop). Use ~12–13px readable inherited text at normal desktop size, compact gaps and margins, not low-contrast tiny text. Aim compact tiles at least 25% shorter and 25% narrower than existing typical tiles measured in same conditions; report actual before/after geometry and count of fully visible tiles at normal viewport with help off. At centre content width 640px, level 1 should fit four columns if hitboxes and readable names permit; at ~480px aim three; narrow widths fall back naturally. For compact tiles use select/thumbnail/name + compact menu + explicit close in a single row; if space genuinely cannot fit, actions flow into second row with no overlap. At large sizes a second row is fine. Touch/coarse pointer may reduce column count to maintain 44px preferred hitboxes. At 200% zoom allow extra wrapping/row height rather than clipping. Long names ellipsise horizontally with full accessible name; Info supplies full text even with Hover Notes off. Do not use vertical per-letter wrapping. Use clear active indicator (not colour alone), preparing status, linked state as appropriate. Normal text should meet 4.5:1 contrast; UI boundaries/focus 3:1 where applicable. Targets at least 24 CSS px in compact pointer mode (prefer 28–32), 44px coarse pointer when feasible.

Retain existing five-position preference key and ordinal compatibility, default 3 for new or invalid values unless actual measured UI suggests an explicitly documented change. No silent reset of stored level; zoom changes presentation only. Use labels/aria-valuetext for levels, preserve slider Home/End/arrow keys. No new list mode preference required; smallest size is list-like automatically.

### Action rules
- Keep selection and close directly available. Prefer one consistently visible More actions button per model for Rename and Info at compact density; an inline equivalent at wider density is acceptable if no duplicate focus targets. Use a small non-modal disclosure with native buttons or an existing accessible action helper from Library where suitable. Do not introduce a full custom ARIA menu without implementing its semantics.
- Close action accessible name must unambiguously mean closing open model, not deleting saved model. Do not nest buttons. Menu opens by click/tap/keyboard, not hover only; Escape closes it first, restores visible trigger, then next Escape closes drawer and restores toggle. One disclosure open at once, dismiss on outside click/selection/project change; ensure focus not lost on rerender. Do not portal a menu above warnings or let it get clipped by scroll; an in-flow expansion is acceptable.
- Retain real Info dialog, rename and linked-source guard, Delete/Alt+arrow/arrow/Home/End interactions, drag reorder, selection staying open, New and filter behavior. No new destructive action. Retry and human-readable preview failure reasons remain directly reachable even at minimum density. Avoid hiding critical status inside hover-only help.

## 4. Engineering plan

### A — baseline and ownership
Fetch origin/main and the existing draft branch, read AGENTS.md and docs/AI_HANDOVER.md, verify #182/#176 status, confirm clean worktree. Continue this PR branch, not a new issue/PR. Capture current screenshots and DOM geometry: actual center width/height, scroll containers, visible card count, card/thumbnail dimensions, keyboard focus and toolbar appearance with help off/on. Reproduce long names, 105 open entries and viewport shrink. Note actual failures; do not invent them.

### B — one bounded scroll surface
Use a column flex/grid root with disclosure row in normal flow, then .md-body as the sole scroll container (min-block-size:0; flex:1; overflow-y:auto; overflow-x controlled without hiding focus; overscroll-behavior:contain). .md-controls and .md-grid use natural height, no independent overflow/max-height. Ensure hidden attribute remains authoritative and no controls focusable when collapsed. Keep drawer viewport-relative height ~1/3 and cap within actual host; at short heights retain reachable disclosure and scroll content. No position:fixed spanning sidebars. Use logical properties, theme variables, minmax(0,1fr), and repeat(auto-fill,minmax(min(100%,var(--md-card-min)),1fr)); consider container queries using actual drawer width, not window width. Use CSS fallback. No global scrollbar or button resets.

Update all JS scroll references (current grid.scrollTop, search/project change, restore scroll, focus fallback) and IntersectionObserver root to the single actual scroll element. Check observer cleanup/disconnect and stale epoch behavior. Preserve scroll on selection/reorder as appropriate; clamp/reset on filter/project switch; ensure focussed row visible after keyboard move. Avoid scrolling the page when operating drawer. Only render genuine previews when cards are near/in view; retain current cache key/source/revision, serial queue, byte/count bounds, image error invalidation and stale guard. No forced synchronous rendering or rebuild on density input. Do not add virtualization unless measured evidence justifies it; 105 cards already supported. If redraw causes pending previews to get deferred or wrong, reproduce and fix narrowly, never fake thumbnails.

### C — compact tiles
Use CSS variables for tile/thumbnail/gap/padding; make smallest mode meaningfully smaller in actual pixels. Separate select and action controls; flex/grid shrink correctly with min-inline-size:0. Ensure no action collisions, no clipped focus rings, no tiny target exceptions. Keep #smsModelsDrawer, #smsNew, .md-* and data-action contracts where practicable; adapt callers/test helpers intentionally if changed. Preserve model-tab stable IDs, action labels, project qualification and current selection. Use existing callbacks; UI state stays outside authoritative project/undo/print documents. Test menu dismissal and keyboard/touch before proceeding.

### D — toolbar
Keep #hoverNotes and #detailedExplanations native labelled checkbox inputs, same group and DOM binding. Style labels to align with adjacent utility buttons: matching height, radius, padding, gap, border, theme-aware checked/unchecked/hover/focus/disabled states. A native checkbox remains visibly checked, not just background colour. Do not replace with duplicate toggles or custom roles. Preserve label click, Space, browser storage/cross-tab and fresh defaults from #174; no reset or help registry changes. Responsive toolbar wraps in normal flow, never horizontal page overflow. Check Simple/Advanced, all four preference combinations, legacy if reachable, and actual mounted shell. Keep Info as one button, not reintroduce separate Help/What's New. Ensure added controls use shared Help without recursively describing themselves.

### E — integration, QA and docs
Run focused tests first, then full suites. Reconcile latest main (especially #182 docs, #176 if landed), retain both independent changes. Update the original drawer handover and docs/WT025_READABLE_USER_GUIDE.md with final behaviour; update docs/PROJECT_STATUS.md and docs/AI_HANDOVER.md with actual head/CI links and outstanding owner review. Update CHANGELOG.md and existing generated release metadata/What's New via repository's normal release tooling only after runtime changes; choose next version after fresh main, preserve .35.52 and subsequent entries. Use scripts rather than inventing release IDs. Planning-only commit has no product version bump. Keep historical #140 and #169 evidence intact. No Pages deployment or merge.

## 5. Test and visual acceptance matrix

| Area | Required acceptance / evidence |
| --- | --- |
| Layout | 390, 768, 1024, 1440, 1920 CSS px viewport; actual center width, short-height desktop e.g. 1366×768 and small-height mobile; focus mode, sidebar changes; drawer bounded to .viewarea, collapsed initially, height roughly 1/3 on ordinary desktop; no page horizontal overflow |
| Density | all 5 levels at normal desktop, min/max at every viewport; report measured tile width/height, thumb size and fully visible card count vs baseline; 3/4 columns where intended; 200% actual Chromium page zoom or documented equivalent plus text scaling; no clipping/vertical wrapping |
| Scroll | with 105 entries, wheel/touch/keyboard through same scroll container from search and controls to last card; no nested independently scrolling body controls/grid; first/last card and all actions visibly reachable; scroll not obscured by header; long help expands in same flow; focus scrolls into view |
| Input | keyboard Enter/Space, Tab/Shift+Tab, Escape priority, native slider keys, selection, rename/cancel, Info/close, reorder including Alt+arrows and drag, Delete, focus restored after close/rename/filter; touch selection/menu/close; measured targets and focus bounds |
| State | 0/1/9/105 open models, duplicate names, Unicode/long names, active and preparing status, linked rename guard; project switch/reset; no saved model deletion; verify storage/IDs/jobs/cache unchanged by zoom/search/open/close disclosure/help; only existing authorized action mutations; reload persists zoom/help; invalid and blocked storage fallback |
| Preview | seven real distinct source images, no stale source after edit, genuine saved/revision preview, missing/invalid source reason and Retry, first/last cards at scroll and filter, observer rooted in real scroll container, no duplicate synchronous work; bounded cache preserved; use counters/test instrumentation if needed, not production logging |
| Help | all four combinations, new defaults, existing preferences, cross-tab sync, label click and Space, touch notes, critical validation/warnings preserved, Info navigation, both themes, legacy if supported; checkbox bounds and contrast |
| Regression | Library B2a/B2b destinations, project snapshots, print prepare and actual STL/3MF downloads, native precision, grip gizmos, edge finishing, Layers compatibility if merged; no geometry changes |
| Performance | same browser/machine baseline, record 105-card open/filter/scroll timings and preview activity; target no meaningful regression (investigate >20% median slowdown over repeated samples); no page errors, repeated scroll/zoom and open/close, check detached observer/DOM growth |

Use real Playwright editor, not static mockups as acceptance. Extend existing `tests/wt023-model-drawer-browser.mjs` and `tests/wt024-help-browser.mjs` or add a focused test wired into package.json. Replace old action-row and .md-grid scroll assumptions with geometry assertions that action targets do not intersect selection text/other actions, remain inside tile and visible, and all scroll paths work. Never weaken prior seven-family/105-item/rename/export guarantees. Include before and after screenshots in qa/ or workflow artifact (avoid unnecessary tracked binaries). Suggested captures: baseline compact, compact and standard at 1440, min/max at 390/768, 200%, both themes, all-help long scroll, last card, toolbar checked/unchecked and focus, failure/Retry, touch. Inspect screenshots manually in session and report any remaining defect. Numeric targets are proposed, not proven until measured.

From clean worktree use npm ci and repository TESTING.md server instructions (port 4321 / CRYSTAL_FORGE_URL). Run:
- `node tests/wt023-model-drawer-browser.mjs` and `node tests/wt024-help-browser.mjs` (server + Chromium)
- `npm run test:static`, `npm test`, `npm run test:browser`
- `npm run release:metadata` for generated release consistency when runtime implemented; inspect diff and verify idempotence.
- applicable CI on exact final head, static, browser smoke, fabrication, edge finishing and any triggered help/native precision/measured-profile checks. Distinguish skipped conditional jobs from passes. Fix failures, rerun; do not claim old SHA green as current proof. Verify mergeability, base SHA, no unresolved reviews and latest main status. If CI cannot run or manual review incomplete, stay draft and report.

## 6. Definition of done and handoff

- One compact drawer implementation, not a second store, CSS overlay or duplicate toolbar controls.
- Owner's density/scroll/toolbar refinements visibly delivered; all critical controls accessible; no state or fabrication regression.
- Before/after measurements and screenshots, focused and full regression logs, final exact-head workflow evidence; relevant docs/release updated.
- Owner-only merge and visual sign-off. No physical printing claims; #10 remains independent.
- Record final SHA, base SHA, test commands/results, CI links, screenshot artifact, measured density gain, any deviations and subsequent coordination. If interrupted, push tested checkpoint on THIS branch and post PR comment with next actions. Do not recreate feature in another branch.

## 7. Codex execution prompt

Continue WT-023C2 in the existing draft PR from branch feat/wt023c2-compact-model-drawer-toolbar. Read this full packet, AGENTS.md and current handover. Fetch latest main and verify #175/#182/#176 ownership. Implement the compact drawer and matching native help checkbox styling, not a new drawer. Capture baseline first; build one scroll surface, update observer/scroll ownership, shrink density levels and action layout, preserve true previews and existing callbacks/state. Validate all acceptance, including 105 items, seven families, 390/768/1440, short heights, actual 200% zoom, both themes, all help modes, keyboard/touch, and measured before/after density. Run focused and complete static, browser and Manifold suites, fix failures, update guides/release/AI handover, push and verify exact-head CI. Leave draft if any gate is outstanding; otherwise mark ready for owner review with evidence. No auto-merge, deployment or other branch edits. Do not start over, and do not stop at a planning-only checkpoint if execution is available.
