# Viewport Layers — implementation packet (#162)

## Implemented branch

PR #176 adds the viewport disclosure, presets and independent guide filters. Crystal supplies every layer in the table. Native builders show existing pixel or mount rings and tags, fitting replicas and cutters, selected port arrows and routes with separately filterable directions. Native cable lengths and tab outlines have no dedicated viewport producers and are shown as unavailable. Grid, axes and dimensions are shared. Visibility composes with the workspace, active preview choices, and selected or invalid feedback. Layers never alter the document, prepare a model or filter final solid geometry.

The original dated specification follows.


**Status:** consolidated in model appearance and viewport implementation PR #176. View preference core and tests committed; actual disclosure and renderer integration pending. Main inspected 25 November 2026: `ff495743be918b761e17ee3bc87264d64b00b4a2`. Fetch live main and claim #162 before implementing; #158 Gear and #163 Help own overlapping runtime files. #164 and #166 are merged; #165 is superseded. No new issue or alternative drawer.

## Codex execution prompt

Implement issue #162 in a single focused feature PR from current main. Read AGENTS.md, AI_HANDOVER.md, this packet and the merged Models drawer implementation. Do not edit #158 or #163 branches; wait for shared runtime ownership to be released or explicitly coordinate distinct file responsibilities. Deliver the actual accessible floating Layers disclosure, shared view-only preferences, both renderer adapters, real browser evidence and unchanged manufacturing evidence. Run focused tests then applicable exact-head CI, update changelog, generated release information and user guide. Do not stop at a plan, automatically merge or claim physical validation.

## Why this needs a separate controller

The user needs to inspect the model without overlapping P labels, routing lengths, replicas, bores and mounting tabs. Existing rendering controls mix visibility with actual model settings. `studio-v3.js` default settings include `showPixels`, and `updateLEDs()` (around line 521) asynchronously creates named `crystal-fitting-negative` and `crystal-fitting-positive` meshes only when the existing fitting-preview prerequisites are met. This is not equivalent to a passive overlay preference. Preserve the existing fit-preview activation, diagnostics and generation token; layer switches mask available positive/negative children without silently switching model settings or launching work every frame.

| Category | Current source anchor | Proposed view adapter |
|---|---|---|
| Pixel tags | hardware-editor.js addMarker, positionMarkers; native pixelLabel | Independent label visibility, including focus/hit testing |
| Pixel replica | studio-v3.js updateLEDs positive; audit native fitting preview producer | Filter generated replica; never create fake replicas |
| Bore/socket | hardware-editor.js draw ring/tube; updateLEDs negative; native marker/fit producer audit | Separate guides from true Boolean geometry |
| Wire routes | hardware-editor.js draw ghost/outline; sensory-studio.js nativeRoute | Tag producer output, preserve showNativeGuide and stage gates |
| Length labels | hardware-route-length DOM span | Independent label mask; preserve existing wireShowLengths baseline |
| IN/OUT | hardware-editor.js addEdgeMarker and native pixelPort | Preserve selected-port rule and original drag access when shown |
| Direction | hardware-editor.js ArrowHelper | Independent mask; preserve wireDirectionArrows baseline |
| Mount tabs | hardware-editor.js draw disc/outline | Preview proxies only; do not hide fused solid |
| Mount holes and tags | tabHoles/mounts ring/tube, data-hw-kind, native mountLabel | Separate preview/tag categories; avoid accidental pixel coupling |
| Guides | grid/axes and mounting-pattern-viewport.js | Audit actual producers; never hide active draft handle or critical invalid feedback |

Source lines refer to the audited SHA, not permanent anchors. `hardware-editor.js positionMarkers()` recalculates DOM hidden state on every animation frame and resets guide group visibility; `draw()` destroys/recreates guide children. Apply the shared predicate in these producer paths, not only at disclosure click. Native `refreshPixelMarkers()` resets route, pixel, mount and label visibility by stage, and port visibility by selected ID. Apply after or within that existing decision. Inspect cache regeneration, drag gestures and all raycast candidates in sensory-studio.js; native categories absent on a family are unsupported, not successful dummy switches. Mount pattern centre and candidate markers are temporary tool UI, not ordinary passive decorations.

## Proposed interface and semantics

One collapsed Layers button in centre viewport, separate from the Models drawer and existing tool controls. Accessible disclosure button + labelled native checkboxes grouped Pixels/Wiring/Mounting/Guides; mixed-state group toggles operate on supported child preferences only. Use short labels, not icons or colours alone. Ordinary keyboard Tab, Space/Enter, Escape and outside-click dismissal with focus restoration; do not trap focus or consume canvas gestures outside panel. Scroll inside panel at narrow widths. Use existing Help registry when #163 is merged, not a second tooltip system.

Presets: Clean model hides passive overlays; Pixel placement shows pixel tags/replicas/socket guides; Wire routing shows route/length/port/direction guides and useful P tags; Mounting shows mount previews/tags; Reset restores historical defaults. Presets are proposed initial mapping; verify against actual supported categories and record final mapping. Preserve active selection, temporary placement and invalid warnings independently. Show unavailable controls with explicit reason (e.g. no active fitting preview, incompatible prepared view); preserve preference when switching capability. A prepared solid is truthful: actual cut or fused geometry cannot be individually hidden.

## State and rendering contract

Proposed isolated versioned browser preference key, never inside project, saved-model, backup or fabrication settings. On missing/invalid JSON, unknown keys, blocked storage or quota errors use validated defaults or session-memory choice; never clear workspace storage. A default/unset preference should preserve existing stage and model-specific behaviour, including legacy length/arrow flags. Use effective visibility = baseline stage/capability/activation AND layer preference, except essential active-tool feedback is not filtered. Preference changes only refresh presentation, not project save, revision, history, dirty state, prepared job, geometry generation or export. Do not overwrite existing fitting preview choice.

Three.js visibility and picking are distinct. Explicitly filter hidden/noninteractive candidates and ancestors or use appropriate raycast layer masks; don't assume visible=false prevents intersections. DOM labels must actually be hidden/removed from pointer and keyboard hit testing, not only opacity:0. Reapply masks after async fit output, model switch, cached group reuse, preview rebuild, stage changes and reload. Avoid new per-frame allocation or duplicated listeners; clean subscriptions on teardown.

## Evidence gates (implementation PR)

1. Unit: valid/malformed preference parsing; storage errors; unsupported category; composition with legacy false flags/stage; independent toggles; mixed state; deterministic presets; active-tool override.
2. Browser: real Crystal clutter fixture with accepted sockets/routes/mounts; assert each DOM and scene category toggles independently; prove click/drag reaches underlying intended target when hidden (no forced clicks). Six native families individually exercise supported controls, with explicit capability reasons for absent features.
3. Rebuild: change model/workspace/project, re-render/async preview, reload, prepared view, orbit, keyboard placement and invalid feedback; verify no accidental reset or invisible hit target. 390/768/1440px, light/dark, 200% text, keyboard and focus restore. Inspect console and screenshots.
4. Data: capture full workspace storage bytes and model fingerprint/revision, dirty indicator/history and prepared job state before and after visibility-only sequence; ensure identical values, except dedicated preferences. If export is deterministic compare mesh buffers or normalized STL/3MF geometry, otherwise compare canonical triangles/sections and relevant cut dimensions. Keep existing seven-builder fabrication and edge regressions. No claim of printed fit.
5. Document capability matrix, final mapping and evidence links. Check exact-head static, real Chromium, fabrication and applicable workflows; owner alone merges.

## Research references

- [W3C APG disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) — labelled button with accurate expanded state and native keyboard activation.
- [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster) and [Object3D](https://threejs.org/docs/pages/Object3D.html) — picking filter and render visibility need explicit treatment; verify implementation against repository's pinned Three.js version.
- [MDN Web Storage availability](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API) — storage access may fail even when API exists; view preferences must degrade without data loss.

Source audit only; no local runtime, geometry, accessibility or browser tests were executed for this planning packet.
