import type PocketBase from 'pocketbase';
import { ClientResponseError } from 'pocketbase';
import type { MealSlot } from '$lib/meals';

/**
 * Puts a meal on the plan for one (day, slot), replacing whatever was there.
 * meal_plan has a unique (household, day, slot) index, so if a concurrent
 * request created the row in between, the create fails and we update it.
 */
export async function setPlannedMeal(
	pb: PocketBase,
	householdId: string,
	day: string,
	slot: MealSlot,
	mealId: string
): Promise<void> {
	const plan = pb.collection('meal_plan');
	const filter = pb.filter('household = {:h} && day = {:d} && slot = {:s}', { h: householdId, d: day, s: slot });
	const find = () => plan.getFirstListItem(filter, { fields: 'id' }).catch(() => null);

	const existing = await find();
	if (existing) {
		await plan.update(existing.id, { meal: mealId });
		return;
	}
	try {
		await plan.create({ household: householdId, day, slot, meal: mealId });
	} catch (err) {
		const raced = err instanceof ClientResponseError && err.status === 400 ? await find() : null;
		if (!raced) throw err;
		await plan.update(raced.id, { meal: mealId });
	}
}
