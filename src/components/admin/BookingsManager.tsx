"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Clock,
  CreditCard,
  X,
  Scissors,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  User,
  MessageCircle,
  ExternalLink,
  Tag,
  Copy,
  Check,
  Eye,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/labels";
import { ConfirmDialogModal } from "@/components/admin/ConfirmDialogModal";
import type { Booking, DressCustomization, BookingStatus, PaymentStatus } from "@/lib/types";

interface BookingsManagerProps {
  initialBookings: any[];
}

export function BookingsManager({ initialBookings = [] }: BookingsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<any[]>(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const [transitionNote, setTransitionNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Cancel order modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Helper to extract customization details from JSON or formatted string
  const getCustomization = (b: any): DressCustomization | null => {
    if (b.customization && typeof b.customization === "object" && Object.keys(b.customization).length > 0) {
      return b.customization as DressCustomization;
    }
    if (typeof b.notes === "string" && b.notes.includes("Custom Sizing")) {
      const match = b.notes.match(/Bust\s*([\d.]+)"?,\s*Waist\s*([\d.]+)"?,\s*Hips\s*([\d.]+)"?/i);
      if (match) {
        return {
          custom_type: "custom_fit",
          bust_inches: match[1],
          waist_inches: match[2],
          hips_inches: match[3],
        };
      }
    }
    return null;
  };

  const getProductImage = (b: any): string | null => {
    const images = b.product?.product_images;
    if (Array.isArray(images) && images.length > 0) {
      return images.find((i: any) => i.is_primary)?.url || images[0].url;
    }
    return null;
  };

  const getCategory = (b: any): string => {
    if (b.order_type) return b.order_type;
    if (b.product?.category) return b.product.category;
    return "dress";
  };

  const getCleanPhone = (phone?: string | null) => {
    if (!phone) return "";
    return phone.replace(/[^0-9]/g, "");
  };

  const copyToClipboard = (text: string, fieldName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Status counters
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const inTailoringCount = bookings.filter((b) => b.status === "picked_up").length;
  const shippedCount = bookings.filter((b) => b.status === "returned").length;
  const deliveredCount = bookings.filter((b) => b.status === "completed").length;
  const pendingCount = bookings.filter((b) => b.status === "pending_payment" || b.status === "requested").length;

  // Filter bookings client side
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "pending"
        ? b.status === "pending_payment" || b.status === "requested"
        : b.status === statusFilter;

    const cat = getCategory(b);
    const matchesCategory =
      categoryFilter === "all"
        ? true
        : categoryFilter === "dress"
        ? cat === "dress"
        : cat === "ornament" || cat === "ornaments";

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.reference?.toLowerCase().includes(q) ||
      b.customer_name?.toLowerCase().includes(q) ||
      b.customer_phone?.toLowerCase().includes(q) ||
      b.customer_email?.toLowerCase().includes(q) ||
      b.product_name?.toLowerCase().includes(q) ||
      (b.notes && b.notes.toLowerCase().includes(q));

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedBooking) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: selectedBooking.id,
          status: newStatus,
          note: transitionNote,
        }),
      });

      if (res.ok) {
        const updated = {
          ...selectedBooking,
          status: newStatus as any,
          admin_notes: transitionNote || selectedBooking.admin_notes,
        };
        setBookings(bookings.map((b) => (b.id === selectedBooking.id ? updated : b)));
        setSelectedBooking(updated);
        setTransitionNote("");
        setCancelModalOpen(false);
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 01. Refined Header & Metric Chips */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-5 border-b border-[#E8DDD1] gap-4">
        <div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Store Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
            Orders
          </h1>
          <p className="text-xs text-[#7A6A5F] mt-1">
            Track client purchases, custom dress tailoring dimensions, Razorpay transactions, and courier delivery fulfillment.
          </p>
        </div>

        {/* Quick status counters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm text-xs text-[#2B211C] shadow-2xs">
            <span className="text-[#7A6A5F]">Total:</span>
            <strong className="font-semibold">{totalCount}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-sm text-xs text-emerald-900 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Confirmed:</span>
            <strong className="font-semibold">{confirmedCount}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/80 border border-amber-200/80 rounded-sm text-xs text-amber-900 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B06F5E]" />
            <span>In Tailoring:</span>
            <strong className="font-semibold">{inTailoringCount}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/80 border border-blue-200/80 rounded-sm text-xs text-blue-900 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Shipped:</span>
            <strong className="font-semibold">{shippedCount}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-sm text-xs text-stone-800 shadow-2xs">
            <span>Delivered:</span>
            <strong className="font-semibold">{deliveredCount}</strong>
          </div>
        </div>
      </div>

      {/* 02. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="flex items-center bg-[#FFFDF9] border border-[#E8DDD1] focus-within:border-[#B06F5E] focus-within:ring-1 focus-within:ring-[#B06F5E] rounded-sm px-3.5 py-2 shadow-2xs transition-all">
              <Search className="w-4 h-4 text-[#7A6A5F] mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order ref, client name, phone, item, or measurements..."
                className="w-full text-xs bg-transparent focus:outline-hidden text-[#2B211C] placeholder:text-[#7A6A5F]/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[#7A6A5F] hover:text-[#2B211C] p-0.5 ml-1"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm px-3 py-2 text-[#2B211C] focus:outline-none focus:border-[#B06F5E] shadow-2xs shrink-0"
          >
            <option value="all">All Categories</option>
            <option value="dress">Dresses Only</option>
            <option value="ornament">Ornaments Only</option>
          </select>
        </div>

        {/* Filter Segmented Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          {[
            { id: "all", label: "All Orders", count: totalCount },
            { id: "confirmed", label: "Confirmed", count: confirmedCount },
            { id: "picked_up", label: "In Tailoring", count: inTailoringCount },
            { id: "returned", label: "Shipped", count: shippedCount },
            { id: "completed", label: "Delivered", count: deliveredCount },
            { id: "pending", label: "Pending", count: pendingCount },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all whitespace-nowrap shadow-2xs ${
                  isSelected
                    ? "bg-[#2B211C] text-[#FAF6F0]"
                    : "bg-[#FFFDF9] text-[#7A6A5F] border border-[#E8DDD1] hover:bg-[#FAF6F0] hover:text-[#2B211C]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-[#FAF6F0]/20 text-[#FAF6F0]"
                      : "bg-[#FAF6F0] text-[#7A6A5F] border border-[#E8DDD1]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 03. Orders Table View */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm shadow-xs overflow-hidden">
        {filteredBookings.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F0] text-[#7A6A5F] uppercase tracking-wider font-sans border-b border-[#E8DDD1]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Order Ref</th>
                    <th className="py-3 px-4 font-semibold">Client &amp; Shipping</th>
                    <th className="py-3 px-4 font-semibold">Purchased Item</th>
                    <th className="py-3 px-4 font-semibold">Fit / Customization</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Payment</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDD1] text-[#2B211C]">
                  {filteredBookings.map((b) => {
                    const cat = getCategory(b);
                    const isOrnament = cat === "ornament" || cat === "ornaments";
                    const custom = getCustomization(b);
                    const img = getProductImage(b);
                    const paymentLabel = PAYMENT_STATUS_LABEL[b.payment_status as PaymentStatus] || b.payment_status;
                    const statusLabel = BOOKING_STATUS_LABEL[b.status as BookingStatus] || b.status;

                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className="hover:bg-[#FAF6F0]/70 cursor-pointer transition-colors group"
                      >
                        {/* Order Ref */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-semibold text-[#B06F5E] group-hover:underline block">
                            {b.reference}
                          </span>
                          <span className="text-[10px] text-[#7A6A5F]">
                            {formatDate(b.created_at)}
                          </span>
                        </td>

                        {/* Client & Shipping */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-xs text-[#2B211C] block">
                            {b.customer_name}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-[#7A6A5F] mt-0.5">
                            <span className="font-mono">{b.customer_phone}</span>
                            {b.customer_phone && (
                              <a
                                href={`https://wa.me/${getCleanPhone(b.customer_phone)}?text=Hello%20${encodeURIComponent(
                                  b.customer_name
                                )},%20regarding%20your%20Haya%20order%20${b.reference}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-0.5"
                              >
                                <MessageCircle className="w-2.5 h-2.5" /> WhatsApp
                              </a>
                            )}
                          </div>
                          {b.customer_address && (
                            <span className="text-[10px] text-[#7A6A5F]/80 block max-w-xs truncate mt-0.5">
                              {b.customer_address}
                            </span>
                          )}
                        </td>

                        {/* Item & Category */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {img ? (
                              <div className="relative aspect-[3/4] w-9 rounded-xs overflow-hidden bg-[#F4ECE1] border border-[#E8DDD1] shrink-0">
                                <Image src={img} alt="" fill className="object-cover" sizes="36px" />
                              </div>
                            ) : (
                              <div className="w-9 h-11 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] flex items-center justify-center shrink-0 text-[#B06F5E]">
                                <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-serif text-xs font-medium block text-[#2B211C] group-hover:text-[#B06F5E] transition-colors truncate max-w-[170px]">
                                {b.product_name}
                              </span>
                              <span className="text-[9px] uppercase font-semibold text-[#B06F5E] bg-[#FAF6F0] px-1.5 py-0.2 rounded-xs border border-[#E8DDD1]/80 inline-block mt-0.5">
                                {isOrnament ? "Fine Ornament" : "Bridal Dress"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Fit / Customization */}
                        <td className="py-3 px-4">
                          {custom ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-xs bg-amber-50 text-amber-800 border border-amber-200">
                                Custom Tailoring
                              </span>
                              <span className="text-[11px] text-[#7A6A5F] block font-mono">
                                Bust: {custom.bust_inches || "—"}&quot; • W: {custom.waist_inches || "—"}&quot; • H: {custom.hips_inches || "—"}&quot;
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-medium text-xs block">{b.size || "Standard"}</span>
                              {b.color && <span className="text-[10px] text-[#7A6A5F]">{b.color}</span>}
                            </div>
                          )}
                        </td>

                        {/* Total Paid */}
                        <td className="py-3 px-4 font-sans font-semibold text-xs whitespace-nowrap">
                          {formatINR(b.total_paise)}
                        </td>

                        {/* Razorpay Payment Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase tracking-wider ${
                              b.payment_status === "paid"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {paymentLabel}
                          </span>
                        </td>

                        {/* Order Pipeline Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[11px] font-medium ${
                              b.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                : b.status === "picked_up"
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : b.status === "returned"
                                ? "bg-blue-100 text-blue-900 border border-blue-200"
                                : b.status === "completed"
                                ? "bg-stone-100 text-stone-900 border border-stone-200"
                                : "bg-[#F4ECE1] text-[#2B211C]"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(b);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2B211C] bg-[#FAF6F0] hover:bg-[#E8DDD1] border border-[#E8DDD1] rounded-xs transition-colors"
                          >
                            <Eye className="w-3 h-3 text-[#B06F5E]" />
                            <span>Manage Order</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (screens < md) */}
            <div className="md:hidden divide-y divide-[#E8DDD1]">
              {filteredBookings.map((b) => {
                const cat = getCategory(b);
                const isOrnament = cat === "ornament" || cat === "ornaments";
                const custom = getCustomization(b);
                const img = getProductImage(b);
                const paymentLabel = PAYMENT_STATUS_LABEL[b.payment_status as PaymentStatus] || b.payment_status;
                const statusLabel = BOOKING_STATUS_LABEL[b.status as BookingStatus] || b.status;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="p-4 space-y-3 hover:bg-[#FAF6F0]/60 active:bg-[#FAF6F0] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[#B06F5E] text-xs">
                          {b.reference}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-sans uppercase font-semibold bg-[#FAF6F0] border border-[#E8DDD1] text-[#7A6A5F]">
                          {isOrnament ? "Ornament" : "Dress"}
                        </span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded-xs text-[9px] font-semibold uppercase tracking-wider ${
                          b.payment_status === "paid"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {paymentLabel}
                      </span>
                    </div>

                    <div className="flex gap-3 items-start">
                      {img && (
                        <div className="relative aspect-[3/4] w-12 rounded-xs overflow-hidden bg-[#F4ECE1] border border-[#E8DDD1] shrink-0">
                          <Image src={img} alt="" fill className="object-cover" sizes="48px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-sm font-medium text-[#2B211C] truncate">
                          {b.product_name}
                        </h3>
                        <p className="text-[11px] text-[#7A6A5F] mt-0.5">
                          Client: <span className="font-medium text-[#2B211C]">{b.customer_name}</span>
                        </p>
                        <div className="text-[11px] text-[#7A6A5F] flex items-center gap-1 mt-0.5">
                          {custom ? (
                            <span className="text-[#B06F5E] font-medium">
                              Custom Fit ({custom.bust_inches}&quot; • {custom.waist_inches}&quot;)
                            </span>
                          ) : (
                            <span>Size: {b.size || "Standard"}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E8DDD1]/60 text-xs">
                      <span className="text-[11px] text-[#7A6A5F]">
                        {formatDate(b.created_at)}
                      </span>
                      <span className="font-sans font-semibold text-[#2B211C]">
                        {formatINR(b.total_paise)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF6F0] text-[#7A6A5F] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6 stroke-[1.4]" />
            </div>
            <h3 className="font-serif text-lg text-[#2B211C]">No Orders Found</h3>
            <p className="text-xs text-[#7A6A5F] max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? `No orders matched your search "${searchQuery}". Try clearing the search query.`
                : "There are currently no orders under this status filter."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-4 py-1.5 bg-[#2B211C] text-white text-xs font-medium rounded-sm hover:bg-[#B06F5E] transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* 04. Detailed Order Inspection Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedBooking(null)}
            aria-hidden="true"
          />

          <div className="relative bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm shadow-2xl max-w-3xl w-full p-6 sm:p-8 z-10 max-h-[92vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E8DDD1]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-[#B06F5E]">
                    {selectedBooking.reference}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#FAF6F0] border border-[#E8DDD1] uppercase font-semibold text-[#7A6A5F]">
                    {getCategory(selectedBooking) === "dress" ? "Bespoke Dress Order" : "Fine Ornament Order"}
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-[#2B211C]">
                  {selectedBooking.product_name}
                </h3>
                <p className="text-xs text-[#7A6A5F] mt-0.5">
                  Ordered on {formatDate(selectedBooking.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#FAF6F0] rounded-sm transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid 2 Columns: Item & Customization | Client Shipping & Razorpay */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Product & Customization Details */}
              <div className="p-4 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] space-y-3 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E8DDD1] font-semibold uppercase text-[10px] text-[#B06F5E]">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Item &amp; Customization Specifications</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#7A6A5F]">Product Name:</span>
                    <strong className="text-[#2B211C] font-serif">{selectedBooking.product_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A6A5F]">Category:</span>
                    <span className="font-medium capitalize">{getCategory(selectedBooking)}</span>
                  </div>
                  {selectedBooking.color && (
                    <div className="flex justify-between">
                      <span className="text-[#7A6A5F]">Color:</span>
                      <span className="font-medium text-[#2B211C]">{selectedBooking.color}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#7A6A5F]">Size Choice:</span>
                    <span className="font-medium text-[#2B211C]">{selectedBooking.size || "Standard"}</span>
                  </div>
                </div>

                {/* If Dress has Custom Measurements */}
                {(() => {
                  const custom = getCustomization(selectedBooking);
                  if (!custom) return null;
                  return (
                    <div className="mt-3 p-3 bg-white rounded-xs border border-amber-200 space-y-2">
                      <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-amber-900 block">
                        Bespoke Tailoring Measurements:
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                        <div className="bg-[#FAF6F0] p-1.5 rounded-xs text-center border border-[#E8DDD1]/60">
                          <span className="text-[9px] text-[#7A6A5F] block uppercase">Bust</span>
                          <span className="font-bold text-[#2B211C]">{custom.bust_inches || "—"}&quot;</span>
                        </div>
                        <div className="bg-[#FAF6F0] p-1.5 rounded-xs text-center border border-[#E8DDD1]/60">
                          <span className="text-[9px] text-[#7A6A5F] block uppercase">Waist</span>
                          <span className="font-bold text-[#2B211C]">{custom.waist_inches || "—"}&quot;</span>
                        </div>
                        <div className="bg-[#FAF6F0] p-1.5 rounded-xs text-center border border-[#E8DDD1]/60">
                          <span className="text-[9px] text-[#7A6A5F] block uppercase">Hips</span>
                          <span className="font-bold text-[#2B211C]">{custom.hips_inches || "—"}&quot;</span>
                        </div>
                        <div className="bg-[#FAF6F0] p-1.5 rounded-xs text-center border border-[#E8DDD1]/60">
                          <span className="text-[9px] text-[#7A6A5F] block uppercase">Shoulder</span>
                          <span className="font-bold text-[#2B211C]">{custom.shoulder_inches || "—"}&quot;</span>
                        </div>
                        <div className="bg-[#FAF6F0] p-1.5 rounded-xs text-center border border-[#E8DDD1]/60">
                          <span className="text-[9px] text-[#7A6A5F] block uppercase">Length</span>
                          <span className="font-bold text-[#2B211C]">{custom.length_inches || "—"}&quot;</span>
                        </div>
                      </div>
                      {custom.custom_notes && (
                        <div className="pt-1 text-[11px] text-[#7A6A5F]">
                          <span className="font-medium text-[#2B211C] block">Client Tailoring Notes:</span>
                          <p className="italic bg-[#FAF6F0] p-2 rounded-xs mt-0.5 border border-[#E8DDD1]/60">{custom.custom_notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {selectedBooking.notes && (
                  <div className="pt-2 border-t border-[#E8DDD1] text-[11px]">
                    <span className="text-[#7A6A5F] font-medium block">Order Notes:</span>
                    <p className="mt-0.5 text-[#2B211C]">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Customer Shipping & Razorpay Payment */}
              <div className="space-y-4">
                {/* Customer Contact & Address */}
                <div className="p-4 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E8DDD1] font-semibold uppercase text-[10px] text-[#B06F5E]">
                    <MapPin className="w-4 h-4" />
                    <span>Customer &amp; Shipping Details</span>
                  </div>

                  <div>
                    <span className="text-[#7A6A5F] text-[10px] uppercase block">Client Name</span>
                    <span className="font-medium text-[#2B211C] text-sm">{selectedBooking.customer_name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[#7A6A5F] text-[10px] uppercase block">Phone</span>
                      <a href={`tel:${selectedBooking.customer_phone}`} className="text-[#B06F5E] hover:underline font-mono">
                        {selectedBooking.customer_phone}
                      </a>
                    </div>
                    <div>
                      <span className="text-[#7A6A5F] text-[10px] uppercase block">Email Address</span>
                      <a href={`mailto:${selectedBooking.customer_email}`} className="text-[#7A6A5F] hover:underline truncate block">
                        {selectedBooking.customer_email}
                      </a>
                    </div>
                  </div>

                  {selectedBooking.customer_phone && (
                    <div className="pt-1">
                      <a
                        href={`https://wa.me/${getCleanPhone(selectedBooking.customer_phone)}?text=Hello%20${encodeURIComponent(
                          selectedBooking.customer_name
                        )},%20regarding%20your%20Haya%20order%20${selectedBooking.reference}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs text-xs font-medium transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    </div>
                  )}

                  <div className="pt-1">
                    <span className="text-[#7A6A5F] text-[10px] uppercase block">Delivery Shipping Address</span>
                    <p className="text-[#2B211C] mt-0.5 bg-white p-2.5 rounded-xs border border-[#E8DDD1] leading-relaxed">
                      {selectedBooking.customer_address || "No delivery address provided."}
                    </p>
                  </div>
                </div>

                {/* Razorpay Payment Information */}
                <div className="p-4 bg-white rounded-xs border border-[#E8DDD1] space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8DDD1]">
                    <div className="flex items-center gap-2 font-semibold uppercase text-[10px] text-[#B06F5E]">
                      <CreditCard className="w-4 h-4" />
                      <span>Razorpay Online Payment</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded-xs text-[9px] font-semibold uppercase tracking-wider ${
                        selectedBooking.payment_status === "paid"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {PAYMENT_STATUS_LABEL[selectedBooking.payment_status as PaymentStatus] || selectedBooking.payment_status}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-[#E8DDD1]/80 text-xs">
                    <div className="flex justify-between text-[#7A6A5F]">
                      <span>Item Amount:</span>
                      <span className="font-medium text-[#2B211C]">
                        {formatINR(selectedBooking.rental_amount_paise || (selectedBooking.total_paise - (selectedBooking.fees_paise || 0)))}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#7A6A5F]">
                      <span>Shipping Charge:</span>
                      <span className="font-medium text-[#2B211C]">
                        {formatINR(selectedBooking.fees_paise || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#7A6A5F]">
                      <span>GST / Taxes:</span>
                      <span className="font-medium text-emerald-700">₹0 (Zero GST)</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-[#E8DDD1]">
                    <span className="text-[#2B211C] font-semibold">Total Paid:</span>
                    <span className="font-bold text-base text-[#B06F5E] font-sans">
                      {formatINR(selectedBooking.total_paise)}
                    </span>
                  </div>

                  {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                    <div className="pt-2 border-t border-[#E8DDD1] space-y-1 text-[11px] text-[#7A6A5F]">
                      <div className="flex justify-between">
                        <span>Razorpay Order ID:</span>
                        <code className="text-[#2B211C] font-mono">{selectedBooking.payments[0].razorpay_order_id}</code>
                      </div>
                      {selectedBooking.payments[0].razorpay_payment_id && (
                        <div className="flex justify-between">
                          <span>Razorpay Payment ID:</span>
                          <code className="text-[#2B211C] font-mono">{selectedBooking.payments[0].razorpay_payment_id}</code>
                        </div>
                      )}
                      {selectedBooking.payments[0].method && (
                        <div className="flex justify-between">
                          <span>Payment Method:</span>
                          <span className="capitalize font-medium text-[#2B211C]">{selectedBooking.payments[0].method}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Lifecycle Status Actions */}
            <div className="space-y-3 pt-4 border-t border-[#E8DDD1]">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-base text-[#2B211C]">
                  Update Order Pipeline Status
                </h4>
                <span className="text-xs text-[#7A6A5F]">
                  Current Status: <strong className="text-[#2B211C]">{BOOKING_STATUS_LABEL[selectedBooking.status as BookingStatus] || selectedBooking.status}</strong>
                </span>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                  Optional Status Transition Note (e.g. Courier Tracking Number or Tailoring Update)
                </label>
                <input
                  type="text"
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                  placeholder="e.g. Dispatched via BlueDart courier tracking #12345..."
                  className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={updating || selectedBooking.status === "confirmed"}
                  onClick={() => handleUpdateStatus("confirmed")}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs text-xs font-medium transition-colors disabled:opacity-40"
                >
                  Payment Received / Confirmed
                </button>

                <button
                  type="button"
                  disabled={updating || selectedBooking.status === "picked_up"}
                  onClick={() => handleUpdateStatus("picked_up")}
                  className="px-3.5 py-2 bg-[#B06F5E] hover:bg-[#975D4E] text-white rounded-xs text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>In Production / Tailoring</span>
                </button>

                <button
                  type="button"
                  disabled={updating || selectedBooking.status === "returned"}
                  onClick={() => handleUpdateStatus("returned")}
                  className="px-3.5 py-2 bg-[#2B211C] hover:bg-black text-white rounded-xs text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Shipped / In Transit</span>
                </button>

                <button
                  type="button"
                  disabled={updating || selectedBooking.status === "completed"}
                  onClick={() => handleUpdateStatus("completed")}
                  className="px-3.5 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-xs text-xs font-medium transition-colors disabled:opacity-40"
                >
                  Delivered / Fulfilled
                </button>

                <button
                  type="button"
                  disabled={updating || selectedBooking.status === "cancelled"}
                  onClick={() => setCancelModalOpen(true)}
                  className="px-3.5 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-xs text-xs font-medium transition-colors disabled:opacity-40 ml-auto"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => handleUpdateStatus("cancelled")}
        title="Cancel Order"
        message={
          selectedBooking
            ? `Are you sure you want to cancel order ${selectedBooking.reference} for ${selectedBooking.customer_name}?`
            : "Are you sure you want to cancel this order?"
        }
        confirmLabel="Yes, Cancel Order"
        cancelLabel="Keep Order"
        variant="danger"
        loading={updating}
      />
    </div>
  );
}
