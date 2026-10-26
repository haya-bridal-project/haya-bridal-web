import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/** Refreshes the Supabase session cookie and gates /account and /admin. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthed = !!data?.claims?.sub;
  const path = request.nextUrl.pathname;

  const needsAuth =
    path.startsWith("/account") ||
    path.startsWith("/checkout") ||
    path.startsWith("/book/") ||
    (path.startsWith("/admin") && !path.startsWith("/admin/login"));

  if (needsAuth && !isAuthed) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = path.startsWith("/admin") ? "/admin/login" : "/login";
    redirect.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(redirect);
  }

  return response;
}
