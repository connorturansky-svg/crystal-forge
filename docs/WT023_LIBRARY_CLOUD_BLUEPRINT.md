# WT-023 · Library, project folders, preset catalogues and cloud repository blueprint

**Status:** proposed architecture, not shipped implementation. **Audit date:** 22 November 2026. **Owner-approved cloud direction:** existing private GitHub repository with improved **manual** Studio sync first. No hosted login, unattended background upload or PIN-based repository authentication in this milestone.
**Source baseline:** `main` `7ff6ba8ba8dd0525563e2c933c0a9a5cc920c0f7` after merged #135. Recheck GitHub before implementation.
**Owner milestone:** [WT-023 #137](https://github.com/connorturansky-svg/crystal-forge/issues/137). **Do not merge planning work or implement contested product decisions without owner approval.**

## Owner-approved design decisions — 22 November 2026

The owner **explicitly approved** the four architectural defaults below. They are no longer outstanding design questions, but this approval does **not** authorise automatic merging, new cloud account creation or destructive migrations.

1. **Single-level project folders**: user-visible, collapsible projects with stable project ownership/identity; no nested subfolders in first release.
2. **One active project**: the model tab rail labels each as `Project : Model` (compact visually on small screens, full accessible identity), without concurrent editing across projects.
3. **Global/shared profile catalogue**: reusable, version-aware pixel types and printer/Cura profiles, selected at project level with explicit model/job overrides and no silent reconfiguration of saved hardware.
4. **Private GitHub manual sync first**: clearer Connect, Check, Preview, safe Merge/Copy, explicit Upload and local/remote revision/status. No PIN, hosted sign-in or unattended automatic cross-device sync in this milestone.

**GitHub milestone:** [#137](https://github.com/connorturansky-svg/crystal-forge/issues/137); first narrow implementation [#138](https://github.com/connorturansky-svg/crystal-forge/issues/138). Existing WT-022 search PR #136 merged on `main` at `dddb172a26b5d9e2b70df607951f938069b62ab3`. Product work may begin from latest main; keep separate CI #131 and physical print QA #10 independent.

## 0. Executive design decision

Keep the already working source-of-truth model, version history, private-GitHub vault, calibrated pixel data and non-destructive conflict recovery. **Reorganise how people see and move work** around actual named Projects and shared reusable Resources. Avoid a broad rewrite of the geometry editor or a new unaudited cloud backend.

**Short hierarchy:** Templates & starting points → Projects (collapsible) → Models / Pixel settings / Print settings → Shared Resources (saved models, pixel types, printer/Cura profiles) → Sync & Backups.

A folder is a *UI collection of actual projects or project contents*, not a folder on disk or in the GitHub repository. Clarify this in labels. Do not present a new project as a local file unless the user explicitly exported one.

## 1. What is really implemented today

| Topic | Source evidence | Current behaviour / important limitation |
|---|---|---|
| Active workspace | `studio-documents.js`, `sensory-studio.js` | `state.project` with `project.id/title/models/tabs/activeTab/printer/printJobs` is autosaved in the current browser profile. A model is not a separate disk file. |
| Saved projects | `studio-documents.js`, `sensory-studio.js` | `state.savedProjects` keeps project snapshots, each with a `snapshotId`; opening one saves the current project as a copy. A snapshot is not necessarily an independently synced remote editable project. |
| Saved reusable models | `state.library` and `saveLibraryRevision/insertLibraryModel` | Stable Library record IDs and revision lists; independent editable copies or pinned linked revisions. Don't remove, retarget or overwrite source revisions automatically. |
| Collections, favourites, templates | `studio-organisation.js` | `collections[]`, `items` membership and version-pinned model/project templates; these are virtual tags/metadata, not project ownership folders. |
| Templates and naming | `sensory-studio.js::renderBuiltInTemplates/renderTemplates/add` | Clicking built-in template adds a model directly into the active project. `add()` accepts null name and uses family display name; tabs show only `model.name`. |
| Library previews | `sensory-studio.js::thumbnail/recipeThumbnail/modelPicture/renderLibraryCards` | 200×150 thumbnail screenshot from live/recipe 3D group where possible; otherwise generic “Preview unavailable”. Older/imported/snapshot models often lack an image; saved projects only show the first stored thumbnail. |
| Pixel types | `pixel-profiles.js`, `studio-v3.js`, `sensory-studio.js` | Built-in seed, bullet and gumdrop; user-created measured pixel profiles; profiles are shared between builders but managed mainly in Pixel controls, not a universal resource catalogue. Existing model fit references and A–G dimensions must survive. |
| Print settings | `cura-profiles.js` and Print Centre | UM2+ and UM3 Extended plus custom choice, project defaults and per-job overrides; .curaprofile generated as *overrides*, not a guaranteed installed printer or physical tested recipe. No versioned shared printer-profile catalogue yet. |
| Legacy Crystal cloud | `github-vault.js` / `studio-v3.js` | Private GitHub repository configured in Crystal controls. Fine-grained token held in session memory, not project JSON. Optional 3.5-second auto-sync belongs to **legacy Crystal vault**, not Studio automatic cross-device updates. |
| Studio cloud | `studio-vault.js`, `studio-sync-plan.js`, `sensory-studio.js::syncStudio` | `.sensory-model-studio/manifest-v1.json` points to immutable SHA-256 asset JSON; upload assets first, guard manifest SHA; private remote Check/Preview/Merge or manual Upload. Local recovery copies and same-ID conflict preservation. **Manual** sync, not live collaborative sync. |
| Whole backup | `docs/BACKUP_RECOVERY.md` | Complete JSON download/restoration with preview/copy/merge; active project is deliberately not replaced automatically. Browser deletion can still destroy work without export/cloud copy. |

**Cloud terms to surface to the user:**
- **Saved locally:** data is currently stored in this browser, not guaranteed on another device.
- **Backed up on GitHub:** the *confirmed manifest SHA* for the last complete upload, with remote revision/time.
- **Remote changed:** another device updated the manifest; review changes and reconcile before uploading.
- **Working offline:** continue editing locally; never claim remote synced.
- **Preview-only:** checking remote and seeing its contents does not modify local models or projects.

Current GitHub repo paths and existing manifest are implementation details, **not project-folder names**.

## 2. Navigation and precise language

```text
LIBRARY
  Find anything… [models / projects / templates / pixel types / printers]
  START SOMETHING
    Built-in model templates (seven families)
    My model templates
    Project templates
  PROJECTS                         [+ New project]
    ▾ Current: Project name
       Models (n)                  [+ New model]
       Pixel settings              [chosen profile(s), not duplicates]
       Printer & print settings    [printer default and job overrides]
       Versions / snapshots        [recoverable prior saved states]
    ▸ Project A                    [Open] [Details] [Copy item]
    ▸ Project B
    ▸ Archived projects
  SHARED RESOURCES
    Saved models & versions
    Pixel types                    [Built-in] [My measured presets]
    3D printers & Cura profiles    [Known machines] [My presets]
    Favourites / collections
  SYNC & BACKUPS
    Local / Connected / Unsynced / Conflicts / Synced [timestamp]
    Connect private GitHub / Check cloud / Upload / Review changes
    Download complete backup / Import / Recovery history
```

Use collapsible **project panels** immediately; user-created nested folders are optional and should not be smuggled into the project identity schema before approval. Current/Archived can be metadata views, not destructive moving/archiving. Retain existing collection filters as *cross-project tags*, not duplicate project stores.

Recommended user-facing labels:
- Replace **“In this project”** with **“Models in [actual project title]”** where needed, otherwise remove the redundant flat section under the new tree.
- **“Saved models”** → **“Reusable models”**. Clearly distinguish a reusable saved *Library source* from models belonging to a project.
- **“Saved projects”** → **“Projects”** and label backups/previous snapshots as **“Versions”** if stable project identity can be correctly preserved.
- **“Templates”** → **“Start from a template”**; selecting it is never an instant destructive switch.
- **“Cloud sync”** → **“Sync & Backups”** until a genuinely automatic, multi-device service exists.

## 3. User journeys and contracts

### A. New template/model
Click template → chooser: **Use in project: [current/existing/search]** or **Create new project** → **Model name** required (prefilled editable suggestion, never silently accepted) → source behaviour (New independent copy / Link to pinned Library revision when eligible) → Create. On Cancel no new project/model/revision, no accidental active-project replacement. If target project is not active, save safely and either stay put or explicitly **Open new model**. Don't mutate print jobs in unrelated projects.

### B. Switch projects or open from another project
Expand project without switching. Select Model → Open project, or Copy to current/another project. Copy creates new model ID, preserves generator and measured profile dependencies, and can remain linked only when approved. Opening a saved project first makes a recoverable copy of the current work, does not conflate snapshotId with its stable project ID, and preserves tabs, job revisions and printer settings.

### C. Shared Pixel types
Show built-in **Nominal** profiles separately from custom **Measured / Verified by print**. Clearly distinguish a measurement recorded in software from real physical fit approval. Inspect A–G body/flange/cable dimensions using the existing dimension diagram. Allow Duplicate, Edit, Add to Project, Export and Delete with dependency warnings. Pinned fit must not drift if a global custom name/measurement changes. Do not silently change pixel clearances or retarget old sockets.

### D. Printers and profiles
Allow saved **Machine** (physical bed, nozzle/core, materials), **Quality profile** (Cura overrides) and **project default** selection; preserve per-model and per-job overrides and show effective origin. Avoid claiming a generated .curaprofile includes printer firmware/G-code or proven Cura toolpaths. Warn if machine/nozzle/material unsupported and require inspection in Cura before real printing.

### E. Model names, info, tabs, previews
Require model name in creation flow. A generated starter name is fine as a prefilled suggestion. Bottom model tab: `Project : Model`, with compact visual abbreviation plus full screen-reader label and tooltip on mobile. Existing project currently supports only one active project's open tabs: **do not silently implement multi-project tabs** without a separate owner decision and identity/storage contract.

Info (hover, keyboard focus and touch dialog) exposes family, generator ID, independent/linked source and revision, associated project, timestamps and source/preset/profile provenance. Editable settings stay in established Design/Build/Pixels/Print workspaces.

Render real geometry for every eligible family; the thumbnail is a derivative **not authoritative model data**. Use deterministic preview from actual saved parameters/build/materials; validate cached image against stable model fingerprint/generator version and invalidate on edits. Lazy bounded queue, capped dimension and bytes, backpressure, WebGL/context cleanup, no eager heavy Manifold exports for all cards. For unsupported/corrupt/missing import assets, show a truthful error + Retry instead of a made-up image or silent blank.

### F. Cloud journey (owner-approved first release)
User enters Library → Sync & Backups → Connect private GitHub repository. Explain private repo and fine-grained Contents token, session-memory credential handling and no public/repo-source uploads. Device A: review status → Upload workspace → confirm manifest SHA/time. Device B: connect → Check cloud read-only → inspect local/remote-only/conflicting projects/models/profiles/templates → choose Keep local / Merge-and-copy-conflicts / Import selected as copy → recoverable local checkpoint → apply. Changes on Device B require explicit Upload after reconciliation. Reconnect/new device must re-authorise; untrusted/failed/private repo check blocks remote use without corrupting local work.

Never describe the legacy Crystal 3.5-second auto-sync as whole-Studio autosync. Fully automatic push/pull is **explicitly deferred**. Owner chose the existing private GitHub vault, straightforward manual Check/Preview/Merge/Upload and visible remote status first; no hosted login is required for the WT-023 rollout.

**Security and new-device access:** The public GitHub Pages website contains no private user vault by default. To read private vault assets, a newly connected device must have genuine repository authorisation. A 4-digit PIN has 10,000 possibilities, cannot protect a stored PAT, and cannot grant private GitHub access in a public client-only app. Any 4-digit feature is at most an optional, explicitly low-security **local screen/privacy lock on an already authorised device** and does not encrypt browser data. The current flow stays repo-scoped fine-grained token in memory; a less awkward approved GitHub/device-auth flow would be a separate future security design. See [WT-023G #145](https://github.com/connorturansky-svg/crystal-forge/issues/145).

## 4. Data contract and migration proposal (for #138 to validate, not a preselected schema)

**Core identities:** Project ID, Saved snapshot ID, Model ID, saved Library Source ID + revision, Template ID pinned to source + revision, global Resource ID + immutable revision, and Collection ID. Display names are **not** IDs; model/project names may collide. The active project and saved projects must be reconcilable without overwriting the only surviving copy.

Possible **additive** metadata (select exact implementation in WT-023A after tests): `projectIndex` listing stable IDs, titles, lastOpened and optional folder/archived flags; `resourceLibrary` containing versioned pixel/printer records, with project/profile ID references. Keep legacy `state.project`, `state.savedProjects`, `state.organisation`, `state.library` and `state.pixelProfiles` legible until a reversible conversion succeeds. Avoid reusing `collections[]` to mean both project ownership and tag membership.

**Preservation constraints:**
1. Existing schemaVersion 1 local workspace, archived JSON and remote v1 manifests import without changing a single saved model, print job or fitting dimension until explicit user action.
2. Never deduplicate model/project IDs by equal names. Conflicting IDs with different content require copy IDs and reference remapping, not last-write-wins.
3. A model's saved `generator.typeId/typeVersion`, parameters, build and material/print dependencies are portable. Linked revision references remain pinned, not secretly promoted.
4. Existing `studio-vault.js` immutable assets and guarded manifest remain the recovery contract. Extend optionally and backward-compatibly if new resource metadata is needed; old manifest readers should not be incorrectly told they can open a newer unsupported format.
5. Snapshot and cloud transaction errors leave saved local state intact and offer a recovery backup; unknown repo, hash mismatch, missing asset, timeout, full browser quota or stale manifest do not mark data saved.
6. For any new printer/profile resource, effective settings are explicit (global preset → project default → model override → job override), and only a real effective fabrication change invalidates prepared print jobs.
7. Protect multi-tab updates with existing workspace version checks; separate concurrent devices with SHA conflict check and preview reconciliation.

## 5. Independent Codex slices and ownership

| Slice / Issue | Scope | Dependency / overlap control | Exit gate |
|---|---|---|---|
| [WT-023A #138](https://github.com/connorturansky-svg/crystal-forge/issues/138) | identity, project/snapshot distinction, project-folder metadata, reversible migration | Start after owner choice; do not rewrite #136 search | unit document/vault/backup and original model ID tests |
| [WT-023B #139](https://github.com/connorturansky-svg/crystal-forge/issues/139) | Library information architecture, collapsing project view and template destination chooser | A merged, then work in `sensory-studio.js` | real Chromium template targeting, 390px, safe project open/copy |
| [WT-023C #140](https://github.com/connorturansky-svg/crystal-forge/issues/140) | required names, `Project : Model` tabs, metadata, truthful full-family thumbnails | B merged; same Library renderer ownership | seven families, legacy previews, lazy cache and save/reload |
| [WT-023D #141](https://github.com/connorturansky-svg/crystal-forge/issues/141) | reusable pixel then printer/Cura resource catalogues | A/B contract; **split into D1 and D2 PRs** | preserved calibrations and correct print/profile overrides |
| [WT-023E #142](https://github.com/connorturansky-svg/crystal-forge/issues/142) | first-class cloud setup and sync status in Library, two-device manual recovery | schema/resource slices integrated; no new server | mock private GitHub conflict/partial upload/offline/390px |
| [WT-023F #143](https://github.com/connorturansky-svg/crystal-forge/issues/143) | optional future account-backed cloud / autosync ADR, not code | **deferred; GitHub manual first is approved** | provider, security, cost and exportability decision |
| [WT-023G #145](https://github.com/connorturansky-svg/crystal-forge/issues/145) | new-device onboarding and optional 4-digit convenience PIN **security design only** | review with #142 before cloud UI code | private repo auth remains authoritative; no PIN-based remote access |

**Release coordination update:** #135 and #136 are merged on main. **Independent CI draft #131** remains separate and must not be concurrently edited by Codex. 

**Historical coordination:** [#135](https://github.com/connorturansky-svg/crystal-forge/pull/135) Wave print repair is merged into `7ff6ba8`; [#136](https://github.com/connorturansky-svg/crystal-forge/pull/136) Support-Free Shoulders search is draft and touches `sensory-studio.js`, `index.html`; [#131](https://github.com/connorturansky-svg/crystal-forge/pull/131) CI efficiency is draft and touches Actions workflows/classifier. Do not begin #139–#142 editing their source until #136 and current releases are reconciled. #131 should independently complete/land before expensive test-heavy WT-023 work if approved. Keep real physical [Issue #10](https://github.com/connorturansky-svg/crystal-forge/issues/10) on the printing track; UI scope does not substitute for tested parts.

## 6. Acceptance campaign

**Local and compatibility:** legacy model/project/imported 3D mesh saved, project rename, duplicate-name handling, create/rename/cancel, saved Library revisions and pinned models, template project chooser, nested IDs and tabs, project switch with recovery, 390px and desktop layout.

**Assets and pictures:** real Crystal, Tile, Gear, Wave, Cap, Character, Pebble + imported SVG/STL/OBJ where supported, stale thumbnail after edit, missing custom profile/source, corrupt/non-renderable model, GPU context loss, 100-card lazy browsing and offline.

**Cloud:** two mock devices A/B; different projects same names; same IDs different source; preserved measured fit; source/collection/template ID remap; remote manifest changed between asset and commit; partial upload; GitHub public-repo refusal; invalid token; network offline; localStorage quota; reload after recovery; optional selective revision; no content leaks in logs.

**Print:** unchanged effective printer/nozzle/material across resources; dual-material UM3 compatibility warnings; Cura quality overrides export; prepared STL/3MF geometry and source snapshot integrity after project/library moves; no print claimed physically validated from CI.

**Release:** one separate PR per slice (D1/D2 separate), explicit file ownership, latest-head `npm run test:static`, targeted Node, Chromium desktop + 390px, Manifold only if source/export changes, `CHANGELOG.md`, actual app version + What's New when user-visible, updated `docs/AI_HANDOVER.md` and acceptance register. Draft to owner-ready only with evidence, no Codex auto-merge or silent user data migration.

## 7. Decisions for owner (not blocking the planning PR)

1. **Project folders — DECIDED:** single-level expandable named projects, no nested subfolders in first implementation. Virtual app folders, not OS folders.
2. **Tabs — DECIDED:** one active editable project at a time; each tab displays `Project : Model`. No simultaneous cross-project tabs in initial implementation.
3. **Cloud — DECIDED:** **private GitHub vault with manual conflict-safe sync first**. Hosted login and unattended sync deferred. A proposed 4-digit PIN is **not cloud authentication**; optional local privacy-screen lock and secure new-device onboarding require a separate UX/security choice in [#145](https://github.com/connorturansky-svg/crystal-forge/issues/145).
4. **Resources — DECIDED:** globally shared, versioned pixel and printer/Cura profiles with project-level selection and explicit pinning/snapshot for export reproducibility. Do not duplicate definitions in every project by default.

**Approved decision scope:** All four main architecture decisions are now approved. Use the existing private GitHub repository as cloud storage and improve the manual connection/status/Check/Preview/Merge/Upload experience. This is not approval to implement a PIN login, a hosted backend or continuous multi-device sync.

No assumption above grants permission to change hosting, create private repositories, store user tokens, delete data or merge product PRs.
