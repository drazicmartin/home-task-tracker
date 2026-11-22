/** Lowercase, accent-free text so "menage" matches "Ménage". */
export function normalizeText(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}

/** The search box's words, normalized; empty when there's nothing to search for. */
export function searchWords(query: string): string[] {
	return normalizeText(query).split(/\s+/).filter(Boolean);
}

/** Every word appears somewhere in the text (in any order). */
export function matchesWords(text: string, words: string[]): boolean {
	if (words.length === 0) return true;
	const haystack = normalizeText(text);
	return words.every((word) => haystack.includes(word));
}
