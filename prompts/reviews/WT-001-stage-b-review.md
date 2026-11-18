# WT-001 — Independent review findings for Stage B (PR #30)

> **Recorded:** 2026-11-18, from an externally supplied two-page PDF titled `0-WT-001 Independent Review.pdf`. This is a structured transcription/synthesis of the review, **not** an independent re-test by the orchestrator.
>
> **Verdict from reviewer:** Changes requested, no confirmed P0 blocker.
>
> **Evidence reviewed by reviewer:** PR #30 head `a118975436e89c0bac623821494f6c68cdb3e23c`; merge `cb2da6dd42d5eeddd14da2673dfd5a02a5523722`; prior main `948cd5ac31330fc1c7da3f1386c9ad60e0328361`. The reviewer reported matching PR/merge trees and local Chromium/Manifold probes.
>
> **PR #30:** https://github.com/connorturansky-svg/crystal-forge/pull/30
> **Review Issue:** https://github.com/connorturansky-svg/crystal-forge/issues/31
> **Active next implementation:** https://github.com/connorturansky-svg/crystal-forge/pull/35 (WT-002). **Do not create a competing PR** on the same Studio shell/generator files.

## P1-1 — Contextual visual palette / precision controls desynchronise

**Reproduce:** Select a Swept turbine; Right Arrow on lower diameter slider yields 100.5 mm on both controls and geometry. Change exact diameter on the right to 110 mm. Geometry becomes 110 mm but lower palette still shows 100.5 mm until rerender. Select Mechanical in right settings with 11 teeth: undercut validation rejects the edit, saved state remains Decorative, but the select incorrectly displays Mechanical.

**Required fix:** Make both editors render from the authoritative accepted model state; synchronise changes in both directions immediately; restore the last accepted value after any rejected commit. Preserve focus/keyboard editing semantics and history.

**Test:** DOM/keyboard Playwright regression for lower->right and right->lower edits, rejected invalid choices, model state, undo/reload and focus retention.

## P1-2 — Default pixel hole can miss all solid material on openwork gear

**Reproduce:** Swept turbine → Build → Add pixel hole. Automatic candidate X=23, Z=0 mm on default geometry (and X=25.3 after resize to 110 mm) lands inside a window. Manifold correctly rejects: `Pixel hole 1 does not cut the model.` The reviewer found X=-23, Z=0 removed approximately 176 mm³ and prepared successfully on the default model.

**Required fix:** Candidate placement must validate **actual solid material intersection**, window/cutout clearance, walls and existing holes, not just overall model bounds. Do not remove/relax the final Manifold guard; if no safe placement exists, give a useful error rather than saving a non-cutting feature.

**Test:** Browser Add pixel hole → saved Build state → exact matching Manifold preparation for a real openwork preset at multiple sizes; accepted candidate makes a nonzero physical cut; invalid candidate fails informatively.

## P1-3 — Creative gear two-material preview/export mismatch

**Reproduce:** Enable Two material regions on any of six new creative gear presets with default Face colour region. Reviewer observed entirely primary-colour preview meshes, while Manifold emitted primary and secondary material STL bodies. Recipe uses horizontal split at `thickness - 0.8 mm` and export marks the *lower* body as secondary, contradicting apparent intent of `Face`.

**Required fix:** Define and document whether `Face` means contrasting top visible face or lower body. Make preview and export use that same geometric region definition. Verify actual material volume/position and faces, not merely presence of two output files.

**Test:** Cross-check preview mesh/material with exported 3MF/STL regions, at least two gear styles and default/alternate depth.

## P2 — Keep selected component/pixel editing in the lower palette

When a part is selected in the viewport, the right panel shows Individual parts but the lower palette remains on whole-model controls. In Build, it offers Add pixel hole and fit coupon but detailed position, size and removal remain exclusively on the right. Illustrated starting points are below a long text-control grid.

**Requested follow-up:** Context-sensitive selected-part or selected-pixel lower-palette tools, prominent visual style gallery, keyboard/focus tests. This can be integrated with WT-002's contextual palette work after the P1s.

## Verified / not verified

**Reviewer confirmed:** Lower palette does edit real 3D geometry; Undo/Redo/reload retain at least the tested gear choice; exact-head static/Chromium/Manifold passed on PR #30; all six preset defaults exported both material modes in catalogue test; legacy gear parameters reproduce old recipes where new keys absent; representative Crystal checks passed.

**Reviewer cautioned:** Four of six presets still rely on radial windows; not six unrelated mechanisms. Legacy preservation not independently validated via actual owner archive or live vault. New Crystal palette manufacturing actions not fully exercised. No installed Cura slice, physical tolerances, genuine meshing, optical quality, tactile comfort or child/overhead safety verification.

## Orchestrator disposition / coordination

- These are **reported reviewer findings**, not fresh independent code retests.
- **Fix P1-1 and P1-2 before expanding shared palette/Build usage to six families.** Fix P1-3 before broad two-material design expansion. They are functional regressions despite green CI because the original tests missed specific user journeys.
- PR #35 is already the single in-flight WT-002 implementation branch. Inform its integration owner of this review and request a planned early corrective checkpoint **without opening a conflicting feature branch**. If the owner chooses a small preceding hotfix PR, coordinate explicit file boundaries and rebase WT-002 afterwards.
- Require three targeted reproductions and screenshots/test URLs on the **latest commit** before calling Stage B fully accepted; then close the review Issue after recording disposition.
- Mark P2 separately from blocking P1s and retain unresolved physical validation in existing issues rather than duplicating them.
- The original supplied PDF is not committed to this public repository; this summary retains the actionable evidence without assuming the PDF's redistribution rights.
