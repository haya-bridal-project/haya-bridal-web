import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminCtx = await getAdminContext();
    return NextResponse.json({
      isAdmin: !!adminCtx,
      role: adminCtx?.role || null,
      userEmail: adminCtx?.user?.email || null,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        isAdmin: false,
        role: null,
        userEmail: null,
        error: err instanceof Error ? err.message : "Auth check failed",
      },
      { status: 200 }
    );
  }
}
