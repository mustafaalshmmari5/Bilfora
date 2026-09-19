import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = "https://xdjumeoydjhribkmjkvc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Yo64cO9q-yhkyL12O9xo7g_nyXUc-dN";

export async function proxy(request: NextRequest) {
    const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user && isDashboard) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
