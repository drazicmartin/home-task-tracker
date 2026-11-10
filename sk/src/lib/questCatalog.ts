/**
 * Built-in catalogues of ready-made quests, one per household kind (house
 * chores, habits, fitness, learning), offered on the "new quest" screen
 * (multi-select). Nothing is stored for the catalogue itself: picking an
 * entry just creates a normal task with these defaults, which the household
 * can then edit like any other quest.
 *
 * Points follow one scale so rewards stay comparable across quests:
 *
 *   score = round(minutes / 5) + hardship
 *
 * i.e. 1 point per ~5 minutes of effort, plus a 0-2 bonus for quests that
 * are dirty, physical or that nobody wants to do (toilets, litter, no screen
 * before bed...). A 5-minute quest is worth 1 point, a 1-hour one about 12.
 */
import type { HouseholdKind } from '$lib/householdKinds';

export type QuestUnit = 'day' | 'week' | 'month' | 'year';

export type QuestCategory =
	// chores
	| 'kitchen'
	| 'floors'
	| 'bathroom'
	| 'laundry'
	| 'pets'
	| 'outdoor'
	| 'errands'
	// habits (health is shared with fitness)
	| 'health'
	| 'mind'
	| 'routine'
	| 'social'
	// fitness
	| 'cardio'
	| 'strength'
	| 'flexibility'
	// learning
	| 'languages'
	| 'study'
	| 'creative';

type Localized = { fr: string; en: string };

export type CatalogQuest = {
	id: string;
	kind: HouseholdKind;
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

type Preset = Omit<CatalogQuest, 'kind'>;

export function questScore(quest: Pick<CatalogQuest, 'minutes' | 'hardship'>): number {
	return Math.max(1, Math.round(quest.minutes / 5) + quest.hardship);
}

/** Categories of each kind's catalogue, in display order. */
export const KIND_CATEGORIES: Record<HouseholdKind, QuestCategory[]> = {
	chores: ['kitchen', 'floors', 'bathroom', 'laundry', 'pets', 'outdoor', 'errands'],
	habits: ['health', 'mind', 'routine', 'social'],
	fitness: ['cardio', 'strength', 'flexibility', 'health'],
	learning: ['languages', 'study', 'creative']
};

/** Every category, in a stable order (chores first, then the other kinds'). */
export const QUEST_CATEGORIES: QuestCategory[] = [...new Set(Object.values(KIND_CATEGORIES).flat())];

const CHORES: Preset[] = [
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

/** Compact constructor for the shorter catalogues below. */
function preset(
	id: string,
	category: QuestCategory,
	name: [fr: string, en: string],
	description: [fr: string, en: string],
	frequency: number,
	unit: QuestUnit,
	minutes: number,
	hardship: 0 | 1 | 2 = 0
): Preset {
	return {
		id,
		category,
		name: { fr: name[0], en: name[1] },
		description: { fr: description[0], en: description[1] },
		frequency,
		unit,
		minutes,
		hardship
	};
}

const HABITS: Preset[] = [
	// --- health ---
	preset('water', 'health', ["Boire 1,5 L d'eau", 'Drink 1.5 L of water'], [
		'Garder une gourde à portée de main et la remplir au fil de la journée.',
		'Keep a water bottle at hand and refill it through the day.'
	], 1, 'day', 5),
	preset('fruits_veg', 'health', ['Manger 5 fruits et légumes', 'Eat 5 fruits and veggies'], [
		'Au moins cinq portions de fruits ou légumes dans la journée.',
		'At least five portions of fruit or vegetables over the day.'
	], 1, 'day', 10),
	preset('sleep_early', 'health', ['Se coucher avant 23 h', 'In bed before 11 pm'], [
		'Lumière éteinte avant 23 h pour une vraie nuit de sommeil.',
		'Lights out before 11 pm for a proper night of sleep.'
	], 1, 'day', 5, 1),
	preset('no_sugar', 'health', ['Journée sans sucre ajouté', 'No added sugar today'], [
		'Ni sodas, ni bonbons, ni gâteaux : seulement le sucre naturel des fruits.',
		'No sodas, sweets or cakes: only the natural sugar in fruit.'
	], 1, 'day', 5, 2),
	preset('meds', 'health', ['Prendre ses médicaments / vitamines', 'Take your meds / vitamins'], [
		'Le traitement ou les compléments du jour, à heure fixe.',
		"Today's treatment or supplements, at a set time."
	], 1, 'day', 1),

	// --- mind ---
	preset('meditate', 'mind', ['Méditer 10 minutes', 'Meditate for 10 minutes'], [
		'Une séance guidée ou en silence, assis au calme.',
		'A guided or silent session, sitting somewhere quiet.'
	], 1, 'day', 10),
	preset('read', 'mind', ['Lire 20 minutes', 'Read for 20 minutes'], [
		'Un livre, une BD, un magazine… tout sauf les réseaux sociaux.',
		'A book, a comic, a magazine… anything but social media.'
	], 1, 'day', 20),
	preset('journal', 'mind', ['Écrire dans son journal', 'Write in your journal'], [
		'Quelques lignes sur sa journée, ses idées ou ce qu’on ressent.',
		'A few lines about your day, your ideas or how you feel.'
	], 1, 'day', 10),
	preset('gratitude', 'mind', ['Noter 3 choses positives', 'Write down 3 good things'], [
		'Trois moments ou petites victoires de la journée dont on est content.',
		"Three moments or small wins from today you're glad about."
	], 1, 'day', 5),

	// --- routine ---
	preset('make_bed', 'routine', ['Faire son lit', 'Make your bed'], [
		'Tirer la couette et remettre les oreillers dès le lever.',
		'Straighten the duvet and pillows right after getting up.'
	], 1, 'day', 3),
	preset('wake_up', 'routine', ['Se lever sans repousser le réveil', 'Get up without snoozing'], [
		"Debout à la première sonnerie, sans le bouton « snooze ».",
		'Up at the first ring, no snooze button.'
	], 1, 'day', 5, 1),
	preset('no_screen', 'routine', ["Pas d'écran 1 h avant de dormir", 'No screens 1 h before bed'], [
		'Téléphone, tablette et télé éteints la dernière heure de la soirée.',
		'Phone, tablet and TV off for the last hour of the evening.'
	], 1, 'day', 5, 2),
	preset('plan_day', 'routine', ['Planifier sa journée', 'Plan your day'], [
		'Lister les 3 priorités du jour le matin (ou la veille au soir).',
		"List the day's 3 priorities in the morning (or the evening before)."
	], 1, 'day', 5),
	preset('weekly_review', 'routine', ['Faire le bilan de la semaine', 'Weekly review'], [
		"Regarder ce qui a marché, ce qui a coincé, et préparer la semaine suivante.",
		"Look at what worked, what didn't, and prepare next week."
	], 1, 'week', 20),

	// --- social ---
	preset('call_family', 'social', ['Appeler un proche', 'Call a loved one'], [
		'Un vrai appel (pas juste un message) à la famille ou un ami.',
		'A real call (not just a text) to family or a friend.'
	], 2, 'week', 15),
	preset('check_in', 'social', ["Prendre des nouvelles d'un ami", 'Check in on a friend'], [
		"Envoyer un message à quelqu'un à qui on n'a pas parlé depuis longtemps.",
		"Text someone you haven't talked to in a while."
	], 2, 'week', 5),
	preset('quality_time', 'social', ['Moment ensemble sans écran', 'Screen-free time together'], [
		'Un jeu, une balade ou un repas ensemble, téléphones rangés.',
		'A game, a walk or a meal together, phones put away.'
	], 2, 'week', 30),
	preset('good_deed', 'social', ['Rendre service à quelqu’un', 'Do someone a favour'], [
		"Aider un voisin, un collègue ou un proche sans qu'on le demande.",
		'Help a neighbour, a colleague or a relative without being asked.'
	], 1, 'week', 15)
];

const FITNESS: Preset[] = [
	// --- cardio ---
	preset('run', 'cardio', ['Aller courir', 'Go for a run'], [
		"Un footing d'au moins 30 minutes, à son rythme.",
		'A run of at least 30 minutes, at your own pace.'
	], 3, 'week', 30, 1),
	preset('steps', 'cardio', ['Faire 10 000 pas', 'Walk 10,000 steps'], [
		'Marcher dans la journée jusqu’à atteindre 10 000 pas au compteur.',
		'Walk during the day until the step counter hits 10,000.'
	], 1, 'day', 30),
	preset('bike', 'cardio', ['Sortie vélo', 'Bike ride'], [
		"Au moins une heure sur le vélo, route, VTT ou home-trainer.",
		'At least an hour on the bike: road, mountain or indoor trainer.'
	], 1, 'week', 60),
	preset('swim', 'cardio', ['Aller nager', 'Go swimming'], [
		'Une séance de natation à la piscine ou en eau libre.',
		'A swimming session at the pool or in open water.'
	], 1, 'week', 45, 1),
	preset('stairs', 'cardio', ["Prendre les escaliers", 'Take the stairs'], [
		"Toute la journée, escaliers plutôt qu'ascenseur ou escalator.",
		'All day long, stairs instead of the lift or escalator.'
	], 1, 'day', 5),

	// --- strength ---
	preset('gym', 'strength', ['Séance de musculation', 'Strength training session'], [
		'Une séance complète à la salle ou à la maison, échauffement compris.',
		'A full session at the gym or at home, warm-up included.'
	], 3, 'week', 60, 1),
	preset('pushups', 'strength', ['3 séries de pompes', '3 sets of push-ups'], [
		'Trois séries jusqu’à l’échec (sur les genoux si besoin).',
		'Three sets to failure (on your knees if needed).'
	], 3, 'week', 10, 1),
	preset('core', 'strength', ['Gainage et abdos', 'Core and abs'], [
		'Planche, gainage latéral et crunchs, une dizaine de minutes.',
		'Plank, side plank and crunches, about ten minutes.'
	], 3, 'week', 10, 1),
	preset('squats', 'strength', ['Faire 50 squats', 'Do 50 squats'], [
		'En une ou plusieurs séries, dos droit et talons au sol.',
		'In one or more sets, back straight and heels down.'
	], 3, 'week', 5, 1),

	// --- flexibility ---
	preset('stretch', 'flexibility', ["S'étirer 10 minutes", 'Stretch for 10 minutes'], [
		'Étirements doux du dos, des jambes et des épaules.',
		'Gentle stretches for the back, legs and shoulders.'
	], 1, 'day', 10),
	preset('yoga', 'flexibility', ['Séance de yoga', 'Yoga session'], [
		'Un cours ou une vidéo de yoga d’une demi-heure.',
		'A half-hour yoga class or video.'
	], 2, 'week', 30),
	preset('morning_mobility', 'flexibility', ['Réveil musculaire', 'Morning mobility'], [
		'Cinq minutes de mobilité articulaire au lever.',
		'Five minutes of joint mobility after getting up.'
	], 1, 'day', 5),

	// --- health ---
	preset('sleep_8h', 'health', ['Dormir 8 heures', 'Sleep 8 hours'], [
		'Une vraie nuit de récupération, couché assez tôt.',
		'A proper recovery night, in bed early enough.'
	], 1, 'day', 5, 1),
	preset('meal_prep', 'health', ['Préparer ses repas de la semaine', 'Meal prep for the week'], [
		'Cuisiner à l’avance des repas équilibrés pour les prochains jours.',
		'Cook balanced meals in advance for the coming days.'
	], 1, 'week', 60),
	preset('hydrate', 'health', ["Boire 2 L d'eau", 'Drink 2 L of water'], [
		"Bien s'hydrater, surtout les jours d'entraînement.",
		'Stay hydrated, especially on training days.'
	], 1, 'day', 5)
];

const LEARNING: Preset[] = [
	// --- languages ---
	preset('lang_lesson', 'languages', ['Leçon de langue', 'Language lesson'], [
		'Une leçon sur une appli ou dans un manuel, sans sauter de jour.',
		'A lesson in an app or a textbook, without skipping a day.'
	], 1, 'day', 15),
	preset('vocab', 'languages', ['Réviser 20 mots de vocabulaire', 'Review 20 vocabulary words'], [
		'Cartes mémoire ou liste de mots, en répétition espacée.',
		'Flashcards or a word list, with spaced repetition.'
	], 1, 'day', 10),
	preset('watch_vo', 'languages', ['Regarder un épisode en VO', 'Watch an episode in the original language'], [
		'Une série ou un film dans la langue apprise, sous-titres dans cette langue.',
		'A show or film in the language you learn, with subtitles in that language.'
	], 2, 'week', 40),
	preset('speak', 'languages', ["Pratiquer à l'oral", 'Speaking practice'], [
		'Une conversation avec un natif, un tandem ou un cours en visio.',
		'A conversation with a native speaker, a tandem partner or an online class.'
	], 1, 'week', 30, 1),

	// --- study & work ---
	preset('focus_session', 'study', ['Session de travail concentré', 'Focused work session'], [
		'25 minutes sans distraction (Pomodoro), téléphone en mode avion.',
		'25 distraction-free minutes (Pomodoro), phone in airplane mode.'
	], 1, 'day', 25),
	preset('homework', 'study', ['Faire ses devoirs', 'Do your homework'], [
		'Les devoirs du jour terminés, cartable prêt pour demain.',
		"Today's homework done, school bag ready for tomorrow."
	], 1, 'day', 45, 1),
	preset('online_course', 'study', ['Avancer un cours en ligne', 'Progress an online course'], [
		'Une vidéo ou un module de formation, exercices compris.',
		'One video or training module, exercises included.'
	], 3, 'week', 30),
	preset('review_notes', 'study', ['Relire ses notes / fiches', 'Review your notes'], [
		'Repasser sur les cours de la semaine pour mieux les retenir.',
		"Go over the week's lessons to remember them better."
	], 3, 'week', 20),
	preset('nonfiction', 'study', ['Lire un chapitre pour apprendre', 'Read a chapter to learn'], [
		'Un chapitre d’essai, de documentaire ou de livre technique.',
		'A chapter of a non-fiction, documentary or technical book.'
	], 2, 'week', 30),

	// --- creativity ---
	preset('instrument', 'creative', ['Pratiquer son instrument', 'Practice your instrument'], [
		'Gammes, morceau en cours ou improvisation, une demi-heure.',
		'Scales, the piece in progress or improvising, for half an hour.'
	], 4, 'week', 30),
	preset('draw', 'creative', ['Dessiner', 'Draw'], [
		'Un croquis, une étude ou une illustration, sur papier ou tablette.',
		'A sketch, a study or an illustration, on paper or a tablet.'
	], 3, 'week', 20),
	preset('write', 'creative', ['Écrire 500 mots', 'Write 500 words'], [
		'Roman, nouvelle, blog ou poème : avancer son texte.',
		'Novel, short story, blog or poem: move your text forward.'
	], 3, 'week', 30),
	preset('side_project', 'creative', ['Avancer un projet perso', 'Work on a side project'], [
		'Une heure sur un projet qui vous tient à cœur (code, bricolage, couture…).',
		'An hour on a project you care about (code, DIY, sewing…).'
	], 2, 'week', 60)
];

const withKind = (kind: HouseholdKind, presets: Preset[]): CatalogQuest[] => presets.map((q) => ({ ...q, kind }));

export const QUEST_CATALOG: CatalogQuest[] = [
	...withKind('chores', CHORES),
	...withKind('habits', HABITS),
	...withKind('fitness', FITNESS),
	...withKind('learning', LEARNING)
];

/** One kind's catalogue, grouped by category in display order. */
export function catalogFor(kind: HouseholdKind): { category: QuestCategory; quests: CatalogQuest[] }[] {
	return KIND_CATEGORIES[kind].map((category) => ({
		category,
		quests: QUEST_CATALOG.filter((q) => q.kind === kind && q.category === category)
	}));
}
export function findCatalogQuest(id: string): CatalogQuest | undefined {
	return QUEST_CATALOG.find((q) => q.id === id);
}

export function localize(text: Localized, locale: string): string {
	return locale === 'en' ? text.en : text.fr;
}
