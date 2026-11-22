import { ClientResponseError } from 'pocketbase';
import { isMealDifficulty, MAX_PREP_MINUTES, type MealDifficulty } from '$lib/meals';

export type MealFormValues = {
	name: string;
	difficulty: MealDifficulty;
	prep_minutes: number;
};

/**
 * Reads the dish form (MealForm.svelte) shared by the create and edit
 * actions. The form has two file inputs named "photo" (camera / gallery):
 * whichever was used last is the one that's kept.
 */
export function parseMealForm(form: FormData): {
	values: MealFormValues;
	photo: File | null;
	removePhoto: boolean;
	valid: boolean;
} {
	const difficulty = form.get('difficulty');
	const rawMinutes = String(form.get('prep_minutes') ?? '').trim();
	const minutes = rawMinutes === '' ? 0 : Number(rawMinutes);
	const values: MealFormValues = {
		name: String(form.get('name') ?? '').trim(),
		difficulty: isMealDifficulty(difficulty) ? difficulty : 'easy',
		prep_minutes: Number.isFinite(minutes) ? Math.round(minutes) : 0
	};
	const photo =
		form
			.getAll('photo')
			.filter((entry): entry is File => entry instanceof File && entry.size > 0)
			.at(-1) ?? null;

	const valid =
		values.name.length > 0 &&
		values.name.length <= 150 &&
		isMealDifficulty(difficulty) &&
		Number.isFinite(minutes) &&
		minutes >= 0 &&
		minutes <= MAX_PREP_MINUTES;

	return { values, photo, removePhoto: form.get('remove_photo') === '1', valid };
}

/** Whether PocketBase refused the record because of the photo (format, size). */
export function isPhotoError(err: unknown): boolean {
	return err instanceof ClientResponseError && Boolean(err.response?.data?.photo);
}
