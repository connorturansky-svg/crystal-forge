# Crystal Forge — readable quick guide

> **Current app guidance, checked against main 23 November 2026.** The legibility upgrades and “Since your last visit” feature described in [WT-025 #154](https://github.com/connorturansky-svg/crystal-forge/issues/154) are **PLANNED, NOT YET AVAILABLE**. The universal two-level hover/inline help in [WT-024 #152](https://github.com/connorturansky-svg/crystal-forge/issues/152) is also **PLANNED**. Do not look for these controls yet.

## Find something without searching through menus

1. Open [Crystal Forge on GitHub Pages](https://connorturansky-svg.github.io/crystal-forge/).
2. Look for **Find tools & downloads**. Type what you want to do, e.g. **magnets in a circle**, **smooth sharp edges**, **LED sockets** or **download STL**.
3. Use **Down** to move into the results, **Up/Down** to choose and **Enter** to open the result. The app tries to move to the matching workspace and setting. If a tool cannot be used yet, read its explanation.
4. If the term does not work, try a short name such as **mounting**, **pixel**, **bevel**, **Cura** or **wire**.

## Know where you are

The eight workspace names are **Home, Library, Design, Build, Pixels, Wiring, Mounting, Print Centre**. You do not need to visit them all in order. The same model stays available while you switch tools. **Simple** shows a smaller set of controls; **Advanced** reveals more detailed settings.

The **Features** tab under Help provides a visual list of model builders and available actions. Use it if you are unsure what Crystal Forge can do.

## Read about a setting or an update

- The currently deployed app has a **Descriptions** button for a persistent help panel, plus some short hover/focus notes. The future two-checkbox system is not shipped.
- Select **Help** for the current usage instructions and keyboard shortcuts.
- Select **What's new** for the newest released notes, unreleased/draft notes and older history. **The existing page is not yet a “since you last visited” summary**. Treat notes marked *Unreleased* as plans, not live capabilities.
- A small screen or long description may require scrolling. Use the browser's own zoom or text settings when needed; some controls may still be dense until the new readability work ships.

## Make a print file without losing your work

1. Create/open a model, then use **Design** and other workspaces to edit.
2. Go to **Print Centre**, choose **Prepare** and read the job status.
3. Only download the enabled STL/3MF for the prepared revision. A 3D preview is **not** a prepared file; after a geometry edit you may need to prepare again.
4. Inspect the exported model in Cura before printing. Check real LED, wire, mounting and safe-to-touch fit in actual test prints; software checks cannot certify physical fit.
5. Keep an editable JSON backup of the project. Do **not** clear browser storage as a troubleshooting step; see [Backup and recovery](BACKUP_RECOVERY.md).

## What future releases should add

The proposed **Readable display** improvements aim to increase text size, spacing and contrast while preserving working controls. A future **Since your last visit** area will summarise shipped changes in ordinary language, help you locate moved tools and let you mark updates as read. These will be explained here and in the in-app Help only when implementation is merged, Pages deployment is verified and the owner approves release.

**Need to give feedback?** In [WT-025 issue #154](https://github.com/connorturansky-svg/crystal-forge/issues/154), report the workspace, exact label that is hard to read or find, your browser/zoom and what you expected. You do not need to understand the code.
