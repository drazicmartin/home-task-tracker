import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const ACTIVE_HOUSEHOLD_COOKIE = 'active_household';

export const load: LayoutServerLoad = async ({ locals, cookies, url }) => {
	if (!locals.user) {
		redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}

	// The HUD points are fetched for the remembered household at the same
	// time as the household list, instead of after it: the cookie is almost
	// always right, and when it isn't (first visit, left that household...)
	// they're simply fetched again below.
	const cookieId = cookies.get(ACTIVE_HOUSEHOLD_COOKIE);
	const [memberships, cookiePoints] = await Promise.all([
		locals.pb.collection('household_members').getFullList({
			filter: locals.pb.filter('user = {:id}', { id: locals.user.id }),
			expand: 'household',
			sort: 'created'
		}),
		cookieId ? getPlayerPoints(locals, cookieId) : Promise.resolve(0)
	]);

	const households = memberships
		.map((m) => m.expand?.household)
		.filter((h): h is NonNullable<typeof h> => Boolean(h));

	if (households.length === 0) {
		if (url.pathname !== '/households/new') {
			redirect(303, '/households/new');
		}
		return { households: [], activeHousehold: null, playerPoints: 0 };
	}

	const activeHousehold = households.find((h) => h.id === cookieId) ?? households[0];

	if (activeHousehold.id !== cookieId) {
		cookies.set(ACTIVE_HOUSEHOLD_COOKIE, activeHousehold.id, { path: '/', maxAge: 60 * 60 * 24 * 365 });
	}

	const playerPoints = activeHousehold.id === cookieId ? cookiePoints : await getPlayerPoints(locals, activeHousehold.id);

	return { households, activeHousehold, playerPoints };
};

/**
 * The signed-in user's all-time points in this household — drives the HUD's
 * coin counter and level/XP bar. Summed per day by PocketBase (the
 * daily_points view), so it's one small row per active day rather than every
 * record ever. A failure here shouldn't take the whole app down, so it
 * degrades to 0.
 */
async function getPlayerPoints(locals: App.Locals, householdId: string): Promise<number> {
	try {
		const days = await locals.pb.collection('daily_points').getFullList({
			filter: locals.pb.filter('household = {:h} && user = {:u}', { h: householdId, u: locals.user!.id }),
			fields: 'points'
		});
		return Math.round(days.reduce((sum, day) => sum + (Number(day.points) || 0), 0) * 100) / 100;
	} catch {
		return 0;
	}
}
