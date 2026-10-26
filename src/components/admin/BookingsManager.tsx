"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Clock,
  CreditCard,
  X,
  FileText,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/labels";
import type { Booking } from "@/lib/types";

interface BookingsManagerProps {
  initialBookings: Booking[];
}

export function BookingsManager({ initialBookings = [] }: BookingsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const [transitionNote, setTransitionNote] = useState("");
  const [updating, setUpdating] = useState(false);

  // Filter bookings client side
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "pending"
        ? b.status === "pending_payment" || b.status === "requested"
        : b.status === statusFilter;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.reference.toLowerCase().includes(q) ||
      b.customer_name.toLowerCase().includes(q) ||
      b.customer_phone.toLowerCase().includes(q) ||
      b.product_name.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
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
        // Update local state
        const updated = {
          ...selectedBooking,
          status: newStatus as any,
          admin_notes: transitionNote || selectedBooking.admin_notes,
        };
        setBookings(bookings.map((b) => (b.id === selectedBooking.id ? updated : b)));
        setSelectedBooking(updated);
        setTransitionNote("");
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E8DDD1] gap-4">
        <div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Reservation Pipeline
          </span>
          <h1 className="font-serif text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
            Rental Bookings &amp; Logistics
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending Review / Payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="picked_up">Picked Up / Out with Bride</option>
            <option value="returned">Returned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center max-w-md bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 shadow-xs">
        <Search className="w-4 h-4 text-[#7A6A5F] mr-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by ref code, bride name, phone, or outfit..."
          className="w-full text-xs text-[#2B211C] focus:outline-none"
        />
      </div>

      {/* Bookings Table */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm shadow-xs overflow-hidden">
        {filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] text-[#7A6A5F] uppercase tracking-wider font-sans border-b border-[#E8DDD1]">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Client Contact</th>
                  <th className="py-3 px-4">Outfit &amp; Size</th>
                  <th className="py-3 px-4">Rental Window</th>
                  <th className="py-3 px-4">Payable</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Booking Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD1] text-[#2B211C]">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="hover:bg-[#FAF6F0]/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-[#B06F5E]">
                      {b.reference}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium block">{b.customer_name}</span>
                      <span className="text-[11px] text-[#7A6A5F]">{b.customer_phone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-serif text-sm block">{b.product_name}</span>
                      <span className="text-[11px] text-[#7A6A5F]">
                        Size: {b.size || "Standard"} {b.color ? `• ${b.color}` : ""}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium block">
                        {formatDate(b.start_date)} to {formatDate(b.end_date)}
                      </span>
                      <span className="text-[11px] text-[#7A6A5F]">
                        {b.duration_days} Days ({b.buffer_days}d buffer)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold">
                      {formatINR(b.total_paise)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase tracking-wider ${
                          b.payment_status === "paid"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {PAYMENT_STATUS_LABEL[b.payment_status] || b.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-xs bg-[#F4ECE1] text-[11px] font-medium text-[#2B211C]">
                        {BOOKING_STATUS_LABEL[b.status] || b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(b)}
                        className="text-[#B06F5E] hover:underline font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-[#7A6A5F]">
            No booking records match the filter criteria.
          </div>
        )}
      </div>

      {/* Booking Inspection & Transition Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setSelectedBooking(null)}
          />

          <div className="relative bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm shadow-2xl max-w-2xl w-full p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1]">
              <div>
                <span className="font-mono text-xs font-semibold text-[#B06F5E] block">
                  {selectedBooking.reference}
                </span>
                <h3 className="font-serif text-2xl text-[#2B211C]">
                  {selectedBooking.product_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-1 text-[#7A6A5F] hover:text-[#2B211C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF6F0] p-4 rounded-xs border border-[#E8DDD1]">
              <div>
                <span className="text-[#7A6A5F] block uppercase tracking-wider text-[10px]">Client</span>
                <span className="font-medium text-[#2B211C] block text-sm">{selectedBooking.customer_name}</span>
                <span>{selectedBooking.customer_email}</span>
                <span className="block mt-0.5">{selectedBooking.customer_phone}</span>
                {selectedBooking.customer_address && (
                  <span className="block mt-1 text-[#7A6A5F] italic">
                    Address: {selectedBooking.customer_address}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[#7A6A5F] block uppercase tracking-wider text-[10px]">Rental Schedule</span>
                <span className="font-medium text-[#2B211C] block text-sm">
                  {formatDate(selectedBooking.start_date)} &rarr; {formatDate(selectedBooking.end_date)}
                </span>
                <span className="block">{selectedBooking.duration_days} Days Rental Period</span>
                {selectedBooking.event_date && (
                  <span className="block mt-1 text-[#B06F5E] font-medium">
                    Event Date: {formatDate(selectedBooking.event_date)}
                  </span>
                )}
                {selectedBooking.notes && (
                  <span className="block mt-1 text-[#7A6A5F]">
                    Notes: {selectedBooking.notes}
                  </span>
                )}
              </div>
            </div>

            {/* Price & Deposit Summary */}
            <div className="p-4 bg-white border border-[#E8DDD1] rounded-xs text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#7A6A5F]">Rental Charge:</span>
                <span className="font-medium">{formatINR(selectedBooking.rental_amount_paise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5F]">Security Deposit:</span>
                <span className="font-medium">{formatINR(selectedBooking.deposit_paise)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E8DDD1] font-semibold text-sm">
                <span>Total Payable:</span>
                <span className="text-[#B06F5E] font-bold">{formatINR(selectedBooking.total_paise)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#7A6A5F] pt-1">
                <span>Payment Status:</span>
                <span className="font-medium uppercase">{selectedBooking.payment_status}</span>
              </div>
            </div>

            {/* Transition Controls */}
            <div className="space-y-3 pt-2 border-t border-[#E8DDD1]">
              <h4 className="font-serif text-sm text-[#2B211C]">
                Workflow Actions &amp; Status Transitions
              </h4>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                  Concierge Log / Reason Note
                </label>
                <input
                  type="text"
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                  placeholder="e.g. Master tailor completed trial, outfit dispatched..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C]"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {selectedBooking.status === "requested" && (
                  <>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus("confirmed")}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Request</span>
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus("rejected")}
                      className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-medium rounded-sm flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Request</span>
                    </button>
                  </>
                )}

                {selectedBooking.status === "confirmed" && (
                  <>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus("picked_up")}
                      className="px-4 py-2 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium rounded-sm flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Mark Dispatched / Picked Up</span>
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus("cancelled")}
                      className="px-4 py-2 bg-stone-700 text-white text-xs font-medium rounded-sm"
                    >
                      Cancel Booking
                    </button>
                  </>
                )}

                {selectedBooking.status === "picked_up" && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus("returned")}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-sm flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Garment Returned to Studio</span>
                  </button>
                )}

                {selectedBooking.status === "returned" && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus("completed")}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Booking &amp; Release Deposit</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
