/// <reference path="../pb_data/types.d.ts" />

// Speeds up the quest board and the stats/leaderboard pages.
//
// 1. Indexes: every page filters records by household (+ a created window)
//    and the board looks up each quest's latest record, but only the
//    household_members/invites lookups had an index so far — everything else
//    was a full table scan, across every household on the deployment.
//
// 2. task_last_done (view): each quest's latest completion, computed in SQL.
//    The board used to send one request per quest to find it (N+1). It's a
//    correlated subquery rather than a GROUP BY so SQLite applies the
//    "household = X" filter before doing any work, and each lookup is a
//    single seek in idx_records_task_created.
//
// 3. daily_points (view): points and completion counts per member per
//    (UTC) day. The HUD, leaderboard and stats page used to download every
//    single record (with its user expanded) just to add them up in Node; a
//    whole year of history is now at most members × 365 rows. Grouping by
//    household first lets SQLite push the household filter into the view.
//
// Both views are read-only and use the same membership rule as the
// collections they're computed from.
const MEMBER_RULE = "household.household_members_via_household.user ?= @request.auth.id";

const INDEXES = {
  records: [
    "CREATE INDEX idx_records_household_created ON records (household, created)",
    "CREATE INDEX idx_records_task_created ON records (task, created)",
  ],
  tasks: ["CREATE INDEX idx_tasks_household ON tasks (household)"],
};

migrate((app) => {
  for (const [name, indexes] of Object.entries(INDEXES)) {
    const collection = app.findCollectionByNameOrId(name);
    for (const index of indexes) collection.addIndex(...parseIndex(index));
    app.save(collection);
  }

  app.save(new Collection({
    type: "view",
    name: "task_last_done",
    listRule: MEMBER_RULE,
    viewRule: MEMBER_RULE,
    viewQuery: `
      SELECT
        t.id,
        t.household,
        (SELECT MAX(r.created) FROM records r WHERE r.task = t.id) AS last_done
      FROM tasks t
    `,
  }));

  app.save(new Collection({
    type: "view",
    name: "daily_points",
    listRule: MEMBER_RULE,
    viewRule: MEMBER_RULE,
    viewQuery: `
      SELECT
        (r.household || '_' || r.user || '_' || substr(r.created, 1, 10)) AS id,
        r.household,
        r.user,
        substr(r.created, 1, 10) AS day,
        SUM(r.score) AS points,
        COUNT(*) AS completions
      FROM records r
      GROUP BY r.household, r.user, substr(r.created, 1, 10)
    `,
  }));
}, (app) => {
  for (const name of ["daily_points", "task_last_done"]) {
    try {
      app.delete(app.findCollectionByNameOrId(name));
    } catch (_) {
      // already gone
    }
  }

  for (const [name, indexes] of Object.entries(INDEXES)) {
    const collection = app.findCollectionByNameOrId(name);
    for (const index of indexes) collection.removeIndex(index.match(/INDEX (\w+)/)[1]);
    app.save(collection);
  }
});

// "CREATE INDEX idx ON table (a, b)" -> addIndex(name, unique, columns, optional)
function parseIndex(sql) {
  const [, name, columns] = sql.match(/INDEX (\w+) ON \w+ \((.+)\)/);
  return [name, false, columns, ""];
}
