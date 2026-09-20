# Contributing to HikeIt

## Branch structure

- **`main`** — production. Deploys automatically to [hikeit.app](https://hikeit.app).
  Nothing merges here directly except a manual merge from `dev`, done deliberately
  once a batch of tested changes is ready to go live.
- **`dev`** — integration/testing branch. Every feature PR targets this branch.
  It deploys to a stable URL (see below) so changes can be verified together
  before they go live.
- **`feat/*`, `fix/*`, etc.** — one branch per feature or fix, branched from
  `dev`. PR into `dev` only — never directly into `main`.

## Workflow

1. Branch from `dev`: `git checkout dev && git pull && git checkout -b feat/my-thing`
2. Open a PR into `dev`.
3. Once merged, verify the change on `dev`'s deployment (below) — this is a
   real, standing test environment, not a one-off preview link.
4. When a batch of merged changes on `dev` is ready to ship, `main` is
   updated with a manual merge from `dev`. This is a deliberate release step,
   not automatic.

## Deployments

Both branches deploy on Vercel from the same project (`hikeitapp`).

| Branch | URL | Notes |
| --- | --- | --- |
| `main` | https://hikeit.app | Production. Auto-deploys on every push/merge to `main`. |
| `dev` | https://hikeitapp-git-dev-fatlums-projects-686676d4.vercel.app | Stable — Vercel's Git Branch URL for `dev`, unchanged across pushes. Auto-deploys on every push/merge to `dev`. Requires a Vercel login to view (Vercel Authentication is on for everything except custom domains). |

Feature branches also get their own per-branch Preview URL
(`hikeitapp-git-<branch>-fatlums-projects-686676d4.vercel.app`) for reviewing
a PR in isolation before it merges into `dev`.
