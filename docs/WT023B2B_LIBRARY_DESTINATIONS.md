# Library: inspect versions and choose destinations (WT-023B2b candidate)

From **Library → Projects**, expand a project folder, reveal a saved version's Actions and choose **Inspect version**. View the saved model names, genuine previews, source revisions and project defaults without opening or editing that version. Close inspection to continue with the current project.

For a built-in starting point, saved model or reusable model template, choose the existing creation/copy action. Pick the destination and confirm the model name. **Current project** adds a new model without invalidating unrelated prepared jobs. **Saved version** opens a complete candidate based on that exact version and saves the outgoing project. The historical version remains unchanged. **New project** asks for a name; the new project starts with the displayed Studio defaults, not another project's custom calibration. Same titles do not mean the same identity. Whole-project templates always create a new independent project and copy the template's defaults; they are not merged into another project.

A linked copy stays pinned to the selected Library revision. An independent copy can be edited. **Older revision** selects an exact saved revision. Cancel/Escape leaves the destination unchanged. A quota or competing-tab warning keeps the chooser open and does not publish the candidate; export a backup if required before reloading.

Inspection starts at its heading so the introduction stays visible on narrow screens. Closing or cancelling restores a visible source control, using the card's Actions button if its action overlay has closed. The timestamp shown in inspection is the project's stored modification time.

## Engineering handover

- Core candidate and one-write publish boundary: `src/ui/library-destination.mjs`. Chooser: `src/ui/library-destination-dialog.mjs`. The existing `writeWorkspace` guard and `projectWorkspaceCandidate` remain authoritative; no parallel store or schema change.
- `sensory-studio.js` publishes after the durable write. Current destination retains existing live model/job objects and prepared caches; other destinations use the existing replacement path. Historical snapshots and pinned revisions remain unchanged.
- Run `node tests/wt023-library-destination.test.mjs`, `npm run test:static`, `node tests/wt023-compact-library-browser.mjs` and the complete browser/Manifold suites; the core contracts are included by studio-documents.test.mjs. Browser cases exercise actual modal, cancel, storage failure, competing-tab guard, saved inspection, exact snapshot, independent same-title project and reload. Also verify both themes, touch, 200% zoom, real images and Help.
- Candidate version .35.52 follows merged .35.51. Current main is integrated, retaining Info history, drawer sizing, exact controls and cog transforms. Inspection displays exact project/snapshot/model identities, labelled saved settings and missing-source guidance. The revision chooser previews the selected saved geometry. The main New Model picker uses the same destination transaction and preserves selected presets.
- Local Chromium covers seven families × current/saved/new destinations, identical project names with separate IDs, exact snapshots/revisions, unchanged history/settings, real retained prepared-job downloads, cancel/quota/competing tabs, touch creation, focus, both themes at 390/768/1440 px and 200% text. Screenshots are `qa/wt023b2b-*.png`. Node contracts include JSON and hashed-vault round trips. Exact final-head hosted checks remain the release gate. Screen-reader and physical print evaluations are separate.

## Follow-on reconciliation

| PR | Dependency and recommended sequence |
|---|---|
| #176 appearance and viewport layers | Integrate owner-merged #175 before mounting runtime controls. Preserve source-faithful Library/revision previews, current-model cache identity and the shared chooser. Apply colour only to confirmed editable models; layers stay view preferences. Reconcile Help/CSS and allocate a fresh release above current main. |
| #177 project resources and backup centre | Directly depends on the B2b transaction boundary. Reuse the existing workspace and guarded single write for pinned resources and destination defaults; replace explicit fresh defaults only through the approved D1/D2 contract. Extend inspection to human-facing resource versions. Preserve E1/E2 manual backup and two-tab refusal. |
| #178 structural parity | Rebase its QA assumptions onto owner-merged #175 and include the destination matrix, unchanged prepared jobs, exact snapshots, backup round trips and all seven builders. Keep software evidence distinct from physical acceptance. |
| #179 modular fabrication | Integrate merged geometry/export main and #175 before UI/pack integration. New assembly models and jobs must retain project identity, source revision and snapshot semantics. Extend real Manifold/export and cancellation fixtures; allocate a release above current main. Physical registration remains a separate gate. |

These recommendations do not modify the other branches or assert that their unfinished checkpoints are ready.
