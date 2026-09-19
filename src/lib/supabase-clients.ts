import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient;

const FALLBACK_SUPABASE_URL = "https://xdjumeoydjhribkmjkvc.supabase.co";
const FALLBACK_PUBLISHABLE_KEY = "sb_publishable_Yo64cO9q-yhkyL12O9xo7g_nyXUc-dN";

const buildClient = (): Client => {
	const directSupabaseUrl =
		process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
	const supabaseUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/api/supabase`
			: directSupabaseUrl;
	const supabasePublishableKey =
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		FALLBACK_PUBLISHABLE_KEY;

	if (!supabaseUrl || !supabasePublishableKey) {
		throw new Error("Missing Supabase URL or Publishable Key");
	}

	return createBrowserClient(supabaseUrl, supabasePublishableKey);
};

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
