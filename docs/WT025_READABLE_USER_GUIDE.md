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

A future **Since your last visit** area will summarise shipped changes in ordinary language, help you locate moved tools and let you mark updates as read. These will be explained here and in the in-app Help only when implementation is merged, Pages deployment is verified and the owner approves release.

**Need to give feedback?** In [WT-025 issue #154](https://github.com/connorturansky-svg/crystal-forge/issues/154), report the workspace, exact label that is hard to read or find, your browser/zoom and what you expected. You do not need to understand the code.

## Read help beside a setting

In the WT-024 candidate, turn on **Hover Notes** and hover over or focus a setting. On a touch screen, select the question-mark button. Press Escape to dismiss a note. Turn on **Detailed Explanations** to show longer guidance for supported settings. The two options work independently, and your browser remembers your choices.

## Models drawer

Open **Models** at the bottom of the 3D viewport. The list contains the current project's open models. It closes when you reload Studio. While open, type in **Find an open model** to narrow the list without changing saved data.

Choose a model to switch to it. Use **Rename**, **Info** or **Close** on its tile. **Close** removes the open entry while keeping the model in the project. Use Alt+arrow on a model button to reorder it, or Escape to close the drawer and return focus to Models.

Use **New model** to pick a starting point, then review the suggested name. Previews load when their tiles come into view. If a preview fails, read the reason and use **Retry preview**.


## Finding information

Select **Info** in the toolbar, then choose Help guide, Features or What’s new. Press Escape to close and return to the toolbar. The `?` keyboard shortcut still opens the Help guide. Hover Notes and Detailed Explanations remain separate settings.
