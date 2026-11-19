# 016 — Safe Cross-Device Studio Sync, Conflict Preview and Recovery

> **OWNER-APPROVED OVERNIGHT PHASE B — SECOND OF TWO.** Paired with [WT-015 / Issue #58](https://github.com/connorturansky-svg/crystal-forge/issues/58). **Do not implement until WT-015 has a reviewable tested draft PR**. User requested two substantial sequential WT tasks as one overnight Codex handoff.
> **Task:** [WT-016 / Issue #59](https://github.com/connorturansky-svg/crystal-forge/issues/59).
> **Immutable approved revision:** Full 40-char planning SHA pinned in Issue #59. Read this exact committed file.
> **Source dependency:** branch `feat/WT-016-safe-sync` **FROM THE TESTED HEAD OF `feat/WT-015-library-organisation`**, never blindly from stale main. Open **stacked DRAFT PR with base `feat/WT-015-library-organisation`**, not main. Mark depends on [WT-015 Issue #58](https://github.com/connorturansky-svg/crystal-forge/issues/58) and its actual draft PR number. Both PRs remain open for owner review. **No auto-merging either one**; after owner merges WT-015, WT-016 may be retargeted to current main by owner.
> **Verified original main:** `e3af2b87f71724e0bace93222448847709a5fa4a`, after merged WT-013 [PR #57](https://github.com/connorturansky-svg/crystal-forge/pull/57). At Phase B start report the *actual* upstream WT-015 commit SHA and open PR.
> **Dependencies unchanged:** WT-011 [Issue #51](https://github.com/connorturansky-svg/crystal-forge/issues/51) modular splitting LOW/ON HOLD; Jordan's [SVG PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) independent and not integrated. No AI dispatcher or unapproved GitHub organisation policy changes.
> **Delivery scale:** Second full-size, safely bounded milestone; one draft PR with Node/Chromium tests, mocked private GitHub file requests and recovery fixtures. No new third-party backend, token storage or background sync.

## 1. Actual user outcome and safety invariant

The owner uses Pixel Model Maker on different computers and wants reliable private backups, easy recovery and an understandable decision when local and remote projects differ. The app currently has **manual, private GitHub repository backed StudioVault** with manifest SHA concurrency guards, immutable asset hashes and a library `Upload studio backup` / `Pull and reconcile studio backup` pair. It also supports JSON full backups. **Improve and finish this existing local-first workflow**, not a new cloud service.

The primary invariant: **a sync or restore operation must never silently overwrite or delete the only surviving model, template, library revision, saved project, pixel fitting or current active source**. Import/pull/preview/cancel/offline/corrupt remote must leave local records intact until explicit confirmed commit. No cloud pull should directly switch the active model, delete local history or mark old print jobs prepared.

## 2. Verify current code and preserve

- `studio-vault.js::StudioVault.pull/push` already uses content-addressed model/thumbnail assets, SHA-256 verification on read, immutable asset files, `STUDIO_MANIFEST` commit last, and expected manifest SHA for optimistic conflict rejection. Keep this protected write model; do not replace with an unverified full JSON upload or force update.
- `sensory-studio.js::syncStudio(pull)` currently calls `adapter.vault()` for a **private repo connection**, saves a timestamped browser backup and immediately appends remote Library records/projects, renaming duplicates; conflicts are described in a status text only after mutation. Replace this with explicit **Preview → Choose → Apply** via narrowly scoped reusable merge helpers, while preserving no-data-loss philosophy.
- `backup()` downloads `wonder-trunks-studio-backup.json`; `importFile` handles Studio backups / model JSON / older Crystal JSON. Preserve these formats and avoid arbitrary code execution or untrusted HTML from imported names.
- WT-015 added versioned `state.organisation` for collection/favourite/template metadata; `studio-vault.js` now round-trips it as an optional content-addressed manifest asset without breaking old manifests. **WT-016 must preserve this and cover remapping of metadata when importing conflicting IDs.** No schema reset / dropping tags during sync.
- `studio-documents.js` validates model/project schemaVersion 1, linked models point at library source/revision, Print jobs may be stale and loaded prepared meshes are in memory only. Respect `validateProject`, `validateModel`, linked-history and print revision IDs.
- Existing WT-014 compact header, left Design/Build, central renderer, right Precision, horizontal bottom models, `wt-workspace-panels-v2`; WT-013 prepared Crystal inspection and strict passage gate remain functional.
- Authentication remains from the existing private repo client, with credentials **in memory only**. Never ask user to share PAT in public Issue/PR, commit/browser localStorage/project JSON, logs, screenshots or error telemetry.

## 3. Remote preview without mutation

**Prepare-phase API:** Separate `fetchAndVerifyRemote()`, `planReconciliation(local,remote)`, `applyReconciliation(local,plan,choices)` (names optional) so the planner is deterministic/pure and testable and does not mutate the real local or remote state.

1. **Explicit connection status:** Library offers an understandable `Connect private backup` / `Check remote` entry using the *existing* credential mechanism, with meaningful help where connection lives. If no connection, status remains **Local only**; no confusing failed upload or promise of automatic syncing. Do not build OAuth/token saving.
2. **Preview (read-only):** On Check remote/Pull, fetch manifest and all referenced assets, verify hashes/schema, normalise missing old optional collection/template metadata, then display remote identity (safe owner/repo label only if available), manifest version/SHA, saved-project count, library model/revisions count, collection count, reusable template count and difference summary (local-only, remote-only, identical, same-ID differing). Mark whether remote's main project is another newer/colliding copy; distinguish by ID AND content, not a title string.
3. **No unverified data attached:** Manifest missing, unreadable/bad content hash, failed network, incomplete interrupted upload or unsupported source schema blocks apply with a clear user-facing reason. Existing active project, Library, templates and save key must remain byte-for-byte identical on read-only failure/cancel.
4. **Preview chooser:** Let user choose at least `Keep local (no changes)`, `Import remote as separate copies` and `Merge new/unchanged items, copy conflicts`. Show changed record count and give explicit confirmation before mutation. If deletion is proposed in some future UI, it MUST be separate; no automated remote delete in WT-016. Make `Cancel` a true no-op. The preview should be keyboard accessible, non-colour-only, and preserve the new organisation filters.
5. **Before commit:** take a verified pre-apply recoverable snapshot (downloadable and/or safe distinct versioned browser backup with quota check). Do NOT create an unchecked timestamp key and then claim success. Preserve the latest untouched local backup if space/quota failure and reject apply instead of overwriting it. Users can export a JSON backup first if quota is too small.

## 4. Deterministic, idempotent merge and link preservation

6. **Stable source-of-truth identity:** Compare model/project *stable IDs and canonical content/fingerprints* and Library revision histories. Rename only **on verified collision with different content**, and preserve both sides. Do not duplicate unchanged remote records on every repeated pull. For divergent same-ID Library versions, preserve all distinct revisions deterministically, potentially by allocating new library source ID and remapping dependent links/metadata. Never silently replace the local latest revision with a divergent remote latest.
7. **Remote project reference remapping:** For conflicting project identities, choose a new project/snapshot ID and preserve original title plus distinct `(cloud copy)` label where useful. If a project is duplicated, update its model IDs, tabs/activeTab/printJobs/linked source and saved template pointers **only where required**; validate resulting complete project before commit. No accidental duplicate model ID inside a project, orphaned linked source or template pointing at the wrong library ID. Preserve model geometry and printer overrides; set any saved `prepared/preparing` jobs stale on eventual open, as existing logic requires.
8. **Organisation & templates:** Merge collection names using stable IDs and a deterministic policy for same-ID divergent names; preserve both collection definitions with stable remapping. Rewrite imported membership and project/model template source references in lockstep with imported library/project IDs. Favourites must survive unchanged and should not alter model fingerprints. If references are absent, show them as unresolved to user instead of silently using a different source.
9. **Idempotency:** Import the same verified remote twice, with no intervening local changes, and assert second merge produces **zero new duplicate projects/models/collections/templates**. Canonical (or content-hash) comparison plus durable remap/provenance strategy should ensure this across a page reload, not merely within one function invocation.
10. **Transactional commit:** Build + validate a complete candidate in memory first, including all source/template refs and saved data, then commit once through `WORKSPACE_KEY` with a recoverable backup. If validation or localStorage write fails, active app state and saved record remain intact; report failure and offer backup download. Avoid replacing the current `state.project` reference (held by listeners) without the established safe project replacement/switch path.
11. **Current active project safety:** Remote main project is *not* automatically opened. Imported versions appear in Saved projects, with deliberate `Open` confirmation using existing backup protection. If the user chooses to switch after import, use the established path. No auto-leave Design/Build or loss of current camera/selection due to a background pull.

## 5. Safe push / sync freshness

12. **Manual push:** distinguish `No private repo connected`, `Ready to upload`, `Remote changed since last pull`, `Uploading`, `Synced`, `Unable to sync`. No invisible background upload in this phase. Before pushing, verify current local workspace is valid and the remote manifest SHA matches the last confirmed SHA; if remote changed, show a conflict and offer a **new review/merge**, NEVER force-put.
13. **Immutable assets and atomic manifest:** continue hash-checking existing assets; upload new immutable files first, update manifest only with expected SHA and confirmation. Interrupted writes keep last valid manifest available. Deduplicate existing hash assets. Do not delete historical remote content.
14. **Post-upload success reporting:** display counts actually uploaded, commit status and readable remote revision marker; do not say synced until GitHub confirms the manifest. Failed push must preserve `studioVault.sha` safety and allow retry only after refresh/reconcile. No credentials in errors/logs.

## 6. Recovery and practical guidance

15. Add a compact **Backups & Recovery** panel inside Library showing `Saved locally`, recent safe snapshots and `Download complete backup`, `Restore from JSON`, `Check private backup` with clear current vs remote distinction. Use existing controls where possible. Do not build a new Settings workspace.
16. Preview imported JSON before committing: file type and model/project counts, schema validity, any conflicts, and whether it contains WT-015 collection/template metadata. Support legacy Crystal JSON and old complete Studio backups. Invalid/corrupt/oversized input yields actionable error and no mutation; avoid browser freeze for extreme JSON. Never treat an unverified JSON from another source as active code.
17. Support **selective restore** of a saved project or Library model revision from the imported/remote snapshot, in addition to whole-archive add-as-copies; confirm and create recoverable local backup before applying. Do not falsely claim a print job is ready when geometry caches are missing.
18. An accessible short step-by-step user help panel: first setup (existing private repository connection), what stays local, how to push, how to check another PC and pull, what happens on conflicts, how to recover offline via JSON. Describe **actual functionality only** and that the user may need to connect independently on the other device. Do not display/share tokens.

## 7. Acceptance tests — full mocked end-to-end and real UI

**WT016-01** — Two browser contexts / mocked devices: A has model/library/history/collections/templates; B has other distinct project. Check remote is preview-only; cancel leaves B unchanged. Merge copies all intended data with validated IDs; active B remains active.

**WT016-02** — Equal ID/different model revision and equal ID/different project content produce distinct retained versions/copies, linked source IDs remapped, saved Template source references and Collection membership remain correct. No original destroyed.

**WT016-03** — Re-pull same remote after full page reload results in **zero extra records** and stable metadata; only newly changed remote assets append on subsequent pull. Titles, thumbnails and family filters remain correct.

**WT016-04** — Remote hash corruption, missing hashed asset, unsupported manifest, malformed foreign JSON and interrupted asset upload do not mutate local state, current model or known-good manifest. Errors are specific and testable.

**WT016-05** — Two writers with stale manifest SHA: subsequent push refuses with no overwrite, prompts refresh; after proper pull/reconcile, valid push commits with expected SHA and accurate asset counts. No hidden force-push.

**WT016-06** — Existing full backup and Legacy Crystal JSON preview/import work, downloadable and recoverable pre-import snapshots exist, cancel and localStorage quota failure preserve previous state.

**WT016-07** — Selective project/model revision recovery works with correct references and local confirmation; active current model is unchanged until explicit Open. Invalid source revision has a clear warning.

**WT016-08** — Library front-end buttons: connect/help, preview, choose add/merge/cancel, backup download, JSON restore, conflict and error views all operate from actual clicks/keyboard, 1440px and 390–430px; status is readable and true. No screenshot exposing a token.

**WT016-09** — WT-015 collect/favourite/template actions survive local backup, remote push, remote pull and recovery; project/model source IDs preserve correct memberships and linked revision semantics.

**WT016-10** — Crystal 1/2/6-pixel and WT-013 strict inspection, Tile/Gear routing, WT-014 shell, Print Centre current job queue and user data all survive; prepared results cannot be exported after restore unless current revision has newly prepared worker output. No fabricated Cura/light certification.

**WT016-11** — Test actual `studio-vault.js` with **mocked private GitHub client** and in-memory deterministic network faults, no live PAT. Run `npm run test:static`, targeted document/vault/browser suites and exact-head hosted CI (Manifold workflow if run); attach logs/screenshots; report exact limitations.

**WT016-12** — Increment version once above WT-015's version, update `CHANGELOG.md` / in-app What's New / `docs/AI_HANDOVER.md` / relevant docs. Open one stacked draft PR with exact source/target SHA, test evidence, dependencies, manual connection notes, no automatic merge/deploy.

## 8. Boundaries, controls and fallback

Prefer isolated pure `studio-sync-plan.js` or small similarly named module for reconciliation and test fixtures, additive patches to `studio-vault.js`, `sensory-studio.js`, `studio-documents.js` only for strict validation, existing stylesheet and `tests/*.mjs`. Reuse WT-015 organisation model and existing backup data, no major database rewrite, no migration that silently deletes legacy data. **No new package**, backend, third-party sync service, OAuth/PAT persistence, browser credential storage, invisible scheduler, CRDT, optimistic real-time collaboration, GitHub permissions changes, Copilot automation, SVG importer, model/Manifold/Cura/printed physical changes or modular assembly.

The objective is a **safer manual cross-device workflow**. Do not pretend to provide fully hands-free, continuous, instant sync. Never use a public repository for private user project backups by default. Use only the existing user-selected private repository and existing client; no real network traffic from automated tests.

**Fail-safe priority order if capacity is constrained:**
1. Read-only validated remote preview and recovery backup transaction.
2. Correct non-destructive/idempotent merge with source/collection/template remapping.
3. Existing SHA-guarded push reporting.
4. Selective import and polished accessible help.

If robust conflict mapping is not achievable, **do not ship a silently destructive merge**. Keep remote preview and export as working features, label merge blocked, and leave PR in draft with explicitly failed criteria. Do not weaken the tests to claim success.

## 9. Exact GitHub contract

1. Confirm WT-015 [Issue #58](https://github.com/connorturansky-svg/crystal-forge/issues/58) has one draft PR, approved exact-head green CI, stable feature branch and handover; if not, STOP before WT-016 and report.
2. Claim `CLAIM WT-016 — @connorturansky-svg Codex — feat/WT-016-safe-sync — verified remote preview, merge and recovery` on [Issue #59](https://github.com/connorturansky-svg/crystal-forge/issues/59).
3. Fetch **WT-015 branch head**; create `feat/WT-016-safe-sync` from that head. Make only WT-016 incremental commits. Existing WT-015 branch must not be modified by WT-016.
4. Open **DRAFT STACKED PR** with base `feat/WT-015-library-organisation` (not main) titled `[WT-016] Safe cross-device sync, conflict preview and recovery`. Its diff must contain WT-016 changes only, not duplicate WT-015 commits.
5. PR description required metadata:

```
Task issue: #59
Approved spec: prompts/016-safe-cross-device-sync.md @ <FULL_SHA_PINNED_ON_ISSUE_59>
Scope: Read-only remote preview, source-safe/idempotent merge, SHA-guarded upload, selective backup recovery and accessible guidance.
Depends on: WT-015 #58 / its draft PR <NUMBER>, base feat/WT-015-library-organisation @ <EXACT_SOURCE_HEAD_SHA>
Related PRs/duplicates: WT-013 #57 merged; WT-014 #56 merged; WT-011 #51 ON HOLD; SVG PR #37 external.
Test evidence: <exact WT016 head; static/vault mocks/Chromium CI links and screenshots>
Handover: docs/AI_HANDOVER.md
Risks: <manual private GitHub setup, sync conflicts, unsupported selective cases and no realtime OAuth>
```

6. Check PR target correctly points at WT-015 branch, CI passes and all screenshot/artifacts do not leak secrets. Document owner review order: **review/merge WT-015 first**, then rebase/retarget WT-016 as needed, rerun exact-head checks, merge WT-016 only after owner review. **Do NOT merge, deploy, change user repo permissions or close issues unilaterally.**
