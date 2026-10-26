import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth";
import { createUploadSignature, type AssetRole, ASSET_ROLES } from "@/lib/cloudinary";
import { isConfigured } from "@/lib/env";

export async function POST(request: NextRequest) {
  if (!isConfigured.cloudinary()) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
  }

  // Security: only authenticated administrators may request upload signatures
  const adminCtx = await getAdminContext();
  if (!adminCtx) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const role: AssetRole = ASSET_ROLES.includes(body.role) ? body.role : "product";

    const signatureData = createUploadSignature(role);
    return NextResponse.json(signatureData);
  } catch (err: unknown) {
    console.error("[cloudinary/sign] error", err);
    return NextResponse.json({ error: "Signature generation failed" }, { status: 500 });
  }
}
