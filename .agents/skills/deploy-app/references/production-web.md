# Deploy: production-web (GitHub Pages)

Deploys from `main` via `.github/workflows/main.yml` (`workflow_dispatch` only).
Live site: https://chrisstoy.github.io/tictacdoh/

This skill is the only sanctioned way to publish the web build; do not re-add a
push trigger or deploy any other way.

## Extra preflight

- [ ] `GITHUB_PAGES=true` for the Pages build (the workflow sets it). Native
  scripts run `npm run build:native`, which forces `GITHUB_PAGES` unset so
  `start_url` is `/`.

## Deploy

1. Optionally dry-run the artifact locally: `GITHUB_PAGES=true npm run build`
   and confirm `dist/` contains `index.html`, `manifest.json`, `sw.js`,
   `icons/`. `dist/manifest.json` `start_url` is `/tictacdoh/`.
2. Trigger the workflow from `main`:
   `gh workflow run "Build and Deploy to Pages" --ref main`, then
   `gh run watch`. It builds (Node 20, `npm ci`, `npm run build`) and deploys
   `./dist` via `actions/deploy-pages@v4`.

## Verify after deploying

- Open https://chrisstoy.github.io/tictacdoh/ — setup screen loads with
  music/fonts/images, no 404s in the network tab (base path `/tictacdoh/`).
- Start a match vs CPU and play a round to the end.
- In DevTools → Application: manifest is valid and the service worker `sw.js`
  is registered with scope `/tictacdoh/`. After a deploy, a hard refresh (or
  closing all tabs) may be needed to pick up the new worker.

## Rollback

Revert the bad commit on `main`, then run the workflow again; or run it with
`--ref <last-good-commit>`.

## Manual steps

- GitHub Pages must be configured to deploy from "GitHub Actions" (already so
  if the current site is live).
