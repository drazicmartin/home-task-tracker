/**
 * Household "kinds": what a household (a group of players) is tracking. The
 * kind picks which preset quest catalogue is offered first on the "new quest"
 * screen, and which categories custom quests are sorted into. It's stored on
 * households.kind (see pb/pb_migrations/0013_alter_households_add_kind.js);
 * an empty / unknown value means "chores", the original purpose of the app.
 */

export type HouseholdKind = 'chores' | 'habits' | 'fitness' | 'learning';

export const HOUSEHOLD_KINDS: HouseholdKind[] = ['chores', 'habits', 'fitness', 'learning'];

export const DEFAULT_KIND: HouseholdKind = 'chores';

export function isHouseholdKind(value: unknown): value is HouseholdKind {
	return typeof value === 'string' && (HOUSEHOLD_KINDS as string[]).includes(value);
}

/** The kind of a household record (or a raw form value), falling back to the default. */
export function householdKind(value: unknown): HouseholdKind {
	if (value && typeof value === 'object' && 'kind' in value) value = value.kind;
	return isHouseholdKind(value) ? value : DEFAULT_KIND;
}
