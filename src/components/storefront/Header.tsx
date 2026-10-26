"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Heart,
  User,
  ShoppingBag,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import { HayaLogo } from "@/components/brand/HayaLogo";

interface HeaderProps {
  customLogoUrl?: string | null;
  userEmail?: string | null;
  wishlistCount?: number;
}

export function Header({
  customLogoUrl,
  userEmail,
  wishlistCount = 0,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/collections?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Collections", href: "/collections" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E8DDD1] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-[#2B211C] hover:text-[#B06F5E] focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
            </button>
          </div>

          {/* Logo (Left on desktop, Centered on mobile) */}
          <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
            <HayaLogo
              size="md"
              variant="dark"
              customLogoUrl={customLogoUrl}
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 ml-8">
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm tracking-wide transition-colors font-sans py-1 relative ${
                    active
                      ? "text-[#2B211C] font-medium after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1.5px] after:bg-[#B06F5E]"
                      : "text-[#7A6A5F] hover:text-[#2B211C]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            {/* Desktop Outfit Search Bar matching reference */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center relative w-56 lg:w-64"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for outfits..."
                className="w-full pl-4 pr-9 py-2 text-xs bg-transparent border border-[#E8DDD1] rounded-full text-[#2B211C] placeholder-[#7A6A5F]/70 focus:outline-none focus:border-[#B06F5E] focus:ring-1 focus:ring-[#B06F5E] transition-all"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-3 text-[#7A6A5F] hover:text-[#2B211C]"
              >
                <Search className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </form>

            {/* Mobile Search Icon */}
            <button
              type="button"
              onClick={() => {
                setSearchOpen(!searchOpen);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="md:hidden p-1.5 text-[#2B211C] hover:text-[#B06F5E]"
              aria-label="Search outfits"
            >
              <Search className="w-5 h-5 stroke-[1.5]" />
            </button>

            {/* Wishlist */}
            <Link
              href="/account/wishlist"
              className="p-1.5 text-[#2B211C] hover:text-[#B06F5E] relative transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 stroke-[1.5]" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-[#B06F5E] text-white text-[9px] font-semibold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link
              href={userEmail ? "/account" : "/login"}
              className="p-1.5 text-[#2B211C] hover:text-[#B06F5E] transition-colors"
              aria-label={userEmail ? "My Account" : "Sign In"}
              title={userEmail ? `Signed in as ${userEmail}` : "Sign In"}
            >
              <User className="w-5 h-5 stroke-[1.5]" />
            </Link>

            {/* Bag / Bookings */}
            <Link
              href="/account/bookings"
              className="p-1.5 text-[#2B211C] hover:text-[#B06F5E] transition-colors relative"
              aria-label="My Bookings"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
            </Link>

            {/* "Book Consultation" Button in muted terracotta */}
            <Link
              href="/consultation"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide rounded-sm shadow-sm transition-all hover:shadow focus:outline-none"
            >
              Book Consultation
            </Link>
          </div>
        </div>

        {/* Mobile Search Input Drawer (expandable) */}
        {searchOpen && (
          <div className="md:hidden py-3 border-t border-[#E8DDD1] animate-in fade-in slide-in-from-top-1">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bridal lehengas, gowns, couture..."
                className="w-full pl-4 pr-10 py-2.5 text-xs bg-white border border-[#E8DDD1] rounded-full text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
              <button
                type="submit"
                className="absolute right-3 p-1 text-[#7A6A5F]"
                aria-label="Execute search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Slide-out Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#FAF6F0] p-6 shadow-2xl flex flex-col justify-between border-r border-[#E8DDD1] z-50">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#E8DDD1]">
                <HayaLogo size="sm" variant="dark" customLogoUrl={customLogoUrl} />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-[#7A6A5F] hover:text-[#2B211C]"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6 stroke-[1.5]" />
                </button>
              </div>

              {/* Navigation links */}
              <div className="mt-6 flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-base font-serif text-[#2B211C] hover:text-[#B06F5E] transition-colors py-1"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-[#E8DDD1] flex flex-col space-y-3 text-xs text-[#7A6A5F]">
                <Link href="/account" className="flex items-center gap-2 hover:text-[#2B211C]">
                  <User className="w-4 h-4" />
                  <span>{userEmail ? "My Account" : "Sign In / Register"}</span>
                </Link>
                <Link href="/account/bookings" className="flex items-center gap-2 hover:text-[#2B211C]">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Rental Bookings</span>
                </Link>
                <Link href="/account/wishlist" className="flex items-center gap-2 hover:text-[#2B211C]">
                  <Heart className="w-4 h-4" />
                  <span>Wishlist</span>
                </Link>
                <Link href="/admin" className="flex items-center gap-2 hover:text-[#2B211C] pt-2 text-[#B06F5E]">
                  <span>Admin Portal</span>
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E8DDD1]">
              <Link
                href="/consultation"
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#B06F5E] text-white text-xs font-medium tracking-wide rounded-sm shadow-sm hover:bg-[#975D4E]"
              >
                <Calendar className="w-4 h-4" />
                Book Consultation
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
