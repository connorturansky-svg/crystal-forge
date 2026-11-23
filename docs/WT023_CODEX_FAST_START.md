# WT-023A · Codex fast start — minimise tokens, maximise data safety

**Status:** owner-approved task, 22 November 2026. **START WITH THIS FILE instead of the full historical chat/WT-021 roadmap.** [Master #137](https://github.com/connorturansky-svg/crystal-forge/issues/137), [first task #138](https://github.com/connorturansky-svg/crystal-forge/issues/138). Fetch current main; last audited `dddb172a26b5d9e2b70df607951f938069b62ab3` after merged #135/#136. Read `AGENTS.md` first for branch/release rules. The owner must approve every merge.

## Owner decisions are already final for this milestone

Single-level collapsible Project folders; only **one active editable project** with `Project : Model` tab names; shared version-aware pixel and printer/Cura profiles chosen per project; **private GitHub + safe manual Check/Preview/Merge/Upload**. No PIN, nested folder tree, cross-project active tabs, hosted server, or background automatic sync.

## Do not duplicate independently prepared work

- [Draft plan #144](https://github.com/connorturansky-svg/crystal-forge/pull/144): `docs/WT023_LIBRARY_CLOUD_BLUEPRINT.md` is the complete requirements/design record.
- [Draft QA source contract #146](https://github.com/connorturansky-svg/crystal-forge/pull/146): `docs/WT023A_PROJECT_INDEX_PREWORK.md`, `tests/helpers/wt023-project-index.mjs` and `tests/wt023-project-index.test.mjs` already characterize read-only grouping and stable identities; static tests passed at QA audit. **Only reuse after checking final CI/owner integration decision**. No UI or storage migration shipped from it.
- [#131 CI efficiency](https://github.com/connorturansky-svg/crystal-forge/pull/131): separate reviewer owns that branch; never edit workflows or cherry-pick it.
- [#10 physical QA](https://github.com/connorturansky-svg/crystal-forge/issues/10): real print validation separate; do not touch geometry for the Library task.

## Read five source contracts, not the entire repo

| Concern | Read |
|---|---|
| Project/model identity and prepared jobs | `studio-documents.js`: `createProject`, `validateProject`, `saveLibraryRevision`, `editModel` |
| Snapshot copies and switching | `sensory-studio.js`: `saveProjectSnapshot`, `replaceProject`, `writeWorkspace` |
| Tagged collections and saved templates | `studio-organisation.js`: `readOrganisation`, `ensureSnapshotIds`, `templateProject` |
| Validated private vault | `studio-vault.js`: `packStudioVault/unpackStudioVault`; `studio-sync-plan.js`: `reconcileArchive/commitRecovery` |
| Old JSON import | `studio-migration.js`; tests `studio-documents.test.mjs`, `studio-vault.test.mjs` |

**Known traps:** `state.savedProjects` is saved *snapshots*, not a directory of independent live files; a snapshot can share `project.id` with its parent and has unique `snapshotId`. Model IDs are unique per project, titles can repeat. `state.organisation.collections` are virtual tags, not real project ownership. `readOrganisation` normalises only v1 known fields. A new root field would be omitted from remote backups unless `studio-vault.js` explicitly packs it and `reconcileArchive` merges it. `editModel` increments revision and stales print jobs even on rename; do not call it in read-only renderers.

## Your one critical job: WT-023A only

1. Verify whether existing project+snapshot IDs support folders without a new schema. **Prefer derived project groups** from #146; add *versioned optional persistent metadata only when a required operation cannot be derived*. Never add a competing project database needlessly.
2. Build/validate a **complete candidate** before any write/switch; verify old local bytes and snapshot recovery if quota, conflict, network or other-tab updates block the commit. Preserve all original v1 data, templates and measured pixel fit.
3. Add tests for projects with equal titles/different IDs; multiple snapshots same ID; missing/duplicate snapshot ID once-only migration; linked saved Library revision; independent copy; one-active-project tabs; custom profile ID collision; prepared-job source identity; selective and full JSON/cloud recovery. A clean old browser and private vault should still open.
4. Produce **one small draft PR** from current main with exact-head Node + relevant Chromium and mocked vault evidence. No Cloud UI, no nested folders, no printer catalogue, no Pages/CI changes. Code change triggers release metadata policy; update in-app version/changelog only if runtime change genuinely visible.

**Commands:** `node tests/studio-documents.test.mjs`, `node tests/studio-vault.test.mjs`, `npm run test:static`; if #146 code is integrated, `node tests/wt023-project-index.test.mjs`. Browser checks require the local server at port 4321; use `docs/TESTING.md` for setup, and existing CI for exact-head validation.

**Report once:** branch/head, what data model is authoritative, migration/rollback approach, saved ID/profile preservation tests, exact check URLs, anything explicitly unverified, and next owner action. Do not merge or start WT-023B without review.
