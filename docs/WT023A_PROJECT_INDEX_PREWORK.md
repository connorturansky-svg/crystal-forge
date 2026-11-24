# WT-023A prework: read-only project folder index

**Purpose:** Independent engineering prework for [WT-023A #138](https://github.com/connorturansky-svg/crystal-forge/issues/138). No UI, cloud authentication or storage migration is introduced here. It is a tested, small, reusable helper so Codex can spend time on the *hard* part: safe persistent project ownership and reversible migration.

## Observed source contracts (main `dddb172a`, 22 Nov 2026)

1. `state.project` is the single active editable project. `project.id` is its identity; `project.models[]` and `project.tabs[]` are per-project. Two projects may legitimately contain models with the same ID/name because validation checks uniqueness **within** a project, not globally.
2. `state.savedProjects[]` contains project **snapshots**, assigned `snapshotId` in `sensory-studio.js::saveProjectSnapshot`. A saved snapshot can retain the same `project.id` as its active parent; creating a save does not create a new independent project. `replaceProject` loads one and marks all cached print preparations stale.
3. Existing `studio-organisation.js::ensureSnapshotIds` mutates snapshots in place to add IDs; do not call it from read-only Library rendering. A migration/recovery path is responsible for missing/duplicate IDs before interactive folder actions.
4. `state.library` is a **separate** revisioned model-source catalogue; `model.link.sourceId/revision` pins an installed linked model to a particular Library revision. Do not convert a linked model into a mutable independent object while organising folders.
5. `state.organisation.collections` are virtual **tags**. The validator drops unknown properties; new project-ownership metadata needs a deliberate additive schema path, not accidental overloading of collection memberships.
6. `editModel` increments revision and stales print jobs even for name edits. A *read-only* index must never call it; a future rename flow must either preserve this contract or explicitly update it with safe tests.
7. `studio-vault.js` content-addressed assets and `studio-sync-plan.js` conflict-aware recovery already protect local/cloud copies. Their stable project/snapshot/library/measurement references must survive unchanged.

## Prebuilt module

`tests/helpers/wt023-project-index.mjs::listProjectFolders(state)` derives a list of display groups, preserving snapshots under their parent `project.id` without creating IDs or modifying state. It requires already stable, unique snapshot IDs, fails clearly when input is invalid, treats active project title as authoritative, shows saved-version detail explicitly, and preserves duplicate titles or model names across projects. It intentionally **does not pretend to implement a persistent multi-project file store**.

`projectModelTabLabel(project, model)` renders the approved `Project : Model` text as a pure helper, without touching IDs or active tabs. This is **not wired to UI** in this QA prework.

`tests/wt023-project-index.test.mjs` asserts active vs saved identity, two independent projects with equal titles, snapshot chronology, duplicate/missing ID safety, no mutation, model/library link identity, untouched prepared print-job validity and private GitHub manifest/profile round-trip. Run it directly with `node tests/wt023-project-index.test.mjs` or as part of `npm run test:static`; it is imported by the existing documents test, so the repository release metadata checks treat the branch as tests/docs-only. It does **not** prove UI/physical print fit.

## What is still critical for Codex under #138

- Specify/write a **versioned, reversible, crash- and quota-safe persistent project ownership structure** that disambiguates independent projects from snapshots and preserves WT-015 collections/templates and WT-016 recovery merges. Do not merely rely on this display selector as a project database.
- Resolve project rename/version semantics, source profiles and per-project resource references, saved-template target project creation, conflict remapping and historical v1 import without losing any model.
- Build unit/Chromium migration tests that show old workspace and private remote backups round-trip with every ID/profile/print job intact; do not generate new snapshot IDs on every page load or silently merge two different projects because their title matches.
- Confirm exact-head CI, documents and the first non-destructive UI integration plan before proposing a merge. Independent QA must review the data model before #139 Library UI work begins.

**Boundary:** This is **test-only** prework. It makes no production module/schema/version changes, no storage writes, no server requests, and no migrations. After owner review, Codex may move the pure selector to production as part of a release-versioned WT-023A implementation. Codex should reuse or improve it rather than create another competing folder selector.
