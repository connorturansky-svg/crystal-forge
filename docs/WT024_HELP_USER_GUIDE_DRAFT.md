# WT-024 — Future user guide: Hover notes and Detailed explanations

> **DRAFT FOR THE FUTURE RELEASE — NOT CURRENT APP INSTRUCTIONS.** The feature is planned under [#152](https://github.com/connorturansky-svg/crystal-forge/issues/152). The live Studio still uses the original Descriptions button until an implementation PR is tested, approved and merged. Do not paste this text into in-app Help or GitHub Pages until then.

## Understand any setting, wherever you work

Crystal Forge is intended to be usable without prior CAD experience. Two compact tick boxes in the top toolbar will let you choose how much help you see:

**Hover notes** gives you a short explanation when you move over a control or reach it with the keyboard. For touch screens, use the small help affordance beside a setting. Press **Escape** to dismiss a note without changing your design.

**Detailed explanations** displays longer plain-English guidance **directly beneath the setting**. It should tell you what the setting changes, when you might want to use it and what difference it could make to your model or print. It is not confined to the right-hand panel.

You can enable either option, both or neither. Your choice is remembered on that browser. The options are only about how you **view help**: switching them does not change the model, undo history, exported STL/3MF or saved project versions.

## Example

Imagine you're adjusting **LED fit clearance**. The short note explains that this adds room around the LED in the opening. With Detailed explanations on, you'll also learn that an opening printed at the LED's advertised size may be too tight, while one with too much clearance may not hold the LED securely. You should print a fit coupon with the intended printer and filament rather than assuming the numbers guarantee a fit.

Explanations follow you through **Home, Library, Design, Build, Pixels, Wiring, Mounting and Print Centre**, including settings for Crystal Clusters, Tactile Tiles, Gears, Waves, Control Caps, Characters and Light Pods. You do not need to leave the setting you're editing to read the guidance.

## Important distinction

These explanations help you make better decisions. They cannot verify physical strength, sharp edges, LED temperature, wiring suitability, supports or mounting safety. **Prepare the real manufacturing mesh**, inspect your STL/3MF in Cura and make relevant test prints. A preview and a green software check are not proof of physical fit.

## Keyboard and accessibility

- **Tab** to move to the global help preferences or a model setting.
- **Space** to turn the focused checkbox preference on or off.
- **Escape** to close a transient help note.
- Detailed inline text remains visible in reading order while that preference is enabled. The longer text is not supposed to pop up over the sliders or block you from editing.

## Release checklist for whoever publishes this guide

Before moving this into `index.html` Help / What's New or the public README:
- Verify both top-bar checkbox labels and default states are accurate in the actual app.
- Verify touch behaviour, keyboard dismissal, responsive layout and persistence in Chrome and another current browser where available.
- Verify all seven families/eight workspaces genuinely have useful in-flow explanations and report exceptions.
- Replace old PR4 in-app "Use ⓘ Descriptions" paragraph, update CHANGELOG and displayed release version with generator, and use an exact-head Pages deploy check.
- Preserve links to the source issue and distinguish the new assistance from safety/physical verification.
