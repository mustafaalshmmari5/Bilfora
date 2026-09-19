import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient;

const buildClient = (): Client => {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error("Missing Supabase URL or Publishable Key");
	}

	return createBrowserClient(supabaseUrl, supabaseAnonKey);
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

/**
 * Persistent client → uses Cookies
 * Used for standard interaction with Supabase where Middleware protection is needed.
 */
export const supabasePersistent: Client = lazyClient();

/**
 * Session client → Redirects to Persistent client
 * Maintaining export for backward compatibility, but since we are using Cookies (which are domain-wide),
 * distinct storage strategies (localStorage vs sessionStorage) are less relevant for Middleware auth.
 * Both will now effectively use the same cookie-based session.
 */
export const supabaseSession: Client = lazyClient();
