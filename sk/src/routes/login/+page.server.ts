import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function safeNext(next: string | null): string {
	return next && next.startsWith('/') && !next.startsWith('//') ? next : '/board';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(303, safeNext(url.searchParams.get('next')));
	}

	const authMethods = await locals.pb.collection('users').listAuthMethods();
	return { oauth2Providers: authMethods.oauth2.enabled ? authMethods.oauth2.providers : [] };
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { message: 'Merci de remplir tous les champs.', email });
		}

		try {
			await locals.pb.collection('users').authWithPassword(email, password);
		} catch {
			return fail(400, { message: 'E-mail ou mot de passe incorrect.', email });
		}

		redirect(303, safeNext(url.searchParams.get('next')));
	}
};
