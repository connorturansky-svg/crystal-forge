# GitHub repository protection checklist

Crystal Forge is currently **public**. Public code visibility and branch
protection are two different problems; changing one does not solve the other.

## 1. Protect `main` from unreviewed changes

Requires a repository administrator to configure GitHub Settings. These
account-level settings are **not** activated by committing this document.

1. Open the Crystal Forge repository → **Settings** → **Rules** → **Rulesets**.
2. Choose **New ruleset → New branch ruleset**.
3. Name it **Protect main** and target the default `main` branch.
4. Require pull requests before merging; keep draft PRs unmergeable.
5. Require the checks **Static repository checks**, **Browser smoke test**
   and **Verify Crystal Forge fabrication** to pass before merging. Ensure
   the rule uses recent successful checks and an appropriate up-to-date-branch
   requirement so an old green SHA is not accepted.
6. Block force pushes and branch deletion, and restrict bypasses to the
   smallest appropriate group of trusted admins.
7. Save the ruleset as **Active**. Test it with a harmless draft PR.

Set rules at the repository's actual owner level. Some organisation plans
and roles restrict which rules or required approvals can be configured.

## 2. Source copyright, public hosting and secrets

- `LICENSE` records that original Crystal Forge work is **all rights
  reserved**; the original source is not intentionally open sourced.
- This cannot prevent public viewers from seeing and forking a public repo
  under GitHub's terms. It is not an encryption or access-control measure.
- Do not place passwords, API tokens, credentials, private serial numbers,
  SSH keys or hidden settings inside the repository **or front-end JavaScript**.
- Enable GitHub Dependabot security alerts, secret scanning/push protection
  where offered by the repository's account and plan.
- Private source requires changing the repository visibility (and may
  affect GitHub Pages hosting on the current plan). A public web app still
  exposes the JavaScript it ships to a visitor's browser; server-side code
  must be hosted separately if it is meant to remain secret.
- Copies/forks created when the repository was public may continue existing
  after it is made private.

## 3. PR7-specific merge gate

**PR #13** currently diverges from `main` because another PR7 was merged.
Reconcile the latest merged features and review conflicts first: do not
force-overwrite the branch, skip checks or interpret tests on its older SHA
as validation of today's code.

Keep production `main` live and perform further work in a draft PR until
Manifold, static, browser, Cura and actual fit/optical sample validation is
complete.

Official guidance:
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository
