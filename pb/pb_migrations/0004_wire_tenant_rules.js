/// <reference path="../pb_data/types.d.ts" />

// Now that households, household_members and invites all exist, wire up the
// rules that use the household_members_via_household back-relation to scope
// access to "people who belong to this household". createRule stays locked
// (null) on households and household_members on purpose: households are only
// ever created through the privileged server-side flow (sk/src/lib/server/pbAdmin.ts),
// which also creates the matching membership row — this is what stops a
// client from self-joining an arbitrary household by guessing its id.
migrate((app) => {
  const households = app.findCollectionByNameOrId("households");
  households.listRule = "household_members_via_household.user ?= @request.auth.id";
  households.viewRule = "household_members_via_household.user ?= @request.auth.id";
  households.updateRule = "owner = @request.auth.id";
  households.deleteRule = "owner = @request.auth.id";
  app.save(households);

  const householdMembers = app.findCollectionByNameOrId("household_members");
  householdMembers.listRule = "household.household_members_via_household.user ?= @request.auth.id";
  householdMembers.viewRule = "household.household_members_via_household.user ?= @request.auth.id";
  app.save(householdMembers);

  const invites = app.findCollectionByNameOrId("invites");
  const inviteMemberRule = "household.household_members_via_household.user ?= @request.auth.id";
  invites.listRule = inviteMemberRule;
  invites.viewRule = inviteMemberRule;
  invites.createRule = inviteMemberRule;
  invites.deleteRule = inviteMemberRule;
  return app.save(invites);
}, (app) => {
  const households = app.findCollectionByNameOrId("households");
  households.listRule = null;
  households.viewRule = null;
  households.updateRule = null;
  households.deleteRule = null;
  app.save(households);

  const householdMembers = app.findCollectionByNameOrId("household_members");
  householdMembers.listRule = null;
  householdMembers.viewRule = null;
  app.save(householdMembers);

  const invites = app.findCollectionByNameOrId("invites");
  invites.listRule = null;
  invites.viewRule = null;
  invites.createRule = null;
  invites.deleteRule = null;
  return app.save(invites);
});
