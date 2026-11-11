# Cura Profile Generator — v0.10.0 candidate

This document describes the **PR5** Cura profile download feature, what the downloaded file does, and the checks required before it can be called validated.

## Quick workflow

1. In **Crystal Forge → Print**, choose your physical **Ultimaker 3 Extended** or **Ultimaker 2+** machine using the existing printer selector.
2. Under **Crystal Forge → Cura profile**, choose the physically installed nozzle / AA print core, PLA or PETG, quality from Fast to Fine (0–100%) and the goal: translucent, balanced or more durable.
3. Review the computed layer height, initial layer, shell count, top/bottom layers, infill, speed and adhesion summary. Choose **Download Cura profile (.curaprofile)**.
4. Open Cura, activate the correct printer and the matching physical nozzle / AA core, then select the correct PLA/PETG material profile and configure its brand-specific print temperature.
5. In Cura, go to **Preferences → Configure Cura → Profiles → Import** and select the downloaded file. The Cura import procedure must be tested with the actual Cura version installed.
6. Inspect the resulting settings. Open the real prepared STL/3MF, slice, preview layers and verify LED openings, bridge quality, optical access, wall thickness, physical bed fit and cable routing. Print a small fitting sample before a large cluster.

## Supported hardware

| Machine | Supported profile nozzle sizes | Notes |
| --- | --- | --- |
| Ultimaker 3 Extended | **AA 0.25, AA 0.4, AA 0.8 mm** | The standard AA 0.6 option is not supported. Use the actual AA core. Do not use BB support core for PLA/PETG build material. |
| Ultimaker 2+ | **0.25, 0.4, 0.6, 0.8 mm** | Swappable physical nozzles; material and nozzle profile in Cura must match. |

Both PLA and PETG are offered as **candidate settings** for the above configurations. Cura's installed material and quality profiles are the authority for proper brand-specific temperatures and compatibility. This generator does **not** adjust firmware, machine definitions, start/end G-code or physically swap nozzle sizes.

## Quality slider behaviour

- **Fast / Draft (0):** larger layer height, fewer walls, faster print, fewer solid top/bottom layers.
- **Balanced (50):** moderate layers, three walls, medium print speed and five top/bottom layers.
- **Fine / Quality (100):** smaller layer height, slower print, four walls and six top/bottom layers.

Higher quality reduces layer height; it does not increase it. A larger layer height trades detail for speed. Material choice scales speed and cooling, and uses a PLA skirt or PETG brim starting point.

## Print intention

- **Translucent / light transmission:** 0% sparse infill, intended to reduce opaque internal material. Outer walls and top/bottom skins still exist. It does not guarantee one LED can illuminate every crystal.
- **Balanced:** 10–15% infill.
- **Durable:** 25–30% infill, though this is not a load rating.

All three begin with automatic support **disabled** as an initial review setting, **not** a promise that supports are unnecessary. Supports may be essential for bridges or overhangs, especially with large hills and internal roofs. Review every result in Cura.

## Generated file and safety properties

- File extension: `.curaprofile`, a ZIP container with Cura instance files in INI-like format.
- Global overrides include layer height, first layer, sparse infill, support toggle and build-plate adhesion.
- Per-extruder overrides include line width, wall count, skin layers, speed and fan settings. UM3 Extended receives an empty second-extruder override so support-core settings are not inadvertently prescribed.
- This is an **incremental print-quality profile** and **cannot** change machine model, active print core/nozzle, material type or firmware in Cura automatically.
- Default printing temperatures are inherited from Cura's chosen filament profile; a generic PLA/PETG temperature is deliberately not baked into every profile.
- **Not yet confirmed:** importing exported files in a locally installed Cura 5 for both named machines. GitHub unit tests verify ZIP structures and candidate settings, not full Cura application compatibility. Validate and fix any actual import differences before calling profiles proven.

## Recommended test matrix

- UM3 Extended AA 0.25 + PLA, AA 0.4 + PETG, AA 0.8 + PLA.
- UM2+ 0.25 + PLA, 0.4 + PETG, 0.6 + PLA, 0.8 + PETG.
- For each: download, import, confirm the active nozzle/material, preview 0/50/100 quality effects, slice one physical LED-fit coupon and inspect fine thin crystal roots.
- Check 0% infill and light passage paths separately; those are CAD/optics requirements, not fixed by Cura's quality profile.

## Next phase extensions

Model-aware nozzle recommendation, calibrated flow/temperature and brand-specific material presets, bridge-support warnings in Cura terms, matched profile and project 3MF packages, multiple extruder material pairing, fine-layer time estimates and download of a model-specific build checklist.

## Original references

- Cura profile management: https://support.ultimaker.com/articles/Knowledge/1667411286867
- Cura quality changes: https://support.ultimaker.com/articles/Knowledge/1667337576882
- UM2+ nozzles: https://support.ultimaker.com/articles/Knowledge/1667411296273
- UM3 / AA core sizes: https://support.ultimaker.com/articles/Knowledge/1667337922171
- Official CuraProfileReader implementation: https://github.com/Ultimaker/Cura/blob/main/plugins/CuraProfileReader/CuraProfileReader.py
- Official CuraProfileWriter implementation: https://github.com/Ultimaker/Cura/blob/main/plugins/CuraProfileWriter/CuraProfileWriter.py
