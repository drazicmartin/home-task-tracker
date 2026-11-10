import { env } from '$env/dynamic/private';

/**
 * Whether this signed-in user is one of the app's developers, i.e. allowed to
 * read every "message to the developer" (not just their own). Configured with
 * DEVELOPER_EMAILS, a comma-separated list of account e-mails.
 */
export function isDeveloper(user: App.Locals['user']): boolean {
	const email = String(user?.email ?? '').trim().toLowerCase();
	if (!email) return false;
	return (env.DEVELOPER_EMAILS ?? '')
		.split(',')
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean)
		.includes(email);
}
