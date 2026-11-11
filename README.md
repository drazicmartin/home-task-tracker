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

- Mobile-first, video-game-style UI: chores are quests on a quest board, a
  HUD shows your level, XP bar and coins (levels are derived from points
  earned, nothing extra is stored), a bottom tab bar for one-handed use, and
  a podium leaderboard
- Task board with a recurrence-based "how overdue is this" visual, and a
  completion dialog that splits points across whoever did it together
- "Skip this round" in the completion dialog for a recurring quest that
  isn't needed this time (everyone ate out, nothing to take out...): no
  points and no history entry, it just restarts the quest's timer
  (`tasks.skipped_at`), with an undo in the confirmation toast
- Per-household leaderboard (week / month / all-time) and activity history
- Self-serve signup, household creation, and invite links to bring in the
  rest of the household
- Optional "Continue with Authentik" SSO login (see below)
- French and English UI (French by default), switchable per-account
- Several households per account, switched in one tap from the row of
  household pills under the HUD (you stay on the same screen), with a "+"
  to create or join another one
- Household types — house chores, habits, fitness & health, learning —
  each with its own preset quest catalogue and categories
  (`sk/src/lib/householdKinds.ts`); picked when creating the household,
  changeable by the owner in its settings
- Built-in quest catalogues (dishes, vacuuming, cat litter... / water, sleep,
  reading... / running, strength, yoga... / languages, homework, an
  instrument...) to add several common quests at once — the household's own
  type is shown first, the others are a tab away — with points on one
  consistent scale: about 1 point per 5 minutes of effort, +1/+2 for
  unpleasant ones (`sk/src/lib/questCatalog.ts`)
- Leave a household (the owner hands ownership to the next member) or
  delete it entirely, from the household settings
- "Message the developer" inbox: users send bug reports / ideas from the
  pause menu; accounts listed in `DEVELOPER_EMAILS` see all of them and can
  copy the open ones as a ready-to-paste Claude Code prompt
- Installable as an app (PWA): "Add to Home Screen" on iOS / "Install app"
  on Android and desktop Chrome/Edge opens it full-screen with its own icon.
  The service worker (`sk/src/service-worker.ts`) caches only the app shell
  (JS, CSS, icons) — pages are never cached, so no household data lingers
  on the device — and shows an offline screen when there's no connection.
  Installing requires the site to be served over HTTPS (or `localhost`)

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
4. Set `AUTHENTIK_CLIENT_ID`, `AUTHENTIK_CLIENT_SECRET`, `AUTHENTIK_ISSUER` in
   `.env`. `AUTHENTIK_ISSUER` accepts either your Authentik instance's bare
   base URL (`https://auth.example.com`) or the full per-application
   "Issuer URL" shown on the provider's page in Authentik
   (`https://auth.example.com/application/o/<slug>/`) — both work, the
   `/application/o/<slug>/` part is stripped automatically if present.
5. On Authentik 2025.10+: its default "email" scope mapping always sends
   `email_verified: false`, regardless of the user's actual verified status
   in Authentik — a deliberate security change, since Authentik has no single
   authoritative source for that. PocketBase requires `email_verified: true`
   to accept the email claim at all, so without this step every login fails
   at account creation with "email: Cannot be blank" even though Authentik
   clearly sent one. Fix: **Customization → Property Mappings → Create →
   Scope Mapping**, name it e.g. `Custom OAuth Mapping: OpenID 'email'
   (verified)`, scope name `email`, expression:
   ```python
   return {
       "email": request.user.email,
       "email_verified": True,
   }
   ```
   then on the provider (**Applications → Providers → your provider → edit →
   Advanced protocol settings → Scope Mappings**) swap out the default email
   mapping for this custom one (having both selected gives ambiguous merged
   output — remove the default, don't just add to it).
6. Redeploy. Leave those variables unset to keep Authentik login disabled.

If it still doesn't work, open the browser console right when the popup
closes — `sk/src/lib/OAuth2Button.svelte` logs the real error there, including
the full validation error details for any 400 from PocketBase.

**Popup opens and just sits on a blank `about:blank` page:** this is a known
PocketBase-behind-Coolify issue, not an app bug. `authWithOAuth2()` opens a
PocketBase Realtime (Server-Sent Events) subscription *before* it ever
navigates the popup to Authentik — and Coolify's Traefik proxy gzip-compresses
responses by default, which breaks SSE outright (compressed streams can't be
be delivered incrementally), so the subscription hangs forever and the popup
never moves. Fix: disable compression/gzip for the `pb` service specifically
in Coolify's proxy settings for that service's domain (some Coolify versions
disable this automatically for PocketBase-shaped services; older ones need it
turned off by hand). This only affects `pb`, not `sk`.

## Contributors

- [Drazic MARTIN](https://github.com/drazicmartin)
