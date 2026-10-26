import { createClient } from "@/lib/supabase/server";
import { CollectionsManager } from "@/components/admin/CollectionsManager";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const supabase = await createClient();

  const { data: collections } = await supabase
    .from("collections")
    .select("*")
    .order("sort_order")
    .order("name");

  return <CollectionsManager initialCollections={collections || []} />;
}
