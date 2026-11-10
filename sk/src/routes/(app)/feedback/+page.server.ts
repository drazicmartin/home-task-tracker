import { error, fail } from '@sveltejs/kit';
import type { RecordModel } from 'pocketbase';
import { getAdminClient } from '$lib/server/pbAdmin';
import { isDeveloper } from '$lib/server/developer';
import type { Actions, PageServerLoad } from './$types';

const KINDS = ['bug', 'idea', 'other'] as const;
type Kind = (typeof KINDS)[number];

export type FeedbackItem = {
	id: string;
	kind: Kind;
	message: string;
	page: string;
	status: 'open' | 'done';
	created: string;
	author: string;
	household: string;
};

function toItem(record: RecordModel): FeedbackItem {
	const user = record.expand?.user;
	return {
		id: record.id,
		kind: (KINDS as readonly string[]).includes(record.kind) ? record.kind : 'other',
		message: record.message,
		page: record.page ?? '',
		status: record.status === 'done' ? 'done' : 'open',
		created: record.created,
		author: user?.name || user?.email || '',
		household: record.expand?.household?.name ?? ''
	};
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const mine = await locals.pb
		.collection('feedback')
		.getFullList({ filter: locals.pb.filter('user = {:u}', { u: locals.user!.id }), sort: '-created' })
		.catch(() => []);

	const developer = isDeveloper(locals.user);
	let inbox: FeedbackItem[] = [];
	if (developer) {
		const admin = await getAdminClient();
		inbox = (await admin.collection('feedback').getFullList({ sort: '-created', expand: 'user,household' })).map(toItem);
	}

	const from = url.searchParams.get('from') ?? '';

	return {
		mine: mine.map(toItem),
		developer,
		inbox,
		// only keep in-app paths, never arbitrary URLs
		from: from.startsWith('/') && !from.startsWith('//') ? from.slice(0, 300) : ''
	};
};

async function requireDeveloper(locals: App.Locals) {
	if (!isDeveloper(locals.user)) error(403, 'Réservé au développeur');
	return getAdminClient();
}

export const actions: Actions = {
	send: async ({ request, locals, cookies }) => {
		const form = await request.formData();
		const message = String(form.get('message') ?? '').trim();
		const kindRaw = String(form.get('kind') ?? 'other');
		const kind: Kind = (KINDS as readonly string[]).includes(kindRaw) ? (kindRaw as Kind) : 'other';
		const page = String(form.get('page') ?? '').slice(0, 300);

		if (!message) {
			return fail(400, { action: 'send', message: 'Le message ne peut pas être vide.', kind, text: message });
		}
		if (message.length > 5000) {
			return fail(400, { action: 'send', message: 'Message trop long (5000 caractères max).', kind, text: message });
		}

		try {
			await locals.pb.collection('feedback').create({
				user: locals.user!.id,
				household: cookies.get('active_household') || '',
				kind,
				message,
				page,
				status: 'open'
			});
		} catch {
			// the household cookie may point at a household the user just left
			try {
				await locals.pb.collection('feedback').create({ user: locals.user!.id, kind, message, page, status: 'open' });
			} catch {
				return fail(400, { action: 'send', message: "Impossible d'envoyer le message, réessayez.", kind, text: message });
			}
		}

		return { action: 'send', sent: true };
	},

	deleteMine: async ({ request, locals }) => {
		const form = await request.formData();
		try {
			await locals.pb.collection('feedback').delete(String(form.get('id') ?? ''));
		} catch {
			return fail(400, { action: 'deleteMine', message: 'Impossible de supprimer ce message.' });
		}
	},

	setStatus: async ({ request, locals }) => {
		const admin = await requireDeveloper(locals);
		const form = await request.formData();
		const status = form.get('status') === 'done' ? 'done' : 'open';
		await admin.collection('feedback').update(String(form.get('id') ?? ''), { status });
	},

	markAllDone: async ({ request, locals }) => {
		const admin = await requireDeveloper(locals);
		const form = await request.formData();
		for (const id of form.getAll('id').map(String)) {
			await admin.collection('feedback').update(id, { status: 'done' });
		}
	},

	deleteAny: async ({ request, locals }) => {
		const admin = await requireDeveloper(locals);
		const form = await request.formData();
		await admin.collection('feedback').delete(String(form.get('id') ?? ''));
	}
};
