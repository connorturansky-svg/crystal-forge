# PR10 v0.14 — Hands-on acceptance and migration guide

**Draft** [PR #16](https://github.com/connorturansky-svg/crystal-forge/pull/16). Do not merge until all latest-head GitHub Actions checks succeed. This is a software candidate; physical LED fit, Cura slice/quality type availability, cable bend constraints and overhead structural integrity require real-world validation.

## 1. Back up existing custom gumdrops before switching computers

On the **original machine and browser profile**, open Crystal Forge and select **Design → Private GitHub sync → Download all local projects/profiles/templates backup** before deleting anything or clearing site data. The original custom gumdrop measurements live in the old browser's `localStorage`, not in the GitHub source repository. PR10 cannot magically retrieve them from another computer without that browser being used. If the measured profile remains available there, capture and upload it to your private vault using this release.

## 2. Secure private GitHub sync (opt-in)

1. Create a **new private repository** in your personal GitHub account. Do not use the public `crystal-forge` source repository.
2. On GitHub, create a fine-grained access token **restricted to that private repository** with *Contents: read/write* only. Do not use classic unrestricted tokens. Keep it secret.
3. In the Crystal Forge Design workspace, expand **Private GitHub sync** and enter `owner/private-repo` and your token. Connect. The browser only keeps the token in **memory**; it will be cleared from the input and lost on refresh/disconnect, and must be re-entered the next session.
4. If the vault is empty, click **Sync Now** to create `.crystal-forge/vault-v1.json`. If cloud data exists, **Pull + merge first**. The current local project is backed up before activating the cloud project, and custom pixel profiles/templates are merged, preserving conflicts with renamed copies.
5. Once reconciled, enable optional **Auto-sync**. It debounces project edits by about 3.5 seconds while connected.
6. On a second computer, repeat Connect to the same private repo and **Pull + merge** to receive all stored measured pixel profiles/templates and the cloud project.
7. If GitHub detects an unexpected remote SHA, uploads stop rather than overwriting another computer's commit. Pull/merge and inspect, or use the repository's Git history to recover an earlier commit.

**Security/implementation limitation:** this version supports an explicit fine-grained token rather than browser OAuth/PKCE or a server-side credential broker. GitHub cannot authenticate your static public site to private repos automatically without a supported configured auth flow. Never paste your token into a project, message, URL, source file or screenshot. Tokens are not stored automatically; cloud auto-sync therefore requires an active authenticated session. GitHub public API restrictions and private repository availability can be checked only with a real connected account.

## 3. Smooth physical wiring acceptance

| Test | Action | Expected |
| --- | --- | --- |
| Opposed ports | Select P1 and rotate it through 0°, 45°, 90°, 180°. | IN and OUT stay on the same axis, 180° apart. The groove is tangent/straight immediately beside the socket. |
| Smooth bends | Rotate a middle pixel and look at underside. | Curves between sockets are smoothly sampled; no hard elbows. Preview matches the actual Manifold cutter's centreline. |
| Start | Click a selected pixel's **Set P1** button. | Pixel becomes start; later entries rotate cyclically in their original order. First/last external tails recompute. |
| Reverse | Press **Reverse pixel order**. | Pn becomes P1 and port axes reverse while the physical pixel locations stay unchanged. |
| Spacing | Select 25, 50, 100 mm or custom budget. | Interpixel cable lengths (including body centre-to-port distances) appear in mm. Red route/over-budget message for excess. |
| No false ready | Make a string physically too short, rotate to impossible bend, or route through a mount. | Preview gives red/blocked warning; **no partial cable slots** are emitted into a prepared model. |
| Direction | Toggle direction arrows and measured labels. | Arrowheads follow local wire-path tangents from exterior IN through P1→Pn to exterior OUT. |
| Manipulation | Select P2 once, then click-hold its marker and move on the model. | Selected pixel follows valid snapped X/Z positions, green/red preview, updated paths, one undoable commit on release. Empty-space drag still orbits. |

Cable spacing refers to physical **pixel centre-to-centre** distance along the routed path, which includes the centres-to-housing-port allowances. Measure your actual product; manufacturer nominal lengths may not include tails or embedded sections. The initial/final exterior cable lengths can be set independently; 0 means **unbounded/unknown**, not physically zero.

## 4. Cura compatibility

Select UM2+ or UM3 Extended, actual compatible nozzle/core and PLA/PETG. Use the **Cura base quality type** selector. Auto gives a configuration-dependent candidate instead of always hardcoding `normal` (in particular the UM2+ 0.8 mm candidate uses `coarse`). If your local Cura installation does not offer that quality type for the active machine/nozzle/material combination, select a type Cura already offers and export again. There is also an always-readable **Cura settings text** file if imported quality profiles remain invisible. The text overrides are suitable for manual entry in Cura's Custom mode.

The 0.8 mm import warning is a Cura *quality availability* warning, not a corrupt ZIP. **Automated ZIP parsing cannot prove the resulting imported profile appears in your installed Cura.** Manually verify visibility and slice printed samples on your machine. The settings export does not change nozzle hardware, temperature, firmware or validated material profiles.

## 5. Test and review gate

- GitHub Actions **Static repository checks**: new Cura metadata, measured spline geometry, spacing and private-sync mock tests.
- **Browser smoke**: existing PR9 flows, added Cura quality and fallback, cable spacing and private local backup export.
- **Verify Crystal Forge fabrication**: actual Manifold underside groove subtraction/mesh integrity, STL/3MF exports and performance.
- Physical: Cura layer-by-layer check of sockets, curved channels, roofs, overhangs, mounts, retention and real wire spacing; LED optical/heat, tension/strain relief and print tolerances.

## Known limitations

This is not a real pathfinding CAD kernel or certified mechanical cable route: the planner tries smooth tangent curves with conservative geometry/bend tests and may reject crowded layouts. Preview and real groove geometry share sampled segments, but Cura and physical cable bend limits remain the final test. OAuth PKCE login and unattended perpetual sync are not included in the token-based first release. Other open features (bed-aware multi-plane splitting, calibrated clips, physical structural evidence and advanced materials) remain tracked in issues.
