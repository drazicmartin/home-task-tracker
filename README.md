# Home-Task-Tracker (HTT)

HTT, home task tracker is a gamified way of having all the housework done !
It's is currently in developement.

this project use the following stacks :
- SvelteKit as frontend : https://kit.svelte.dev/
- PocketBase as backend : https://pocketbase.io/

# Development 
## Start Backend
```bash
docker compose -f dev-docker-compose.yml up -d
```
- REST API: http://0.0.0.0:3002/api/
- Admin UI: http://0.0.0.0:3002/_/

## Start front end
```bash
cd sk
npm run start -- --open
```

# Deploy

Copy `.env.example` to `.env` and fill in real values, then run:
```
docker compose up -d
```

There's no reverse proxy in this compose file — each service (`sk`, `pb`,
`grafana`) just exposes its container port on the internal Docker network.
Point your own reverse proxy / platform proxy at whichever service(s) you
want reachable from the outside.

This is set up for deploying on [Coolify](https://coolify.io/): import the
repo, let it pick up `docker-compose.yml`, set the env vars from
`.env.example` in the Coolify UI, and assign a domain to the `sk` service
(and optionally `pb` / `grafana` on their own subdomains) from Coolify's
per-service domain settings — no nginx or manual Traefik labels needed.

# Single sign-on with Authentik (optional)

Users can log in with an Authentik account instead of (or alongside) an
email/password. It's entirely opt-in: `pb/pb_hooks/main.pb.js` syncs the
PocketBase OAuth2 config from `AUTHENTIK_CLIENT_ID` / `AUTHENTIK_CLIENT_SECRET`
/ `AUTHENTIK_ISSUER` on every boot, and the "Continue with Authentik" button
on the login/signup pages only appears when it's actually configured.

To enable it:
1. In Authentik, create an OAuth2/OpenID provider with redirect URI
   `${PUBLIC_PB_URL}/api/oauth2-redirect`.
2. Set `AUTHENTIK_CLIENT_ID`, `AUTHENTIK_CLIENT_SECRET`, `AUTHENTIK_ISSUER`
   (your Authentik instance's base URL, e.g. `https://auth.example.com`) and
   `PUBLIC_PB_URL` (the `pb` service's own public URL/domain — the browser
   talks to PocketBase directly for this flow, so it needs to be reachable,
   not just internal to the Docker network) in `.env`.
3. Redeploy. Leave those variables unset to keep Authentik login disabled.

# Grafana - query example

```sql
SELECT u.name, SUM(score), strftime('%s', r.created)*1000 as ts
FROM records as r
INNER JOIN users as u ON u.id = r.user
WHERE ts >= $__from AND ts <= $__to
GROUP BY u.name, ts
ORDER BY ts DESC;
```

# Contributors

- [Drazic MARTIN](https://github.com/drazicmartin)