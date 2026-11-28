# Crystal Forge — readable quick guide

> **Release candidate v0.16.0-dev.35.33 ([PR #157](https://github.com/connorturansky-svg/crystal-forge/pull/157)).** The readable defaults described below apply to this candidate. “Since your last visit” is a separate planned update.

## Find something without searching through menus

1. Open [Crystal Forge on GitHub Pages](https://connorturansky-svg.github.io/crystal-forge/).
2. Look for **Find tools & downloads**. Type what you want to do, e.g. **magnets in a circle**, **smooth sharp edges**, **LED sockets** or **download STL**.
3. Use **Down** to move into the results, **Up/Down** to choose and **Enter** to open the result. The app tries to move to the matching workspace and setting. If a tool cannot be used yet, read its explanation.
4. If the term does not work, try a short name such as **mounting**, **pixel**, **bevel**, **Cura** or **wire**.

## Know where you are

The eight workspace names are **Home, Library, Design, Build, Pixels, Wiring, Mounting, Print Centre**. You do not need to visit them all in order. The same model stays available while you switch tools. **Simple** shows a smaller set of controls; **Advanced** reveals more detailed settings.

The **Features** tab under Help provides a visual list of model builders and available actions. Use it if you are unsure what Crystal Forge can do.

## Find projects and templates in the Library

Templates appears first. Projects contains one expandable folder per project, with the active project marked separately from its saved versions. Use Tab to reach a folder heading and Enter or Space to open or fold it. Open a saved version through its Open project action. The current project is saved as a recoverable copy before switching. Folder expansion is remembered within the browser tab, including on reload.

Library cards show a preview and the item name. Hover over a card or tab to **Actions** to find its commands. On a touchscreen, tap **Actions**. Press Escape to close the commands and return to **Actions**. If a preview could not load, use **Retry** on the card.

Saved models and the existing favourites and collection filters remain available. Template destinations still use the established actions. The planned destination chooser will be implemented separately under #139.

## Read about a setting or an update

- Use **Descriptions** to show the persistent help panel. Some settings also display a short note when you hover or focus them.
- Select **Help** for the current usage instructions and keyboard shortcuts.
- Select **What's new** for the newest released notes, unreleased/draft notes and older history. **The existing page is not yet a “since you last visited” summary**. Treat notes marked *Unreleased* as plans, not live capabilities.
- At a narrow width, scroll within the workspace or dialog to reach longer lists. Use the browser’s zoom or default text size to enlarge the interface. Press Tab to see where focus is, then Enter or Space to activate a focused control.

## Make a print file without losing your work

1. Create/open a model, then use **Design** and other workspaces to edit.
2. Go to **Print Centre**, choose **Prepare** and read the job status.
3. Only download the enabled STL/3MF for the prepared revision. A 3D preview is **not** a prepared file; after a geometry edit you may need to prepare again.
4. Inspect the exported model in Cura before printing. Check real LED, wire, mounting and safe-to-touch fit in actual test prints; software checks cannot certify physical fit.
5. Keep an editable JSON backup of the project. Do **not** clear browser storage as a troubleshooting step; see [Backup and recovery](BACKUP_RECOVERY.md).

## What future releases should add

In the WT-025 interface-polish candidate, **Info → What’s new** shows current version highlights or changes since the most recent version you explicitly marked as read. Select **Mark this version as read** to acknowledge them. Opening Info alone does not mark anything as read. Draft notes remain separate. The small dot on Info indicates unread version notes. Deployment and final checks are pending owner review.

**Need to give feedback?** In [WT-025 issue #154](https://github.com/connorturansky-svg/crystal-forge/issues/154), report the workspace, exact label that is hard to read or find, your browser/zoom and what you expected. You do not need to understand the code.

## Read help beside a setting

In the WT-024 candidate, turn on **Hover Notes** and hover over or focus a setting. On a touch screen, select the question-mark button. Press Escape to dismiss a note. Turn on **Detailed Explanations** to show longer guidance for supported settings. The two options work independently, and your browser remembers your choices.

## Models drawer

Open **Models** at the bottom of the 3D viewport. The list contains the current project's open models. It closes when you reload Studio. While open, type in **Find an open model** to narrow the list without changing saved data.

Choose a model to switch to it. Use **More actions** (…) for **Rename** or **Info**. Info shows the full name when the card truncates it. **Close** (×) removes the open entry while keeping the model in the project. Use Alt+arrow on a model button to reorder it. Escape closes More actions first, then closes the drawer and returns focus to Models.

Set **Thumbnail size** from 1 (Extra compact) to 5 (Extra large). The setting is remembered in the browser. Search, size, inline explanations and cards scroll together below the Models and New model buttons.

Use **New model** to pick a starting point, then review the suggested name. Previews load when their tiles come into view. If a preview fails, read the reason and use **Retry preview**.


## Colours and viewport Layers

In **Design**, open **Model appearance**. Choose a named swatch, use the system picker, or enter exact HEX or RGB values. Select **Apply colour** to commit the edit. **Cancel** discards the draft. Colours travel with the saved model. Secondary colour is available when the builder has an active second material.

Open **Layers** in the viewport to hide individual guides, or choose a preset such as **Clean model** or **Wire routing**. The choices are stored in this browser. Active editing feedback remains available. Use **Reset layers** to restore the defaults. Layers affect guides only. Real cuts and fused features remain part of the prepared solid. Crystal supplies tab outlines and cable length labels. The other builders expose their available fitting, route, mount and guide layers.

## Production handover

Prepare the current model in **Print Centre**, then choose **Download production ZIP**. The archive contains the prepared geometry, editable model, manifest and Cura settings, plus a parts list. Jobs with a verified cable route also include **wiring-plan.csv**. Check the manifest for the model and prepared revision before opening the files in Cura. Use the [physical acceptance register](PHYSICAL_PRODUCTION_ACCEPTANCE.md) when checking fit, installation and actual layer behaviour.

## Finding information

Select **Info** in the toolbar, then choose Help guide, Features or What’s new. Press Escape to close and return to the toolbar. The `?` keyboard shortcut still opens the Help guide. Hover Notes and Detailed Explanations remain separate settings.

New browsers start with both optional help switches off. Turn on Hover Notes for short hints or Detailed Explanations for inline guidance; use both if preferred. Existing choices are retained. A disabled action can still explain why it is blocked.

When both help modes are on, desktop controls that already show an inline explanation hide the redundant question button. Touch devices retain the button; keyboard focus and mouse hover still show short guidance.

New release highlights use plain-text labels such as New, Changed and Moved to make the changes easier to scan. Older notes retain their original wording. Use the existing Help guide, Features or global tool search to locate a control.
