# 009 — Named production packs and print-job manifest

> **Status:** Owner-approved next **small** Codex task.
> **Issue:** [WT-009 / #47](https://github.com/connorturansky-svg/crystal-forge/issues/47).
> **Approved revision:** The full immutable planning branch SHA pinned in Issue #47.
> **Starting baseline:** `main` after merged [WT-008 / PR #46](https://github.com/connorturansky-svg/crystal-forge/pull/46) at observed merge SHA `4f130fe5d78dcf7d7852cc727466c61ef98aa7a7`. Fetch latest main.
> **Usage budget:** User has ~10% Codex remaining. Aim for **~5–7% total allowance** with one focused implementation pass. This cannot be guaranteed by instructions; no subagents, broad audits, redundant full-suite loops, new packages or unrelated refactors.
> **Ownership:** Connor's Codex, one draft PR. Jordan's SVG [WT-003 PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) remains isolated; automatic Copilot dispatch WT-004 separate.

## Why

The now-merged Print Centre can queue several separate prepared models and per-job printer settings, but its production ZIP still downloads as `sensory-model-production.zip` regardless of the job. It is easy to confuse print files and forget which nozzle/material/quality were used. Add **trustworthy names and a small build manifest** without changing any physical model, STL/3MF, Cura calculations or worker logic. The Crystal Cluster remains an unmodified regression benchmark.

## Verified relevant code (avoid broad re-audit)

`sensory-studio.js` `exportJob(id,only3MF)` already:
- verifies `printExportBlock(job,result,settings)`, where `result=currentPrintResult(job)` and `settings=effectivePrinter(job)`;
- calls existing `exportMaterialBodies(result,{name:model.name})`;
- downloads a 3MF using `exported.filename` (this too may collide across duplicate jobs);
- packages `exported.stls`, the 3MF, `editable-model.json`, `material-roles.json`, `print-report.json`, generated Cura profile or manual fallback, and `READ-ME.txt` via existing `zipProfileEntries(entries)`;
- always names the ZIP `sensory-model-production.zip`.

Effective job printer settings already use correct project→model→job precedence from WT-008; do not create a second settings resolver.

## Limited implementation

1. **Safe, useful download names:** Compose `<safe-short-model-slug>-rev<revision>-<short-stable-job-suffix>.zip` and a matching `.3mf` on download only. Stable job suffix derives from the actual job ID; no random timestamp and no cross-job collision for realistic IDs. Handle whitespace, slashes, punctuation, Unicode and very long titles safely (plain ASCII slug and bounded length, with a fallback). Do not allow path separators or untrusted input to introduce directories. Do not rename the *internal* 3MF or STL filenames unnecessarily; only the downloaded outer file needs a unique descriptive name.
2. **Actual manifest** `print-job-manifest.json` inside each production ZIP, using existing real data: `schemaVersion:1`, `modelId`, `modelName`, `generatorType`, `modelRevision`, `jobId`, `preparedRevision`, `printer`, `nozzleMm`, `material`, `quality`, and `files` (entries actually present). Optionally note profile outcome `included` or `manual-review`. **Do not include untrusted secrets, vault tokens, arbitrary full project or browser state.** The manifest describes an export, not actual slice or printer completion.
3. **Readable README:** Add model, revision, job ID and effective printer/nozzle/material/quality at the top of the existing `READ-ME.txt`. Retain all pre-existing shared-origin STL/material warnings, untouched. Append a clear honest reminder that installed Cura preview and physical fit/optics remain manual. Avoid claims that a profile import or actual print has been verified.
4. **Preserve invariants:** No change to `canExport`, `currentPrintResult`, worker, Cura calculation, actual Manifold/3MF geometry, archives' existing content, multi-material alignment or linked/legacy model state. The extra manifest is additive; existing consumers of the production ZIP still find all old paths. If profile generation throws, existing manual fallback persists, and the manifest says so.
5. **One focused test path:** Extend an existing browser/Node print-export test rather than creating a large framework. Check two jobs from same named model (where app permits multiple job IDs) produce distinct filenames. Exercise punctuation/path-like model name and long name sanitising in a pure helper if extracted. Verify real ZIP signature, manifest existence/JSON accuracy and README effective settings. Confirm the downloaded 3MF remains a genuine 3MF ZIP. Verify exporting a stale job remains blocked. Use no fabricated assertions, test logs or screenshot claims.
6. **Release/handover:** App version bump as required by repository release gate, corresponding `CHANGELOG.md` and in-app What's New, and **one brief** `docs/AI_HANDOVER.md` note. Run `npm run test:static`, targeted browser suite, let PR's existing CI run and report exact SHA/results; no repeated expensive local geometry benchmark unless failures indicate a regression.

## Acceptance criteria

- **WT009-01:** Downloaded production ZIP and 3MF name identify model, source revision, job, are bounded/sanitised and unique for two distinct job IDs.
- **WT009-02:** Production ZIP contains all original expected entries **plus** parseable `print-job-manifest.json`, with real effective job settings matching card/actual Cura profile request.
- **WT009-03:** README identifies model/revision/settings and still explains common-origin STL grouping, material limitations and manual Cura/physical checks.
- **WT009-04:** On Cura profile creation failure, manual-review file remains and manifest correctly records that outcome; no false success.
- **WT009-05:** Stale/failed/cancelled/never-prepared jobs cannot export; model and all previous user data remain unchanged. Browser click and file integrity checks pass on the exact implementation head.

## Hard exclusions / cost stop

No modifications to `svg-import/**`, any geometry or LED code, `studio-model-worker.js`, `cura-profiles.js`, `studio-material-export.js`, cloud sync, authentication, printer connectivity, library cards, Print Centre layout or core job schema.

Prefer one existing source module (`sensory-studio.js`), a small pure slug helper **only if testing truly needs it**, one existing test and mandatory release/handover docs. No subagents; single small PR, no broad milestone consolidation.

If a requirement unexpectedly demands substantial architectural work, stop at safe descriptive filenames + manifest, record the limitation, and do not spend remaining credits on unrelated expansion.

## Codex implementation contract

1. Read `AGENTS.md`, the most recent short `docs/AI_HANDOVER.md` sections and the relevant source/test paths **only**. Verify WT-008 PR #46 was merged, latest main and no conflicting owner task.
2. Claim [Issue #47](https://github.com/connorturansky-svg/crystal-forge/issues/47) as `CLAIM WT-009 — @connorturansky-svg Codex — feat/WT-009-print-pack-names — export identity`.
3. Branch from latest main: `feat/WT-009-print-pack-names`. Implement exactly above. One **draft PR**, titled `[WT-009] Named production packs and print-job manifest`, with these mandatory lines:

```
Task issue: #47
Approved spec: prompts/009-print-export-identity.md @ <FULL_40_CHARACTER_APPROVED_SHA_FROM_ISSUE_47>
Scope: Descriptive per-job 3MF/ZIP filenames and accurate additive print-job manifest/README.
Related PRs/duplicates: WT-008 #46 merged; WT-003 #37 SVG external; WT-004 dispatcher separate.
Test evidence: <exact head SHA, real static/browser CI URLs and findings>
Handover: docs/AI_HANDOVER.md
Risks: <manual Cura/physical print still unverified, any deferred edge case>
```

4. No auto-merge, no direct push to main, no deployment, no follow-up PR unless owner asks. Stop and report the PR once tests pass.
