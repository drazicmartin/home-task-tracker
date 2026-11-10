const UNITS = ['day', 'week', 'month', 'year'];

export type TaskFormValues = {
	name: string;
	description: string;
	frequency: number;
	unit: string;
	score: number;
	on_demand: boolean;
};

/**
 * Reads the quest form (TaskForm.svelte) shared by the create / edit / duplicate
 * actions. On-demand quests don't need a valid frequency: the schema still
 * requires one, so an invalid value falls back to once a week.
 */
export function parseTaskForm(form: FormData): { values: TaskFormValues; valid: boolean } {
	const on_demand = form.get('on_demand') === 'on';
	let frequency = Number(form.get('frequency') ?? 1);
	let unit = String(form.get('unit') ?? 'week');
	const values: TaskFormValues = {
		name: String(form.get('name') ?? '').trim(),
		description: String(form.get('description') ?? '').trim(),
		frequency,
		unit,
		score: Number(form.get('score') ?? 1),
		on_demand
	};

	const frequencyValid = Number.isFinite(frequency) && frequency > 0 && UNITS.includes(unit);
	if (on_demand && !frequencyValid) {
		frequency = 1;
		unit = 'week';
		values.frequency = frequency;
		values.unit = unit;
	}

	const valid =
		Boolean(values.name) && Number.isFinite(values.score) && values.score >= 0 && (on_demand || frequencyValid);
	return { values, valid };
}
