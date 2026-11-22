import { fail } from '@sveltejs/kit';
import { baseLocale, isLocale } from '$lib/paraglide/runtime';
import { setLocaleCookie } from '$lib/server/locale';
import type { Actions } from './$types';

export const actions: Actions = {
	updateProfile: async ({ request, locals, cookies }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const requestedLocale = form.get('locale');
		const locale = isLocale(requestedLocale) ? requestedLocale : baseLocale;
		const avatar = form.get('avatar');

		const data: Record<string, unknown> = { name, locale };
		if (avatar instanceof File && avatar.size > 0) {
			data.avatar = avatar;
		}

		try {
			await locals.pb.collection('users').update(locals.user!.id, data);
		} catch {
			return fail(400, { action: 'profile', message: 'Impossible de mettre à jour le profil.' });
		}

		// The hook already re-set the cookie for this request, but from the
		// locale saved *before* this update; this one wins.
		setLocaleCookie(cookies, locale);

		return { action: 'profile', success: true, locale };
	},

	changePassword: async ({ request, locals }) => {
		const form = await request.formData();
		const oldPassword = String(form.get('oldPassword') ?? '');
		const password = String(form.get('password') ?? '');
		const passwordConfirm = String(form.get('passwordConfirm') ?? '');

		if (password.length < 8) {
			return fail(400, { action: 'password', message: 'Le mot de passe doit contenir au moins 8 caractères.' });
		}
		if (password !== passwordConfirm) {
			return fail(400, { action: 'password', message: 'Les mots de passe ne correspondent pas.' });
		}

		try {
			await locals.pb.collection('users').update(locals.user!.id, { oldPassword, password, passwordConfirm });
		} catch {
			return fail(400, { action: 'password', message: 'Mot de passe actuel incorrect.' });
		}

		return { action: 'password', success: true };
	}
};
