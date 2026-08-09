/// <reference path="../pb_data/types.d.ts" />

// Syncs the "users" auth collection's OAuth2 config from env vars on every
// boot (not a migration: this is deployment config, not schema, and it
// needs to react to AUTHENTIK_* changing or being unset again — a migration
// would only ever run once and get "stuck" on whatever was configured the
// first time it applied).
//
// Set AUTHENTIK_CLIENT_ID / AUTHENTIK_CLIENT_SECRET / AUTHENTIK_ISSUER (the
// base URL of your Authentik instance, e.g. https://auth.example.com) to
// enable "Continue with Authentik" login. Leave them unset to disable it.
onBootstrap((e) => {
  e.next();

  const clientId = $os.getenv("AUTHENTIK_CLIENT_ID");
  const clientSecret = $os.getenv("AUTHENTIK_CLIENT_SECRET");
  const issuer = $os.getenv("AUTHENTIK_ISSUER");

  const users = $app.findCollectionByNameOrId("users");

  if (clientId && clientSecret && issuer) {
    const base = issuer.replace(/\/+$/, "");
    users.oauth2.enabled = true;
    users.oauth2.providers = [
      {
        name: "oidc",
        clientId: clientId,
        clientSecret: clientSecret,
        // must match core.OAuth2ProviderConfig's exact JSON tags — the SDK
        // navigates the login popup to `provider.authURL + redirectUri`
        // directly, so a wrong/misspelled key here silently ends up with an
        // empty authURL and the popup lands on a relative "?client_id=..."
        // URL instead, which the browser resolves against whatever page
        // opened it (looks like the app's own login page reappearing).
        authURL: base + "/application/o/authorize/",
        tokenURL: base + "/application/o/token/",
        userInfoURL: base + "/application/o/userinfo/",
        displayName: "Authentik",
        pkce: null,
      },
    ];
  } else {
    users.oauth2.enabled = false;
    users.oauth2.providers = [];
  }

  $app.save(users);
});
