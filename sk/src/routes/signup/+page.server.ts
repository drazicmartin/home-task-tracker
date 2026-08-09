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

		redirect(303, '/board');
	}
};
