/**
 * Presentation-only "game" helpers: player levels, avatar colors and number
 * formatting. Nothing here is stored — levels are derived from the points a
 * player has already earned, so they never drift from the real score.
 */

/** XP needed to go from level 1 to 2; each following level needs one more step than the last. */
const LEVEL_STEP = 10;

export type LevelInfo = {
	level: number;
	/** XP earned inside the current level. */
	current: number;
	/** XP the current level needs in total before levelling up. */
	needed: number;
	/** 0..1 progress through the current level. */
	progress: number;
};

/** Total XP required to *reach* `level` (level 1 starts at 0). */
function xpToReach(level: number): number {
	return (LEVEL_STEP * level * (level - 1)) / 2;
}

/**
 * Levels follow a gentle triangular curve: 10 XP for level 2, then 20 more
 * for level 3, 30 more for level 4, ... so early levels come quickly and
 * later ones take a few weeks of chores.
 */
export function levelInfo(points: number): LevelInfo {
	const total = Math.max(0, points || 0);
	let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * total) / LEVEL_STEP)) / 2));
	// guard against floating point landing just under/over a boundary
	while (xpToReach(level + 1) <= total) level += 1;
	while (level > 1 && xpToReach(level) > total) level -= 1;

	const needed = LEVEL_STEP * level;
	const current = total - xpToReach(level);
	return { level, current, needed, progress: Math.min(1, current / needed) };
}

/** Stable hue (0..359) for a user, so their avatar color is the same everywhere. */
export function avatarHue(seed: string): number {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) | 0;
	}
	return Math.abs(hash) % 360;
}

/**
 * One or two uppercase initials from a display name ("Ada Lovelace" -> "AL",
 * "Ada" -> "A"). Names fall back to an email address when unset, so only the
 * part before the "@" is used.
 */
export function initials(name: string): string {
	const words = name.trim().split('@')[0].split(/[\s._-]+/).filter(Boolean);
	if (words.length === 0) return '?';
	const letters = words.slice(0, 2).map((word) => [...word][0]);
	return letters.join('').toUpperCase();
}

/** Points can be fractional when a task is split between several people. */
export function formatPoints(points: number): string {
	return String(Math.round(points * 100) / 100);
}
