# Owner priority review — Wonder Trunks Studio — 18 November 2026

> **Status:** Owner-supplied prioritisation, **NOT** approval to launch a new coding task. This is a queue and recommendation document, not an immutable implementation brief.
> **Source:** User's direct submitted choices from the interactive prioritisation of 18 backlog areas.
> **No automatic implementation:** Do not dispatch Codex, create an approved WT-012 brief, assign an external agent, replace/supersede WT-011, push to `main`, or merge any PR merely because this file exists.
> **Verified baseline at review:** `main` = `9abcecbe0235c889d16139e110e1b8c621472ca1`; WT-010 [PR #50](https://github.com/connorturansky-svg/crystal-forge/pull/50) **merged**; WT-003 external SVG [PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) remains open/draft; WT-011 approved spec remains pinned and implementation not started. Recheck GitHub before coding.

## User's exact priority selections

| Area | Priority | Relevant existing tracking |
| --- | --- | --- |
| Expand visual model catalogue | **HIGH** | [Roadmap](https://github.com/connorturansky-svg/crystal-forge/blob/main/docs/ROADMAP.md), [Phase D #9](https://github.com/connorturansky-svg/crystal-forge/issues/9) |
| Pixel routing across all *suitable* models | **HIGH** | [Phase B #7](https://github.com/connorturansky-svg/crystal-forge/issues/7), [WT-006 PR #41](https://github.com/connorturansky-svg/crystal-forge/pull/41) |
| Better 3D appearance and inspection | MEDIUM | [Phase D #9](https://github.com/connorturansky-svg/crystal-forge/issues/9) |
| True light pathways and hollow structures | MEDIUM | [Phase B #7](https://github.com/connorturansky-svg/crystal-forge/issues/7) |
| Collections, favourites and reusable templates | MEDIUM | [Project context](https://github.com/connorturansky-svg/crystal-forge/blob/planning/prompts/prompts/PROJECT_CONTEXT.md) |
| Better cross-device project synchronisation | MEDIUM | [Master audit #1](https://github.com/connorturansky-svg/crystal-forge/issues/1) |
| Beginner-friendly and accessible interface | MEDIUM | [Phase D #9](https://github.com/connorturansky-svg/crystal-forge/issues/9) |
| Cura optimisation and physical calibration | MEDIUM | [Phase A #6](https://github.com/connorturansky-svg/crystal-forge/issues/6) |
| Performance, regression tests and reliability | MEDIUM | [Phase E #10](https://github.com/connorturansky-svg/crystal-forge/issues/10) |
| Removable LEDs, retention clips and strain relief | LOW | [Phase B #7](https://github.com/connorturansky-svg/crystal-forge/issues/7) |
| Mounting and mechanical connections | LOW | [Phase C #8](https://github.com/connorturansky-svg/crystal-forge/issues/8) |
| xLights/FPP pixel mapping exports | LOW | [Master audit #1](https://github.com/connorturansky-svg/crystal-forge/issues/1) |
| Automatic splitting and assembly connectors | **LOW** | [WT-011 #51](https://github.com/connorturansky-svg/crystal-forge/issues/51), [Phase C #8](https://github.com/connorturansky-svg/crystal-forge/issues/8) |
| Automated AI/Codex development coordination | LOW | [WT-004 #38](https://github.com/connorturansky-svg/crystal-forge/issues/38) |
| Integrate the existing external SVG importer | **UNDECIDED** | [WT-003 #36](https://github.com/connorturansky-svg/crystal-forge/issues/36) / [draft PR #37](https://github.com/connorturansky-svg/crystal-forge/pull/37) |
| Import STL and OBJ | UNDECIDED | [Roadmap](https://github.com/connorturansky-svg/crystal-forge/blob/main/docs/ROADMAP.md) |
| Advanced direct 3D editing | UNDECIDED | [Phase D #9](https://github.com/connorturansky-svg/crystal-forge/issues/9) |
| Advanced Crystal Cluster controls | UNDECIDED | [Phase D #9](https://github.com/connorturansky-svg/crystal-forge/issues/9) |

**Interpretation:** `UNDECIDED` is **not** `LOW`, `NOT NEEDED`, or approval to cancel. User selected 2 high, 7 medium, 5 low, 4 undecided. Do not infer anything beyond these choices.

## Recommended next implementation order — PROPOSAL, owner decision pending

### Candidate first full-size phase: WT-012 (number reserved as proposal, **not** approved or created)

**Shared physical pixel-string routing across compatible native model families.** Establish common, tested Build routing contracts **before** adding significantly more geometry. Reuse the existing Crystal Cluster `planHardware`, `pixel-string-routing`, `pixel-spacing-snap` and physical manufacturing constraints; carefully implement first on genuinely compatible Light Pods and solid Tactile Tiles, optionally supported Gear bases where real material/clearance can be proven. Opposed 180° pixel IN/OUT, P1→Pn order, separate tails, smooth tangential tracks, 25/50/100/custom mm curved lengths, overlength errors, preview/manufacturing/CSV parity, valid save/reload and actual browser/Manifold tests. Unsupported thin, hollow, openwork or cable-blocked families must show clear restrictions — **no fabricated universal support**. Preserve Crystal behaviour as regression benchmark. The existing generic `studio-pixel-builder.js` primarily makes vertical bores, **not** fully routed serial tracks.

This is a **candidate**: there is no approved brief, task claim, coding branch or PR yet. Confirm order/scope with owner first.

### Candidate second full-size phase: WT-013 (planning placeholder only)

**Creative visual catalogue expansion.** True structural diversity (not just colour/dimension variations), stronger preset previews, differentiated silhouettes/topologies, useful shape/relief parameters and persisted visual collections for gears, tactile tiles, waves, controls, characters and light pods. Crystal Clusters remain the functional benchmark; advanced Crystal multi-select/weighted forms are **undecided** and must not be silently included. All new geometry needs connected, validated Manifold STL/3MF and applicable shared Build compatibility. Possible to schedule this first instead if owner prefers immediate creative output. Avoid merging both candidate phases into an unbounded single PR.

### Later proposed groupings (MEDIUM priorities; order not user-approved)

- **WT-014 candidate:** real optical/light-path material inspection, cavity continuity, conservative cutaways, performance tests; maintain distinct software vs physical validation.
- **WT-015 candidate:** Library favourites/collections/reusable models plus accessible onboarding/keyboard/touch help; no migration that threatens local projects.
- **WT-016 candidate:** better cross-device saving, Cura/calibration workflows and performance/reliability. Consider separating for reasonable PR limits and security/physical test boundaries.

These are *illustrative buckets only*, not promised scope, reserved issues, fixed numerical sequence or executable tasks.

## Explicit deferral — WT-011 stays intact

User says they **rarely print models requiring splitting** and gave automatic splitting/joints **LOW** priority. Keep the existing owner-approved [WT-011 / #51](https://github.com/connorturansky-svg/crystal-forge/issues/51) and immutable `prompts/011-modular-assembly.md` untouched, but **put implementation on hold**. Do not close its issue, remove its approved SHA, overwrite the spec, start its branch or send it to Codex unless the user reprioritises it. Draft status does not mean cancellation.

## Decision gate

Owner must explicitly choose **routing-first**, **catalogue-first**, or a different priority/order before an approved WT-012 implementation brief and new Issue are created. After approval, use a pinned `planning/prompts` commit SHA, fresh `main`, one clearly bounded draft PR, real browser/Manifold checks and no auto-merge. Jordan's unmerged SVG work stays isolated regardless of order. Cross-cutting reliability tests are required in every implementation rather than postponed as an excuse to omit them.
