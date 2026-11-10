/**
 * Built-in catalogue of common household chores, offered as ready-made
 * quests on the "new quest" screen (multi-select). Nothing is stored for the
 * catalogue itself: picking an entry just creates a normal task with these
 * defaults, which the household can then edit like any other quest.
 *
 * Points follow one scale so rewards stay comparable across chores:
 *
 *   score = round(minutes / 5) + hardship
 *
 * i.e. 1 point per ~5 minutes of effort, plus a 0-2 bonus for chores that
 * are dirty, physical or that nobody wants to do (toilets, litter, oven...).
 * A 5-minute chore is worth 1 point, a 1-hour one about 12.
 */

export type QuestUnit = 'day' | 'week' | 'month' | 'year';

export type QuestCategory = 'kitchen' | 'floors' | 'bathroom' | 'laundry' | 'pets' | 'outdoor' | 'errands';

type Localized = { fr: string; en: string };

export type CatalogQuest = {
	id: string;
	category: QuestCategory;
	name: Localized;
	description: Localized;
	/** how many times per `unit` (same meaning as tasks.frequency) */
	frequency: number;
	unit: QuestUnit;
	/** rough time it takes, used to derive the score */
	minutes: number;
	/** 0 = neutral, 1 = unpleasant/physical, 2 = really nobody wants to */
	hardship: 0 | 1 | 2;
};

export function questScore(quest: Pick<CatalogQuest, 'minutes' | 'hardship'>): number {
	return Math.max(1, Math.round(quest.minutes / 5) + quest.hardship);
}

export const QUEST_CATEGORIES: QuestCategory[] = ['kitchen', 'floors', 'bathroom', 'laundry', 'pets', 'outdoor', 'errands'];

export const QUEST_CATALOG: CatalogQuest[] = [
	// --- kitchen ---
	{
		id: 'dishes',
		category: 'kitchen',
		name: { fr: 'Faire la vaisselle', en: 'Do the dishes' },
		description: {
			fr: 'Laver, sécher et ranger la vaisselle du jour (ou remplir et lancer le lave-vaisselle).',
			en: "Wash, dry and put away the day's dishes (or load and run the dishwasher)."
		},
		frequency: 1,
		unit: 'day',
		minutes: 15,
		hardship: 0
	},
	{
		id: 'dishwasher_empty',
		category: 'kitchen',
		name: { fr: 'Vider le lave-vaisselle', en: 'Empty the dishwasher' },
		description: {
			fr: 'Ranger la vaisselle propre à sa place.',
			en: 'Put the clean dishes away where they belong.'
		},
		frequency: 1,
		unit: 'day',
		minutes: 5,
		hardship: 0
	},
	{
		id: 'cook',
		category: 'kitchen',
		name: { fr: 'Préparer le repas', en: 'Cook a meal' },
		description: {
			fr: 'Cuisiner le repas pour tout le foyer, et laisser la cuisine propre derrière soi.',
			en: 'Cook a meal for the whole household and leave the kitchen clean afterwards.'
		},
		frequency: 1,
		unit: 'day',
		minutes: 40,
		hardship: 0
	},
	{
		id: 'kitchen_counters',
		category: 'kitchen',
		name: { fr: 'Nettoyer le plan de travail et la plaque', en: 'Wipe counters and stovetop' },
		description: {
			fr: 'Débarrasser, essuyer le plan de travail, la table et la plaque de cuisson.',
			en: 'Clear and wipe the counters, the table and the stovetop.'
		},
		frequency: 3,
		unit: 'week',
		minutes: 10,
		hardship: 0
	},
	{
		id: 'trash',
		category: 'kitchen',
		name: { fr: 'Sortir les poubelles', en: 'Take out the trash' },
		description: {
			fr: 'Fermer le sac, le descendre au conteneur et remettre un sac propre.',
			en: 'Tie the bag, take it to the bin and put in a fresh bag.'
		},
		frequency: 2,
		unit: 'week',
		minutes: 5,
		hardship: 1
	},
	{
		id: 'recycling',
		category: 'kitchen',
		name: { fr: 'Sortir le tri et le verre', en: 'Take out recycling and glass' },
		description: {
			fr: 'Vider les bacs de tri (emballages, papier, verre) dans les bons conteneurs.',
			en: 'Empty the recycling bins (packaging, paper, glass) into the right containers.'
		},
		frequency: 1,
		unit: 'week',
		minutes: 10,
		hardship: 0
	},
	{
		id: 'fridge',
		category: 'kitchen',
		name: { fr: 'Nettoyer le réfrigérateur', en: 'Clean the fridge' },
		description: {
			fr: "Jeter les produits périmés, vider et nettoyer les clayettes et l'intérieur.",
			en: 'Throw out expired food, empty and wipe the shelves and the inside.'
		},
		frequency: 1,
		unit: 'month',
		minutes: 30,
		hardship: 1
	},
	{
		id: 'oven',
		category: 'kitchen',
		name: { fr: 'Nettoyer le four et le micro-ondes', en: 'Clean the oven and microwave' },
		description: {
			fr: "Dégraisser l'intérieur du four, les grilles et le micro-ondes.",
			en: 'Degrease the inside of the oven, the racks and the microwave.'
		},
		frequency: 4,
		unit: 'year',
		minutes: 30,
		hardship: 2
	},

	// --- floors & dust ---
	{
		id: 'vacuum',
		category: 'floors',
		name: { fr: "Passer l'aspirateur", en: 'Vacuum' },
		description: {
			fr: "Aspirer toutes les pièces, y compris sous les meubles et les tapis.",
			en: 'Vacuum every room, including under furniture and rugs.'
		},
		frequency: 1,
		unit: 'week',
		minutes: 30,
		hardship: 0
	},
	{
		id: 'mop',
		category: 'floors',
		name: { fr: 'Laver le sol', en: 'Mop the floors' },
		description: {
			fr: 'Passer la serpillière dans la cuisine, la salle de bain et les pièces à vivre (après l’aspirateur).',
			en: 'Mop the kitchen, bathroom and living areas (after vacuuming).'
		},
		frequency: 1,
		unit: 'week',
		minutes: 30,
		hardship: 1
	},
	{
		id: 'dust_living',
		category: 'floors',
		name: { fr: 'Faire les poussières du salon / de la salle', en: 'Dust the living room' },
		description: {
			fr: 'Dépoussiérer les meubles, étagères, télé et décorations du salon et de la salle à manger.',
			en: 'Dust the furniture, shelves, TV and decorations in the living and dining room.'
		},
		frequency: 1,
		unit: 'week',
		minutes: 15,
		hardship: 0
	},
	{
		id: 'dust_bedrooms',
		category: 'floors',
		name: { fr: 'Faire les poussières des chambres', en: 'Dust the bedrooms' },
		description: {
			fr: 'Dépoussiérer tables de chevet, commodes, étagères et rebords de fenêtres.',
			en: 'Dust nightstands, dressers, shelves and window sills.'
		},
		frequency: 2,
		unit: 'month',
		minutes: 15,
		hardship: 0
	},
	{
		id: 'windows',
		category: 'floors',
		name: { fr: 'Faire les vitres', en: 'Clean the windows' },
		description: {
			fr: 'Laver les vitres et les miroirs, côté intérieur et extérieur, sans traces.',
			en: 'Clean windows and mirrors, inside and out, streak-free.'
		},
		frequency: 1,
		unit: 'month',
		minutes: 60,
		hardship: 1
	},
	{
		id: 'tidy',
		category: 'floors',
		name: { fr: 'Ranger les pièces à vivre', en: 'Tidy up the living areas' },
		description: {
			fr: 'Remettre chaque objet à sa place, plier les plaids, vider la table basse.',
			en: 'Put everything back in its place, fold the throws, clear the coffee table.'
		},
		frequency: 3,
		unit: 'week',
		minutes: 10,
		hardship: 0
	},

	// --- bathroom ---
	{
		id: 'bathroom',
		category: 'bathroom',
		name: { fr: 'Nettoyer la salle de bain', en: 'Clean the bathroom' },
		description: {
			fr: 'Lavabo, douche / baignoire, robinetterie et miroir, détartrer si besoin.',
			en: 'Sink, shower / bathtub, taps and mirror, descale if needed.'
		},
		frequency: 1,
		unit: 'week',
		minutes: 30,
		hardship: 1
	},
	{
		id: 'toilets',
		category: 'bathroom',
		name: { fr: 'Nettoyer les toilettes', en: 'Clean the toilet' },
		description: {
			fr: "Cuvette, abattant, extérieur et sol autour, et remettre du papier.",
			en: 'Bowl, seat, outside and the floor around it, and restock the paper.'
		},
		frequency: 1,
		unit: 'week',
		minutes: 10,
		hardship: 2
	},

	// --- laundry ---
	{
		id: 'laundry',
		category: 'laundry',
		name: { fr: 'Lancer une machine et étendre le linge', en: 'Run a load and hang the laundry' },
		description: {
			fr: 'Trier, lancer la machine puis étendre (ou passer au sèche-linge).',
			en: 'Sort, run the washer, then hang it up (or tumble dry).'
		},
		frequency: 2,
		unit: 'week',
		minutes: 15,
		hardship: 0
	},
	{
		id: 'fold',
		category: 'laundry',
		name: { fr: 'Plier et ranger le linge', en: 'Fold and put away laundry' },
		description: {
			fr: 'Décrocher le linge sec, le plier et le ranger dans les armoires de chacun.',
			en: "Take down the dry laundry, fold it and put it in everyone's wardrobe."
		},
		frequency: 2,
		unit: 'week',
		minutes: 15,
		hardship: 0
	},
	{
		id: 'ironing',
		category: 'laundry',
		name: { fr: 'Faire le repassage', en: 'Do the ironing' },
		description: {
			fr: 'Repasser chemises, pantalons et linge de maison en attente.',
			en: 'Iron the waiting shirts, trousers and household linen.'
		},
		frequency: 1,
		unit: 'week',
		minutes: 30,
		hardship: 1
	},
	{
		id: 'bedsheets',
		category: 'laundry',
		name: { fr: 'Changer les draps', en: 'Change the bed sheets' },
		description: {
			fr: 'Retirer les draps et taies, les mettre au lavage et refaire les lits propres.',
			en: 'Strip sheets and pillowcases, put them in the wash and make the beds with clean ones.'
		},
		frequency: 2,
		unit: 'month',
		minutes: 15,
		hardship: 1
	},

	// --- pets ---
	{
		id: 'litter',
		category: 'pets',
		name: { fr: 'Faire la litière des chats', en: "Clean the cats' litter box" },
		description: {
			fr: 'Retirer les excréments et les agglomérats, compléter la litière, nettoyer autour.',
			en: 'Scoop out waste and clumps, top up the litter, clean around the box.'
		},
		frequency: 1,
		unit: 'day',
		minutes: 5,
		hardship: 2
	},
	{
		id: 'litter_full',
		category: 'pets',
		name: { fr: 'Changer entièrement la litière', en: 'Fully replace the litter' },
		description: {
			fr: 'Vider tout le bac, le laver et le remplir de litière neuve.',
			en: 'Empty the whole box, wash it and refill it with fresh litter.'
		},
		frequency: 2,
		unit: 'month',
		minutes: 15,
		hardship: 2
	},
	{
		id: 'feed_pets',
		category: 'pets',
		name: { fr: 'Nourrir les animaux', en: 'Feed the pets' },
		description: {
			fr: "Remplir les gamelles de nourriture et changer l'eau.",
			en: 'Fill the food bowls and refresh the water.'
		},
		frequency: 2,
		unit: 'day',
		minutes: 3,
		hardship: 0
	},
	{
		id: 'walk_dog',
		category: 'pets',
		name: { fr: 'Promener le chien', en: 'Walk the dog' },
		description: {
			fr: 'Une vraie balade, sacs à crottes compris.',
			en: 'A proper walk, poop bags included.'
		},
		frequency: 2,
		unit: 'day',
		minutes: 20,
		hardship: 0
	},

	// --- outdoor & car ---
	{
		id: 'car_outside',
		category: 'outdoor',
		name: { fr: 'Laver la voiture (extérieur)', en: 'Wash the car (outside)' },
		description: {
			fr: 'Carrosserie, jantes et vitres extérieures, à la main ou en station de lavage.',
			en: 'Body, wheels and outside windows, by hand or at a car wash.'
		},
		frequency: 1,
		unit: 'month',
		minutes: 45,
		hardship: 0
	},
	{
		id: 'car_inside',
		category: 'outdoor',
		name: { fr: 'Laver la voiture (intérieur)', en: 'Clean the car (inside)' },
		description: {
			fr: "Vider les déchets, aspirer les sièges et tapis, essuyer le tableau de bord et les vitres intérieures.",
			en: 'Clear out the trash, vacuum seats and mats, wipe the dashboard and inside windows.'
		},
		frequency: 1,
		unit: 'month',
		minutes: 30,
		hardship: 0
	},
	{
		id: 'plants',
		category: 'outdoor',
		name: { fr: 'Arroser les plantes', en: 'Water the plants' },
		description: {
			fr: "Arroser les plantes d'intérieur et du balcon / jardin.",
			en: 'Water the indoor plants and the balcony / garden ones.'
		},
		frequency: 2,
		unit: 'week',
		minutes: 5,
		hardship: 0
	},
	{
		id: 'mow',
		category: 'outdoor',
		name: { fr: 'Tondre la pelouse', en: 'Mow the lawn' },
		description: {
			fr: "Tondre, ramasser l'herbe coupée et ranger la tondeuse.",
			en: 'Mow, collect the clippings and put the mower away.'
		},
		frequency: 2,
		unit: 'month',
		minutes: 60,
		hardship: 1
	},

	// --- errands & misc ---
	{
		id: 'groceries',
		category: 'errands',
		name: { fr: 'Faire les courses', en: 'Do the grocery shopping' },
		description: {
			fr: 'Faire la liste, aller au magasin (ou commander) et ranger les courses.',
			en: 'Make the list, go to the store (or order online) and put everything away.'
		},
		frequency: 1,
		unit: 'week',
		minutes: 60,
		hardship: 0
	},
	{
		id: 'declutter',
		category: 'errands',
		name: { fr: 'Trier et désencombrer un placard', en: 'Declutter a cupboard' },
		description: {
			fr: 'Choisir un placard ou un tiroir, jeter / donner ce qui ne sert plus, réorganiser.',
			en: "Pick a cupboard or drawer, toss / donate what isn't used, reorganise."
		},
		frequency: 1,
		unit: 'month',
		minutes: 30,
		hardship: 0
	}
];

export function findCatalogQuest(id: string): CatalogQuest | undefined {
	return QUEST_CATALOG.find((q) => q.id === id);
}

export function localize(text: Localized, locale: string): string {
	return locale === 'en' ? text.en : text.fr;
}
