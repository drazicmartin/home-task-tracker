/// <reference path="../pb_data/types.d.ts" />

// Add a locale preference, and widen the view/list rules from "self only" to
// "self, or anyone who shares a household with me" — required so the task
// board's member picker, the leaderboard and the history feed can show
// co-members' names/avatars. create/update/delete stay self-only.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  collection.fields.add(new Field({
    name: "locale",
    type: "select",
    required: false,
    maxSelect: 1,
    values: ["fr", "en"],
  }));

  const shareHouseholdRule =
    "id = @request.auth.id || " +
    "@request.auth.household_members_via_user.household ?= household_members_via_user.household";
  collection.listRule = shareHouseholdRule;
  collection.viewRule = shareHouseholdRule;

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("locale");
  collection.listRule = "";
  collection.viewRule = "id = @request.auth.id";
  return app.save(collection);
});
