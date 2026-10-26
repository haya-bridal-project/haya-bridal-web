import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supabase = await createClient();

  const { data: collections } = await supabase
    .from("collections")
    .select("id,name")
    .order("name");

  return <ProductForm collections={collections || []} />;
}
