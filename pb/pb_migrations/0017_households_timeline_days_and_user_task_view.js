/// <reference path="../pb_data/types.d.ts" />

// 1. households.timeline_days: how many days the board's timeline covers.
//    Optional; the app treats an empty / 0 value as the original 30 days
//    (sk/src/lib/timeline.ts), so existing households need no backfill. Only
//    the owner can change it, through the households update rule.
//
// 2. user_task_completions (view): how many times each member completed each
//    quest, all time. The stats page classifies quests into categories and
//    compares who does which category the most; for the "all time" window
//    this is one small row per (member, quest) instead of every record ever.
//    Same membership rule as the records it's computed from.
const MEMBER_RULE = "household.household_members_via_household.user ?= @request.auth.id";

migrate((app) => {
  const households = app.findCollectionByNameOrId("households");
  households.fields.add(new Field({
    name: "timeline_days",
    type: "number",
    required: false,
    onlyInt: true,
    min: 0,
    max: 365,
  }));
  app.save(households);

  app.save(new Collection({
    type: "view",
    name: "user_task_completions",
    listRule: MEMBER_RULE,
    viewRule: MEMBER_RULE,
    viewQuery: `
      SELECT
        (r.household || '_' || r.user || '_' || r.task) AS id,
        r.household,
        r.user,
        r.task,
        COUNT(*) AS completions
      FROM records r
      GROUP BY r.household, r.user, r.task
    `,
  }));
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("user_task_completions"));
  } catch (_) {
    // already gone
  }

  const households = app.findCollectionByNameOrId("households");
  households.fields.removeByName("timeline_days");
  app.save(households);
});
