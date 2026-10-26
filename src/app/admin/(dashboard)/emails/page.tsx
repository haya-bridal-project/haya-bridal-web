import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  EmailOutboxManager,
  type EmailLogItem,
} from "@/components/admin/EmailOutboxManager";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  await requireAdmin();
  const serviceClient = createServiceClient();

  let logs: EmailLogItem[] = [];
  try {
    const { data, error } = await serviceClient
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      logs = data as EmailLogItem[];
    }
  } catch {
    logs = [];
  }

  return <EmailOutboxManager initialLogs={logs} />;
}
