import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/** Refreshes the Supabase session cookie and gates /account and /admin. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  // Prune foreign Supabase project cookies lingering on localhost to prevent HTTP 431 header bloat
  const currentRef = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (currentRef) {
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-") && !cookie.name.includes(currentRef)) {
        response.cookies.delete(cookie.name);
      }
    }
  }

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

  const { data: { user } = { user: null } } = await supabase.auth.getUser();
  const isAuthed = !!user;
  const path = request.nextUrl.pathname;

  // Checkout (/book, /checkout) is open to guests and logged-in users alike.
  // Only the account area and the admin panel require a signed-in user.
  const needsAuth =
    path.startsWith("/account") ||
    (path.startsWith("/admin") && !path.startsWith("/admin/login"));

  if (needsAuth && !isAuthed) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = path.startsWith("/admin") ? "/admin/login" : "/login";
    redirect.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    const redirectResponse = NextResponse.redirect(redirect);
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c);
    });
    return redirectResponse;
  }

  return response;
}
