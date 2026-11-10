/// <reference path="../pb_data/types.d.ts" />

// "On demand" quests have no recurrence: they never become due or overdue and
// are simply done whenever needed. frequency/unit stay required in the schema
// and keep their last value, so switching a quest back to recurring restores it.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("tasks");
  collection.fields.add(new Field({
    name: "on_demand",
    type: "bool",
    required: false,
  }));
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("tasks");
  collection.fields.removeByName("on_demand");
  return app.save(collection);
});
