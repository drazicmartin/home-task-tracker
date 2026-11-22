/// <reference path="../pb_data/types.d.ts" />

// Meal planner (sk/src/routes/(app)/meals, sk/src/lib/meals.ts).
//
// 1. meals: the household's own library of dishes, with a difficulty, a
//    preparation time and an optional photo of the finished dish. The photo
//    is a *protected* file: it is only served with a file token of someone
//    who can view the meal (a member of its household), and the app streams
//    it through its own /meal-photos route, since PocketBase itself is not
//    necessarily reachable from the browser.
//
// 2. meal_plan: which meal is cooked on which day, for lunch or dinner. One
//    row per (household, day, slot), enforced by a unique index. "day" is a
//    plain YYYY-MM-DD calendar date, not a timestamp, so a dinner never moves
//    to another day because of time zones. Deleting a meal removes it from
//    the plan (cascade). The create/update rules also check the meal belongs
//    to the same household, so a plan can't point at another household's meal.
//
// 3. households.meal_slots: which slots the planner shows on each weekday,
//    e.g. only dinner Monday to Friday, lunch and dinner at the weekend.
//    Optional JSON; the app falls back to exactly that default when empty.
//    Only the owner can change it, through the households update rule.
const MEMBER_RULE = "household.household_members_via_household.user ?= @request.auth.id";
const SAME_HOUSEHOLD_MEAL_RULE = `${MEMBER_RULE} && meal.household = household`;

migrate((app) => {
  const households = app.findCollectionByNameOrId("households");

  const meals = new Collection({
    type: "base",
    name: "meals",
    fields: [
      {
        name: "household",
        type: "relation",
        required: true,
        collectionId: households.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      { name: "name", type: "text", required: true, max: 150 },
      {
        name: "difficulty",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["easy", "medium", "hard"],
      },
      {
        // total time to get it on the table, in minutes; not "required"
        // because PocketBase's required check rejects a legitimate 0
        name: "prep_minutes",
        type: "number",
        required: false,
        onlyInt: true,
        min: 0,
        max: 1440,
      },
      {
        name: "photo",
        type: "file",
        required: false,
        maxSelect: 1,
        // the app downsizes photos in the browser before upload; this is the
        // ceiling for an untouched one (no JavaScript, unsupported browser)
        maxSize: 15 * 1024 * 1024,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        thumbs: ["160x160", "640x480"],
        protected: true,
      },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_meals_household ON meals (household)"],
    listRule: MEMBER_RULE,
    viewRule: MEMBER_RULE,
    createRule: MEMBER_RULE,
    updateRule: MEMBER_RULE,
    deleteRule: MEMBER_RULE,
  });
  app.save(meals);

  const mealPlan = new Collection({
    type: "base",
    name: "meal_plan",
    fields: [
      {
        name: "household",
        type: "relation",
        required: true,
        collectionId: households.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      {
        name: "day",
        type: "text",
        required: true,
        min: 10,
        max: 10,
        pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      },
      {
        name: "slot",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["lunch", "dinner"],
      },
      {
        name: "meal",
        type: "relation",
        required: true,
        collectionId: meals.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_meal_plan_household_day_slot ON meal_plan (household, day, slot)",
      "CREATE INDEX idx_meal_plan_meal ON meal_plan (meal)",
    ],
    listRule: MEMBER_RULE,
    viewRule: MEMBER_RULE,
    createRule: SAME_HOUSEHOLD_MEAL_RULE,
    updateRule: SAME_HOUSEHOLD_MEAL_RULE,
    deleteRule: MEMBER_RULE,
  });
  app.save(mealPlan);

  households.fields.add(new Field({
    name: "meal_slots",
    type: "json",
    required: false,
    maxSize: 2000,
  }));
  return app.save(households);
}, (app) => {
  for (const name of ["meal_plan", "meals"]) {
    try {
      app.delete(app.findCollectionByNameOrId(name));
    } catch (_) {
      // already gone
    }
  }

  const households = app.findCollectionByNameOrId("households");
  households.fields.removeByName("meal_slots");
  return app.save(households);
});
