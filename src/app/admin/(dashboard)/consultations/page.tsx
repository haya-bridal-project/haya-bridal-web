import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  ConsultationsManager,
  type ConsultationItem,
} from "@/components/admin/ConsultationsManager";

export const dynamic = "force-dynamic";

export default async function AdminConsultationsPage() {
  await requireAdmin();
  const serviceClient = createServiceClient();

  let consultations: ConsultationItem[] = [];
  try {
    const { data, error } = await serviceClient
      .from("consultations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      consultations = data as ConsultationItem[];
    }
  } catch {
    consultations = [];
  }

  return <ConsultationsManager initialConsultations={consultations} />;
}
