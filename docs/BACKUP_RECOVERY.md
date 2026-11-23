# Back up and recover your Studio workspace

Studio saves work in the current browser profile. To move to another device or protect your work before clearing browser data, download a complete backup. A print export such as STL or 3MF is not a workspace backup.

## Download a backup

1. Open **Library > Backups & Recovery**.
2. Select **Download complete backup**. Keep the downloaded JSON somewhere private outside the browser, and add a date to the filename so you can identify it later.

## Recover from a JSON file

1. On the destination device or browser, first download a backup of any work you already have there.
2. In **Library > Backups & Recovery**, use **Restore backup or old Crystal JSON** to pick your complete backup file. For a Studio backup, the **Review backup** dialog lists items found only on this device, items found only in the backup, and items with the same ID but different content. Opening the review doesn't import anything.
3. Under **Recover**, choose **Complete backup**, a particular project, or a Library model revision. Then choose a **Recovery strategy**:

   | Strategy | What happens |
   | --- | --- |
   | **Keep local workspace** | Close the review without importing. **Cancel** also leaves your workspace unchanged. |
   | **Import separate copies** | Recover the selected work as separate copies rather than merging it into the Library. |
   | **Merge new items and copy conflicts** | Add new items and preserve both versions when the same ID has different content. Unchanged items don't need another copy. |

4. Select **Apply choice** and confirm the recovery if prompted. Studio saves a local recovery snapshot before writing changes. Look for **Recovery complete**, then find the recovered project or model in the Library. Your active project stays open; open a recovered project separately when you're ready.

## Use a private GitHub backup

This is manual, not automatic sync. Open a Crystal model's saved-project controls and connect your private repository under **Private GitHub sync**. Do not use a public repository or share your token, backup file, or private repository details in an issue.

- On the source device, use **Library > Backups & Recovery > Upload studio backup** and wait for **Backup saved**.
- On the destination device, connect the same private repository, then use **Check private backup**. Review and apply your selection as above.
- If upload reports that the remote has changed, check the backup again and review and merge the complete backup before retrying. Do not overwrite another device's changes.

## If something goes wrong

- **Could not read backup:** Check that you selected the original backup JSON, not a print export or a partially downloaded file. Try another dated backup; keep the original file.
- **Recovery won't apply:** Leave the current workspace open. Read the message in the review dialog. If local work changed, review the backup again. If storage is full, download a complete backup before clearing any data.
- **Need the previous state:** In **Backups & Recovery**, select a dated **Review local snapshot** if available. It uses the same review process rather than rolling back your entire workspace. These snapshots are stored in the browser, so they aren't a substitute for a downloaded backup.

## Your privacy: the public Studio is not a public Library

Anyone can open the public Crystal Forge editor, but that does **not** let them read your locally saved projects or your private GitHub backup. The app stores editable Studio data in the browser profile currently in use. Your private cloud backup stays in a **separate private GitHub data repository** and requires valid repository authorisation. Do not upload private workspace JSON to the public `crystal-forge` source repository.

A four-digit PIN is not required for this single-user design and would not securely authorise a private GitHub repository. Lock your computer/browser session when leaving it unattended; GitHub's repository permissions and revocable, repository-restricted credentials protect the remote data.

### Connect a second device (current manual workflow)

1. Create a separate **Private** GitHub repository for the Library. Generate a **fine-grained personal access token** limited to that repository with **Contents: Read and write** permission. GitHub's [official token guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) explains how; write includes read. Never put the token in a GitHub Issue, commit, screenshot or saved project.
2. In the **current** app, open a Crystal model's saved-project controls and expand **Private GitHub sync**, then enter the `owner/repository` name and the token and connect. This setup is currently separate from the Studio Library; WT-023E will make it accessible from Library directly. The token is kept in client session memory and must be supplied again after a new session.
3. On the first device, use **Library → Backups & Recovery → Upload studio backup**. Wait for confirmation of the remote manifest; **Saved locally** is not the same as **Backed up on GitHub**.
4. On the second device, connect to the same private repository and select **Check private backup**. Review differences **before** choosing which copies/projects to import. Checking remote alone does not replace the active project. Explicitly upload the new combined workspace after any changes.

**Important:** Whole-Studio sync is currently manual. The older Crystal editor's auto-sync switch is for the separate legacy Crystal backup, not continuous whole-Studio collaboration. Keep a dated downloaded JSON backup too. The cloud manifest and GitHub commit history help preserve versions, but the Studio UI does **not** yet provide a verified one-click historical remote restore for every Studio revision. A private token can expire or be revoked; if connection fails, keep editing locally and reconnect without deleting files.

**Storage limitations:** GitHub's [repository Contents API](https://docs.github.com/en/rest/repos/contents) returns differently formatted content for files larger than 1 MB, and [rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) may affect large Libraries. WT-023E tracks size/retry/recovery hardening; never treat an incomplete or failed upload as a finished backup.
