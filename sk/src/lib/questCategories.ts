/**
 * Automatic classification of quests into the catalogue's categories, so
 * custom quests get a colour and an icon too (e.g. in the board timeline)
 * without the user having to pick one.
 *
 * 1. a quest whose name is exactly a catalogue entry gets that entry's category;
 * 2. otherwise French + English keywords are scored against the name (and,
 *    with less weight, the description) and the best-scoring category wins.
 *    Only the categories of the household's kind compete, so "Lire 20 min"
 *    lands in "mind" for a habits household and isn't mistaken for a chore;
 * 3. nothing matched -> 'other'.
 */
import { DEFAULT_KIND, type HouseholdKind } from '$lib/householdKinds';
import { KIND_CATEGORIES, QUEST_CATALOG, QUEST_CATEGORIES, type QuestCategory } from '$lib/questCatalog';

export type TaskCategory = QuestCategory | 'other';

export const TASK_CATEGORIES: TaskCategory[] = [...QUEST_CATEGORIES, 'other'];

/**
 * Distinct, saturated hues that stay readable with white icons on the dark UI.
 * They only need to be distinct within one kind (a household shows one kind's
 * categories), so hues are reused across kinds.
 */
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
	kitchen: '#f97316',
	floors: '#06b6d4',
	bathroom: '#3b82f6',
	laundry: '#ec4899',
	pets: '#d97706',
	outdoor: '#16a34a',
	errands: '#a855f7',
	health: '#16a34a',
	mind: '#8b5cf6',
	routine: '#0ea5e9',
	social: '#d97706',
	cardio: '#ef4444',
	strength: '#f97316',
	flexibility: '#06b6d4',
	languages: '#3b82f6',
	study: '#a855f7',
	creative: '#ec4899',
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
	],
	health: [
		'eau', 'water', 'boire', 'drink*', 'hydrat*', 'fruit*', 'legume*', 'vegetable*', 'veggie*', 'sommeil',
		'sleep*', 'dormir', 'coucher', 'bedtime', 'nuit', 'night', 'sucre', 'sugar', 'vitamin*', 'medicament*',
		'meds', 'complement*', 'alcool', 'alcohol', 'tabac', 'cigarette*', 'smok*', 'repas', 'meal*', 'nutrition',
		'manger', 'eat', 'sante', 'health*', 'regime', 'diet'
	],
	mind: [
		'medit*', 'lire', 'lecture', 'read*', 'livre*', 'book*', 'journal', 'gratitude', 'respir*', 'breath*',
		'mindful*', 'pleine conscience', 'calme', 'priere', 'pray*', 'positi*', 'zen', 'relax*'
	],
	routine: [
		'reveil', 'wake', 'snooz*', 'lever', 'matin*', 'morning', 'soir*', 'evening', 'ecran*', 'screen*',
		'telephone', 'phone', 'planifi*', 'plan', 'routine', 'agenda', 'bilan', 'review', 'todo', 'to do',
		'faire son lit', 'make your bed', 'make the bed', 'priorit*'
	],
	social: [
		'appeler', 'appel', 'call', 'ami', 'amis', 'friend*', 'famille', 'family', 'proche*', 'parents',
		'nouvelles', 'check in', 'service', 'favour', 'favor', 'benevol*', 'volunteer*', 'ensemble', 'together',
		'couple', 'voisin*', 'neighbo*'
	],
	cardio: [
		'courir', 'course', 'run', 'running', 'jogging', 'footing', 'velo', 'bike', 'cycl*', 'nage*', 'nager',
		'swim*', 'piscine', 'pool', 'marche*', 'walk*', 'pas', 'steps', 'escalier*', 'stairs', 'cardio', 'hiit',
		'rameur', 'rowing', 'corde a sauter', 'jump rope', 'rando*', 'hike', 'hiking'
	],
	strength: [
		'muscu*', 'gym', 'salle de sport', 'pompe*', 'push-up*', 'pushup*', 'squat*', 'abdo*', 'abs', 'gainage',
		'plank*', 'core', 'traction*', 'pull-up*', 'poids', 'weight*', 'halter*', 'dumbbell*', 'crossfit', 'renfo*',
		'strength', 'fentes', 'lunge*'
	],
	flexibility: [
		'etir*', 'stretch*', 'yoga', 'pilates', 'mobilit*', 'souplesse', 'flexib*', 'echauff*', 'warm-up',
		'reveil musculaire'
	],
	languages: [
		'langue*', 'language*', 'anglais', 'english', 'espagnol', 'spanish', 'allemand', 'german', 'italien',
		'italian', 'japonais', 'japanese', 'chinois', 'chinese', 'portugais', 'portuguese', 'vocabulaire', 'vocab*',
		'duolingo', 'vo', 'grammaire', 'grammar', 'oral', 'speaking', 'tandem'
	],
	study: [
		'etud*', 'study', 'studies', 'cours', 'course', 'lesson*', 'lecon*', 'revis*', 'devoir*', 'homework',
		'exam*', 'fiche*', 'notes', 'pomodoro', 'travail', 'work', 'focus', 'concentr*', 'chapitre', 'chapter',
		'mooc', 'formation', 'training', 'certif*', 'apprendre', 'learn*'
	],
	creative: [
		'instrument', 'piano', 'guitar*', 'violon', 'violin', 'musique', 'music', 'chant*', 'sing*', 'dessin*',
		'draw*', 'sketch*', 'croquis', 'peint*', 'paint*', 'ecrire', 'ecriture', 'writ*', 'mots', 'words',
		'photo*', 'tricot*', 'knit*', 'couture', 'sew*', 'projet perso', 'side project', 'code', 'coder',
		'program*', 'bricol*', 'diy'
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

/** Exact catalogue names -> category, per kind ("kind:name"), and for any kind ("*:name"). */
const CATALOG_BY_NAME = new Map<string, QuestCategory>();
for (const q of QUEST_CATALOG) {
	for (const label of [q.name.fr, q.name.en]) {
		const key = normalize(label).trim();
		CATALOG_BY_NAME.set(`${q.kind}:${key}`, q.category);
		if (!CATALOG_BY_NAME.has(`*:${key}`)) CATALOG_BY_NAME.set(`*:${key}`, q.category);
	}
}

function countHits(text: string, patterns: RegExp[]): number {
	return patterns.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
}

function bestKeywordMatch(name: string, description: string, categories: QuestCategory[]): TaskCategory {
	let best: TaskCategory = 'other';
	let bestScore = 0;
	for (const { category, patterns } of MATCHERS) {
		if (!categories.includes(category)) continue;
		// the name is what the user chose to call it: it outweighs the description
		const score = countHits(name, patterns) * 3 + countHits(description, patterns);
		if (score > bestScore) {
			best = category;
			bestScore = score;
		}
	}
	return best;
}

/**
 * Exact catalogue names are looked up in the household's own catalogue first,
 * then in the others (a fitness preset added to a habits household keeps its
 * "cardio" colour). Keywords only ever compete within the household's kind.
 */
export function classifyTask(name: string, description = '', kind: HouseholdKind = DEFAULT_KIND): TaskCategory {
	const n = normalize(name).trim();
	const fromCatalog = CATALOG_BY_NAME.get(`${kind}:${n}`) ?? CATALOG_BY_NAME.get(`*:${n}`);
	if (fromCatalog) return fromCatalog;

	const d = normalize(description.replace(/<[^>]*>/g, ' '));
	return bestKeywordMatch(n, d, KIND_CATEGORIES[kind]);
}
