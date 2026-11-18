# 008 — Reliable visual Print Centre queue and per-job settings

> **Status:** Owner-approved, awaiting completion/merge of WT-007.
> **Task Issue:** [WT-008 / #45](https://github.com/connorturansky-svg/crystal-forge/issues/45).
> **Approved spec SHA:** The final immutable 40-character planning SHA is recorded in Issue #45.
> **Owner:** Connor's Codex; one source branch from latest main, one **draft** PR.
> **Sequencing gate:** **DO NOT START UNTIL WT-007 [PR #44](https://github.com/connorturansky-svg/crystal-forge/pull/44) IS MERGED.** On 2026-11-18 18:29 UTC it was open, ready for review, with latest static/browser/fabrication checks passing. WT-007 touches `sensory-studio.js`, so branching early produces unnecessary conflicts.
> **Effort budget:** Owner reports WT-007 consumed ~4% of Codex credit allowance, WT-006 ~70%. Aim for ~15–20% total credit allowance in one bounded pass. **This is a scoping target, not a credit guarantee**. Do not use multiple agents, heavy exploratory audits, full-scale refactors, repeated redundant tests, or side quests.
> **External non-overlap:** Jordan's draft [WT-003 / PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) isolates SVG import and demo; WT-004 is separate Copilot automation.

## Why

The current Studio has a global Print Centre / Quick Print which can queue models, prepare geometry through a Web Worker, download a production ZIP or 3MF and choose global Ultimaker/Cura settings. However, its UI is still a fairly basic collection of text cards. The user needs a visually legible, **reliable** print queue that makes it obvious what will be printed, with which printer settings, and whether the output is fresh and safe to download. Reuse existing real manufacturing, profiles and document job state. This task improves the **workflow and user controls**, not mesh generation or optical engineering.

## Baseline source observations (verify on latest main after WT-007 merge)

- `sensory-studio.js` already owns `showPrint()`, `renderJobs()`, `prepare()`, `exportJob()` and `curaOptions()`. The unified shell has current-model Quick Print, expandable multi-model queue, global machine/nozzle/material/quality, and a collection of job cards.
- `studio-documents.js` already defines `queueModel()`, `beginPreparation()`, `finishPreparation()`, `cancelPreparation()`, `canExport()`, stable job IDs/revisions, `job.overrides`, `model.printerOverrides` and `project.printer` precedence at ticket creation.
- `studio-model-worker.js` prepares geometry; `prepared` is an in-memory result map. `studio-material-export.js`, `cura-profiles.js` and ZIP exporters are existing working real functions.
- Currently Print Centre renders text-only job cards and global printer settings; the per-job overrides exist in the data model but have no focused UI. `renderJobs()` is called for worker progress; preparation and cancelled/stale responses need exact-id correctness.
- The global printer setting's existing onchange deliberately stales affected jobs. Avoid silently changing that contract. The exported Cura settings must actually agree with the effective settings shown for each job.
- Physical dimensions/slicer and material assignments need installed Cura and actual print tests. A software-green build does **not** establish material/fit or printer viability.

## Work scope — a single medium-sized feature PR

### 1. Visual, informative queue cards

- Render each queued job as `.sms-tile` with a **real cached/stored model thumbnail** (or an accurate fallback placeholder), model name, model family, model source revision and current job state. Reuse the model/Library card styles; do not make thumbnails for the entire catalogue or start many WebGL renderers.
- Show effective **machine**, **nozzle**, **material**, **quality** and whether values inherit global settings or are overridden for the job. Use a single shared resolver reflecting the actual `{...project.printer,...model.printerOverrides,...job.overrides}` precedence. UI, preparation ticket and exported Cura profile must use equivalent effective settings. If needed, implement one small pure resolver helper; don't create a separate settings database.
- Show progress from real worker stage messages and clear status text `Queued`, `Preparing`, `Prepared`, `Stale`, `Failed`, `Cancelled`. Do not fabricate completion percentages. A failed job shows a meaningful error and visible Retry/Prepare action.
- Highlight only one status if a single model has multiple jobs: keep each card's job ID distinct and do not confuse it with the model's ID.

### 2. Real queue actions

- Preserve the existing current-model Quick Print and `Add more models` flow. Add an explicit affordance to queue any existing project model that is not already queued, with no accidental duplicates from repeated double-click/taps.
- Add `Move up` / `Move down` controls for the print **queue order**, not generator order or tab order. Preserve identity, revisions, overrides and prepared results while reordering. Disable at ends. Save/reload retains order.
- `Remove` deletes only the selected queued job and its prepared cache/active worker; do not delete the underlying model.
- `Cancel` ends an in-flight job and cannot be overwritten by a late message; `Retry`/Prepare starts a fresh ticket only for that job and never downloads stale output. Do not permit simultaneously preparing the same job twice from repeated clicks.
- When an underlying model changes, the existing stale/revision logic must remain authoritative; no stale export enabled and no result from a previous revision attached.

### 3. Job-specific settings that actually work

- For each job add compact overrides for **printer** (Ultimaker 3 Extended / Ultimaker 2+ / Custom / other), **nozzle** (0.25, 0.4, 0.6, 0.8 mm), **material** (PLA, PETG) and **quality** (0–100). Provide `Use project defaults` to clear the job's overrides; make overridden state visible and explain precedence. Do not override measured pixel dimensions or fitted hardware as a side effect.
- The global project defaults remain editable. A job override must **not** modify `project.printer`, other jobs, model parameters, recorded project thumbnails or material roles.
- Changing a job's effective printer setting when it's queued/preparing/prepared cancels only that job's worker and invalidates **only that job's prepared cache and revision status** (mark stale/queued appropriately); the previously prepared *other* job stays valid. Ensure `requestId` is invalidated before any stale callback could complete.
- Persist `job.overrides` using the existing project serialization and schema; no migration or new storage format. Reloading should show the same settings and queue order. Prepared geometry is **in-memory**; on reload a persisted `prepared` state must not falsely enable downloads until correctly re-prepared.
- For the production ZIP / Cura settings download, use the same effective settings displayed on the relevant job card; preserve true 3MF material body export and existing dual-material UM3 limitation. An existing `Custom / other` printer profile may remain manual-only with a clear warning, not a claim of tested compatibility.
- Do **not** build a new Cura profile generator or add gcode / OctoPrint / printer network connection. Existing Cura manual-settings fallback remains.

### 4. Clear preflight and truthful download controls

- Each job card must show which exact revision is prepared, whether 3MF and production ZIP downloads are enabled, and **why** downloads are disabled (queued, in progress, stale revision, failed job, missing prepared in-memory mesh, incompatible machine/material, etc.). `disabled` must be real in the DOM.
- Keep existing model dimensions/envelope notice. Do not invent slicer layout or certify bed fit. If existing bounds check indicates a violation, show prominent **warning** or a conservative block with an honest explanation; avoid misleading “ready to print” wording. Do not rework geometry orientation/envelope algorithms in this task.
- Preserve real export signatures and filenames. Don't add fake buttons or action controls without handlers. Do not catch export errors and report success.
- Avoid browser freezes from the Print UI: use stored thumbnails/cache, not eager preparation/renderer work. No unnecessary background processing.

## Specific interactions to test in Chromium (not just source review)

**WT008-01:** Open Quick Print on a Crystal model. Current model preview and correct name are visible; expandable queue lists other native model types with accessible buttons. No duplicate job from rapid repeated Add.

**WT008-02:** Queue a Crystal model and a Gear or Tactile Tile. They appear as distinct cards with correct images/placeholders, source revision, and independent IDs.

**WT008-03:** Move the second job up then down. Queue order changes, saved order restores after reload, model tabs and library ordering do not change. End controls disabled.

**WT008-04:** Set **job A** to UM2+ / 0.8 / PETG / quality 35 while job B remains inherited defaults. The first job card shows effective values, model and project defaults are unchanged; save/reload retains both. `Use project defaults` clears only A's override.

**WT008-05:** Prepare A and B using existing actual worker. Progress status shows only reported stages. Repeated clicks do not launch duplicate workers; cancel/late callback leaves A cancelled; B remains preparing or prepared as appropriate. Retry A returns a valid new request ID and completion.

**WT008-06:** Changing A's nozzle/material while A is prepared invalidates A's download buttons/cache but not B's. Editing the underlying model makes its jobs stale and refuses old result; no export possible until current revision completes.

**WT008-07:** 3MF and production ZIP download buttons are only enabled when `canExport()` **and** the correct prepared worker result are present. Actual downloaded bytes have expected 3MF/ZIP signatures and the production pack includes Cura settings corresponding to the displayed job machine/nozzle/material/quality. Don't claim Cura import succeeded without actually opening Cura.

**WT008-08:** Error/unsupported dual-material path preserves the prepared state honestly, reports an actionable reason and keeps source models intact. Existing UM3 vs UM2 dual-material safeguard remains.

**WT008-09:** Button and keyboard paths: Add, expand/collapse, reorder, per-job controls, reset, Prepare, Cancel, Retry, Remove, 3MF, ZIP and global Cura export work at desktop and narrow viewport; screenshot both states, assert no page/console errors.

**WT008-10:** Existing Crystal Cluster Design/Build fitting and pixel-string UI, linked models, multi-model tabs and current local library are preserved. No changes to manufacturing geometry, schema or SVG importer. Static/Chromium and repository native CI pass on exact PR head; any full Manifold CI result reported truthfully if run.

## Cost/complexity guardrails

- **One** Codex implementation pass, **no subagents**; avoid parallel worktree agents, extensive searches or speculative architecture proposals.
- Prefer editing `sensory-studio.js`, minimal `studio-documents.js` helper(s), existing `sensory-studio.css`, one or two existing `tests/*.mjs` and **required release/handover files**. No new packages/frameworks.
- Implement sections 1–4 in order; prioritise **correct queue + overrides + stale safety** over visual polish if time/credits constrain. If a component requires a major rewrite, explicitly defer that part rather than expanding.
- Run a focused node/document test, `npm run test:static`, one representative Chromium suite and exact-head CI. Do not loop the full expensive geometry benchmark when no geometry changed, but report hosted CI's actual Manifold result if it runs. No fabricated screenshots or test claims.
- Bump version once to satisfy existing release gate; include matching `CHANGELOG.md` and in-app What's New plus a **short** current `docs/AI_HANDOVER.md` update. Don't inflate the changelog or mutate stale historical documents.
- Keep the PR **draft**, no owner bypass, no merge, no GitHub Pages deploy, no unverified real Cura/physical print claims.

## Required coordination and deliverable

1. Verify PR #44 is merged. If not, stop implementation immediately and report the blocker, **do not create another coding branch that conflicts with its source**.
2. Fetch latest `main` and check open PRs. Read `AGENTS.md`, relevant Print Centre section of `docs/AI_HANDOVER.md`, `docs/TESTING.md`, and these exact source modules. Do not scan unrelated historical prompts or attempt all old phases.
3. Claim [Issue #45](https://github.com/connorturansky-svg/crystal-forge/issues/45) with `CLAIM WT-008 — @connorturansky-svg Codex — feat/WT-008-print-centre — reliable global queue and job settings`.
4. Create `feat/WT-008-print-centre` from fresh main. Open one draft PR titled `[WT-008] Reliable visual Print Centre queue and per-job settings` with the exact metadata:

```
Task issue: #45
Approved spec: prompts/008-print-centre-queue.md @ <EXACT_FULL_SHA_PINNED_ON_ISSUE_45>
Scope: Visual print job cards, queue ordering, per-job settings, stale-safe prep and downloads.
Related PRs/duplicates: WT-007 PR #44 merged; WT-006 PR #41 merged; WT-003 PR #37 SVG isolated; WT-004 distinct.
Test evidence: <exact head SHA, test commands/results, fresh CI URLs, screenshot links>
Handover: docs/AI_HANDOVER.md
Risks: <untested Cura/physical printer tests, limitations, deferred work>
```

5. Stop at WT008-01…10. Summarise implemented controls, exact test evidence and limitations in the PR and handover. **No auto-merge or deployment.**

This task intentionally does **not** include SVG integration, STL/OBJ import, bed nesting, geometry repair, multi-part joints, new hardware families, cloud sync or automated Copilot dispatch.
