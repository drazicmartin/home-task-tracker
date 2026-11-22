/**
 * Meal planner: the household's meal library (pb_migrations/0018) and the
 * weekly plan of what's cooked for lunch / dinner each day.
 *
 * Days are plain "YYYY-MM-DD" calendar dates everywhere (meal_plan.day, the
 * ?week= URL parameter). Date arithmetic is done in UTC on those strings so
 * daylight saving time can never shift a meal to the previous/next day.
 */

export type MealSlot = 'lunch' | 'dinner';
export const MEAL_SLOTS: MealSlot[] = ['lunch', 'dinner'];

export function isMealSlot(value: unknown): value is MealSlot {
	return value === 'lunch' || value === 'dinner';
}

/** Monday first, as the week is shown. */
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Which slots the planner shows on each weekday (households.meal_slots). */
export type MealSlotSettings = Record<Weekday, MealSlot[]>;

const WEEKDAY_ONLY_DINNER: MealSlotSettings = {
	mon: ['dinner'],
	tue: ['dinner'],
	wed: ['dinner'],
	thu: ['dinner'],
	fri: ['dinner'],
	sat: ['lunch', 'dinner'],
	sun: ['lunch', 'dinner']
};

/** Quick choices offered in the settings sheet; the first one is the default. */
export const MEAL_SLOT_PRESETS: { id: 'weekdayDinner' | 'everyMeal' | 'dinnerOnly'; slots: MealSlotSettings }[] = [
	{ id: 'weekdayDinner', slots: WEEKDAY_ONLY_DINNER },
	{ id: 'everyMeal', slots: Object.fromEntries(WEEKDAYS.map((d) => [d, ['lunch', 'dinner']])) as MealSlotSettings },
	{ id: 'dinnerOnly', slots: Object.fromEntries(WEEKDAYS.map((d) => [d, ['dinner']])) as MealSlotSettings }
];

/** Dinner on weekdays, lunch and dinner at the weekend: for households that never changed it. */
export const DEFAULT_MEAL_SLOTS: MealSlotSettings = WEEKDAY_ONLY_DINNER;

/** Keeps only known slots, at most once each, always lunch before dinner. */
function cleanSlots(value: unknown): MealSlot[] {
	return Array.isArray(value) ? MEAL_SLOTS.filter((slot) => value.includes(slot)) : [];
}

/** The slot settings stored on a household record, falling back to the default. */
export function householdMealSlots(household: unknown): MealSlotSettings {
	const stored =
		household && typeof household === 'object' && 'meal_slots' in household ? household.meal_slots : null;
	if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return DEFAULT_MEAL_SLOTS;
	const record = stored as Record<string, unknown>;
	return Object.fromEntries(WEEKDAYS.map((day) => [day, cleanSlots(record[day])])) as MealSlotSettings;
}

/** Reads the settings sheet: one checkbox per (weekday, slot), named "slot" with value "mon:dinner". */
export function parseMealSlotsForm(form: FormData): MealSlotSettings {
	const ticked = new Set(form.getAll('slot').map(String));
	return Object.fromEntries(
		WEEKDAYS.map((day) => [day, MEAL_SLOTS.filter((slot) => ticked.has(`${day}:${slot}`))])
	) as MealSlotSettings;
}

export function sameMealSlots(a: MealSlotSettings, b: MealSlotSettings): boolean {
	return WEEKDAYS.every((day) => a[day].join() === b[day].join());
}

// ------------------------------------------------------------------ meals

export type MealDifficulty = 'easy' | 'medium' | 'hard';
export const MEAL_DIFFICULTIES: MealDifficulty[] = ['easy', 'medium', 'hard'];

export function isMealDifficulty(value: unknown): value is MealDifficulty {
	return typeof value === 'string' && (MEAL_DIFFICULTIES as string[]).includes(value);
}

/** 1 to 3 "pips", for the difficulty badge. */
export function difficultyLevel(difficulty: string): number {
	return Math.max(1, MEAL_DIFFICULTIES.indexOf(difficulty as MealDifficulty) + 1);
}

/** Suggested preparation times (minutes) in the meal form and the picker filter. */
export const PREP_TIME_PRESETS = [15, 30, 45, 60, 90];

export const MAX_PREP_MINUTES = 1440;

/** "45 min", "1 h", "1 h 30" — same in French and English. */
export function formatPrepTime(minutes: number): string {
	if (!Number.isFinite(minutes) || minutes <= 0) return '';
	const h = Math.floor(minutes / 60);
	const min = Math.round(minutes % 60);
	if (h === 0) return `${min} min`;
	return min === 0 ? `${h} h` : `${h} h ${String(min).padStart(2, '0')}`;
}

/** The fields of a meal the planner and the library need. */
export type Meal = {
	id: string;
	name: string;
	difficulty: MealDifficulty;
	prep_minutes: number;
	photo: string;
};

export const MEAL_FIELDS = 'id,name,difficulty,prep_minutes,photo';

export function toMeal(record: Record<string, unknown>): Meal {
	return {
		id: String(record.id),
		name: String(record.name ?? ''),
		difficulty: isMealDifficulty(record.difficulty) ? record.difficulty : 'easy',
		prep_minutes: Number(record.prep_minutes) || 0,
		photo: String(record.photo ?? '')
	};
}

/** One filled slot of the plan: `meal` is the dish's id. */
export type PlannedMeal = { id: string; day: string; slot: MealSlot; meal: string };

export type MealPhotoSize = 'thumb' | 'card' | 'full';
const PHOTO_THUMBS: Record<MealPhotoSize, string | null> = { thumb: '160x160', card: '640x480', full: null };

/** Thumb sizes the photo route accepts (must match the "photo" field's thumbs in pb_migrations/0018). */
export const ALLOWED_PHOTO_THUMBS = new Set(Object.values(PHOTO_THUMBS).filter((t): t is string => Boolean(t)));

/**
 * URL of a meal's photo through the app's own /meal-photos route, which
 * checks the viewer is a member of the meal's household. Empty if no photo.
 */
export function mealPhotoUrl(meal: Pick<Meal, 'id' | 'photo'>, size: MealPhotoSize = 'thumb'): string {
	if (!meal.photo) return '';
	const thumb = PHOTO_THUMBS[size];
	const path = `/meal-photos/${encodeURIComponent(meal.id)}/${encodeURIComponent(meal.photo)}`;
	return thumb ? `${path}?thumb=${thumb}` : path;
}

// ------------------------------------------------------------------ dates

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isDayString(value: unknown): value is string {
	if (typeof value !== 'string') return false;
	const match = DAY_RE.exec(value);
	if (!match) return false;
	const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
	return toDayString(date) === value; // rejects 2026-02-31 and friends
}

/** A UTC-midnight Date for a "YYYY-MM-DD" string. */
function dayDate(day: string): Date {
	const [y, m, d] = day.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d));
}

function toDayString(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/** Today's calendar date where the code runs (the server's TZ, or the browser's). */
export function today(now = new Date()): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(day: string, days: number): string {
	return toDayString(new Date(dayDate(day).getTime() + days * DAY_MS));
}

export function weekdayOf(day: string): Weekday {
	// getUTCDay(): 0 = Sunday
	return WEEKDAYS[(dayDate(day).getUTCDay() + 6) % 7];
}

/** The Monday of the week a day falls in. */
export function weekStart(day: string): string {
	return addDays(day, -WEEKDAYS.indexOf(weekdayOf(day)));
}

/** The 7 days (Monday to Sunday) of the week starting on `monday`. */
export function weekDays(monday: string): { day: string; weekday: Weekday }[] {
	return WEEKDAYS.map((weekday, i) => ({ day: addDays(monday, i), weekday }));
}

/** Formats a "YYYY-MM-DD" day with Intl, without the time zone ever moving it. */
export function formatDay(day: string, locale: string, options: Intl.DateTimeFormatOptions): string {
	return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(dayDate(day));
}
