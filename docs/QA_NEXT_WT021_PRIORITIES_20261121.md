# Next WT-021 software priorities after edge finishing and Gear #121

**Snapshot from the current main acceptance register at review:** docs/WT021_COMPLETION_REGISTER.md shows these five still PARTIAL entries in its identified DIM/FAB/FIT/CAL/PAR/UX table. The register is an acceptance ledger, **not an exhaustive live defect scanner**. Recheck main and tests before claiming a status.

## Prioritize by print impact, not feature count

| Suggested order | Existing acceptance | Why next | Focused Codex work package |
| --- | --- | --- | --- |
| 1 | FIT-02 (P0), view positive hardware / actual negative cutter | Visual and physical preview mismatches can hide a blocked LED or mounting bore despite valid mesh exports | One matched family-by-family evidence matrix: positive LED body, negative seat, insertion axis, wall/collision/breakthrough states, saved revision, Manifold cutter vs STL/3MF. Repair only proved discrepancies; don't invent unsupported side machining |
| 2 | FIT-03 (P0), continuous IN→OUT physical route | Route arrows/overlays are not proof of actual uninterrupted printed cable geometry | Representative route through P1→Pn, opposite IN/OUT, actual channel and perimeters, measured sections in STL/3MF, full browser workflow. Keep openwork/hollow unsupported cases explicit and safely blocked |
| 3 | PAR-02 (P1), selected-object manipulation persistence | UX-03/#118 provides typed numeric values and parameter Reset but does not prove independent dimensions on each additional body | Begin with raised Rotary Cap body; independent selected part width/depth/height, precise Reset, undo/redo, reload, revision invalidation and measured export parity; avoid rewriting other seven-family features |
| 4 | PAR-04 (P1), Cura profile compatibility | A generated profile may not match an actually installed printer/nozzle/material combo | Validate actual UM2+ and UM3 Extended profile imports, AA 0.8 where installed, 0.4 mm variants, 2.85 mm filament and fallback text; layer preview and machine envelope. Keep physical test evidence distinct from CI |
| Dependency-bound | DIM-01 (P0), historical Crystal dimension discrepancy | Existing regression fixed stale measured dimensions, but exact original 51×49×66 versus 44.7426×44.7718×61.2501 mm comparison needs the original model/project/export | Request/recover the original saved revision and STL. When available, replay the exact design through prepared mesh, STL, 3MF and Cura on a single identity; do not fabricate missing historical samples |

## Existing implemented/verified context

Current register identifies DIM-02/03/04/05, FAB-01/02, FIT-01, CAL-01/02, PAR-01/03 and UX-01 as VERIFIED on recorded suites. **Do not reimplement them**, but rerun critical regression tests whenever the same underlying geometry changes. The register still has outstanding scope: passing all implemented fixtures is not evidence that a user can fabricate every possible setting.

## Execution order and boundaries

1. Finish safe exposed-edge work first, using the independent test/evidence pack from draft PR #122. Keep feature geometry under Codex in a separate focused PR, not in QA branch.
2. Begin real first-print coupons and Cura acceptance under #10 using docs/QA_FIRST_PRINT_PLAN_20261121.md (draft PR #123). Physical observations may reprioritize the software backlog.
3. Then target FIT-02 in a small draft PR with a compact family matrix and exact-head evidence. FIT-03 can follow or overlap only with explicit owner/agent coordination, because both touch fitting and routing geometry.
4. Preserve historical DIM-01 as data-dependent. Avoid spending Codex credits speculating about a project that is not present.
5. Treat the GitHub Pages older-tab retention task from merged #115 as a separate release QA/Jordan lane; it should not interfere with geometry.

**Ownership:** Issue #79 software; #10 printed/optical/structural evidence; #105 agent conflict coordination; #51 modular splitting remains on hold. Owner alone merges and deploys.
