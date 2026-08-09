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
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!name || !email || !password) {
			return fail(400, { message: 'Merci de remplir tous les champs.', name, email });
		}
		if (password.length < 8) {
			return fail(400, { message: 'Le mot de passe doit contenir au moins 8 caractères.', name, email });
		}

		try {
			await locals.pb.collection('users').create({
				name,
				email,
				password,
				passwordConfirm: password,
				locale: 'fr'
			});
			await locals.pb.collection('users').authWithPassword(email, password);
		} catch (error) {
			return fail(400, {
				message: "Impossible de créer le compte. L'adresse e-mail est peut-être déjà utilisée.",
				name,
				email
			});
		}

		redirect(303, safeNext(url.searchParams.get('next')));
	}
};
