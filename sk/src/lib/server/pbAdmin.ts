import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';

const PB_URL = env.PB_URL || 'http://127.0.0.1:8090';

let pbAdmin: PocketBase | null = null;

/**
 * Superuser PocketBase client for the handful of writes that regular
 * per-request auth can't do because the rule is intentionally locked
 * (households/household_members creation) — see pb/pb_migrations.
 * Never expose this client or its credentials to the browser.
 */
export async function getAdminClient(): Promise<PocketBase> {
	if (!pbAdmin) {
		pbAdmin = new PocketBase(PB_URL);
	}

	if (!pbAdmin.authStore.isValid) {
		await pbAdmin.collection('_superusers').authWithPassword(env.PB_SUPERUSER_EMAIL!, env.PB_SUPERUSER_PASSWORD!);
	}

	return pbAdmin;
}
