import { questStatus, type TaskWithScore } from '$lib/scoring';

/** Status buckets the board can filter on; on-demand quests are their own bucket. */
export type StatusFilter = 'overdue' | 'dueSoon' | 'ok' | 'onDemand';
export const STATUS_FILTERS: StatusFilter[] = ['overdue', 'dueSoon', 'ok', 'onDemand'];

/** Point ranges, matching the catalogue scale (1 point ≈ 5 min, so 10+ ≈ an hour or more). */
export type PointsFilter = 'xs' | 's' | 'm' | 'l';
export const POINTS_FILTERS: { id: PointsFilter; min: number; max: number; label: string }[] = [
	{ id: 'xs', min: -Infinity, max: 2, label: '1–2' },
	{ id: 's', min: 3, max: 5, label: '3–5' },
	{ id: 'm', min: 6, max: 9, label: '6–9' },
	{ id: 'l', min: 10, max: Infinity, label: '10+' }
];

export type RhythmFilter = 'day' | 'week' | 'month' | 'year';
export const RHYTHM_FILTERS: RhythmFilter[] = ['day', 'week', 'month', 'year'];

export type QuestSort = 'urgency' | 'pointsDesc' | 'pointsAsc' | 'name';
export const QUEST_SORTS: QuestSort[] = ['urgency', 'pointsDesc', 'pointsAsc', 'name'];

export type QuestFilters = {
	query: string;
	status: StatusFilter[];
	points: PointsFilter[];
	rhythm: RhythmFilter[];
	sort: QuestSort;
};

export function emptyFilters(): QuestFilters {
	return { query: '', status: [], points: [], rhythm: [], sort: 'urgency' };
}

/** Number of active filters (search and sort not included), for the toggle badge. */
export function activeFilterCount(filters: QuestFilters): number {
	return filters.status.length + filters.points.length + filters.rhythm.length;
}

export function isFiltering(filters: QuestFilters): boolean {
	return filters.query.trim() !== '' || activeFilterCount(filters) > 0;
}

/** Lowercase, accent-free text so "menage" matches "Ménage". */
function normalize(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, ' ');
}

export function taskStatusFilter(task: TaskWithScore): StatusFilter {
	return task.onDemand ? 'onDemand' : questStatus(task.todoPercentage);
}

/**
 * Applies search + filters + sort. Each filter group is an OR of its ticked
 * options; the groups (and the search) are combined with AND. An empty group
 * means "no constraint".
 */
export function filterQuests(tasks: TaskWithScore[], filters: QuestFilters): TaskWithScore[] {
	const words = normalize(filters.query).split(/\s+/).filter(Boolean);
	const pointRanges = POINTS_FILTERS.filter((p) => filters.points.includes(p.id));

	const matches = tasks.filter((task) => {
		if (words.length > 0) {
			const haystack = normalize(`${task.name} ${stripHtml(task.description ?? '')}`);
			if (!words.every((word) => haystack.includes(word))) return false;
		}
		if (filters.status.length > 0 && !filters.status.includes(taskStatusFilter(task))) return false;
		if (pointRanges.length > 0 && !pointRanges.some((r) => task.score >= r.min && task.score <= r.max)) {
			return false;
		}
		if (filters.rhythm.length > 0 && (task.onDemand || !filters.rhythm.includes(task.unit as RhythmFilter))) {
			return false;
		}
		return true;
	});

	// the server already returns quests in urgency order
	switch (filters.sort) {
		case 'pointsDesc':
			return matches.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
		case 'pointsAsc':
			return matches.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
		case 'name':
			return matches.sort((a, b) => a.name.localeCompare(b.name));
		default:
			return matches;
	}
}
