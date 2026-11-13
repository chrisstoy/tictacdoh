# Deploy: multiplayer-worker (Cloudflare)

Worker name `tictacdoh-multiplayer` (`workers/multiplayer/wrangler.jsonc`).
Deploys from any clean tree. **No** GitHub Actions — do not add a workflow
unless the human explicitly approves Actions changes (AGENTS.md).

## Extra preflight

- [ ] Cloudflare account authenticated for Wrangler (`wrangler whoami` /
  `wrangler login` or API token).
- [ ] `npm run test:multiplayer` green.
- [ ] Decide the `EXPO_PUBLIC_MULTIPLAYER_URL` that native builds and the Pages
  workflow Build step will bake after deploy (Pages already sets production
  Worker URL in `main.yml` for #53). Defaults include Capacitor localhost
  schemes and `https://chrisstoy.github.io`; set Worker `CORS_ORIGINS` only for
  extra Origins.

## Deploy

```bash
npm run test:multiplayer
cd workers/multiplayer
npx wrangler deploy
```

First deploy applies Durable Object migration tag `v1` (`GameRoom`). Capture
the printed HTTPS URL (no trailing slash) and set
`EXPO_PUBLIC_MULTIPLAYER_URL` to that base when running
`npm run build:native` / store release scripts for builds that should expose
Online Create/Join on native and web. Custom scheme:
`tictacdoh://join/<code>`; Pages fallback `/?join=<code>` via `WEB_JOIN_BASE`
(see `deployment.md`). Checklist: `.agents/reference/deployment.md`
(ADR 0004/0005).

Local iteration uses `npx wrangler dev` (or `npm run dev` in that package),
not a Pages deploy.

## Verify after deploying

- `GET ${EXPO_PUBLIC_MULTIPLAYER_URL}/health` returns OK.
- Create a room from a native or Pages build with that env baked in.
- Join landing at `/join/<code>` offers app scheme and browser `?join=`
  fallback.
- If `fetch` fails with a CORS error, extend Worker `CORS_ORIGINS` (see
  `deployment.md`) — do not invent a client workaround. Full checklist is in
  `deployment.md`.

## Rollback

Redeploy a known-good commit from `workers/multiplayer/` with
`npx wrangler deploy`, or `wrangler rollback` if the account has version
history enabled. Native clients keep the old URL until rebuilt with a new
`EXPO_PUBLIC_MULTIPLAYER_URL`.
