# 015 — Visual Library Collections, Favourites and Reusable Templates

> **OWNER-APPROVED OVERNIGHT PHASE A.** The user asked for a substantial single overnight Codex handoff working on **two separate WT milestones sequentially**. This is FIRST. Phase B = [WT-016 / Issue #59](https://github.com/connorturansky-svg/crystal-forge/issues/59); it MUST NOT begin until WT-015's draft PR is open and tests pass.
> **Task:** [WT-015 / Issue #58](https://github.com/connorturansky-svg/crystal-forge/issues/58).
> **Immutable approved revision:** Full 40-char SHA pinned in Issue #58. Read the entire file at that exact SHA, not the moving planning branch.
> **Verified main when authored:** `e3af2b87f71724e0bace93222448847709a5fa4a`, after merged [WT-013 / PR #57](https://github.com/connorturansky-svg/crystal-forge/pull/57) (exact head static/Chromium/Manifold/contributor green). Refresh main at coding time. WT-014 shell [PR #56](https://github.com/connorturansky-svg/crystal-forge/pull/56) merged.
> **Parent PR:** `[WT-015] Visual Library collections, favourites and reusable templates`; source `feat/WT-015-library-organisation`; base **main**.
> **Other ownership:** [WT-011 / Issue #51](https://github.com/connorturansky-svg/crystal-forge/issues/51) modular splitting LOW/ON HOLD, immutable spec unchanged. External [WT-003 SVG PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) open/draft, untouched. No AI dispatcher or cloud-auth work.
> **Stacked PR strategy:** WT-016 will be based on **this feature branch** rather than main, ensuring two sequential commits/PRs and no overlapping code merges. Both draft; no auto-merge/deploy.

## User value

Pixel Model Maker is now a multi-model design/print tool with real Library cards and saved projects. The owner wants reusable things organised as a creative collection, not a flat list: star favourites, organise items into named collections, quickly filter by theme, and use a saved model or project as a reusable starting point. An existing saved library model may be inserted as a **linked** revision or an **independent** copy; both established behaviours must survive.

**Deliver genuine persistent user data and actions**, not decorative tags. The two high-priority catalogue/routing features, WT-013 real light inspector and WT-014 layout all remain operational.

## Verified baseline contracts (confirm latest)

- `studio-documents.js` owns schemaVersion 1, canonical JSON validation, versioned `state.library` model records, copy/linked insertion, saved project snapshots and print jobs. `createProject` already has a `collections:[]` field but that alone is not a complete cross-Library collection index. Avoid using it as a second authority.
- `sensory-studio.js::showLibrary/renderLibraryCards` renders project models, versioned saved Library models and `state.savedProjects` with image, label and actions. Saved-project Rename/Open and existing backups are working.
- `state.legacyTemplates` is imported during legacy migration; **do not delete, reinterpret or convert** legacy Crystal templates automatically. New user-created templates have their own explicit metadata.
- `studio-vault.js::packStudioVault/unpackStudioVault` stores the current project, Library revisions, saved projects and legacy templates through content-addressed assets. Adding organisation metadata to local state **without vault preservation would silently lose it on sync**; update round-trip support in WT-015 before starting WT-016.
- WT-014 interface: left Design/Build `#smsTools`, centre viewport, right `#smsPrecision`, horizontal bottom model rail `#smsModelRail`, compact top controls and draggable/collapsible panels. Keep it; do not reinstate old More/Panels or lower viewport slider.
- Current `studio-vault.js` already verifies immutable asset hashes and manifest SHA on push; do **not** modify that safety model just to add a favourites feature.
- `studio-migration.js` restores legacy schemaVersion 1 workspace. Preserve all untouched original local storage keys and older backup/project import.

## Feature A — small, additive organisation source of truth

Choose one **versioned, backwards-compatible** optional `state.organisation` structure (or equivalent well-justified **single** metadata record) separate from parametric meshes, job state, content hashes and linked model source. Recommended fields:
```js
{
  version: 1,
  collections: [{id, name, description?}],
  items: {
    // Stable keys such as "model:<library record id>" / "project:<saved snapshot id>"
    "model:<id>": {favorite: true|false, collectionIds: ["..."]},
    "project:<id>": {favorite: true|false, collectionIds: ["..."]}
  },
  templates: [{id, name, kind: "model"|"project", sourceId, revision?: positiveInt}]
}
```
This is a **recommendation, not a mandatory naming contract**. Key requirements: stable IDs rather than title strings, clear source type, bounded validation (empty, duplicate ID, unknown reference, invalid collection, invalid version), deterministic sorting when needed, no uncontrolled object growth, escape all user text in DOM. Never put passwords, API tokens, downloadable meshes or remote credentials in organisation fields.

- Preserve project model/source IDs, model revisions, `modelFingerprint` and prepared-print revision correctness. Setting a favourite must **not** stale a print job or regenerate geometry.
- No forced top-level `SCHEMA_VERSION` bump or wholesale saved project conversion. Old workspace with no organisation must load with empty defaults; only new metadata is additive.
- Explicitly document whether favourites on **active project models** are allowed; at minimum support versioned saved **Library models** and saved **project snapshots**, which are stable. Project snapshots may share IDs from successive saves—assign fresh snapshot identity only when needed without silently modifying the original saved project source or breaking an existing Open action.
- Collections are virtual, **not filesystem folders** or destructive model moves. Renaming a collection doesn't change member IDs. Deleting a collection requires confirmation and removes membership only, never underlying models/projects/templates.
- New changes should be undoable where consistent with existing workflow or at least safely cancelable with no mutation. Persist explicitly with existing `save()`.

## Feature B — visible, working Library controls

- In **Library** show a compact, discoverable **Favourites**, **All items**, **Collections** selection area (sidebar or top small toolbar within existing Library overlay) and collection Create/Rename/Delete/Manage. Respect original text search, generator type filter, linked/independent copy and saved-project Rename/Open.
- Saved model cards and saved project cards include working **Favourite toggle** (with `aria-pressed`, clear label), collection membership picker/multi-select, understandable folder/tags badges, and optional **Save as reusable template** action.
- Collection filtering must work jointly with current name search and model family filter; project cards should appear only where relevant, with a clear empty state. Favourites can be toggled without opening/deleting a model.
- Keep cached/reused thumbnails, avoid regenerating all model meshes/WebGL renderers merely to change a star or collection.
- At 390–430px and 1440px, collections and per-card controls remain keyboard/touch accessible with non-colour-only state. Use existing design tokens, simple descriptions and no dependency UI framework.

## Feature C — genuinely reusable model and project templates

**Model templates**
1. A saved Library model can be marked/saved as a named template referencing a **specific approved saved revision** (not just a live mutable model). Keep source revision and a safe visible snapshot preview.
2. Applying a model template offers both established options: **Independent copy** (editable independent model with new ID) and **Linked copy** (references the pinned Library source/revision; remains protected from edits until detached/updated by explicit actions). Reuse `insertLibraryModel` rather than reinvent link records.
3. If a source revision is missing, show `Unavailable source` and keep metadata for recovery or offer explicit removal, **not** a different template silently.

**Project templates**
4. Save an explicit saved-project snapshot as a reusable starting-point template. Choosing it creates a **new independent project identity** with valid model IDs/tabs/active-tab references, printer defaults, material/profile settings and **no stale prepared result marked exportable**. Any queued preparation must start stale/queued; workers/cache are not serialised as valid prepared results.
5. Before replacing the current active project, show an explicit confirmation and take a **recoverable local snapshot**. Cancel leaves project and templates unchanged. If copying all nested model IDs is required to prevent duplicates/linked collisions, remap all tab/active/job references consistently; alternatively use existing robust project-copy/replace path with a distinct project ID and preserved internal valid identities (document the policy).
6. A template is a **user-created model/project starter**, not a generated HTML preview. A named template must continue to work after save/reload and appear on a clear `Templates` view. **Never** automatically convert/erase `legacyTemplates` from old Crystal data.
7. Template deletion/removal removes only template metadata, not source model/project. Collections/favourites and templates maintain stable refs after saved-project Rename.

## Feature D — persistence & private backup parity

- Save/reload local `WORKSPACE_KEY`; old schemaVersion 1 project backup remains importable. `backup()` full JSON includes organisation data without including credentials.
- Additive `StudioVault` pack/unpack stores the new **optional organisation** data in the **existing content-addressed manifest v1** in a backwards-compatible manner (e.g. one additional optional hashed asset reference). Support old remote manifests missing this property; return normalised defaults without rejecting old backups.
- Existing vault hash mismatch, failed asset write and SHA protection remain correct. New metadata must round-trip even when Library includes linked revisions and templates.
- Do not perform network sync automatically, show clear state that collections and favourites are local until backed up.
- If storage quota is exceeded, never claim save succeeded; show actionable error and keep prior serialized state recoverable.

## Acceptance criteria (must verify actual paths)

**WT015-01:** Create two named collections, rename one, assign one saved Library model and one saved project, search/type filter, reload and see same membership/thumbnail/name. Reject empty/overlong names and collection name collisions according to documented policy.

**WT015-02:** Toggle a favourite on a model and saved project; `Favourites` filter shows exactly those entries, persists across reload, does not mutate model revisions or invalidate unrelated print jobs.

**WT015-03:** Remove membership; delete a collection with confirmation. Models/projects, linked version history and unrelated collections remain intact. Cancel changes nothing.

**WT015-04:** Make a model template from a saved revision; insert independent and linked variants with fresh IDs. Confirm linked read-only/update handling, detachment and source revision pinning survive reload.

**WT015-05:** Save project as template, apply to new workspace via confirmation/backed-up current source, check model/tabs/active ID integrity and printer/profiles; old jobs cannot export stale prepared data. Cancel is true no-op.

**WT015-06:** Rename a saved project and a collection without orphaning template/favourite/collection references; missing source warnings are explicit and non-destructive.

**WT015-07:** Existing older schemaVersion 1 workspace and Crystal `legacyTemplates` load unchanged; new organisational state saves/reloads and backup JSON round-trips without unsupported project schema churn.

**WT015-08:** `packStudioVault/unpackStudioVault` round-trip the new organisation data; older remote manifests remain readable; all asset hashes and failed-write recovery continue to pass. Nothing stores tokens in returned JSON.

**WT015-09:** Real Chromium interactions on desktop and 390px narrow: create/manage collection, favourite, filter, template create/apply, search + type filter, confirmation, navigation and save/reload. Screenshots and no console/page errors.

**WT015-10:** Regress Crystal one/multi-LED Build/Inspector, WT-012 Tile/Gear serial routes, WT-014 panel/resizer, Print Centre and saved-project Open/Rename; do not perform unnecessary fabrication changes. Run `npm run test:static`, relevant Node document/vault/browser tests and exact-head hosted checks.

**WT015-11:** Single app release/version bump, matching `CHANGELOG.md` / in-app What's New, brief `docs/AI_HANDOVER.md`, relevant roadmap and test documentation. One **draft PR** with exact SHA/test links/screenshots and honest limitations; no auto-merge.

## Allowed code, test and scope boundary

Prefer `sensory-studio.js`, minimal `studio-documents.js` pure organisation helpers (or one new small `studio-organisation.js`), `studio-vault.js` optional manifest field, `studio-migration.js` only if needed for no-data-loss default, existing `sensory-studio.css` and focused Node/Chromium tests. A staged one-time local metadata migration is fine, but **no remodel of user project source, geometry/Manifold, Web Worker, Cura or printer state**.

No remote account setup, automation, OAuth, SVG/STL/OBJ import, AI dispatch, physical hardware, modular splits, or speculative all-family new generators. All actual data mutation must use stable identities, validation and transactional save where feasible. No new dependencies.

### Exact GitHub contract

1. Fetch fresh `main`; check Issues #58/#59, approved SHA, existing claims, open PRs. Read `AGENTS.md`, `docs/AI_HANDOVER.md`, this pinned brief, relevant source/tests.
2. Claim `CLAIM WT-015 — @connorturansky-svg Codex — feat/WT-015-library-organisation — collections favourites templates`.
3. Branch `feat/WT-015-library-organisation` from latest main. Work, test, bump release metadata once.
4. Open **draft** PR to **main** titled `[WT-015] Visual Library collections, favourites and reusable templates` with:

```
Task issue: #58
Approved spec: prompts/015-library-collections-templates.md @ <FULL_SHA_PINNED_ON_ISSUE_58>
Scope: Stable collections, favourites and versioned model/project templates with library+vault persistence.
Related PRs/duplicates: WT-013 #57 merged; WT-014 #56 merged; WT-016 #59 follows as stacked PR; WT-011 #51 on hold; WT-003 SVG #37 external.
Test evidence: <exact implementation SHA; actual static, Node, Chromium and CI URLs, screenshots>
Handover: docs/AI_HANDOVER.md
Risks: <older data, template/ID round-trip and manual edge cases>
```

5. **GATE before Phase B:** WT-015 must be in a reviewable draft PR with actual pass results for focused static/document/vault and browser paths. If not green/working, **STOP** and report; do not launch WT-016. Do **not merge** PR A automatically.
