# Development history — evidence-based chronology

**Sources:** conversation visible to the documentation session, earlier Crystal Forge discussion context, tracked `CHANGELOG.md` and current Git commits. All documented activity below occurred on **10 November 2026** where dated; repository commits corroborate the latter phases. This is a design trajectory, not a transcript and not a record of every assistant suggestion. Precise times are omitted where unsupported.

## 1. Original idea and early prototype — creative brief

**User intention:** create a browser-based parametric designer for 3D-printed glowing crystal/gemstone clusters for a participatory interactive cave/creative environment with young people. Need large variations and the ability to make actual physical objects, not just a rendering.

An early prototype (still stored as the unreferenced `app.js`) explored seeded forms and basic STL. Its own comments warn that overlapping preview solids were **not** print-ready Boolean-unioned geometry. The active editor later moved to `studio-v3.js`.

## 2. Shape exploration and artistic redirection — v0.2–v0.3

The user judged overly realistic/noisy/soft forms less successful and pushed toward **cartoon-like low-poly crystals**: flat facets, large vs small spikes, hexagonal shafts, well-formed pyramidal tops, distinctive clustering and minimal common root. Controls expanded to crystal family, shoulder/top and bottom diameters, side and tip rounding and more intentional geometry.

The UI evolved into Design/Build/Print workspaces with colour-coded cards, Simple/Advanced presentation, object tree, per-object XYZ controls, numerical inputs, view snaps, saved JSON and early lighting planning. **Why:** approachable generator and precise sculptural editor in one.

## 3. Real manufacturing geometry — v0.4

The project introduced Manifold 3D WASM for actual solid unions, experimental whole-cluster hollowing, nominal gumdrop LED bores, mounting holes, calibration strip and STL/3MF export. Representative printable-mesh tests replaced dependence on raw preview triangles. A default 45° overhang screen, support warnings, limited printer-fit diagnostics and cut-plane exports were added.

**Compromise:** full hollowing was an approximate erosion/air-channel process, not a verified constant wall. An apparently valid Manifold mesh could still fail in Cura or have blocked illumination. A numerical test is not a real printed fit test.

## 4. Rounded tips, true orbit centre and mounded base — v0.4.2

The user reported unsuitable point shapes and a model orbiting incorrectly after movement. A curved/tangential spherical cap replaced blunt or nipple-shaped ends, while camera rotation was re-centred on the actual cluster. Independent mound height and rim controls were introduced, with later high-DPI framing fixes. This preserved the intended floating inspection experience.

## 5. Individual design and shared light planning — v0.5

Selection acquired individual shape controls, coloured status and locked/editable handling; base shapes expanded. The default lighting target shifted to **one underside LED** serving a cluster rather than assuming a separate LED for every spike. Hole/collision planning and several base shapes were added.

**Key tension:** a shared optical chamber is attractive but a multi-spike organic cluster can produce sealed, unlit pockets, insufficient wall thickness and difficult manifold operations. Hardware design must consider location, access and roof geometry together.

## 6. Responsiveness and light-path repair — v0.5.1

Repository commits document work on even illumination, real upper-edge fillets, Web Worker print preparation (commit `85d06b7`), caching/reusing workers and finished manufacturing meshes (e.g. `f7f4ca2` / `0edc02d`), and repairs to dome-following internal light passages (e.g. `a38e023`). Fit-base preset for a 22 mm nominal gumdrop housing became 25 mm.

A previous headless browser run was observed taking ~118 seconds for a full prepare; the main page stayed responsive once work was delegated. This motivated the later Cura-first strategy. Passing earlier CI runs did not eliminate physical light-path uncertainty.

## 7. Spacing, growth direction and shoulder continuity — v0.6.0

The user pointed out that 100% spacing still overlapped and requested a much wider maximum and very tight minimum. They also specified directional lean presets (one-way, criss-cross, radial in/out), separate strength and randomness sliders, and shoulder smoothing continuous with side rounding.

An early commit `fbb21bf` implemented the design but inadvertently introduced a JavaScript syntax regression. GitHub's tests caught it. The corrective work matters historically: **source changes must be tested before being considered working**.

## 8. Cura-first printing replaces default whole-cluster erosion — v0.6.1

The user explicitly observed that Cura can choose infill from 0% to 100%, and preferred Crystal Forge to export a solid exterior with real LED/mounting cuts rather than expensive, always-on internal hollowing. This became the default in commit `8b1ba32`; experimental hollowing stayed optional.

The user then inspected Cura's underside toolpaths and identified two problems: a mound roof may bridge poorly at zero infill, and a drilled LED bore may terminate at a solid wall or roof. **Cura-generated empty space is not necessarily continuous light access**.

## 9. Build-stage hardware editor, direction fix and vaulted roof — v0.7.0

The user saw that One direction and Radial inward did not behave as expected. The cause was each crystal's independent yaw rotating its local lean direction. Subsequent code compensated for that rotation, and regression tests used world-space directions (commit `c744a39`).

The user also requested visible LED positions in Build and eventual manual positioning of LED and mounting holes. `hardware-editor.js` was introduced with click-to-place, X/Z editing and red invalid markers (commit `1fe8221`).

To accommodate a zero-infill base without reverting to expensive whole-cluster erosion, the assistant implemented an **optional open underside vault with integral flared support pillars**, physical socket collars and lateral LED vents (commit `4ac85d7`). The in-app and written v0.7.0 release record was committed as `e72a9d0`. Later GitHub Actions reported passing Playwright, Manifold and Pages deployment for that release.

**Current truth:** code and representative tests exist; the vault's bridging quality, optical distribution and touch/mount safety have **not** been validated by a physical print merely because Manifold/Playwright passed.

## 10. Shared AI development documentation — new current activity

The user requested that ChatGPT and Codex Desktop share one reliable repository knowledge system, preserving **motivation as well as implementation** and avoiding invisible context loss. This effort introduces `AGENTS.md` and `docs/` on branch `docs/shared-chatgpt-codex-workflow`, along with lightweight checks and PR-based collaboration rules. This is **not** a change to the Crystal Forge app version until a separate user-facing release is made.

## How to extend this timeline

Append only evidence-backed milestones with version/commit (when known), user reason, trade-off, verified tests and remaining caveats. Avoid inventing older dates or implying historical approval for newly proposed workflow policies. Keep release notes in `CHANGELOG.md` and active work in `docs/AI_HANDOVER.md`.


## v0.8 feature-branch continuation — 10 November 2026

After the initial documentation PR was merged, user feedback highlighted thin crystals at maximum taper settings, stretched rather than rotated lean patterns, overbright even lighting, roots protruding from the mound, LED bores drilling through the top, unreliable auto pixel placement and a single-click placement tool that resumed orbiting. Further requests introduced continuous cursor-guided LED placement, highly variable extreme top/bottom widths, rounded blind bore ceilings, evenly spaced semicircular cable-tie/bolt tabs and small hover help boxes.

Work on `feat/global-crystal-diameter` (PR #3) implemented these as v0.8.0. This work intentionally retains Cura-first exterior printing, one authoritative hardware planner, and separate preview/manufacturing geometries. The new Playwright checks exercise the cursor through multiple clicks and contextual help; further Manifold/Cura/physical verification remains necessary for blind bores, tab strength and roots in the printed model.
