/// <reference path="../pb_data/types.d.ts" />

// Creates the "households" collection (a couple/group/family tenant).
// Rules that need to reference "household_members" (which does not exist
// yet) are wired up in 0004_wire_tenant_rules.js once every collection in
// the cycle has been created.
migrate((app) => {
  const usersCollection = app.findCollectionByNameOrId("users");

  const collection = new Collection({
    type: "base",
    name: "households",
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        max: 100,
      },
      {
        name: "owner",
        type: "relation",
        required: true,
        collectionId: usersCollection.id,
        cascadeDelete: false,
        maxSelect: 1,
      },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("households");
  return app.delete(collection);
});
