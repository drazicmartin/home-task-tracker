import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) {
		redirect(303, '/board');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
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

		redirect(303, '/board');
	}
};
