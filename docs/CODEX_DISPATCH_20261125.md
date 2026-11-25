# Current implementation dispatch — 25 November 2026

**Historical dispatch.** See [current project status](PROJECT_STATUS.md) for B2a delivery, merged Help and live review holds. Main audited `ff495743be918b761e17ee3bc87264d64b00b4a2`. Read AGENTS.md and AI_HANDOVER.md, then verify live claims and refs. This index supersedes stale next-task directions in historical issue bodies without deleting their evidence or changing product requirements.

## Current consolidation

| Issue | Evidence on main / status | Next action |
|---|---|---|
| #137 WT-023 parent | #147 transaction, #151 B1, #164 drawer, #166 additional QA, #148 large backup fix merged | Track outstanding B2/D1/D2/E1/E2 here; no duplicate epic |
| #139 Library | B1 merged | B2 destination chooser only |
| #140 drawer | #164 and #166 merged; #165 closed unmerged | Audit remaining acceptance, especially imported sources/naming and metadata, against actual browser evidence before closing; no second drawer |
| #141 resources | Existing measured profile and Cura foundations | D1 immutable pixel resources, then D2 printer resources |
| #142 cloud | #148 large authenticated blob recovery merged | E1 connection/status, then E2 manual conflict workflow |
| #152 Help | #163 active draft, browser failure on old head | Existing owner completes reconciliation; no duplicate branch |
| #154 legibility | #157 foundation merged | Remaining since-last-visit feature and accessibility audit, after #163 |
| #162 Layers | New source-audited packet proposed separately in #167 | Runtime after #158/#163 ownership clears |
| #79 parity | #159 evidence-gate plan already merged | Select one genuinely uncovered family/operation row from current register; do not restart historical passed fixtures |
| #51 modular fabrication | Historical constrained manual joint/auto splitting foundations | Owner-authorised larger milestone; current source feasibility review first |
| #10 production QA | Software evidence and physical acceptance distinct | Real Cura/print coupons/fit/retention and documented performance evidence |
| #33 operations | Owner settings remain distinct from code | Verify actual ruleset/permissions; no agent changes without owner authorisation |

Active runtime PRs #158 Gear and #163 Help are independent existing assignments. No new runtime task may overwrite or duplicate these. Start with source and exact-head evidence, not generic rewrites. The owner approves merges.

## Owner refinement — 25 November 2026

Read the [expanded project-centred Library implementation packet](WT023_PROJECT_LIBRARY_IMPLEMENTATION.md): B2a compact image-led tiles with hover/focus/touch actions; B2b project browser and transactional destination chooser; then D1/D2 and E1/E2. Owner screenshot exposed the drawer formatting defect; separate runtime correction #169 adds responsive density and thumbnail size. Arbitrary model colours are now tracked under #170 with independent planning PR #171. These new requirements do not restart #164/#166 or expand active #158/#163.

## B2 — ready-to-dispatch once shared ownership cleared

**Codex:** Implement #139 B2 on fresh main, single focused PR. Read existing `WT023_NEXT_SLICES_ACCEPTANCE_20261123.md` B2, but note its C1/C2 are now merged. Reuse the new naming dialog and drawer rather than rewriting them. Audit `sensory-studio.js` renderLibraryCards (around 2638), renderBuiltInTemplates (2746), renderTemplates (2766), saveProjectSnapshot/replaceProject (3173), `studio-sync-plan.js` projectWorkspaceCandidate/assertWorkspaceVersion and `studio-organisation.js` templateProject. Current built-in template opens naming then add directly to active project; saved-model and reusable model template actions insert immediately into active project; project template creates a fresh project via safe switch. Current target switch saves outgoing snapshot and invalidates target prepared jobs whose runtime meshes are not retained.

Introduce an explicit source/revision, destination and editable name confirmation for model templates/copies. Current, exact saved snapshot within existing project, and new project must use stable IDs; display duplicate-title disambiguation. A whole-project template remains new independent project unless owner explicitly approves merge semantics; do not flatten it into current project. Resolve pinned source and validate the entire candidate before one durable write; never switch then separately write insertion. Capture live Crystal edit before confirmation commit with existing lifecycle; cancel/back/escape no project writes. Quota, stale concurrent-tab storage, unavailable source and invalid names preserve current workspace and target historical snapshots. Current-project insertion preserves existing prepared jobs for unaffected models; switched target uses established invalidation policy. Use actual generated source and preview queue.

Run focused candidate tests for every destination, duplicate titles, old pinned revision, missing source, independent/linked copies and failure injection. Chromium exercise built-in seven families, reusable/saved models and full project templates, keyboard 390px and cancel. Compare storage bytes before/after rejected operations and inspect source IDs, revision, project and job identities. Test vault and existing unified drawer regressions. Update release docs, exact-head CI, no owner merge.

## D1/D2 — reproducible resources, not another Library store

Use existing #141 and merged #160 acceptance guide. D1 starts with persisted identity, reachability and migration tests before UI. `studio-profile-safety.js` planPixelProfileSave currently normalises and replaces same ID; cap 30 custom profiles. profileReferencedInModel checks native active/holes/socketProfile ID and Crystal parameter/manual holes, but caller must traverse active, saved and pinned library records. `studio-sync-plan.js` existing archive merge and `studio-vault.js` are integration points. Do not use current mutable ID as if immutable revision; model A pinned old fit must not change after global edit. Define compatible versioning/snapshot policy, preserve all unique calibrations and v1 archives, protect referenced deletion and deterministic conflict remap. Test actual measured bore sections at old/new versions. Keep default nominal vs measured vs physically verified distinct. Follow D2 separately with existing project/model/job precedence and actual Cura compatibility, no printer firmware control. Use existing tests and existing issue; do not duplicate #160's research.

## E1/E2 — private cloud

Use #142 and existing #160 brief; #148 is merged, not a branch to revive. E1 is discoverable Library connection, private repository verification, memory-only credential and clear last-confirmed SHA/time vs local save. E2 builds on actual resources and existing recovery preview: explicit Check/Preview/Merge/Copy/Upload, guarded manifest and content-hash checks; no last-write-wins or unattended sync. `sensory-studio.js` previewRecovery and `studio-sync-plan.js` commitRecovery already exist; audit them before adding anything. Two-device conflict and missing/large assets, quota, expired permission, cancelled selection and offline failure fixtures. Mock CI is not live private repository proof; owner-controlled opt-in test with redacted evidence only. No credential logging or PIN authentication.

## Other next slices and evidence

- #154: after Help, audit deployed release metadata and design voluntary last-seen release summary using existing Help/What's New and tool finder. No invented unseen release, no auto-modal interruption or visual overhaul. Use browser preference separate from project. Test absent/invalid/stale marker, first visit, keyboard and 200% zoom; preserve accessible change history.
- #79: use already merged evidence gates #159. Select one specific unresolved matrix cell, reproduce on fresh main, follow real viewport → saved source → prepared Manifold → STL/3MF, inspect measured sections, report unsupported paths honestly. No general parity badge from passing unrelated tests.
- #51: do not dispatch until owner confirms milestone. Compare current source layout under src/printing against historical WT-011 prompt on planning/prompts. Separate conservative joint eligibility, real matched pocket/dowel geometry, multi-piece topology and export manifest; fail closed where stock/route clearance cannot be proved. Printed tolerance coupons and physical assembly under #10.
- #10/#33: owner operations/physical tests cannot be completed by an AI code PR. Distinguish software regression, actual deployed site, actual physical trial and owner settings as separate evidence levels.

## Dispatch rules

Keep each implementation separately reviewable; no new issue per symptom. Claim existing issue and branch before editing. Verify latest main and active PRs. Implementation prompt explicitly authorises edit/test/commit/push to assigned branch; deliver tested PR, not another status report. A docs PR is not evidence a feature is implemented. Do not duplicate previous plans or auto-merge; record exact-head non-skipped workflows, limitations and owner action. Update stale pointers at handover only after actual merge.

This is a documentation-only consolidation; no software tests executed by this audit. B2 source anchors and profile safety source were inspected on the stated main; other lanes reuse existing reviewed plans and still require source revalidation before implementation.
