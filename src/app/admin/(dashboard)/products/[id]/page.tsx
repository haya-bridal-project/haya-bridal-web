import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage(props: EditProductPageProps) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: product }, { data: collections }] = await Promise.all([
    supabase
      .from("products")
      .select("*,product_images(*),product_rental_options(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("collections").select("id,name").order("name"),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      initialProduct={product}
      collections={collections || []}
    />
  );
}
