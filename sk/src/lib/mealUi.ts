/** Translated labels and icons for the meal planner (see $lib/meals). */
import { Moon, Sun, type LucideIcon } from '@lucide/svelte';
import * as m from '$lib/paraglide/messages.js';
import { addDays, formatDay, MEAL_SLOT_PRESETS, WEEKDAYS, type MealDifficulty, type MealSlot, type Weekday } from '$lib/meals';

export const DIFFICULTY_LABELS: Record<MealDifficulty, () => string> = {
	easy: m.difficulty_easy,
	medium: m.difficulty_medium,
	hard: m.difficulty_hard
};

export const SLOT_LABELS: Record<MealSlot, () => string> = {
	lunch: m.meals_slot_lunch,
	dinner: m.meals_slot_dinner
};

export const SLOT_ICONS: Record<MealSlot, LucideIcon> = {
	lunch: Sun,
	dinner: Moon
};

export const PRESET_LABELS: Record<(typeof MEAL_SLOT_PRESETS)[number]['id'], () => string> = {
	weekdayDinner: m.meals_preset_weekday_dinner,
	everyMeal: m.meals_preset_every_meal,
	dinnerOnly: m.meals_preset_dinner_only
};

function capitalize(text: string): string {
	return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

/** "Monday" / "Lundi" — 2024-01-01 was a Monday. */
export function weekdayName(weekday: Weekday, locale: string, style: 'long' | 'short' = 'long'): string {
	return capitalize(formatDay(addDays('2024-01-01', WEEKDAYS.indexOf(weekday)), locale, { weekday: style }));
}

/** "Tuesday 24 Nov" / "Mardi 24 nov." */
export function dayLabel(day: string, locale: string): string {
	return capitalize(formatDay(day, locale, { weekday: 'long', day: 'numeric', month: 'short' }));
}
