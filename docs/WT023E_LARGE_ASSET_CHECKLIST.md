# Large private Studio backup acceptance (WT-023E)

This targeted fix is drafted in [PR #148](https://github.com/connorturansky-svg/crystal-forge/pull/148), stacked after Codex [#147](https://github.com/connorturansky-svg/crystal-forge/pull/147). **Do not merge before #147.**

GitHub [Contents](https://docs.github.com/en/rest/repos/contents) can omit Base64 for files over 1 MB; [Git blobs](https://docs.github.com/en/rest/git/blobs) provide authenticated Base64 by SHA up to 100 MB. The code uses the **existing private repo token**, validates blob SHA/encoding, and retains content-addressed integrity and guarded manifest writes.

Run `node tests/studio-vault-large-file.test.mjs` and `npm run test:static`; mock large manifests, model assets, corruption and already-existing-asset push. Exact-head browser and Manifold checks are required before release. No real private repository or credential was used. Test on a *separate private test repo* before depending on larger personal backups.

Out of scope: auto sync, new accounts, PINs, compression, rate-limit retry, historical restore UI and new device pairing. Keep a dated JSON offline backup.