/// <reference path="../pb_data/types.d.ts" />

// Allow editing history records (records.updateRule was null since 0006 —
// "immutable audit log"), matching the flat trust model already used for
// create/delete: any household member can correct a mistake in place
// instead of having to delete + recreate it.
migrate((app) => {
  const memberRule = "household.household_members_via_household.user ?= @request.auth.id";

  const records = app.findCollectionByNameOrId("records");
  records.updateRule = memberRule;
  return app.save(records);
}, (app) => {
  const records = app.findCollectionByNameOrId("records");
  records.updateRule = null;
  return app.save(records);
});
