/// <reference path="../pb_data/types.d.ts" />

// Add "household" to records (denormalized directly rather than derived via
// task.household so leaderboard/history queries stay a single-hop filter),
// and drop the old "timestamp" field on upgrade: nothing in the app ever
// reads it, everything uses PocketBase's own built-in "created" field
// instead. Rules are wired up separately in 0007_wire_tasks_records_rules.js
// (see the comment in 0005_alter_tasks_add_household.js for why).
//
// Handles both an existing pre-multi-tenant database (alter) and a brand new
// deployment where "records" doesn't exist yet (create).
migrate((app) => {
  const householdsCollection = app.findCollectionByNameOrId("households");
  const tasksCollection = app.findCollectionByNameOrId("tasks");
  const usersCollection = app.findCollectionByNameOrId("users");

  let collection;
  try {
    collection = app.findCollectionByNameOrId("records");
  } catch (_) {
    collection = null;
  }

  // plain-object shape, shared between the "create fresh" (Collection
  // constructor, expects plain JSON-like objects) and "alter existing"
  // (collection.fields.add(), expects a real Field instance) branches below
  const householdFieldSpec = {
    name: "household",
    type: "relation",
    required: false, // relaxed so pre-existing rows survive until the 0009 backfill runs
    collectionId: householdsCollection.id,
    cascadeDelete: true,
    maxSelect: 1,
  };

  if (collection) {
    collection.fields.add(new Field(householdFieldSpec));
    collection.fields.removeByName("timestamp");
  } else {
    collection = new Collection({
      type: "base",
      name: "records",
      fields: [
        {
          name: "task",
          type: "relation",
          required: true,
          collectionId: tasksCollection.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: "user",
          type: "relation",
          required: true,
          collectionId: usersCollection.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: "score", type: "number", required: true, min: 0 },
        householdFieldSpec,
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
  }

  // records are an immutable audit log: correcting a mistake is delete + recreate, not edit
  collection.updateRule = null;

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("records");
  collection.fields.removeByName("household");
  collection.fields.add(new Field({ name: "timestamp", type: "number", required: false }));
  return app.save(collection);
});
