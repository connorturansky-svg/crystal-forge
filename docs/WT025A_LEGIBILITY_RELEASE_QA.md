# WT-025A — readable default text: release and review guide

> **Implementation candidate, NOT YET DEPLOYED.** [Scope issue #154](https://github.com/connorturansky-svg/crystal-forge/issues/154). The broader design is in [planning PR #155](https://github.com/connorturansky-svg/crystal-forge/pull/155). **Owner approval is required to merge.** Recheck PR head and exact CI results; this dated document is not a live status feed.

## What changes for an actual user after release

- Main Crystal Forge controls now use a **16 px** base reading size rather than 13 px.
- Setting labels, short explanations, search results and common status text use approximately **14–16 px**. The existing Help and What's New dialog also uses a 16 px default with more line spacing.
- The Workspaces and main toolbar have more comfortable clickable labels. Both dark and light themes remain available.
- The same eight workspace destinations, seven builders, edit controls, search, tooltips, keyboard controls and saved projects remain in place. Browser zoom is still supported; there is no new mandatory mode or accessibility questionnaire.
- **What has not shipped:** the two-level Help system belongs to [WT-024 #152](https://github.com/connorturansky-svg/crystal-forge/issues/152) and [PR #153](https://github.com/connorturansky-svg/crystal-forge/pull/153), while “Since your last visit” belongs to a later WT-025 PR. This release does **not** implement either one.

## Manual user walkthrough after CI

1. Open the PR's local/staged build and the current main build at the same 1440×950 viewport. Compare **Design**, **Build**, **Pixels**, **Wiring**, **Mounting**, **Library**, **Home** and **Print Centre**, checking label size, focus outline, readability and text wrapping.
2. Use the search for **mounting grid** and **smooth sharp edges**; confirm the result titles and explanatory lines are easy to read and the controls still open.
3. Open **Help → What’s New** and the **Help** tab, in both dark and light themes. Confirm the release list is a legible 16px and that the overlay closes without moving the current editing selection.
4. At **390px** width, switch workspaces, open the tool finder and check the save/theme/help buttons. No page-level sideways scrolling or hidden critical controls. Sidebar scrolling is expected.
5. At 200% browser text-only scaling or 200% zoom, ensure the rem-based text increases, controls remain operable and focus labels are not cut off. Check 400% zoom/reflow manually where meaningful; the 3D canvas is a legitimate two-dimensional exception, **not an exception for surrounding labels**.
6. Try a real keyboard-only route using Tab/Shift+Tab, Space, Enter and Escape. Check a screen reader such as NVDA if available. Automated browser assertions do **not** prove screen-reader or cognitive-accessibility success.
7. Open an existing model, switch Simple/Advanced, modify a non-critical numeric control, close/reopen the model and verify autosaved edits. Prepare one existing printable mesh and check that export/stale behaviour has not changed. The CSS change does not itself manipulate model data.

## Automated review evidence

- `tests/studio-workspaces-browser.mjs` includes new **rendered** font-size checks for main text, tool-search labels/results, Help and What's New, both themes, keyboard focus, desktop and 390px layout across all eight workspaces, 200% equivalent reflow and 200% text-size scaling. The same fixture retains #150’s seven-builder and real mounting save/reload assertions.
- Screenshots are **qa/unified-wt025-legibility-390.png**, **qa/unified-wt025-legibility-1440.png**, and **qa/unified-wt025-legibility-200-reflow.png**. The existing `qa/unified-*.png` CI artifact rule collects them. The 200% screenshot uses a 720 CSS-pixel viewport and 2× DPR to reproduce reflow on a 1440-pixel desktop. It is separate from the 200% root text-size assertion and a manual native browser-zoom check.
- Exact-head CI gates to inspect: Static repository checks and release-metadata version parity; Browser smoke test (including this fixture); Verify Crystal Forge fabrication; Seven-builder edge finishing. Older passed SHAs are not sufficient. No existing workflow must be loosened to accommodate this feature.
- No fonts are downloaded, third-party services added, print geometry altered, or new browser storage written. CSS changes can change layout; scrutinise narrow/wide overlap and scroll before approval.

## Agent/Codex handover and known limits

- **Only three production files are in the initial scope:** `index.html` for the CSS/Help/release version, `sensory-studio.css` for runtime-generated interface styles and `CHANGELOG.md` for the shipped note. The new test and this document are separate source contracts.
- `tests/release-metadata.mjs` requires the latest version number and generated HTML release history to exactly match `CHANGELOG.md`; never hand-edit the release history without matching the generation script. Node command: `node scripts/generate-release-metadata.mjs --check`.
- Leave the one-tooltip architecture and `#descriptionsBtn` intact until the independently owned WT-024 implementation; don't race or duplicate it.
- Tiny 3D annotations and certain dense geometry graphics have not received a full design audit in this small slice. Leave physical pixel/magnet markers and 3D canvas proportions untouched; schedule a focused follow-up after measured usability testing.
- **No statement of WCAG 2.2 AA certification, full cognitive accessibility or physical fit** can come from CSS alone. Report unresolved contrast/zoom/screen-reader failures before merge.
- If another PR lands on main, rebase/reconcile the commit, regenerate release metadata if a later version took precedence, then rerun full exact-head CI. Owner still approves the final merge and actual Pages release.

Research: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/), [W3C cognitive accessibility guidance](https://www.w3.org/TR/coga-usable/), [British Dyslexia Association style guide](https://cdn.bdadyslexia.org.uk/uploads/documents/Advice/style-guide/BDA-Style-Guide-2023.pdf).
