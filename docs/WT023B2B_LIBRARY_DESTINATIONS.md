# Library: inspect versions and choose destinations (WT-023B2b candidate)

From **Library → Projects**, expand a project folder, reveal a saved version's Actions and choose **Inspect version**. View the saved model names, genuine previews, source revisions and project defaults without opening or editing that version. Close inspection to continue with the current project.

For a built-in starting point, saved model or reusable model template, choose the existing creation/copy action. Pick the destination and confirm the model name. **Current project** adds a new model without invalidating unrelated prepared jobs. **Saved version** opens a complete candidate based on that exact version and saves the outgoing project. The historical version remains unchanged. **New project** asks for a name; the new project starts with the displayed Studio defaults, not another project's custom calibration. Same titles do not mean the same identity. Whole-project templates always create a new independent project and copy the template's defaults; they are not merged into another project.

A linked copy stays pinned to the selected Library revision. An independent copy can be edited. **Older revision** selects an exact saved revision. Cancel/Escape leaves the destination unchanged. A quota or competing-tab warning keeps the chooser open and does not publish the candidate; export a backup if required before reloading.

## Engineering handover

- Core candidate and one-write publish boundary: `src/ui/library-destination.mjs`. Chooser: `src/ui/library-destination-dialog.mjs`. The existing `writeWorkspace` guard and `projectWorkspaceCandidate` remain authoritative; no parallel store or schema change.
- `sensory-studio.js` publishes after the durable write. Current destination retains existing live model/job objects and prepared caches; other destinations use the existing replacement path. Historical snapshots and pinned revisions remain unchanged.
- Run `node tests/wt023-library-destination.test.mjs`, `npm run test:static`, `node tests/wt023-compact-library-browser.mjs` and the complete browser/Manifold suites; the core contracts are included by studio-documents.test.mjs. Browser cases exercise actual modal, cancel, storage failure, competing-tab guard, saved inspection, exact snapshot, independent same-title project and reload. Also verify both themes, touch, 200% zoom, real images and Help.
- Candidate version .35.45 is provisional; coordinate #169/#174/#158 before merge and regenerate release metadata after integration. No local browser, screen-reader or physical tests claimed by this API-only contributor. Use exact-head hosted checks and inspect their screenshots.
