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

export type MoveResult = { moved: string; swapped: string | null };

/**
 * Moves the dish planned on (fromDay, fromSlot) to (toDay, toSlot). If a dish
 * is already planned there, the two dishes swap places. Returns the ids of
 * the dish that moved and of the one it swapped with (null if the target was
 * free). Throws if nothing is planned on the source slot.
 */
export async function movePlannedMeal(
	pb: PocketBase,
	householdId: string,
	from: { day: string; slot: MealSlot },
	to: { day: string; slot: MealSlot }
): Promise<MoveResult> {
	const plan = pb.collection('meal_plan');
	const find = ({ day, slot }: { day: string; slot: MealSlot }) =>
		plan
			.getFirstListItem(pb.filter('household = {:h} && day = {:d} && slot = {:s}', { h: householdId, d: day, s: slot }), {
				fields: 'id,meal'
			})
			.catch(() => null);

	const [source, target] = await Promise.all([find(from), find(to)]);
	if (!source) throw new Error('nothing planned on the source slot');
	const sourceMeal = String(source.meal);

	if (!target) {
		// the (household, day, slot) unique index rejects this if someone filled the target meanwhile
		await plan.update(source.id, { day: to.day, slot: to.slot });
		return { moved: sourceMeal, swapped: null };
	}

	const targetMeal = String(target.meal);
	if (targetMeal === sourceMeal) return { moved: sourceMeal, swapped: targetMeal };

	// Only the dishes change hands: both rows keep their (day, slot), so the unique index never trips.
	await plan.update(target.id, { meal: sourceMeal });
	try {
		await plan.update(source.id, { meal: targetMeal });
	} catch (err) {
		// put the target back so the dish isn't on the menu twice
		await plan.update(target.id, { meal: targetMeal }).catch(() => {});
		throw err;
	}
	return { moved: sourceMeal, swapped: targetMeal };
}
