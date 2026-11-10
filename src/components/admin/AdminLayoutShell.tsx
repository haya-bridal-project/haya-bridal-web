"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HayaLogo } from "@/components/brand/HayaLogo";
import { ConfirmDialogModal } from "@/components/admin/ConfirmDialogModal";
import {
  LayoutDashboard,
  Package,
  Layers,
  Image as ImageIcon,
  ShoppingBag,
  MessageSquare,
  Settings,
  Mail,
  ExternalLink,
  LogOut,
  Shield,
  Menu,
  X,
  Plus,
} from "lucide-react";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  userEmail: string;
  role: string;
}

const NAVIGATION_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Collections", href: "/admin/collections", icon: Layers },
  { label: "Homepage & Banners", href: "/admin/homepage", icon: ImageIcon },
  { label: "Orders", href: "/admin/bookings", icon: ShoppingBag },
  { label: "Client Enquiries", href: "/admin/enquiries", icon: MessageSquare },
  { label: "Settings & Pricing", href: "/admin/settings", icon: Settings },
  { label: "Email Outbox", href: "/admin/emails", icon: Mail },
];

export function AdminLayoutShell({
  children,
  userEmail,
  role,
}: AdminLayoutShellProps) {
  const pathname = usePathname();
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const mobileMenuOpen = menuOpenPath === pathname;
  const setMobileMenuOpen = (open: boolean) => setMenuOpenPath(open ? pathname : null);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const handleConfirmSignOut = () => {
    setSigningOut(true);
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/signout";
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF6F0] text-[#2B211C]">
      {/* ============================================================ */}
      {/* MOBILE TOP BAR (visible on screens < lg)                     */}
      {/* ============================================================ */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#FFFDF9] border-b border-[#E8DDD1] px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1 text-[#2B211C] hover:bg-[#FAF6F0] rounded-sm transition-colors focus:outline-hidden"
            aria-label="Open Admin Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <HayaLogo size="sm" variant="dark" href="/admin" />
            <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#B06F5E] bg-[#FAF6F0] px-1.5 py-0.5 rounded-xs border border-[#E8DDD1]">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white rounded-sm text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Product</span>
          </Link>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MOBILE SLIDE-OVER DRAWER & BACKDROP                          */}
      {/* ============================================================ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <aside className="fixed inset-y-0 left-0 w-[82vw] max-w-xs bg-[#FFFDF9] border-r border-[#E8DDD1] flex flex-col justify-between shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
            <div>
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#E8DDD1] flex items-center justify-between">
                <div>
                  <HayaLogo size="sm" variant="dark" href="/admin" />
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#B06F5E] bg-[#FAF6F0] px-2 py-0.5 rounded-xs border border-[#E8DDD1]">
                      Staff Portal
                    </span>
                    <span className="text-[11px] font-mono text-[#7A6A5F] capitalize">
                      {role}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#FAF6F0] rounded-sm transition-colors"
                  aria-label="Close Admin Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
                {NAVIGATION_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-medium transition-colors ${
                        active
                          ? "bg-[#FAF6F0] text-[#B06F5E] font-semibold border-l-2 border-[#B06F5E]"
                          : "text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#FAF6F0]"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 stroke-[1.6] shrink-0 ${
                          active ? "text-[#B06F5E]" : "text-[#7A6A5F]"
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E8DDD1] space-y-3 bg-[#FAF6F0]/60">
              <div className="px-2 text-xs text-[#7A6A5F]">
                <span className="block text-[10px] uppercase tracking-wider text-[#7A6A5F]/70">
                  Signed in as
                </span>
                <span className="font-medium text-[#2B211C] truncate block">
                  {userEmail}
                </span>
              </div>

              <div className="flex items-center justify-between px-2 pt-2 border-t border-[#E8DDD1] text-xs">
                <Link
                  href="/"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-[#7A6A5F] hover:text-[#2B211C] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Storefront</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSignOutModalOpen(true);
                  }}
                  className="text-red-700 hover:text-red-900 inline-flex items-center gap-1 font-medium transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR (hidden on mobile, visible on lg:)           */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex w-64 bg-[#FFFDF9] border-r border-[#E8DDD1] flex-col justify-between shrink-0 shadow-xs min-h-screen sticky top-0 h-screen">
        <div>
          {/* Logo & Portal Badge */}
          <div className="p-6 border-b border-[#E8DDD1]">
            <HayaLogo size="sm" variant="dark" href="/admin" />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#B06F5E] bg-[#FAF6F0] px-2 py-0.5 rounded-xs border border-[#E8DDD1]">
                Staff Portal
              </span>
              <span className="text-[11px] font-mono text-[#7A6A5F] capitalize">
                {role}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#FAF6F0] text-[#B06F5E] font-semibold border-l-2 border-[#B06F5E]"
                      : "text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#FAF6F0]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 stroke-[1.6] shrink-0 ${
                      active ? "text-[#B06F5E]" : "text-[#7A6A5F]"
                    }`}
                  />
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
              {userEmail}
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

            <button
              type="button"
              onClick={() => setSignOutModalOpen(true)}
              className="text-red-700 hover:text-red-900 inline-flex items-center gap-1 font-medium transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN ADMIN CONTENT AREA                                      */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-[#FFFDF9] border-b border-[#E8DDD1] px-8 items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#B06F5E]" />
            <span className="text-xs font-medium text-[#2B211C] uppercase tracking-wider">
              Boutique Operations
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/admin/products/new"
              className="px-3.5 py-1.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white rounded-sm font-medium transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Product</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={signOutModalOpen}
        onClose={() => setSignOutModalOpen(false)}
        onConfirm={handleConfirmSignOut}
        title="Sign Out of Staff Portal"
        message={`Are you sure you want to end your current administrative session (${userEmail})? You will be signed out and redirected to the login screen.`}
        confirmLabel="Yes, Sign Out"
        cancelLabel="Stay Signed In"
        variant="signout"
        loading={signingOut}
      />
    </div>
  );
}
