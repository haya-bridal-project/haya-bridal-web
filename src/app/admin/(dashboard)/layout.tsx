import { requireAdmin } from "@/lib/auth";
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminCtx = await requireAdmin();

  return (
    <AdminLayoutShell
      userEmail={adminCtx.user.email || "admin@hayabridal.com"}
      role={adminCtx.role}
    >
      {children}
    </AdminLayoutShell>
  );
}
