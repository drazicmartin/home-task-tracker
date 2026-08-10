import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Dedicated healthcheck target (docker-compose.yml): deliberately does not
// touch PocketBase, so it only reflects whether this "sk" process itself is
// up, not whether "pb" is reachable — that's "pb"'s own healthcheck's job.
export const GET: RequestHandler = () => text('ok');
