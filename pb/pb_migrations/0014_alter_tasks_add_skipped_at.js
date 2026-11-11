/// <reference path="../pb_data/types.d.ts" />

// "Skip this round": a recurring quest that doesn't need doing this time
// (nothing to wash up because everyone ate out, nothing to take out...) can
// be skipped. Skipping awards no points and creates no record, it only
// restarts the quest's recurrence timer: the board measures overdue-ness from
// the latest of the last completion and skipped_at.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("tasks");
  collection.fields.add(new Field({
    name: "skipped_at",
    type: "date",
    required: false,
  }));
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("tasks");
  collection.fields.removeByName("skipped_at");
  return app.save(collection);
});
