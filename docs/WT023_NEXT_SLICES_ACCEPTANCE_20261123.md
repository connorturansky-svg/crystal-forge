# WT-023 — Library, resources and private cloud: next-slice acceptance brief

**Research and implementation planning only.** No software changes, no approved merge, no physical fit claim.

**Source baseline:** main 0e38435904970f952deeab8abacfd9725d385184, checked on 23 November 2026. This is a dated checkpoint, NOT a substitute for fetching current main when implementation begins. Parent [#137](https://github.com/connorturansky-svg/crystal-forge/issues/137); existing issues [#139](https://github.com/connorturansky-svg/crystal-forge/issues/139), [#140](https://github.com/connorturansky-svg/crystal-forge/issues/140), [#141](https://github.com/connorturansky-svg/crystal-forge/issues/141), [#142](https://github.com/connorturansky-svg/crystal-forge/issues/142).

The owner-approved architecture stands: **one active editable project; single-level virtual, collapsible project folders; tabs eventually labelled Project : Model; version-aware shared pixel/printer resources with reproducible overrides; private GitHub manual Check/Preview/Merge/Upload.** No hosted auth, PIN authentication, new backend or unattended sync.

## Current dependencies and scope

| Slice | Owner issue | Dependency | Deliverable |
|---|---|---|---|
| A — existing #147 | #138 | already under owner review | Transactional project/snapshot identity, safe open/save/switch |
| B1 — existing #151 | #139 | #147 accepted | Templates first, single-level collapsible project folders |
| **B2** | #139 | B1 merged | Template/model destination chooser: current/existing/new project |
| **C1** | #140 | B2 and accessibility conflicts reconciled | Required naming, project-qualified tabs, accessible model info |
| **C2** | #140 | C1 or separately reconciled renderer | Truthful lazy thumbnails and understandable fallback |
| **D1** | #141 | Stable A/B identity | Version-aware measured pixel catalogue |
| **D2** | #141 | D1 data contract | Shared printer and Cura preset catalogue |
| E0 — existing #148 | #142 | #147 accepted | Authenticated Git Blob fallback for large files |
| **E1** | #142 | E0 plus stable Library entry | Private repository connect and truthful status |
| **E2** | #142 | E1 plus stable resources | Explicit Check/Preview/Merge/Copy/Upload |

At this audit #147 was open; #151 and #148 were dependent drafts. #157 owns readability changes to CSS, index and release metadata; #158 owns Gear grips. Do not edit, duplicate or rebase these other agents' branches. A GitHub "merged" badge on a stacked feature branch is not proof it reached production main.

## Source findings and design consequences

**Model creation and tabs.** In sensory-studio.js, add(typeId, parameters, name) currently uses the family display name when name is absent and commits immediately. renderTabs shows model.name, not the project-qualified title. studio-documents.js keeps stable model IDs and revisions. Its editModel increments revision and makes related prepared jobs stale **even for a rename**, while modelFingerprint excludes name. C1 must explicitly choose and test whether to preserve this strict policy or introduce a safe metadata-only rename path. A mere label change must never silently alter revision semantics.

**Existing Library.** studio-organisation.js version 1 stores collections and templates; a model template pins source ID + revision, and a project template pins a saved snapshot ID. sensory-studio.js already has renderBuiltInTemplates, renderTemplates, insertLibraryModel, templateProject and replaceProject. B2 must reuse these and #147's candidate/commit transaction rather than creating another folder or duplicate Library data model.

**Thumbnail preview.** sensory-studio.js uses thumbnail(group), a 200 by 150 WebGL canvas, recipeThumbnail, and modelPicture. Failed render often becomes a generic “Preview unavailable” without detailed reason. Some cards recompute the generator recipe when model.thumbnail is absent. This can be wrong or unavailable for Crystal sources and imported mesh/SVG assets. Source-faithful previews need fingerprinting, lazy work and explicit errors, NOT compulsory expensive Manifold fabrication for every Library tile.

**Pixel profiles.** pixel-profiles.js offers built-in seed, bullet, gumdrop and custom measured profiles. normalisePixelProfile validates known fields and does not retain arbitrary future revision/notes properties. studio-profile-safety.js checks model references and protects a capped 30-custom-profile list; studio-sync-plan.js already remaps conflicting incoming pixel IDs when merging. An editable **versioned** resource catalogue needs an explicit backwards-compatible data contract and preservation tests before any UI. Never silently mutate an existing hole when a global profile changes.

**Printer settings.** resolveJobPrinter in studio-documents.js layers project.printer, then model.printerOverrides, then job.overrides. cura-profiles.js has Ultimaker 2+ and Ultimaker 3 Extended options, selected nozzle/core, material and calculated Cura quality differences. An exported Cura profile does NOT install or reconfigure a physical printer, and imported quality types may not exist for every machine/variant.

**Cloud.** github-vault.js has session-memory private-repository credentials, studio-vault.js packs content-hashed immutable assets and guarded remote manifests, and studio-sync-plan.js previews/merges archives and preserves local recovery. #148 adds a separate large Contents API Blob fallback. E1/E2 should layer user experience over this existing stack, not create a parallel remote database or move tokens into localStorage.

## B2 — template destination chooser

**Journey:** choose a built-in model, saved model, model template or complete project template. The chooser identifies source, type, pinned revision and whether a linked copy is supported. Choose current project, an existing saved project identified by stable ID, or a new project with a meaningful name. For model sources choose independently editable or linked immutable revision; confirm creates the model in the selected project.

- Open, Back, Escape, close and Cancel are **read-only**: compare original workspace storage bytes and current project/tab IDs after each.
- Two saved projects may share the same title; show enough distinguishing context (current/saved, revision, model count) and use ID not name.
- Existing-project target uses #147 safe switch and outgoing recoverable snapshot. Validate the *complete* candidate before durable write; only then update the active UI. Quota, competing-tab or invalid source errors leave state intact.
- Linked copy means a source ID + pinned revision with no ordinary editing until independent-copy action. Independent copy gets a fresh ID but retains referenced measured pixel fit or explicit source-independent profile snapshot.
- Do not rewrite all model creation and tab naming in B2; C1 owns that general change. Do not open a missing-source template as a generic unrelated preset.
- Fixtures: duplicate project names and duplicate model IDs across projects; three snapshots of one project; old Library revision; missing template source; seven built-in families; copied linked/independent models; legacy archive; full keyboard/touch and 390px dialog.

## C1 — names, tabs and model metadata

- Require an editable meaningful name on new native, Crystal, imported SVG and imported mesh creation. Preserve original legacy unnamed data; apply display-only fallback until explicitly renamed.
- Show Project : Model in each tab, with full aria-label and compact visual truncation where necessary. One project stays active; tabs may not become cross-project concurrent editing. Keep reorder, close, focus, undo/redo and keyboard switching.
- Accessible info control: family/generator type; project; revision; linked source/revision; valid created/modified dates; pixel/printer profile dependencies; thumbnail freshness; prepared job state. Distinguish *not yet prepared* from *invalid to print*.
- Explicitly test rename-related prepared-job staleness policy from existing editModel; don't accidentally label a previously prepared job current on a different revision.
- Fixtures: create/cancel/rename all seven families and compatible imports; long Unicode names, whitespace, keyboard/390px/200% zoom, legacy unnamed model; source pinned, model IDs/job IDs unchanged by tab display.

## C2 — truthful thumbnails

- Preview actual saved geometry and current model/build/material flags, not an unrelated generator default. Resolve Crystal adapter state and imported source assets faithfully or show precise **Unsupported / Missing source / Invalid source / Render failed** message with meaningful Retry.
- Cache key must consider generator/version, model geometry fingerprint, linked source revision, relevant pixel/profile and material dependencies, and renderer version. Invalidate on edited geometry and updated source; do not steal a thumbnail from an unrelated project snapshot.
- For 100+ cards, bound visible-card render work and memory. Handle cancelled filters/project switching and WebGL context loss. Dispose only resources actually owned by the thumbnail path; avoid destroying shared live editor geometries.
- Verify editor-to-thumbnail screenshot correspondences for seven built-in families and eligible imports; 100+ scroll/reload/card filter; disabled WebGL and missing assets; keyboard navigation must remain usable while previews fail.

## D1 — versioned measured pixel resources

**First task: specify and test persisted identity.** Current normalisePixelProfile strips unknown revision metadata. Proposed migration decision: stable resource ID plus immutable versioned samples or explicit captured fit snapshots, while preserving all existing custom-* identities and unchanged legacy v1 semantics.

- Built-in seed/bullet/gumdrop labelled nominal. Custom user measurements separate *LED measured*, *test socket printed* and *actual observed retention* evidence, with date and nozzle/material where known. Do not falsely mark typed dimensions verified.
- Editing a shared profile makes a new revision rather than silently mutating existing pinned models or old print jobs. A referenced resource cannot simply disappear: check active models, saved snapshots, pinned Library models, templates and prepared jobs.
- Same ID, revision and hash = idempotent; same ID/revision but different data = deterministic recovered copy/revision and imported-reference remapping, preserving local originals.
- Validate full localStorage/private-vault/import/export round trip and backward compatibility with Crystal and native per-hole profile fields.
- Fixtures: model A pins sample v1 and model B v2; two distinct P positions share custom profile; linked model; legacy backup; max-capacity profile list; corrupt incoming ID; deleted source; compare actual accepted STL/3MF bore sections at pinned versions.

## D2 — printer and Cura resources

- Keep existing effective scope precedence: project defaults → model override → print-job override; show source of each effective setting.
- Named resource revision/snapshot should include machine/nozzle/core/material/quality intent, compatibility, custom quality changes and warnings. Existing archives with inline printer overrides remain reproducible.
- A profile rename alone should not change printed part geometry. Effective printer/quality setting changes stale only affected jobs; never silently lose prepared-job model source revision.
- Explicitly differentiate a Cura *quality override file* from a printer installation or firmware configuration. Include selected machine/material/core compatibility warning and plain-text fallback for unsupported Cura quality types.
- Fixtures: UM2+ 0.4 mm PLA; UM3 Extended AA 0.8 PLA; PETG warning; unsupported UM3 0.6; project/model/job override cascade; imported old archive and private vault; physical Cura preview under issue #10.

## E1/E2 — private GitHub manual sync

- Library → Sync & Backups discovers and reuses existing private repository client. Connect using least-privilege repo-scoped credentials in **memory only**, prove repository is private and read/write access is appropriate; disconnect clears token. Never write token into project JSON, URL, browser storage, logs or screenshots.
- Keep **Saved locally** visibly separate from **Last confirmed GitHub backup (SHA/time)**. Suggested states: Local only; Connected not yet checked; Unsynced local changes; Checking; Remote changed; Conflicts — review; Uploading assets; Confirmed SHA/time; Failed — retry without losing data. Only server-confirmed manifest updates acknowledge an upload.
- Check and Preview validate source assets and diff project IDs, snapshots, Library revisions, profiles, template sources. Merge/Copy preserves recovery snapshot, handles profile-ID collisions and requires explicit selection. Upload uses immutable assets first and SHA-guarded manifest last; no last-write-wins.
- Integrate #148 authenticated Blob fallback for GitHub Contents responses with no inline Base64. Corrupt hash, missing asset, expired token, rate/quota, offline and upload interruption fail clearly without changing the active workspace.
- Two-device fixture: A uploads baseline; B checks/recovers; A and B diverge independently on a same-ID pixel profile, template and model; B previews and keeps copies; A's stale upload is rejected; recovery remains possible via local file backup. 390px, keyboard and permission expiry are acceptance cases.

## Required tests and handover for each implementation PR

| Slice | Focused unit tests | Real browser | Data/export validation |
|---|---|---|---|
| B2 | Destination ID, source revision, candidate rollback | Dialog, seven sources, Cancel, 390px, keyboard | Original project JSON unchanged on failure; vault round trip |
| C1 | Name/revision/job policy | Create/rename and tab navigation | IDs, links and prepared-job staleness |
| C2 | Fingerprint/cache/retry | Geometry screenshots and 100+ cards | Source-faithful previews, no invented fallback |
| D1 | Version pinning, merge/conflict and deletion reachability | Project/global/per-hole profile selection | Actual STL/3MF socket sizes plus v1 vault |
| D2 | Effective settings, unsupported quality/core | Printer and profile scope UI | Cura override metadata and #10 physical checks |
| E1 | Auth and status machine | Connect/disconnect keyboard/390px | Credential never persisted |
| E2 | Two-device SHA conflict and recovery | Preview/merge/failed upload | Hash integrity, unchanged local work on failure |

For any code PR: run **focused Node first**, then exact-head static, Chromium, Manifold/STL/3MF and seven-builder edge tests where relevant. Record exact SHA, file diff, actual non-skipped checks, user screenshots, release version, CHANGELOG and in-app What's New. No physical fit claim from software. Stop on invalid migration, data-loss path or unverified manufacturing geometry. The owner approves each merge; do not automatically deploy.

**Codex fast start after #147/#151:** B2 only. Later C1, then C2, D1, D2, E1 and E2 in independently reviewable slices. Research/testing on D1 and E1 may proceed without editing Codex's branches.
