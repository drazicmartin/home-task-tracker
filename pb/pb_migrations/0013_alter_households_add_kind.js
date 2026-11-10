/// <reference path="../pb_data/types.d.ts" />

// Household "kind": what the group tracks (house chores, personal habits,
// fitness, learning...). It picks which preset quest catalogue the app offers
// and how custom quests get categorised (sk/src/lib/householdKinds.ts).
// Optional in the schema (the app treats an empty value as "chores"), and
// every household that existed before this migration is backfilled to
// "chores", which is what the app was built for until now.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("households");
  collection.fields.add(new Field({
    name: "kind",
    type: "select",
    required: false,
    maxSelect: 1,
    values: ["chores", "habits", "fitness", "learning"],
  }));
  app.save(collection);

  const households = app.findRecordsByFilter("households", "kind = ''", "", 0, 0);
  for (const household of households) {
    household.set("kind", "chores");
    app.save(household);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("households");
  collection.fields.removeByName("kind");
  return app.save(collection);
});
