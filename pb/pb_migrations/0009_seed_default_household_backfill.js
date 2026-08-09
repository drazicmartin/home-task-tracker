/// <reference path="../pb_data/types.d.ts" />

// One-time data migration for the pre-multi-tenant deployment: if any tasks
// exist without a household (i.e. this is the original single-household
// database being upgraded), create a default household, add every existing
// user as a member, and backfill "household" onto their tasks/records.
//
// On a brand new deployment there are no users/tasks yet, so this is a no-op.
migrate((app) => {
  const orphanTasks = app.findRecordsByFilter("tasks", "household = ''", "-created", 9999, 0);
  if (orphanTasks.length === 0) {
    return; // nothing to backfill
  }

  const users = app.findRecordsByFilter("users", "id != ''", "+created", 9999, 0);
  if (users.length === 0) {
    return;
  }

  const householdsCollection = app.findCollectionByNameOrId("households");
  const household = new Record(householdsCollection, {
    name: "Foyer",
    owner: users[0].id,
  });
  app.save(household);

  const membersCollection = app.findCollectionByNameOrId("household_members");
  for (const user of users) {
    const member = new Record(membersCollection, {
      household: household.id,
      user: user.id,
    });
    app.save(member);
  }

  for (const task of orphanTasks) {
    task.set("household", household.id);
    app.save(task);
  }

  const orphanRecords = app.findRecordsByFilter("records", "household = ''", "-created", 99999, 0);
  for (const rec of orphanRecords) {
    rec.set("household", household.id);
    app.save(rec);
  }
}, (app) => {
  // Not cleanly reversible (would need to remember which household/members
  // were created here vs. added later by hand) — intentionally a no-op down.
});
