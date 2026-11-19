# WT-018 backlog and integration ledger

Reviewed `main` at `f7c5a3ae68862338e9b7a719bbc54c59d839b616`. Its Git tree matches tested #67 exactly. Source branch heads and reachability come from GitHub's commit comparison to that main SHA.

| PR | Source head | Merge base with main | On main | Disposition |
| --- | --- | --- | --- | --- |
| [#37](https://github.com/connorturansky-svg/crystal-forge/pull/37) | `0dbd1c80ce255dbcefde73f5ef99d1517bc3a0f0` | `948cd5ac31330fc1c7da3f1386c9ad60e0328361` | No | External draft; preserve |
| [#42](https://github.com/connorturansky-svg/crystal-forge/pull/42) | `7f83ab3e9d8ab10525b36977da3dcee95edd077d` | `351e2c7cd6bb521f27b238354d8a5bc5c9ac3f35` | No | Owner decision; retain pilot artifact |
| [#65](https://github.com/connorturansky-svg/crystal-forge/pull/65) | `8646ccb1366f7a1a7b4cec8fe7a9a4774b40f918` | `8646ccb1366f7a1a7b4cec8fe7a9a4774b40f918` | Yes | On main |
| [#66](https://github.com/connorturansky-svg/crystal-forge/pull/66) | `8cf7133b2846f5ed7fdea6355c2bc6e1c5c3b890` | `8646ccb1366f7a1a7b4cec8fe7a9a4774b40f918` | No | Recovered in #71 |
| [#67](https://github.com/connorturansky-svg/crystal-forge/pull/67) | `cea72facd468b4032d65c2161d1e3f6ab4f8b91e` | `cea72facd468b4032d65c2161d1e3f6ab4f8b91e` | Yes | On main |
| [#68](https://github.com/connorturansky-svg/crystal-forge/pull/68) | `e77bb7406da06345a9606c524279b2144e4adad5` | `cea72facd468b4032d65c2161d1e3f6ab4f8b91e` | No | Recovered in #72 |
| [#69](https://github.com/connorturansky-svg/crystal-forge/pull/69) | `86b59911a887a6fed8f64df8af57f39e5504cc9d` | `cea72facd468b4032d65c2161d1e3f6ab4f8b91e` | No | Recovered in #73 |
| [#70](https://github.com/connorturansky-svg/crystal-forge/pull/70) | `6c6b15b6baacfc14057c6b9cac73fa5483f53d72` | `cea72facd468b4032d65c2161d1e3f6ab4f8b91e` | No | Review candidate #74; keep #70 open |

[Jordan’s separate SVG engine](https://github.com/connorturansky-svg/crystal-forge/pull/37) remains under #36. The [integration attribution](SVG_IMPORT_HANDOVER.md) records its source.

## Current issue dispositions

| Issue | Disposition | Remaining acceptance |
| --- | --- | --- |
| #1 | Owner decision | Consolidate outstanding research and design acceptance before retiring the historical queue. |
| #6 | Keep active | Move actual Cura profile import, 0.8 mm visibility and layer checks to #10 before retirement. |
| #7 | Keep active | Physical LED seating, cable bending, wire serviceability and optical testing. |
| #8 | Keep active | Map residual mechanical acceptance to #51 and #10 before considering retirement; keep the hold. |
| #9 | Keep active | Shared mounts, keyboard and touch placement, and model/part manipulation. |
| #10 | Keep active | Physically check Cura import, LED retention, cable seating, optical diffusion, thermal and mounting behaviour. |
| #31 | Closed complete | Independent read-only review delivered and [archived](https://github.com/connorturansky-svg/crystal-forge/blob/316d1d143e6767f8748f0fca6db8b3b9eab8829b/prompts/reviews/WT-001-stage-b-review.md). |
| #33 | Owner decision | Confirm protected-main and external contributor settings. |
| #36 | Keep active | Coordinate review with Jordan. |
| #38 | Blocked | Owner settings and contributor consent. |
| #39 | Owner decision | Manual assignment proved; Jordan to confirm usage/billing. |
| #51 | Keep on hold | Explicit owner instruction required before modular assembly resumes. |

## Draft checks and owner review order

- [#71](https://github.com/connorturansky-svg/crystal-forge/pull/71) at `c4f5b6d56a366f24b20be75550eb9fa906de9ee9` · [Static repository checks](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520708537) · [Verify Crystal Forge fabrication](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520708573) · [Browser smoke test](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520708673)
- [#72](https://github.com/connorturansky-svg/crystal-forge/pull/72) at `d3ffdbf18364775cc5ccf7c16044ce9c318a4094` · [Browser smoke test](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520943886) · [Verify Crystal Forge fabrication](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520943880) · [Static repository checks](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520943967)
- [#73](https://github.com/connorturansky-svg/crystal-forge/pull/73) at `688b10a273d4c172419bde762bd073518c320bfe` · [Verify Crystal Forge fabrication](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520951892) · [Browser smoke test](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520952143) · [Static repository checks](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520951910)
- [#74](https://github.com/connorturansky-svg/crystal-forge/pull/74) at `4f061beb3620162483531125fe378b799e191ac8` · [Verify Crystal Forge fabrication](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520962349) · [Static repository checks](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520962430) · [Browser smoke test](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520962288)
- [#75](https://github.com/connorturansky-svg/crystal-forge/pull/75) at `296e0233d0730b9f8b0e3c8a56bc0fe274e62df5` · [Verify Crystal Forge fabrication](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520976391) · [Static repository checks](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520976372) · [Browser smoke test](https://github.com/connorturansky-svg/crystal-forge/actions/runs/44520976325)

Review in order #71 → #72 → #73 → #74 → #75 → this documentation draft → [#78](https://github.com/connorturansky-svg/crystal-forge/pull/78). After each prerequisite lands, retarget the next draft to main, check its diff and require checks for the updated base. Preserve ancestry with merge commits or rebuild descendants if using squash. Confirm actual Manifold/STL/3MF fixtures and review the [builder matrix](MODEL_BUILDER_PARITY.md). #76 is planning-only and independent. Check [production review](PRODUCTION_REVIEW.md) before Cura/physical trials. Keep #70 and #42 open until their disposition is confirmed.
