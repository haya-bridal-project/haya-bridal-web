import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth";

export async function GET() {
  const adminCtx = await getAdminContext();
  return NextResponse.json({
    isAdmin: !!adminCtx,
    role: adminCtx?.role || null,
    userEmail: adminCtx?.user.email || null,
  });
}
