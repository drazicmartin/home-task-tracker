// src/hooks.server.js
import PocketBase from 'pocketbase';
import fs from "fs";

// detect if we're running inside docker and set the backend accordingly
const pocketbase_url = fs.existsSync("/.dockerenv")
  ? "http://pb:8090" // docker-to-docker
  : "http://localhost:8090"; // localhost-to-localhost

const grafana_url = fs.existsSync("/.dockerenv")
  ? "http://grafana:3000" // docker-to-docker
  : "http://localhost:3000"; // localhost-to-localhost


/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    event.locals.pb = new PocketBase('http://localhost:8090');

    // load the store data from the request cookie string
    event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

    try {
        // get an up-to-date auth store state by verifying and refreshing the loaded auth model (if any)
        event.locals.pb.authStore.isValid && await event.locals.pb.collection('users').authRefresh();
    } catch (_) {
        // clear the auth store on failed refresh
        event.locals.pb.authStore.clear();
    }

    const response = await resolve(event);
    event.locals.user = event.locals.pb.authStore.model

    // send back the default 'pb_auth' cookie to the client with the latest store state
    response.headers.append('set-cookie', event.locals.pb.authStore.exportToCookie());

    return response;
}