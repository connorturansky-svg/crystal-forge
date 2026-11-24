# Continue WT-023C on the existing draft PR

Repo: connorturansky-svg/crystal-forge. Branch: feat/wt023c-viewport-model-drawer. Issue #140.

Read AGENTS.md, docs/AI_HANDOVER.md and docs/WT023C_MODEL_DRAWER_IMPLEMENTATION.md. That one file contains the source map, design, researched accessibility/preview strategy, hooks and acceptance matrix. Run node tests/wt023-model-drawer-contract.test.mjs first. The prepared real browser test tests/wt023-model-drawer-browser.mjs is intentionally not registered until implementation; run it after wiring the UI, extend as needed and register it without dropping existing tests.

Coordinate with #163 Help and #158 Gear; #148 backup belongs to ChatGPT. Integrate current main, preserve #147/#151 transactions and #161 nested Pages assets. Build actual feature on THIS PR: collapsed centre-only one-third drawer with real thumbnails, safe switch/close/reorder, naming, info and bounded source-faithful preview service. No duplicate project store, second PR, unrelated refactor or fake preview. If C2 needs separate review, state dependency and leave #140 open. Update user guide, version, changelog, generated release metadata and handover; verify exact-head full tests and screenshots. Owner merge only.
