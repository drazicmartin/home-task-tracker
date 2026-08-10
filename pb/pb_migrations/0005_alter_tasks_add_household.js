/// <reference path="../pb_data/types.d.ts" />

// Add "household" to tasks. Rules that reference the household_members_via_household
// back-relation are wired up separately in 0007_wire_tasks_records_rules.js —
// PocketBase's rule validator resolves relation-rule references against the
// already-committed schema, which doesn't include a field/collection added
// earlier in the very same migration run.
//
// Handles both an existing pre-multi-tenant database (where "tasks" was
// created by hand via the old collection.json import and just needs the
// household field) and a brand new deployment (where "tasks" doesn't exist
// yet and needs to be created from scratch).
migrate((app) => {
  const householdsCollection = app.findCollectionByNameOrId("households");

  let collection;
  try {
    collection = app.findCollectionByNameOrId("tasks");
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
  } else {
    collection = new Collection({
      type: "base",
      name: "tasks",
      fields: [
        { name: "name", type: "text", required: true, max: 150 },
        { name: "frequency", type: "number", required: true, min: 1 },
        { name: "unit", type: "select", required: true, maxSelect: 1, values: ["day", "week", "month", "year"] },
        { name: "score", type: "number", required: true, min: 0 },
        { name: "description", type: "editor", required: false },
        householdFieldSpec,
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("tasks");
  collection.fields.removeByName("household");
  return app.save(collection);
});
