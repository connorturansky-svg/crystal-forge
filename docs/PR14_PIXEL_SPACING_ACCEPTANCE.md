# PR14 · v0.15.1 — Snap internal pixels to measured string length

**Goal:** Starting with manually placed P1–Pn LEDs roughly within ±5 mm of actual 25/50/100/custom mm centre-to-centre cable length, align the physical smooth routed path through each pixel socket by moving later sockets a few millimetres.

## Algorithm and safeguards

- Build → Cable channels → **Snap internal pixels to cable length**. **Maximum adjustment per pixel** defaults to 5 mm and may be deliberately raised to 25 mm for larger corrections.
- **P1 stays exactly fixed.** Internal P1→P2, P2→P3 … links are solved in order; any previous successfully aligned link stays within the selected length band.
- The target comes from `pixelStringSpacing`. The solver uses `planHardware` (same curves, socket centres, bend, boundaries, attachment obstacles and clearances used for fabrication), **not** simple XY centre distance.
- Actual length is brought to **target minus approximately 0.07 mm**, with a **0.18 mm acceptable range below target** to avoid introducing over-length (red) routes.
- Each moved pixel stays within its configured movement radius around the originally placed position. If it cannot achieve the target within this range, the link remains unchanged and its true before-length and reason are shown.
- The first IN and final OUT perimeter cable tails are explicitly **exempt from pitch matching**; they may be shorter or longer. Previously valid tail routes must remain connected.
- Original pixel IDs, profile types, rotations, original project settings, and mount positions are preserved. A successful adjustment commits only once, supporting Undo and project backup. Failure or already-perfect positions do not create a history entry.

## Automated tests

- `npm run test:static` including `tests/pixel-spacing-snap.test.mjs`: three-pixel 48 → 50 mm, fixed P1, per-pixel maximum movement, actual curved planner results, intact independent inlet/outlet, unchanged inputs and measured profiles, repeat-snap idempotence, far-too-short 48 vs 100 mm rejection, inactive/legacy/one-pixel refusal.
- `npm run test:browser`: new control and 5 mm default visible; existing saved project and 3D Build/Print suites remain green.
- `npm test`: existing real Manifold spline/groove fabrication suite must remain green.
- **Do not merge** unless every suite passes on the exact latest PR commit.

## Manual acceptance with actual crystal project

1. Make a copy of the saved project and a complete backup of measured gumdrop profiles.
2. Build → Pixel string, enable underside wire channels, set **100 mm** stock pitch.
3. Place P1 and P2 about 95–99 mm apart **measured along the pink/cyan curved route**; P3 can also be similarly close.
4. Set **Maximum adjustment per pixel = 5 mm** and click Snap. Inspect numerical P1/P2/P3 coordinates before and after, and the measured label on each internal route (approximately 99.8–100.0 mm). P1 should not move.
5. Confirm IN → P1 tail and final Pn → OUT tail remain connected but are not forced to 100 mm.
6. Try a 51 mm route against 100 mm stock; no implausible ~49 mm jump must occur. UI should say manual repositioning is needed.
7. Position a socket near a fixing hole or outside-edge clearance. It must refuse a dangerous snap and preserve the original.
8. Undo/redo and save project, restore on another browser if applicable. Prepare a fresh Manifold mesh, export STL/3MF and inspect actual cable exit geometry in Cura.

**Physical limitation:** cable pitch is a stated length budget; the algorithm cannot verify wire elasticity, bend stress, connector lead location tolerances or printer shrinkage. Confirm with the real LED string and printed fitting.
