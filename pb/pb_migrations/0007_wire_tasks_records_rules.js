/// <reference path="../pb_data/types.d.ts" />

// Now that tasks.household and records.household are committed, wire up the
// household-membership rule on both collections. Trust-based within a
// household (any member can create/edit/delete any task/record) — matches
// the couples/family use case.
migrate((app) => {
  const memberRule = "household.household_members_via_household.user ?= @request.auth.id";

  const tasks = app.findCollectionByNameOrId("tasks");
  tasks.listRule = memberRule;
  tasks.viewRule = memberRule;
  tasks.createRule = memberRule;
  tasks.updateRule = memberRule;
  tasks.deleteRule = memberRule;
  app.save(tasks);

  const records = app.findCollectionByNameOrId("records");
  records.listRule = memberRule;
  records.viewRule = memberRule;
  records.createRule = memberRule;
  records.deleteRule = memberRule;
  return app.save(records);
}, (app) => {
  const tasks = app.findCollectionByNameOrId("tasks");
  tasks.listRule = "";
  tasks.viewRule = "";
  tasks.createRule = "";
  tasks.updateRule = "";
  tasks.deleteRule = "";
  app.save(tasks);

  const records = app.findCollectionByNameOrId("records");
  records.listRule = "";
  records.viewRule = "";
  records.createRule = "";
  records.deleteRule = null;
  return app.save(records);
});
