/**
 * Automatic classification of quests into the catalogue's categories, so
 * custom quests get a colour and an icon too (e.g. in the board timeline)
 * without the user having to pick one.
 *
 * 1. a quest whose name is exactly a catalogue entry gets that entry's category;
 * 2. otherwise French + English keywords are scored against the name (and,
 *    with less weight, the description) and the best-scoring category wins;
 * 3. nothing matched -> 'other'.
 */
import { QUEST_CATALOG, type QuestCategory } from '$lib/questCatalog';

export type TaskCategory = QuestCategory | 'other';

export const TASK_CATEGORIES: TaskCategory[] = [
	'kitchen',
	'floors',
	'bathroom',
	'laundry',
	'pets',
	'outdoor',
	'errands',
	'other'
];

/** Distinct, saturated hues that stay readable with white icons on the dark UI. */
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
	kitchen: '#f97316',
	floors: '#06b6d4',
	bathroom: '#3b82f6',
	laundry: '#ec4899',
	pets: '#d97706',
	outdoor: '#16a34a',
	errands: '#a855f7',
	other: '#64748b'
};

/**
 * Keywords are compared on accent-free lowercase text, as whole words;
 * a trailing `*` makes it a prefix ("repass*" matches "repassage").
 * Multi-word keywords are allowed ("salle de bain").
 */
const KEYWORDS: Record<QuestCategory, string[]> = {
	kitchen: [
		'vaisselle', 'lave-vaisselle', 'dish*', 'dishwasher', 'cuisin*', 'kitchen', 'cook*', 'repas', 'meal*',
		'diner', 'dejeuner', 'lunch', 'dinner', 'breakfast', 'four', 'oven', 'micro-onde*', 'microwave',
		'frigo', 'fridge', 'refrigerat*', 'congel*', 'freezer', 'plan de travail', 'counter*', 'plaque*',
		'stove*', 'hotte', 'poubelle*', 'trash', 'garbage', 'bin', 'bins', 'dechet*', 'recycl*', 'tri', 'verre'
	],
	floors: [
		'aspirat*', 'vacuum*', 'serpill*', 'mop', 'sol', 'sols', 'floor*', 'balai*', 'sweep*', 'poussiere*',
		'dust*', 'vitre*', 'window*', 'fenetre*', 'ranger', 'rangement', 'tidy', 'menage', 'salon', 'living room', 'lit', 'bed', 'tapis', 'carpet*', 'rug*'
	],
	bathroom: [
		'salle de bain*', 'sdb', 'bathroom*', 'toilet*', 'wc', 'douche*', 'shower*', 'baignoire', 'bath*',
		'lavabo', 'miroir*', 'mirror*'
	],
	laundry: [
		'linge', 'laundry', 'lessive', 'machine', 'etendre', 'hang', 'plier', 'fold', 'repass*', 'iron*',
		'drap', 'draps', 'sheet*', 'vetement*', 'clothes'
	],
	pets: [
		'litiere*', 'litter', 'chat', 'chats', 'cat', 'cats', 'chien*', 'dog*', 'animal', 'animaux', 'pet', 'pets',
		'nourrir', 'feed', 'promener', 'promenade', 'walk', 'aquarium', 'poisson*', 'fish', 'croquette*', 'gamelle*'
	],
	outdoor: [
		'voiture', 'car', 'jardin*', 'garden*', 'plante*', 'plant*', 'arros*', 'tondre', 'tondeuse', 'mow*',
		'pelouse', 'lawn', 'haie*', 'hedge*', 'feuilles', 'leaves', 'balcon', 'terrasse', 'piscine', 'pool',
		'garage', 'potager'
	],
	errands: [
		'course*', 'grocer*', 'shopping', 'achat*', 'acheter', 'buy', 'pharmac*', 'poste', 'post office',
		'desencombr*', 'declutter*', 'rendez-vous', 'rdv', 'papier*', 'paperwork', 'factur*', 'bill*', 'impot*'
	]
};

function normalize(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const MATCHERS = (Object.entries(KEYWORDS) as [QuestCategory, string[]][]).map(([category, words]) => ({
	category,
	patterns: words.map((word) => {
		const prefix = word.endsWith('*');
		const body = escapeRegex(prefix ? word.slice(0, -1) : word).replace(/\\?-| /g, '[\\s-]');
		return new RegExp(`(^|[^a-z0-9])${body}${prefix ? '' : '(?![a-z0-9])'}`);
	})
}));

const CATALOG_BY_NAME = new Map<string, QuestCategory>(
	QUEST_CATALOG.flatMap((q) => [
		[normalize(q.name.fr).trim(), q.category] as const,
		[normalize(q.name.en).trim(), q.category] as const
	])
);

function countHits(text: string, patterns: RegExp[]): number {
	return patterns.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
}

export function classifyTask(name: string, description = ''): TaskCategory {
	const n = normalize(name).trim();
	const fromCatalog = CATALOG_BY_NAME.get(n);
	if (fromCatalog) return fromCatalog;

	const d = normalize(description.replace(/<[^>]*>/g, ' '));
	let best: TaskCategory = 'other';
	let bestScore = 0;
	for (const { category, patterns } of MATCHERS) {
		// the name is what the user chose to call it: it outweighs the description
		const score = countHits(n, patterns) * 3 + countHits(d, patterns);
		if (score > bestScore) {
			best = category;
			bestScore = score;
		}
	}
	return best;
}
