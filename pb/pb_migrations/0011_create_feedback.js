/// <reference path="../pb_data/types.d.ts" />

// "Message to the developer" inbox. Users write bug reports / ideas from the
// app; they can only see and delete their own messages. The developer view
// (sk/src/routes/(app)/feedback, gated by the DEVELOPER_EMAILS env var) reads
// every message and flips "status" through the superuser client, which is
// why updateRule stays locked here.
migrate((app) => {
  const usersCollection = app.findCollectionByNameOrId("users");
  const householdsCollection = app.findCollectionByNameOrId("households");

  const collection = new Collection({
    type: "base",
    name: "feedback",
    fields: [
      {
        name: "user",
        type: "relation",
        required: true,
        collectionId: usersCollection.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      {
        // optional context: which household the user was in when writing
        name: "household",
        type: "relation",
        required: false,
        collectionId: householdsCollection.id,
        cascadeDelete: false,
        maxSelect: 1,
      },
      {
        name: "kind",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["bug", "idea", "other"],
      },
      { name: "message", type: "text", required: true, max: 5000 },
      // app page the user came from, e.g. "/board"
      { name: "page", type: "text", required: false, max: 300 },
      {
        name: "status",
        type: "select",
        required: false,
        maxSelect: 1,
        values: ["open", "done"],
      },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: '@request.auth.id != "" && user = @request.auth.id',
    updateRule: null,
    deleteRule: "user = @request.auth.id",
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("feedback");
  return app.delete(collection);
});
