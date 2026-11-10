## Intent and affected behaviour

Describe what changed **and why**, linking the relevant feature spec / accepted design decision.

## Verification completed

- [ ] `npm run test:static` — exact run/commit:
- [ ] `npm test` — exact run/commit (or explain not run):
- [ ] `npm run test:browser` — exact run/commit (or explain not run):
- [ ] Benchmarked before/after if performance-sensitive, with case/settings:
- [ ] Cura/manual preview or physical print if output geometry changed (or list outstanding verification):

## Risk and compatibility

Describe what could break: saved projects, Simple/Advanced state, preview/manufacturing consistency, LED access, mounting bores, vault/roof, orientation, printer size, geometry performance or deploy. List any physical/safety limitations.

## Documentation/handover

- [ ] Relevant specs/ADRs/roadmap updated if changed
- [ ] `docs/AI_HANDOVER.md` updated for substantial work
- [ ] `CHANGELOG.md` and in-app version updated **only if** a user-visible release

## Deployment

`main` automatically deploys to GitHub Pages. This PR must not publish unfinished app code before approval.
