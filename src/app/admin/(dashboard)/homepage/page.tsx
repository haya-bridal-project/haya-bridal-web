import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/public";
import { HomepageContentEditor } from "@/components/admin/HomepageContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const supabase = await createClient();

  const [{ data: slides }, settings] = await Promise.all([
    supabase.from("hero_slides").select("*").order("sort_order"),
    getSiteSettings(),
  ]);

  return (
    <HomepageContentEditor
      initialSlides={slides || []}
      initialSettings={settings}
    />
  );
}
