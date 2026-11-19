# WT-003 handover: standalone SVG extrusion

**Approved brief:** `prompts/003-svg-extrusion-engine.md @ d78d54681eba6ca0cd9987eda8ce6ec56a3195dc`. [Task issue](https://github.com/connorturansky-svg/crystal-forge/issues/36). The approved scope deliberately leaves live Studio, generators, existing export and fabrication APIs, release version, and WT-002 untouched.

## Reproduce the demonstration

At the repository root, use Node 22 and serve the checkout (not `file://`):

```shell
npm install --no-audit --no-fund
python -m http.server 4321 --bind 127.0.0.1
```

Open `http://127.0.0.1:4321/svg-import/demo/`. Choose the clockwork sample, confirm a width and depth, inspect its open windows in the contour and orbit views, then prepare with Manifold and download STL and 3MF. Try changing dimensions to confirm preparation is invalidated. Open a file with unsupported geometry to see why it cannot be imported; the last valid model should be preserved. Only local artwork or bundled samples are used.

## Verification commands

```shell
node --test tests/svg-import-engine.mjs
npx playwright install chromium
node tests/svg-import-browser.mjs
```

Run the browser test while the local server is running. Set `CRYSTAL_FORGE_URL` to override the default origin, `CRYSTAL_FORGE_BROWSER_EXECUTABLE` to use an installed Chromium, or `SVG_IMPORT_QA_DIR` to collect screenshots in a specific directory. Exact-head test status and screenshot links belong on the draft PR; a previous successful build is not evidence for a newer commit.

## Integration boundary

1. After WT-002, start a separate owner-approved integration change. Recheck the Studio recipe, validation, Build and Print APIs against current `main`.
2. Store the versioned record inside a dedicated imported-model envelope. Use canonical contours and dimensions as the geometry authority; fingerprint them along with Build parameters, not the filename or source hash alone. Preserve the rejected-file/last-valid-state behavior. Consider including the source SVG only in an explicitly user-approved private backup; geometry can be restored without it.
3. Use the same recipe for Design preview and worker preparation. Recompute and invalidate prepared output on size, depth, rotation, or cutter edits. Connect the existing print export only when the current fingerprint has a verified prepared mesh.
4. Start with one connected body and the proven vertical Build bore. Keep arbitrary mounting, multiple print objects, bevels, routing and material region selection out until they have their own acceptance tests.

See [SVG import design](SVG_IMPORT_DESIGN.md) for APIs, supported inputs, limits, and coordinate frames. Automated topology and export tests do not establish installed Cura behavior, layer support, optical performance, structural safety, or actual print/fit quality.
