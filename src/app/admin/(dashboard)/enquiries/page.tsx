import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { EnquiriesManager, type EnquiryItem } from "@/components/admin/EnquiriesManager";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  await requireAdmin();
  const serviceClient = createServiceClient();

  let enquiries: EnquiryItem[] = [];
  try {
    const { data, error } = await serviceClient
      .from("enquiries")
      .select("*,product:products(id,name,slug)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      enquiries = data as EnquiryItem[];
    }
  } catch {
    enquiries = [];
  }

  return <EnquiriesManager initialEnquiries={enquiries} />;
}
