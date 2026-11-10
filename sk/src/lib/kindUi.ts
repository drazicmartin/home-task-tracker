/**
 * Icons, colours and translated labels for household kinds and quest
 * categories, shared by the household switcher, the kind picker, the quest
 * catalogue and the board timeline.
 */
import {
	Bath,
	BookOpen,
	Brain,
	CalendarCheck,
	Dumbbell,
	Footprints,
	GraduationCap,
	HeartPulse,
	House,
	Languages,
	Palette,
	PawPrint,
	PersonStanding,
	Shirt,
	ShoppingCart,
	SprayCan,
	Sprout,
	Star,
	Sunrise,
	Users,
	UtensilsCrossed,
	type LucideIcon
} from '@lucide/svelte';
import * as m from '$lib/paraglide/messages.js';
import type { HouseholdKind } from '$lib/householdKinds';
import type { TaskCategory } from '$lib/questCategories';

export const KIND_ICONS: Record<HouseholdKind, LucideIcon> = {
	chores: House,
	habits: CalendarCheck,
	fitness: Dumbbell,
	learning: GraduationCap
};

export const KIND_COLORS: Record<HouseholdKind, string> = {
	chores: '#f97316',
	habits: '#8b5cf6',
	fitness: '#ef4444',
	learning: '#3b82f6'
};

export const KIND_LABELS: Record<HouseholdKind, () => string> = {
	chores: m.kind_chores,
	habits: m.kind_habits,
	fitness: m.kind_fitness,
	learning: m.kind_learning
};

export const KIND_DESCRIPTIONS: Record<HouseholdKind, () => string> = {
	chores: m.kind_chores_desc,
	habits: m.kind_habits_desc,
	fitness: m.kind_fitness_desc,
	learning: m.kind_learning_desc
};

export const CATEGORY_ICONS: Record<TaskCategory, LucideIcon> = {
	kitchen: UtensilsCrossed,
	floors: SprayCan,
	bathroom: Bath,
	laundry: Shirt,
	pets: PawPrint,
	outdoor: Sprout,
	errands: ShoppingCart,
	health: HeartPulse,
	mind: Brain,
	routine: Sunrise,
	social: Users,
	cardio: Footprints,
	strength: Dumbbell,
	flexibility: PersonStanding,
	languages: Languages,
	study: BookOpen,
	creative: Palette,
	other: Star
};

export const CATEGORY_LABELS: Record<TaskCategory, () => string> = {
	kitchen: m.catalog_cat_kitchen,
	floors: m.catalog_cat_floors,
	bathroom: m.catalog_cat_bathroom,
	laundry: m.catalog_cat_laundry,
	pets: m.catalog_cat_pets,
	outdoor: m.catalog_cat_outdoor,
	errands: m.catalog_cat_errands,
	health: m.catalog_cat_health,
	mind: m.catalog_cat_mind,
	routine: m.catalog_cat_routine,
	social: m.catalog_cat_social,
	cardio: m.catalog_cat_cardio,
	strength: m.catalog_cat_strength,
	flexibility: m.catalog_cat_flexibility,
	languages: m.catalog_cat_languages,
	study: m.catalog_cat_study,
	creative: m.catalog_cat_creative,
	other: m.catalog_cat_other
};
