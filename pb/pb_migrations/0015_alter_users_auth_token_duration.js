/// <reference path="../pb_data/types.d.ts" />

// Lengthen the users' auth token lifetime from PocketBase's default 7 days
// to 30 days. sk/src/hooks.server.ts refreshes the token on every request,
// so this is the allowed *inactivity* window, not a hard session cap: anyone
// who opens the app at least once a month stays logged in indefinitely.
const THIRTY_DAYS = 30 * 24 * 60 * 60;
const PB_DEFAULT = 7 * 24 * 60 * 60;

migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.authToken.duration = THIRTY_DAYS;
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.authToken.duration = PB_DEFAULT;
  return app.save(collection);
});
