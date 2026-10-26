import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { HayaLogo } from "@/components/brand/HayaLogo";
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  Image as ImageIcon,
  CalendarCheck,
  MessageSquare,
  UserCheck,
  Settings,
  Mail,
  ExternalLink,
  LogOut,
  Shield,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminCtx = await requireAdmin();

  const navigation = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Products", href: "/admin/products", icon: Sparkles },
    { label: "Collections", href: "/admin/collections", icon: Layers },
    { label: "Homepage & Banners", href: "/admin/homepage", icon: ImageIcon },
    { label: "Bookings & Rentals", href: "/admin/bookings", icon: CalendarCheck },
    { label: "Client Enquiries", href: "/admin/enquiries", icon: MessageSquare },
    { label: "Consultations", href: "/admin/consultations", icon: UserCheck },
    { label: "Settings & Pricing", href: "/admin/settings", icon: Settings },
    { label: "Email Outbox", href: "/admin/emails", icon: Mail },
  ];

  return (
    <div className="min-h-screen flex bg-[#FAF6F0] text-[#2B211C]">
      {/* Admin Desktop Sidebar */}
      <aside className="w-64 bg-[#FFFDF9] border-r border-[#E8DDD1] flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Logo & Portal Badge */}
          <div className="p-6 border-b border-[#E8DDD1]">
            <HayaLogo size="sm" variant="dark" href="/admin" />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#B06F5E] bg-[#FAF6F0] px-2 py-0.5 rounded-xs border border-[#E8DDD1]">
                Staff Portal
              </span>
              <span className="text-[11px] font-mono text-[#7A6A5F] capitalize">
                {adminCtx.role}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-medium text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#FAF6F0] transition-colors"
                >
                  <Icon className="w-4 h-4 stroke-[1.6] shrink-0 text-[#B06F5E]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#E8DDD1] space-y-3">
          <div className="px-3.5 py-2 text-xs text-[#7A6A5F]">
            <span className="block text-[10px] uppercase tracking-wider text-[#7A6A5F]/70">
              Authenticated
            </span>
            <span className="font-medium text-[#2B211C] truncate block">
              {adminCtx.user.email}
            </span>
          </div>

          <div className="flex items-center justify-between px-2 text-xs">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[#7A6A5F] hover:text-[#2B211C] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Website</span>
            </Link>

            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-red-700 hover:text-red-900 inline-flex items-center gap-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-[#FFFDF9] border-b border-[#E8DDD1] px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#B06F5E]" />
            <span className="text-xs font-medium text-[#2B211C] uppercase tracking-wider">
              Boutique Operations
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/admin/products/new"
              className="px-3.5 py-1.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white rounded-sm font-medium transition-colors shadow-xs"
            >
              + New Outfit
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
