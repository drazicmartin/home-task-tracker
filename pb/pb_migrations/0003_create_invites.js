/// <reference path="../pb_data/types.d.ts" />

// Shareable invite codes/links that let a new user join an existing household.
migrate((app) => {
  const householdsCollection = app.findCollectionByNameOrId("households");
  const usersCollection = app.findCollectionByNameOrId("users");

  const collection = new Collection({
    type: "base",
    name: "invites",
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
        name: "code",
        type: "text",
        required: true,
        max: 32,
      },
      {
        name: "created_by",
        type: "relation",
        required: true,
        collectionId: usersCollection.id,
        cascadeDelete: false,
        maxSelect: 1,
      },
      {
        name: "expires_at",
        type: "date",
        required: false,
      },
      {
        name: "max_uses",
        type: "number",
        required: false,
        min: 1,
      },
      {
        // not required: PocketBase's "required" check on number fields
        // rejects a legitimate 0, and every invite starts at 0 uses
        name: "uses_count",
        type: "number",
        required: false,
        min: 0,
      },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_invites_code ON invites (code)"],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("invites");
  return app.delete(collection);
});
