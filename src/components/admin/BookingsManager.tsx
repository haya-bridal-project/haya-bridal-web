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
  AlertTriangle,
  AlertCircle,
  Printer,
  FileText,
  CheckSquare,
  Square,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/labels";
import { ConfirmDialogModal } from "@/components/admin/ConfirmDialogModal";
import { OrderInvoiceModal } from "@/components/admin/OrderInvoiceModal";
import type { Booking, DressCustomization, BookingStatus, Payment, SiteSettings } from "@/lib/types";

export type AdminOrder = Booking & {
  payments?: Payment[];
  product?: {
    id: string;
    name: string;
    category?: string | null;
    product_images?: { url: string; is_primary: boolean }[];
  } | null;
};

interface BookingsManagerProps {
  initialBookings: AdminOrder[];
  siteSettings?: Partial<SiteSettings>;
}

export function BookingsManager({ initialBookings = [], siteSettings }: BookingsManagerProps) {
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<AdminOrder[]>(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<AdminOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const [transitionNote, setTransitionNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Multi-select for batch actions (e.g. printing invoices)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Invoice modal state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceOrders, setInvoiceOrders] = useState<AdminOrder[]>([]);

  // Order status update confirmation modal
  const [statusToConfirm, setStatusToConfirm] = useState<BookingStatus | null>(null);

  const getStatusConfirmationConfig = (status: BookingStatus | null) => {
    if (!status || !selectedBooking) {
      return {
        title: "Update Order Status",
        message: "Are you sure you want to update this order's status?",
        confirmLabel: "Update Status",
        cancelLabel: "Cancel",
        variant: "warning" as const,
      };
    }

    const ref = selectedBooking.reference;
    const client = selectedBooking.customer_name;
    const email = selectedBooking.customer_email || "the customer";
    const noteText = transitionNote.trim() ? ` with note: "${transitionNote.trim()}"` : "";

    switch (status) {
      case "confirmed":
        return {
          title: "Confirm Order & Payment",
          message: `Are you sure you want to mark order ${ref} for ${client} as Paid & Confirmed? A confirmation email will be sent to ${email}.`,
          confirmLabel: "Yes, Confirm Order",
          cancelLabel: "Cancel",
          variant: "success" as const,
        };
      case "returned": // Shipped / In Transit
        return {
          title: "Mark Order as Shipped",
          message: `Are you sure you want to update order ${ref} to Shipped / In Transit${noteText}? A dispatch notification email with tracking details will be sent to ${email}.`,
          confirmLabel: "Yes, Mark as Shipped",
          cancelLabel: "Cancel",
          variant: "info" as const,
        };
      case "completed": // Delivered / Fulfilled
        return {
          title: "Mark Order as Delivered",
          message: `Are you sure you want to mark order ${ref} as Delivered & Fulfilled${noteText}? An official delivery confirmation email will be sent to ${email}.`,
          confirmLabel: "Yes, Mark as Delivered",
          cancelLabel: "Cancel",
          variant: "success" as const,
        };
      case "cancelled":
        return {
          title: "Cancel Order",
          message: `Are you sure you want to cancel order ${ref} for ${client}${noteText}? This action will record the cancellation and update the order history.`,
          confirmLabel: "Yes, Cancel Order",
          cancelLabel: "Keep Order",
          variant: "danger" as const,
        };
      default:
        return {
          title: "Update Order Status",
          message: `Are you sure you want to update order ${ref} to ${status}?`,
          confirmLabel: "Yes, Update Status",
          cancelLabel: "Cancel",
          variant: "warning" as const,
        };
    }
  };

  // Extract payment analysis for an order
  const getPaymentInfo = (b: AdminOrder) => {
    const isPaid =
      b.payment_status === "paid" ||
      (Array.isArray(b.payments) && b.payments.some((p) => p.status === "captured"));

    const failedPayment = Array.isArray(b.payments)
      ? b.payments.find((p) => p.status === "failed")
      : null;

    const isFailed =
      !isPaid && (b.payment_status === "failed" || Boolean(failedPayment));

    const isRefunded =
      b.payment_status === "refunded" ||
      (Array.isArray(b.payments) && b.payments.some((p) => p.status === "refunded"));

    const isAwaiting = !isPaid && !isFailed && !isRefunded;

    let failureReason = failedPayment?.error_description || failedPayment?.error_code || null;
    if (!failureReason && b.admin_notes && b.admin_notes.includes("Payment Failed:")) {
      const lines = b.admin_notes.split("\n");
      const failureLine = lines.reverse().find((l: string) => l.includes("Payment Failed:"));
      if (failureLine) failureReason = failureLine;
    }

    const latestPayment = Array.isArray(b.payments) && b.payments.length > 0 ? b.payments[0] : null;

    return {
      isPaid,
      isFailed,
      isAwaiting,
      isRefunded,
      failureReason,
      latestPayment,
    };
  };

  // Effective status: if paid and pending, it's confirmed
  const getEffectiveStatus = (b: AdminOrder): string => {
    const pay = getPaymentInfo(b);
    if (pay.isPaid && (b.status === "pending_payment" || b.status === "requested")) {
      return "confirmed";
    }
    return b.status;
  };

  // Helper to extract customization details from JSON or formatted string
  const getCustomization = (b: AdminOrder): DressCustomization | null => {
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

  const getProductImage = (b: AdminOrder): string | null => {
    const images = b.product?.product_images;
    if (Array.isArray(images) && images.length > 0) {
      return images.find((i) => i.is_primary)?.url || images[0].url;
    }
    return null;
  };

  const getCategory = (b: AdminOrder): string => {
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

  // Status & payment counters
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => getEffectiveStatus(b) === "confirmed").length;
  const shippedCount = bookings.filter((b) => b.status === "returned").length;
  const deliveredCount = bookings.filter((b) => b.status === "completed").length;
  const awaitingPaymentCount = bookings.filter((b) => getPaymentInfo(b).isAwaiting).length;
  const paymentFailedCount = bookings.filter((b) => getPaymentInfo(b).isFailed).length;

  // Filter bookings client side
  const filteredBookings = bookings.filter((b) => {
    const pay = getPaymentInfo(b);
    const effStatus = getEffectiveStatus(b);

    let matchesStatus = true;
    if (statusFilter === "confirmed") {
      matchesStatus = effStatus === "confirmed";
    } else if (statusFilter === "picked_up") {
      matchesStatus = b.status === "picked_up";
    } else if (statusFilter === "returned") {
      matchesStatus = b.status === "returned";
    } else if (statusFilter === "completed") {
      matchesStatus = b.status === "completed";
    } else if (statusFilter === "awaiting_payment") {
      matchesStatus = pay.isAwaiting;
    } else if (statusFilter === "payment_failed") {
      matchesStatus = pay.isFailed;
    }

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
      (b.notes && b.notes.toLowerCase().includes(q)) ||
      (pay.latestPayment?.razorpay_payment_id && pay.latestPayment.razorpay_payment_id.toLowerCase().includes(q)) ||
      (pay.latestPayment?.razorpay_order_id && pay.latestPayment.razorpay_order_id.toLowerCase().includes(q));

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Selection handlers
  const handleToggleSelectOne = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === filteredBookings.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredBookings.map((b) => b.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedOrderIds([]);
  };

  // Print handlers
  const handlePrintSingle = (order: AdminOrder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setInvoiceOrders([order]);
    setInvoiceModalOpen(true);
  };

  const handlePrintBulk = () => {
    const selected = bookings.filter((b) => selectedOrderIds.includes(b.id));
    if (selected.length === 0) return;
    setInvoiceOrders(selected);
    setInvoiceModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus: BookingStatus) => {
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
        const updated: AdminOrder = {
          ...selectedBooking,
          status: newStatus,
          ...(newStatus === "confirmed" ? { payment_status: "paid" as const } : {}),
          admin_notes: transitionNote || selectedBooking.admin_notes,
        };
        setBookings(bookings.map((b) => (b.id === selectedBooking.id ? updated : b)));
        setSelectedBooking(updated);
        setTransitionNote("");
        setStatusToConfirm(null);

        if (newStatus === "completed") {
          setStatusFeedback(
            `Order marked as Delivered. Delivery notification email sent to ${selectedBooking.customer_email || "customer"}.`
          );
        } else if (newStatus === "returned") {
          setStatusFeedback(
            `Order marked as Shipped. Dispatch notification email sent to ${selectedBooking.customer_email || "customer"}.`
          );
        } else if (newStatus === "confirmed") {
          setStatusFeedback(
            `Order marked as Confirmed. Confirmation email sent to ${selectedBooking.customer_email || "customer"}.`
          );
        }
        setTimeout(() => setStatusFeedback(null), 6000);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error || "Failed to update order status");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update order status");
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
            Orders &amp; Invoices
          </h1>
          <p suppressHydrationWarning className="text-xs text-[#7A6A5F] mt-1">
            Real-time tracking of orders, payment transactions, custom measurements, and official tax invoice generation.
          </p>
        </div>

        {/* Quick status counters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm text-xs text-[#2B211C] shadow-2xs">
            <span className="text-[#7A6A5F]">Total:</span>
            <strong className="font-semibold">{totalCount}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/90 border border-emerald-200 rounded-sm text-xs text-emerald-900 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Confirmed &amp; Paid:</span>
            <strong className="font-semibold">{confirmedCount}</strong>
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
          {paymentFailedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              <span>Failed:</span>
              <strong className="font-semibold">{paymentFailedCount}</strong>
            </div>
          )}
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
                placeholder="Search by ref, client, phone, item, or Cashfree ID..."
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
          {(
            [
              { id: "all", label: "All Orders", count: totalCount, isDanger: false },
              { id: "confirmed", label: "Paid & Confirmed", count: confirmedCount, isDanger: false },
              { id: "returned", label: "Shipped", count: shippedCount, isDanger: false },
              { id: "completed", label: "Delivered", count: deliveredCount, isDanger: false },
              { id: "awaiting_payment", label: "Awaiting Payment", count: awaitingPaymentCount, isDanger: false },
              ...(paymentFailedCount > 0
                ? [{ id: "payment_failed", label: "Payment Failed", count: paymentFailedCount, isDanger: true }]
                : []),
            ]
          ).map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all whitespace-nowrap shadow-2xs ${
                  isSelected
                    ? tab.isDanger
                      ? "bg-red-700 text-white"
                      : "bg-[#2B211C] text-[#FAF6F0]"
                    : tab.isDanger
                    ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                    : "bg-[#FFFDF9] text-[#7A6A5F] border border-[#E8DDD1] hover:bg-[#FAF6F0] hover:text-[#2B211C]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : tab.isDanger
                      ? "bg-red-100 text-red-800"
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

      {/* 02.5 Floating Bulk Action Bar (when orders selected) */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-[#2B211C] text-white px-4 py-3 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg border border-[#3E312A] animate-in slide-in-from-top-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-medium">
              {selectedOrderIds.length} of {filteredBookings.length} order{selectedOrderIds.length === 1 ? "" : "s"} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrintBulk}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white rounded-xs font-medium transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {selectedOrderIds.length} Invoices (Batch Print)</span>
            </button>

            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-stone-200 rounded-xs transition-colors"
            >
              {selectedOrderIds.length === filteredBookings.length ? "Deselect All" : `Select All (${filteredBookings.length})`}
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-2.5 py-1.5 text-stone-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 03. Orders Table View */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm shadow-xs overflow-hidden">
        {filteredBookings.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F0] text-[#7A6A5F] uppercase tracking-wider font-sans border-b border-[#E8DDD1]">
                  <tr>
                    {/* Checkbox Header */}
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredBookings.length > 0 && selectedOrderIds.length === filteredBookings.length}
                        onChange={handleToggleSelectAll}
                        className="rounded-xs border-[#E8DDD1] text-[#B06F5E] focus:ring-[#B06F5E] cursor-pointer"
                        title="Select All"
                      />
                    </th>
                    <th className="py-3 px-4 font-semibold">Order Ref</th>
                    <th className="py-3 px-4 font-semibold">Client &amp; Shipping</th>
                    <th className="py-3 px-4 font-semibold">Purchased Item</th>
                    <th className="py-3 px-4 font-semibold">Fit / Customization</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Payment Status</th>
                    <th className="py-3 px-4 font-semibold">Order Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDD1] text-[#2B211C]">
                  {filteredBookings.map((b) => {
                    const cat = getCategory(b);
                    const isOrnament = cat === "ornament" || cat === "ornaments";
                    const custom = getCustomization(b);
                    const img = getProductImage(b);
                    const pay = getPaymentInfo(b);
                    const effStatus = getEffectiveStatus(b);
                    const isSelected = selectedOrderIds.includes(b.id);

                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className={`hover:bg-[#FAF6F0]/70 cursor-pointer transition-colors group ${
                          isSelected ? "bg-amber-50/40" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(b.id)}
                            className="rounded-xs border-[#E8DDD1] text-[#B06F5E] focus:ring-[#B06F5E] cursor-pointer"
                          />
                        </td>

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

                        {/* Total Amount */}
                        <td className="py-3 px-4 font-sans font-semibold text-xs whitespace-nowrap">
                          {formatINR(b.total_paise)}
                        </td>

                        {/* Payment Status (Production Clarity) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {pay.isPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>PAID VIA CASHFREE</span>
                            </span>
                          ) : pay.isFailed ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10px] font-semibold uppercase tracking-wider bg-red-50 text-red-800 border border-red-300">
                                <XCircle className="w-3 h-3 text-red-600 shrink-0" />
                                <span>PAYMENT FAILED</span>
                              </span>
                              {pay.failureReason && (
                                <span className="block text-[10px] text-red-700/80 truncate max-w-[150px]" title={pay.failureReason}>
                                  {pay.failureReason}
                                </span>
                              )}
                            </div>
                          ) : pay.isRefunded ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10px] font-semibold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                              <RotateCcw className="w-3 h-3 text-purple-600 shrink-0" />
                              <span>REFUNDED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>AWAITING PAYMENT</span>
                            </span>
                          )}
                        </td>

                        {/* Order Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {effStatus === "confirmed" ? (
                            <span className="px-2.5 py-1 rounded-xs text-[11px] font-medium bg-emerald-100 text-emerald-900 border border-emerald-200 inline-block">
                              Confirmed
                            </span>
                          ) : effStatus === "picked_up" ? (
                            <span className="px-2.5 py-1 rounded-xs text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-200 inline-block">
                              In Tailoring
                            </span>
                          ) : effStatus === "returned" ? (
                            <span className="px-2.5 py-1 rounded-xs text-[11px] font-medium bg-blue-100 text-blue-900 border border-blue-200 inline-block">
                              Shipped
                            </span>
                          ) : effStatus === "completed" ? (
                            <span className="px-2.5 py-1 rounded-xs text-[11px] font-medium bg-stone-100 text-stone-900 border border-stone-200 inline-block">
                              Delivered
                            </span>
                          ) : effStatus === "cancelled" ? (
                            <span className="px-2.5 py-1 rounded-xs text-[11px] font-medium bg-red-100 text-red-900 border border-red-200 inline-block">
                              Cancelled
                            </span>
                          ) : pay.isFailed ? (
                            <span className="px-2.5 py-1 rounded-xs text-[11px] font-medium bg-red-50 text-red-800 border border-red-200 inline-block">
                              Payment Failed
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xs text-[11px] font-medium bg-[#FAF6F0] text-[#7A6A5F] border border-[#E8DDD1] inline-block">
                              Awaiting Payment
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Invoice Print Button */}
                            <button
                              type="button"
                              onClick={(e) => handlePrintSingle(b, e)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2B211C] bg-[#FAF6F0] hover:bg-[#E8DDD1] border border-[#E8DDD1] rounded-xs transition-colors"
                              title="Print Tax Invoice"
                            >
                              <Printer className="w-3 h-3 text-[#B06F5E]" />
                              <span>Invoice</span>
                            </button>

                            {/* Manage Order Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(b);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2B211C] bg-[#FAF6F0] hover:bg-[#E8DDD1] border border-[#E8DDD1] rounded-xs transition-colors"
                            >
                              <Eye className="w-3 h-3 text-[#B06F5E]" />
                              <span>Manage</span>
                            </button>
                          </div>
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
                const pay = getPaymentInfo(b);
                const isSelected = selectedOrderIds.includes(b.id);

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`p-4 space-y-3 hover:bg-[#FAF6F0]/60 active:bg-[#FAF6F0] transition-colors cursor-pointer ${
                      isSelected ? "bg-amber-50/40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelectOne(b.id);
                          }}
                          className="rounded-xs border-[#E8DDD1] text-[#B06F5E] focus:ring-[#B06F5E]"
                        />
                        <span className="font-mono font-semibold text-[#B06F5E] text-xs">
                          {b.reference}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-sans uppercase font-semibold bg-[#FAF6F0] border border-[#E8DDD1] text-[#7A6A5F]">
                          {isOrnament ? "Ornament" : "Dress"}
                        </span>
                      </div>
                      {pay.isPaid ? (
                        <span className="px-2 py-0.5 rounded-xs text-[9px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          PAID
                        </span>
                      ) : pay.isFailed ? (
                        <span className="px-2 py-0.5 rounded-xs text-[9px] font-semibold uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
                          FAILED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-xs text-[9px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                          UNPAID
                        </span>
                      )}
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
                      <div>
                        <span className="text-[11px] text-[#7A6A5F] block">
                          {formatDate(b.created_at)}
                        </span>
                        <span className="font-sans font-semibold text-[#2B211C]">
                          {formatINR(b.total_paise)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handlePrintSingle(b, e)}
                          className="px-2.5 py-1 text-xs font-medium text-[#2B211C] bg-[#FAF6F0] hover:bg-[#E8DDD1] border border-[#E8DDD1] rounded-xs inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-[#B06F5E]" />
                          <span>Invoice</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="px-2.5 py-1 text-xs font-medium text-[#2B211C] bg-[#FAF6F0] hover:bg-[#E8DDD1] border border-[#E8DDD1] rounded-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-[#B06F5E]" />
                          <span>Manage</span>
                        </button>
                      </div>
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
      {selectedBooking && (() => {
        const pay = getPaymentInfo(selectedBooking);
        const effStatus = getEffectiveStatus(selectedBooking);
        const custom = getCustomization(selectedBooking);

        return (
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

                <div className="flex items-center gap-2">
                  {/* Quick Print from Modal Header */}
                  <button
                    type="button"
                    onClick={() => handlePrintSingle(selectedBooking)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#E8DDD1] text-[#2B211C] border border-[#E8DDD1] rounded-xs text-xs font-medium transition-colors"
                    title="Print Tax Invoice"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#B06F5E]" />
                    <span>Print Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="p-1.5 text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#FAF6F0] rounded-sm transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Grid 2 Columns: Item & Customization | Client Shipping & Cashfree */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Product & Customization Details */}
                <div className="p-4 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] space-y-3 text-xs">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E8DDD1] font-semibold uppercase text-[10px] text-[#B06F5E]">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Item Specifications</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#7A6A5F]">Product:</span>
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
                  {custom && (
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
                  )}

                  {selectedBooking.notes && (
                    <div className="pt-2 border-t border-[#E8DDD1] text-[11px]">
                      <span className="text-[#7A6A5F] font-medium block">Order Notes:</span>
                      <p className="mt-0.5 text-[#2B211C]">{selectedBooking.notes}</p>
                    </div>
                  )}

                  {selectedBooking.admin_notes && (
                    <div className="pt-2 border-t border-[#E8DDD1] text-[11px] bg-white p-2.5 rounded-xs border border-stone-200">
                      <span className="text-[#7A6A5F] font-semibold block uppercase text-[10px]">System &amp; Admin Audit Notes:</span>
                      <p className="mt-1 text-[#2B211C] whitespace-pre-wrap font-mono text-[10px]">{selectedBooking.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Customer Shipping & Cashfree Payment */}
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

                  {/* Cashfree Online Payment Box */}
                  <div className="p-4 bg-white rounded-xs border border-[#E8DDD1] space-y-3 text-xs shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8DDD1]">
                      <div className="flex items-center gap-2 font-semibold uppercase text-[10px] text-[#B06F5E]">
                        <CreditCard className="w-4 h-4" />
                        <span>Cashfree Online Payment</span>
                      </div>
                      {pay.isPaid ? (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>PAID</span>
                        </span>
                      ) : pay.isFailed ? (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase tracking-wider bg-red-50 text-red-800 border border-red-300 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span>FAILED</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>UNPAID</span>
                        </span>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-[#7A6A5F]">
                        <span>Item Price:</span>
                        <span className="font-medium text-[#2B211C]">
                          {formatINR(selectedBooking.rental_amount_paise || (selectedBooking.total_paise - (selectedBooking.fees_paise || 0)))}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#7A6A5F]">
                        <span>Insured Express Shipping:</span>
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
                      <span className="text-[#2B211C] font-semibold">Total Order Value:</span>
                      <span className="font-bold text-base text-[#B06F5E] font-sans">
                        {formatINR(selectedBooking.total_paise)}
                      </span>
                    </div>

                    {/* Cashfree Transaction Identifiers */}
                    <div className="pt-2 border-t border-[#E8DDD1] space-y-1.5 text-[11px] bg-[#FAF6F0] p-2.5 rounded-xs border border-[#E8DDD1]/80">
                      {pay.latestPayment?.razorpay_order_id && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#7A6A5F]">Cashfree Order ID:</span>
                          <div className="flex items-center gap-1 font-mono text-[#2B211C]">
                            <span>{pay.latestPayment.razorpay_order_id}</span>
                            <button
                              type="button"
                              onClick={(e) => copyToClipboard(pay.latestPayment?.razorpay_order_id || "", "order_id", e)}
                              className="text-[#7A6A5F] hover:text-[#2B211C]"
                              title="Copy Order ID"
                            >
                              {copiedField === "order_id" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {pay.latestPayment?.razorpay_payment_id && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#7A6A5F]">Cashfree Payment ID:</span>
                          <div className="flex items-center gap-1 font-mono text-emerald-700 font-semibold">
                            <span>{pay.latestPayment.razorpay_payment_id}</span>
                            <button
                              type="button"
                              onClick={(e) => copyToClipboard(pay.latestPayment?.razorpay_payment_id || "", "pay_id", e)}
                              className="text-[#7A6A5F] hover:text-[#2B211C]"
                              title="Copy Payment ID"
                            >
                              {copiedField === "pay_id" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {pay.latestPayment?.method && (
                        <div className="flex justify-between">
                          <span className="text-[#7A6A5F]">Payment Method:</span>
                          <span className="capitalize font-medium text-[#2B211C]">{pay.latestPayment.method}</span>
                        </div>
                      )}

                      {pay.latestPayment?.verified_at && (
                        <div className="flex justify-between">
                          <span className="text-[#7A6A5F]">Verified At:</span>
                          <span className="text-[#2B211C]">{formatDate(pay.latestPayment.verified_at)}</span>
                        </div>
                      )}

                      {/* Explicit failure notice */}
                      {pay.isFailed && (
                        <div className="mt-2 pt-2 border-t border-red-200 text-red-800 space-y-1">
                          <div className="flex items-center gap-1 font-semibold text-[10px] uppercase">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Payment Gateway Error Details:</span>
                          </div>
                          <p className="text-[11px] leading-relaxed bg-red-50 p-2 rounded-xs border border-red-200">
                            {pay.failureReason || "The payment authorization failed or was declined at the bank."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Lifecycle Status Actions & Print Invoice */}
              <div className="space-y-3 pt-4 border-t border-[#E8DDD1]">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-base text-[#2B211C]">
                    Update Order Pipeline Status
                  </h4>
                  <span className="text-xs text-[#7A6A5F]">
                    Current Status: <strong className="text-[#2B211C]">{effStatus === "confirmed" ? "Confirmed" : BOOKING_STATUS_LABEL[selectedBooking.status as BookingStatus] || selectedBooking.status}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                    Status Transition Note (e.g. Courier Tracking Number or Dispatch Note)
                  </label>
                  <input
                    type="text"
                    value={transitionNote}
                    onChange={(e) => setTransitionNote(e.target.value)}
                    placeholder="e.g. Dispatched via BlueDart tracking #9823423..."
                    className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                  <p className="text-[11px] text-[#7A6A5F] mt-1">
                    * Updating status to <strong>Shipped</strong> or <strong>Delivered</strong> automatically dispatches a branded notification email to <strong>{selectedBooking.customer_email || "the customer"}</strong>.
                  </p>
                </div>

                {statusFeedback && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs text-xs text-emerald-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{statusFeedback}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {/* Print Invoice Button */}
                  <button
                    type="button"
                    onClick={() => handlePrintSingle(selectedBooking)}
                    className="px-3.5 py-2 bg-white hover:bg-[#FAF6F0] text-[#2B211C] border border-[#E8DDD1] rounded-xs text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#B06F5E]" />
                    <span>Print Tax Invoice</span>
                  </button>

                  <button
                    type="button"
                    disabled={updating || effStatus === "confirmed"}
                    onClick={() => setStatusToConfirm("confirmed")}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    Confirm Order &amp; Payment
                  </button>

                  <button
                    type="button"
                    disabled={updating || selectedBooking.status === "returned"}
                    onClick={() => setStatusToConfirm("returned")}
                    className="px-3.5 py-2 bg-[#2B211C] hover:bg-black text-white rounded-xs text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Shipped / In Transit</span>
                  </button>

                  <button
                    type="button"
                    disabled={updating || selectedBooking.status === "completed"}
                    onClick={() => setStatusToConfirm("completed")}
                    className="px-3.5 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-xs text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5"
                    title="Mark order as delivered and send delivery notification email to customer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Delivered / Fulfilled</span>
                  </button>

                  <button
                    type="button"
                    disabled={updating || selectedBooking.status === "cancelled"}
                    onClick={() => setStatusToConfirm("cancelled")}
                    className="px-3.5 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-xs text-xs font-medium transition-colors disabled:opacity-40 ml-auto"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 05. Tax Invoice Print & PDF Modal */}
      <OrderInvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        orders={invoiceOrders}
        siteSettings={siteSettings}
      />

      {/* 06. Order Status Confirmation Modal (Every status transition) */}
      {(() => {
        const config = getStatusConfirmationConfig(statusToConfirm);
        return (
          <ConfirmDialogModal
            isOpen={statusToConfirm !== null}
            onClose={() => {
              if (!updating) setStatusToConfirm(null);
            }}
            onConfirm={async () => {
              if (statusToConfirm) {
                await handleUpdateStatus(statusToConfirm);
              }
            }}
            title={config.title}
            message={config.message}
            confirmLabel={config.confirmLabel}
            cancelLabel={config.cancelLabel}
            variant={config.variant}
            loading={updating}
          />
        );
      })()}
    </div>
  );
}
