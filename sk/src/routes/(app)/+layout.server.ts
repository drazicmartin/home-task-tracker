import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const ACTIVE_HOUSEHOLD_COOKIE = 'active_household';

export const load: LayoutServerLoad = async ({ locals, cookies, url }) => {
	if (!locals.user) {
		redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}

	const memberships = await locals.pb.collection('household_members').getFullList({
		filter: locals.pb.filter('user = {:id}', { id: locals.user.id }),
		expand: 'household',
		sort: 'created'
	});

	const households = memberships
		.map((m) => m.expand?.household)
		.filter((h): h is NonNullable<typeof h> => Boolean(h));

	if (households.length === 0) {
		if (url.pathname !== '/households/new') {
			redirect(303, '/households/new');
		}
		return { households: [], activeHousehold: null, playerPoints: 0 };
	}

	const cookieId = cookies.get(ACTIVE_HOUSEHOLD_COOKIE);
	const activeHousehold = households.find((h) => h.id === cookieId) ?? households[0];

	if (activeHousehold.id !== cookieId) {
		cookies.set(ACTIVE_HOUSEHOLD_COOKIE, activeHousehold.id, { path: '/', maxAge: 60 * 60 * 24 * 365 });
	}

	return { households, activeHousehold, playerPoints: await getPlayerPoints(locals, activeHousehold.id) };
};

/**
 * The signed-in user's all-time points in this household — drives the HUD's
 * coin counter and level/XP bar. Only the score field is fetched. A failure
 * here shouldn't take the whole app down, so it degrades to 0.
 */
async function getPlayerPoints(locals: App.Locals, householdId: string): Promise<number> {
	try {
		const records = await locals.pb.collection('records').getFullList({
			filter: locals.pb.filter('household = {:h} && user = {:u}', { h: householdId, u: locals.user!.id }),
			fields: 'score'
		});
		return records.reduce((sum, record) => sum + (Number(record.score) || 0), 0);
	} catch {
		return 0;
	}
}
