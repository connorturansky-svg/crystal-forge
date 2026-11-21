# Edge-mouth finishing — engineering prework and exact acceptance

**Status:** investigation / test scaffold only; no product behavior changes in this branch.
**Repository baseline:** merged PR #121, main commit \`9f792e1c133ab93cff0fc1ee68d2f23562b40077\`.
**Owner requirement:** remove audience-touchable sharp *top-facing* edges with a small conventional 45-degree chamfer, including relevant openings; **do not** indiscriminately soften functional hardware and underside edges.

## Evidence boundary and upstream context

- PR #120 fixed the crinkling introduced by #117. PR #121 fixed zero-area triangles on optional raised Gear rim outlines. Do not regress either.
- \`studio-geometry.js::prepareRecipe\` currently calls \`bevelTopSolid\` **on joined positive material**, before later \`recipe.negative\` cutters are subtracted. \`fabrication-v1.js::prepareFabrication\` likewise bevels joined Crystal stock before later LED/mount and light-path work.
- Existing 12-tooth/68.5 mm/five-spoke/8 mm Gear fixture places spoke windows and centre bore **in its original positive extrusion**. Those rims already participate in the top chamfer; they are *not* a valid example of a later cut.
- Therefore an eligible *later-subtracted top-entry bore* may retain a sharp entry lip. This is a **source-order hypothesis** until the prepared mesh, independent export section, and actual browser workflow confirm it. Real hardware cut positions may be underside-only and intentionally out of scope.
- \`tests/edge-mouth-baseline-audit.mjs\` generates an explicit positive box plus a later negative 8 mm bore. It produces a JSON comparison with chamfer off/on. It is **diagnostic only**: the old behavior must not be mistaken for a passing safety test.
- \`tests/helpers/print-section-profile.mjs\` parses the *delivered binary STL*, checks degenerate triangles, sections at chosen print-Z planes, and measures a radial annulus in mm. It is independent of internal Manifold mesh reporting.

### Execute now

\`\`\`bash
node tests/helpers/print-section-profile.test.mjs
node tests/edge-mouth-baseline-audit.mjs
\`\`\`

First script exercises the STL helper without a browser or Manifold; second needs repository \`npm\` dependencies and actual Manifold WASM. It is **not** in the release suite and makes no claim about the physical feel of a part.

## Implementation approach (for Codex to evaluate)

**Prefer a localized conical lead-in negative cutter for a proven top-entry cylindrical mouth**, over a second whole-mesh bevel on the completed Boolean result. If the nominal bore radius is \`r\`, a 45-degree, \`a\` mm lead-in has radius \`r+a\` at the exposed top plane and \`r\` at or below top-\`a\`. The native geometry already supports \`kind:'cylinder'\` with \`topRadius\` and \`radius\`, and real Manifold subtraction of \`recipe.negative\`. This avoids touching the nominal functional shaft diameter below the entry.

Do **not** implement this as an automatic post-export STL deformation. Keep it in the authoritative preparation path and use a shared specification for preview, exported mesh, and saved revision/fingerprint. Do not simply apply to all bore cutters: most LED entrances are on the underside, and countersinks, countersbores, blind magnet pockets, threaded insert pilots, retention throats and cable channels have specific dimensional contracts. Explicit safe opt-in/exposed-face classification is required. Crystal may need an analogous local cutter in its distinct fabrication path.

Manifold's documented \`CrossSection.offset\` and \`simplify\` are potentially useful for contour clearance proofs, but **offset direction depends on fill and hole orientation**. Verify geometry with actual Manifold 3.5.4 and *both* exported file formats; no API name alone certifies a safe result. Manifold WASM objects need explicit \`delete()\` to avoid memory accumulation.

Documentation:
- https://manifoldcad.org/docs/jsapi/classes/manifold.CrossSection.html — robust 2D polygon Boolean / offset, join-type and simplification.
- https://manifoldcad.org/docs/jsapi/documents/Using_Manifold.html — WASM initialization and explicit memory management.

## Priority test matrix

| Case | Audience-facing top entry? | Expected enabled result | Disabled / negative control |
| --- | --- | --- | --- |
| Simple positive block + later 8 mm top bore | Yes, synthetic | 0.5 mm conical 45-degree entry; 8 mm through-diameter below lip | Top lip unchanged with toggle OFF |
| 68.5 mm / 12-tooth / 5-opening Gear original shaft bore | Yes, source positive extrusion | Preserve PR #120 45-degree bore, spoke and outer rims | No #117 face wrinkles, no #121 degenerates |
| Gear optional raised rim and hub | Exposed upward contour | Preserve all #121 32 variants and exact exported geometry | No additional gap, lost rail or false material split |
| Solid Tile top-entering manual screw through-bore | Only if actually on verified top face | Local entry chamfer at selected exposed plane, not outer rim only | Reject/skip if stock thin or cut intersects another feature |
| Native underside LED pixel insertion | No | **No new lead-in** unless explicitly modelled as a functional socket feature | Nominal flange/retention/bore unchanged |
| Crystal selected exposed top/manual mounting hole | Only on verified surface | Conical entry if safe, independent of top tip treatment | Preserve existing Crystal tip convexity and pixel roof |
| Existing countersink/counterbore | Functionally defined entry | Do not widen or double-chamfer by default | Keep specified recess depths and diameters |
| Blind magnet pocket / threaded insert pilot | Usually functional | No automatic lip modifications | Preserve blind floors, structural wall, known fit |
| Wire channels / perimeter ports | Not generic circular top rims | Do not round across route cross-sections | Preserve openings, slope, roof and bend budget |
| Too-narrow tab/web or intersecting cuts | Possibly | Skip just the unsafe mouth and report precise reason; never collapse entire model | No non-manifold / hidden defect |
| Two-material native/Crystal exports | Only eligible top entries | Both bodies retain correct interface and relative origin | STL and 3MF match prepared union, volume conserved |

## Quantitative acceptance for eligible 8 mm through-bore

Use a sufficiently faceted bore and independent sections in the **export's Z-up print frame**. Example flat 8 mm stock, top at Z=8 mm, lead-in amount \`a=0.5 mm\`:

| Print Z | Target radial envelope | What is verified |
| --- | --- | --- |
| 7.99 mm | approx 4.49 mm | Open mouth slightly wider than through-bore |
| 7.75 mm | approx 4.25 mm | 45-degree taper, not a vertical sharp wall |
| 7.50 mm | approx 4.00 mm | Taper terminates at nominal bore |
| 6.75 mm | approx 4.00 mm | Functional 8 mm through-hole unchanged |
| 0.5 mm | approx 4.00 mm | Underside through-diameter unchanged |

Use tolerances derived from actual polygon segmentation and float32 STL export, not exact mathematical circularity. Independently decode 3MF sections or compare all exported vertex triangles against the verified prepared mesh as in \`tests/edge-finishing.test.mjs\`. Also compare the *outer* positive stock at locations away from the lip; no surface bulges, crinkling, change to underside, or altered shaft clearance.

## Required delivery gates

1. **Prove the defect in real Build flow** with selected top-entry hardware. If the UI cannot actually place such hardware, report that scope limitation rather than invent a failing user journey.
2. Commit a passing **post-fix regression** with both OFF and ON, valid/invalid and undo/save/reload. Promote diagnostic cases into gated acceptance tests only when their target behavior is implemented.
3. Real Manifold status, no zero-area triangles after float32 conversion, preserved lower-bore dimensions, supported wall/roof margins, export parity (STL and 3MF). Re-run the 32 Gear variants from PR #121.
4. Chromium Build -> Prepare -> STL/3MF for at least one eligible native model and Crystal as applicable; record saved revision/fingerprint, warnings and screenshots. Check Cura sections if CuraEngine is available.
5. \`npm run test:static\`, \`npm test\`, \`npm run test:browser\` and latest exact-head PR CI. Update CHANGELOG, What's New, and handover **in the product feature PR**, not this support-only PR.
6. Physical coupon inspection (material, actual LED/hardware dimensions, sharpness/tactile comfort, cable fit and strength) remains under issue #10. A mathematically chamfered model is not a verified safe audience part.

## Collaboration and next steps

Codex owns **product geometry and user-facing Build behavior**. This QA branch owns independent test instrumentation and detailed acceptance only. Cherry-pick the helper/fixture commits into the feature PR if helpful, or use this PR as a reviewed documentation/testing dependency. Avoid parallel edits to \`studio-geometry.js\`, \`fabrication-v1.js\`, \`sensory-studio.js\`, \`studio-v3.js\`, \`index.html\` or \`CHANGELOG.md\` here.

Cross-project release safeguards (Pages startup #90, staged-package #112, old-tab continuity #115) are **separate** from manufacturing. Don't scope creep into their workflows. Owner controls merges and deployment.
