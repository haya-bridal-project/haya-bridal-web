import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const serviceClient = createServiceClient();

  const settingsMap: Record<string, any> = {};
  try {
    const { data } = await serviceClient.from("site_settings").select("*");
    (data || []).forEach((row) => {
      settingsMap[row.key] = row.value;
    });
  } catch {
    // offline/fallback default
  }

  return <SettingsEditor initialSettings={settingsMap} />;
}
