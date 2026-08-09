# Home-Task-Tracker (HTT)

A gamified household task tracker: create a household for your couple,
family, or roommates, add chores with a point value and a recurrence, and
whoever completes one earns points. Multiple independent households can run
on the same deployment — each self-serve signup either creates a new
household or joins an existing one via an invite link.

Stack:
- [SvelteKit](https://kit.svelte.dev/) (Svelte 5, Tailwind v4) — frontend
- [PocketBase](https://pocketbase.io/) — backend, auth, and database, with
  the schema managed as code in `pb/pb_migrations/`

## Features

- Task board with a recurrence-based "how overdue is this" visual, and a
  completion dialog that splits points across whoever did it together
- Per-household leaderboard (week / month / all-time) and activity history
- Self-serve signup, household creation, and invite links to bring in the
  rest of the household
- Optional "Continue with Authentik" SSO login (see below)
- French and English UI (French by default), switchable per-account

## Development

Start the backend:
```bash
docker compose -f dev-docker-compose.yml up -d
```
- REST API: http://0.0.0.0:3002/api/
- Admin UI: http://0.0.0.0:3002/_/

Start the frontend:
```bash
cd sk
npm install
npm run dev -- --open
```

The PocketBase schema lives entirely in `pb/pb_migrations/` (applied
automatically on `pocketbase serve`) — there's nothing to configure by hand
in the Admin UI beyond creating the first superuser, which
`pb/docker-entrypoint.sh` already does from `PB_SUPERUSER_EMAIL` /
`PB_SUPERUSER_PASSWORD`.

## Deploy

Copy `.env.example` to `.env` and fill in real values, then run:
```
docker compose up -d
```

There's no reverse proxy in this compose file — each service (`sk`, `pb`)
just exposes its container port on the internal Docker network. Point your
own reverse proxy / platform proxy at whichever service(s) you want reachable
from the outside.

This is set up for deploying on [Coolify](https://coolify.io/): import the
repo, let it pick up `docker-compose.yml`, set the env vars from
`.env.example` in the Coolify UI, and assign a domain to the `sk` service
(and `pb` too, on its own subdomain, if you want the PocketBase Admin UI or
Authentik login reachable) from Coolify's per-service domain settings — no
nginx or manual Traefik labels needed.

### Upgrading an existing single-household deployment

If you're upgrading from before households/multi-tenancy existed, keep the
same `db-data` volume and just deploy the new images — `pb_migrations`
includes a one-time backfill that creates a household from whatever tasks/
records/users already exist and adds every existing user as a member, so
history isn't lost. Take a PocketBase backup first regardless (Admin UI →
Settings → Backups, or `docker cp` the volume out) as a rollback safety net.
Existing accounts won't have a usable password from before (they were never
actually logged into) — use PocketBase's forgot-password flow to set one.

## Single sign-on with Authentik (optional)

Users can log in with an Authentik account instead of (or alongside) an
email/password. It's entirely opt-in: `pb/pb_hooks/main.pb.js` syncs the
PocketBase OAuth2 config from `AUTHENTIK_CLIENT_ID` / `AUTHENTIK_CLIENT_SECRET`
/ `AUTHENTIK_ISSUER` on every boot, and the "Continue with Authentik" button
on the login/signup pages only appears when it's actually configured.

To enable it:
1. Give the `pb` service its own public domain (in Coolify: a separate
   domain from `sk`, e.g. `pb.example.com` next to `sk`'s `tasks.example.com`)
   — the browser talks to PocketBase directly for this flow, so it needs to
   be reachable on its own, not just internal to the Docker network.
2. In Authentik, create an OAuth2/OpenID provider with redirect URI
   `https://pb.example.com/api/oauth2-redirect` (that `pb` domain from step 1
   + `/api/oauth2-redirect`, exactly).
3. Set `PUBLIC_PB_URL` to that same `pb` domain from step 1 — **this is not
   the same as `ORIGIN`**, which is the app's own domain. Mixing these two up
   (pointing `PUBLIC_PB_URL` at the app instead of at PocketBase) is the most
   common cause of the login popup opening and immediately closing with no
   useful error.
4. Set `AUTHENTIK_CLIENT_ID`, `AUTHENTIK_CLIENT_SECRET`, `AUTHENTIK_ISSUER`
   (your Authentik instance's base URL, e.g. `https://auth.example.com`) in
   `.env`.
5. Redeploy. Leave those variables unset to keep Authentik login disabled.

If it still doesn't work, open the browser console right when the popup
closes — `sk/src/lib/OAuth2Button.svelte` logs the real error there.

## Contributors

- [Drazic MARTIN](https://github.com/drazicmartin)
