# PR12 — Pixel string with no extra isolated socket slots

## Reported behaviour (screenshot, 11 Nov 2026)

The underside showed correct connected main cable routing plus a separate short pink disconnected segment across **each** yellow pixel ring. The duplicate slots came from `fabrication-v1.js` `putSocket()`, which still added two fixed-axis legacy local cable-relief cutters even when the new serial Manifold grooves were active.

## Exact implementation and regression

In `wireMode='string'` the socket cutter now omits the old stand-alone local reliefs; the single shared `hardware.wirePlan.routes` remains authoritative for actual grooves, the Build preview and wiring CSV. These planned paths reach inside pixel sockets. Existing legacy `single`/`parallel` modes preserve their local relief cuts. Separate stepped and five-hole socket fit coupons deliberately keep their own through-wall cable reliefs.

`tests/fabrication.test.mjs` now checks real Manifold volume difference between a string-mode socket and a legacy socket **with all full cable routes disabled**, checks zero local relief depth on string-mode sockets, keeps legacy reliefs, and checks the route count and zero independent reliefs with one and multiple pixels.

## Before merging

1. Latest PR-head **Static repository checks** must succeed.
2. Latest PR-head **Verify Crystal Forge fabrication** must succeed (real Manifold WASM geometry).
3. Latest PR-head **Browser smoke test** must succeed.
4. Create one, two and three serial pixels, rotate pixel angles and inspect the underside in Build: one connected cable path, no extra short cable lines across the sockets.
5. Prepare the manufactured STL/3MF. Check the resulting model *and actual Cura layer view* have the same openings, with no unrelated side slots.
6. Change to older single/parallel wiring mode and verify original local relief behaviour remains.
7. Generate a three/five-size fitting coupon and check its intentionally open-through wire exits remain. Those are deliberately separate from full production string routing.
8. Print one measured LED/cable fitting and check real strain relief, wire bend and socket serviceability. Automated tests cannot validate these physical properties.

Do **not** label this as a complete Cura, structural/overhead, electrical or guaranteed illumination release.
