import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { retryEmail } from "@/lib/email/send";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { log_id } = await request.json();

    if (!log_id) {
      return NextResponse.json({ error: "Missing log_id" }, { status: 400 });
    }

    const result = await retryEmail(log_id);
    return NextResponse.json({ result });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Retry failed" },
      { status: 500 }
    );
  }
}
