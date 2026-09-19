import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Renamed from middleware.ts: Next 16 deprecated the `middleware` file
// convention in favour of `proxy`. Same behaviour, and proxy always runs on
// the Node.js runtime. See https://nextjs.org/docs/messages/middleware-to-proxy

const SUPABASE_URL = "https://xdjumeoydjhribkmjkvc.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Built once, and only when configured. Calling Redis.fromEnv() unconditionally
// logs four errors on every boot in environments without Upstash.
const ratelimit =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? new Ratelimit({
              redis: Redis.fromEnv(),
              limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds per IP
              analytics: true,
              prefix: "@upstash/ratelimit",
          })
        : null;

export async function proxy(request: NextRequest) {
    const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
    const isSupabaseProxy = request.nextUrl.pathname.startsWith("/api/supabase");

    if (isSupabaseProxy) {
        return NextResponse.next({ request });
    }

    // Without Supabase credentials we cannot verify anyone, so fail closed:
    // send dashboard traffic to login rather than throwing a 500 from
    // createServerClient and taking every protected route down with it.
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error(
            "Supabase URL or publishable key is missing. Denying access to protected routes."
        );
        if (isDashboard) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                supabaseResponse = NextResponse.next({
                    request,
                });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                );
            },
        },
    });

    // Rate Limiting Logic
    // Only apply to API routes and Auth endpoints to prevent abuse
    if (
        ratelimit &&
        (request.nextUrl.pathname.startsWith("/api") ||
            request.nextUrl.pathname.startsWith("/auth"))
    ) {
        const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
        // Fail open if Redis is unreachable, to avoid blocking legitimate users
        try {
            const { success } = await ratelimit.limit(ip);
            if (!success) {
                return new NextResponse("Too Many Requests", { status: 429 });
            }
        } catch (error) {
            console.error("Rate limit error:", error);
        }
    }

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
    matcher: [
        "/dashboard/:path*",
        "/api/:path*", // Include API routes for rate limiting
        "/auth/:path*", // Include Auth routes if they exist
    ],
};
