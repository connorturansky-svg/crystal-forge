# WT-025 — human-first GitHub PR and agent reporting checklist

> **Proposed contribution convention**, not an assertion that every existing PR already follows it. Canonical [Issue #154](https://github.com/connorturansky-svg/crystal-forge/issues/154). Use alongside existing `.github/PULL_REQUEST_TEMPLATE.md`, `.github/pull_request_template.md`, `CONTRIBUTING.md` and `AGENTS.md`; do not create a third competing PR template.

## Top of every user-visible PR (four short answers)

**What users will notice:** Write 1–3 plain sentences. Explain the change in the user's words, not just WT numbers, file names or coding terms.

**Where to find it:** Name the workspace, button and setting group. If a control moved, include its previous name/location and the new route.

**What might behave differently:** Describe saved settings, keyboard/focus state, print preparation, regressions, required migration or limitations. State when nothing changes for saved models.

**What is not yet done:** Flag remaining tests, design decisions, unreleased dependencies and physical verification without softening the distinction.

Then add compact technical sections for source contracts, evidence, dependencies and rollback. Keep the introduction scannable even if the engineering details are extensive.

## Status words that cannot be interchanged

- **Planned:** documented intention, not available to users.
- **Implemented in draft:** code exists only in an unmerged PR. Tests may or may not be complete.
- **Merged:** included in main; Pages deployment still needs verification.
- **Deployed:** exact release SHA confirmed on public Pages.
- **Physically verified:** tested with actual Cura/printed hardware, including limits; a passing Boolean/mesh test is not enough.

## Evidence to include

- Exact **base SHA, head SHA**, links to CI runs, actual tested environments. Never paste “all green” if a check was not run or refers to an older commit.
- For UI changes, real before/after screenshots at readable zoom and narrow layout, focus path and light/dark comparison where relevant. Describe what a reader should see in each image; images are supporting evidence, not the only explanation.
- For accessibility changes, test keyboard focus, screen-reader names, contrast, text resizing/spacing, cognitive burden and visual comprehension; explain manual checks still needed.
- For manufacturing changes, state separate real-print/Cura limits. No changes to STL/3MF intended? Say so, then run regression gates that verify it.
- For guidance and Docs-only PRs, state **no runtime or Pages app behaviour changed**. Do not claim passing browser tests prove a feature not yet implemented.

## Review by another ChatGPT chat or Codex agent

1. Read `AGENTS.md`, `docs/PROJECT_STATUS.md`, this PR's linked issue/spec, current main/open PRs and affected source. Verify old status text against GitHub.
2. Choose a **single named lane** and claim relevant files. Do not edit another AI's working tree, update an unowned branch or recreate WT-024's help system.
3. Report: **done / still open / blocked / needs owner**, with links. Do not invent percentages, merge readiness, local tests or physical proof.
4. Update the shortest current handover, with stable issue/PR links and exact known limitations. Future agents should not have to reread an entire chat to continue.
5. Never silently change `index.html` Help, `CHANGELOG.md`, live GitHub Pages or project status to announce a feature before it ships.

## Tiny example of a good change summary

**What you'll notice:** “Mounting patterns now appear together in Mounting. Search for ‘magnets in a circle’ if you previously used Build.”

**Where:** “Mounting → Mounting patterns.”

**Safety:** “Existing saved hole positions remain unchanged; new patterns still require validation before preparing a print file.”

**Status:** “Available only in this draft until merged, released and deployed.”

**Checks:** “Link exact Chromium focus/zoom evidence and fabrication regression; disclose any tests not yet run.”
