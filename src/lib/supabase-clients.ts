import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient;

const SUPABASE_URL = "https://xdjumeoydjhribkmjkvc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Yo64cO9q-yhkyL12O9xo7g_nyXUc-dN";

const buildClient = (): Client =>
	createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const lazyClient = (): Client => {
	let instance: Client | null = null;
	return new Proxy({} as Client, {
		get(_, prop) {
			if (!instance) instance = buildClient();
			const value = Reflect.get(instance, prop);
			return typeof value === "function" ? value.bind(instance) : value;
		},
	});
};

export const supabasePersistent: Client = lazyClient();
export const supabaseSession: Client = lazyClient();
