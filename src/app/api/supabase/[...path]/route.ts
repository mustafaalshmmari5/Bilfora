import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = "https://xdjumeoydjhribkmjkvc.supabase.co";

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_Yo64cO9q-yhkyL12O9xo7g_nyXUc-dN";

const ALLOWED_PREFIXES = ["auth/v1", "rest/v1", "storage/v1"];

async function forward(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const joinedPath = path.join("/");

  if (!ALLOWED_PREFIXES.some((prefix) => joinedPath.startsWith(prefix))) {
    return NextResponse.json({ error: "Unsupported Supabase path" }, { status: 404 });
  }

  const target = new URL(joinedPath, SUPABASE_URL + "/");
  target.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("connection");
  headers.delete("accept-encoding");

  if (!headers.has("apikey")) {
    headers.set("apikey", PUBLISHABLE_KEY);
  }

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  try {
    const upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("connection");
    responseHeaders.set("cache-control", "private, no-store");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Supabase proxy error:", error);
    return NextResponse.json(
      { error: "Supabase connection failed" },
      { status: 502 }
    );
  }
}

export const dynamic = "force-dynamic";

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
