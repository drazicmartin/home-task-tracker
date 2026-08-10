/// <reference path="../pb_data/types.d.ts" />

// Join table between "households" and "users". No "role" field: ownership
// lives on households.owner, membership here is just "is a member".
migrate((app) => {
  const householdsCollection = app.findCollectionByNameOrId("households");
  const usersCollection = app.findCollectionByNameOrId("users");

  const collection = new Collection({
    type: "base",
    name: "household_members",
    fields: [
      {
        name: "household",
        type: "relation",
        required: true,
        collectionId: householdsCollection.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      {
        name: "user",
        type: "relation",
        required: true,
        collectionId: usersCollection.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_household_members_household_user ON household_members (household, user)",
    ],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    // self-leave, or the household owner removing anyone; doesn't need the
    // household_members_via_household back-relation so it's safe to set now
    deleteRule: "user = @request.auth.id || household.owner = @request.auth.id",
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("household_members");
  return app.delete(collection);
});
