# Physical production acceptance register — transferred from #10

Owner retains physical sign-off. This register is NOT a certificate. Software assurance continues in #178; modular fabrication #179; physical tests below remain pending unless evidence is recorded. Historical issue #10 retains prior checklists and CI links.

| Gate | Required evidence | Status |
|---|---|---|
| Cura profile import | Actual printer, core/nozzle, material, Cura version, imported settings and screenshot | Pending |
| Layer inspection | Sliced STL/3MF roofs, roots, walls, channels, bores, orientation, support and bridging review for applicable families | Pending |
| Pixel socket fit | Measured actual body, bore coupon, clearance, insertion/removal and retention | Pending |
| Wiring | Real cable bend, length, strain relief, accessible exit and serviceability | Pending |
| Optical output | LED illumination of intended regions, heat and light transmission with actual material | Pending |
| Assembly | Printed registered parts, dowel/coupon fit, tolerance across printer/material, assembly orientation and retention | Pending |
| Mounting | Actual mounting hardware, fixture and independent mechanical assessment; secondary retention where appropriate | Pending |
| Workshop/installation safety | Technician instructions, appropriate electrical/thermal and handling assessment; no automatic child-safe or overhead claim | Pending |

Record date, model ID/revision or project fixture, exact source commit, printer/nozzle, material, slicer version/profile, export identifiers, measured result, photos and reviewer. A failed test remains open in this register with corrective PR link. Automated CI and geometric evidence remain separate. No statement of physical readiness until owner reviews and records corresponding evidence.

Software QA still required in #178: 10/16/40/60 representative crystal benchmarks across fabrication modes, worker cancellation/stale results, cache reuse/memory, migration fixtures, actual STL/3MF verification, pack/BOM/instructions checks, seven-family parity and performance. Reference #10 original checklist; closure of its issue transfers scope, not acceptance.
