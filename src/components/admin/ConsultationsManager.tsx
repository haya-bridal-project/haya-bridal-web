"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Video,
  Store,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
} from "lucide-react";
import { formatDate } from "@/lib/dates";

export interface ConsultationItem {
  id: string;
  customer_id?: string | null;
  name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time?: string | null;
  mode: "in_store" | "virtual" | string;
  message?: string | null;
  status: "requested" | "confirmed" | "completed" | "cancelled" | string;
  admin_notes?: string | null;
  created_at: string;
}

interface ConsultationsManagerProps {
  initialConsultations: ConsultationItem[];
}

export function ConsultationsManager({
  initialConsultations = [],
}: ConsultationsManagerProps) {
  const [consultations, setConsultations] =
    useState<ConsultationItem[]>(initialConsultations);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ConsultationItem | null>(
    initialConsultations[0] || null
  );
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const filtered = consultations.filter((item) => {
    const matchesStatus =
      statusFilter === "all" ? true : item.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setConsultations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
        if (selectedItem?.id === id) {
          setSelectedItem({ ...selectedItem, status: newStatus });
        }
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedItem) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/admin/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedItem.id, admin_notes: adminNote }),
      });
      if (res.ok) {
        setConsultations((prev) =>
          prev.map((c) =>
            c.id === selectedItem.id ? { ...c, admin_notes: adminNote } : c
          )
        );
        setSelectedItem({ ...selectedItem, admin_notes: adminNote });
      }
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment request?"))
      return;
    try {
      const res = await fetch(`/api/admin/consultations?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const next = consultations.filter((c) => c.id !== id);
        setConsultations(next);
        if (selectedItem?.id === id) {
          setSelectedItem(next[0] || null);
        }
      }
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E8DDD1] gap-4">
        <div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Private Appointments
          </span>
          <h1 className="font-serif text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
            Bridal Trials &amp; Styling Sessions
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7A6A5F] bg-white px-3 py-1.5 border border-[#E8DDD1] rounded-sm">
            Total Bookings: <strong className="text-[#2B211C]">{consultations.length}</strong>
          </span>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex items-center bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 max-w-md w-full shadow-xs">
          <Search className="w-4 h-4 text-[#7A6A5F] mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by bride name, email, or telephone..."
            className="w-full text-xs bg-transparent focus:outline-hidden text-[#2B211C]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "requested", label: "Requested" },
            { id: "confirmed", label: "Confirmed" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[#2B211C] text-[#FAF6F0]"
                  : "bg-white text-[#7A6A5F] border border-[#E8DDD1] hover:bg-[#FAF6F0]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Master Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Appointments list */}
        <div className="lg:col-span-5 bg-white border border-[#E8DDD1] rounded-sm shadow-xs overflow-hidden">
          <div className="p-3 bg-[#FAF6F0] border-b border-[#E8DDD1] text-[11px] font-medium uppercase tracking-wider text-[#7A6A5F]">
            Showing {filtered.length} Appointments
          </div>

          <div className="divide-y divide-[#E8DDD1] max-h-[700px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7A6A5F]">
                No consultation requests found for this filter.
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setAdminNote(item.admin_notes || "");
                    }}
                    className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-[#FAF6F0] border-l-4 border-l-[#B06F5E]"
                        : "hover:bg-[#FFFDF9]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-xs text-[#2B211C]">
                        {item.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs tracking-wider ${
                          item.status === "requested"
                            ? "bg-amber-100 text-amber-800"
                            : item.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#B06F5E]">
                      {item.mode === "virtual" ? (
                        <span className="inline-flex items-center gap-1">
                          <Video className="w-3 h-3" /> Virtual Fitting
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Store className="w-3 h-3" /> In-Boutique Trial
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#7A6A5F]">
                      <Calendar className="w-3 h-3" />
                      <span>{item.preferred_date}</span>
                      {item.preferred_time && (
                        <>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{item.preferred_time}</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail view */}
        <div className="lg:col-span-7 bg-white border border-[#E8DDD1] rounded-sm p-6 shadow-xs">
          {selectedItem ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-[#E8DDD1]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-2xl text-[#2B211C]">
                      {selectedItem.name}
                    </h2>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs tracking-wider ${
                        selectedItem.status === "requested"
                          ? "bg-amber-100 text-amber-800"
                          : selectedItem.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedItem.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {selectedItem.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A6A5F] mt-1">
                    Booked on {formatDate(selectedItem.created_at)}
                  </p>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleStatusChange(selectedItem.id, "confirmed")}
                    className={`px-3 py-1 text-xs rounded-xs font-medium transition-colors ${
                      selectedItem.status === "confirmed"
                        ? "bg-emerald-800 text-white"
                        : "border border-[#E8DDD1] text-emerald-800 hover:bg-emerald-50"
                    }`}
                  >
                    Confirm Session
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedItem.id, "completed")}
                    className={`px-3 py-1 text-xs rounded-xs font-medium transition-colors ${
                      selectedItem.status === "completed"
                        ? "bg-blue-800 text-white"
                        : "border border-[#E8DDD1] text-blue-800 hover:bg-blue-50"
                    }`}
                  >
                    Mark Attended
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedItem.id, "cancelled")}
                    className={`px-3 py-1 text-xs rounded-xs font-medium transition-colors ${
                      selectedItem.status === "cancelled"
                        ? "bg-stone-800 text-white"
                        : "border border-[#E8DDD1] text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(selectedItem.id)}
                    className="p-1 text-red-600 hover:text-red-800 rounded-xs hover:bg-red-50"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Consultation details banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAF6F0] rounded-sm border border-[#E8DDD1]">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#B06F5E] shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                      Scheduled Date
                    </span>
                    <span className="text-xs font-medium text-[#2B211C]">
                      {selectedItem.preferred_date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#B06F5E] shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                      Preferred Time Slot
                    </span>
                    <span className="text-xs font-medium text-[#2B211C]">
                      {selectedItem.preferred_time || "Flexible / Unspecified"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {selectedItem.mode === "virtual" ? (
                    <Video className="w-4 h-4 text-[#B06F5E] shrink-0" />
                  ) : (
                    <Store className="w-4 h-4 text-[#B06F5E] shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                      Fitting Mode
                    </span>
                    <span className="text-xs font-medium text-[#2B211C] capitalize">
                      {selectedItem.mode === "virtual"
                        ? "Virtual Video Consultation"
                        : "In-Store Boutique Trial"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#B06F5E] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                      Client Phone
                    </span>
                    <a
                      href={`tel:${selectedItem.phone}`}
                      className="text-xs text-[#2B211C] hover:underline truncate block font-medium"
                    >
                      {selectedItem.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:col-span-2">
                  <Mail className="w-4 h-4 text-[#B06F5E] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                      Client Email
                    </span>
                    <a
                      href={`mailto:${selectedItem.email}`}
                      className="text-xs text-[#2B211C] hover:underline truncate block font-medium"
                    >
                      {selectedItem.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Client Notes / Requests */}
              {selectedItem.message && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7A6A5F] mb-2">
                    Bride&apos;s Preferences &amp; Message
                  </h3>
                  <div className="p-4 bg-white border border-[#E8DDD1] rounded-sm text-xs text-[#2B211C] leading-relaxed whitespace-pre-wrap">
                    {selectedItem.message}
                  </div>
                </div>
              )}

              {/* Internal Stylist Notes */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7A6A5F] mb-2">
                  Stylist Notes &amp; Measurements
                </h3>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Record gowns pulled, client measurements, custom veil requests, or appointment notes..."
                  className="w-full text-xs p-3 border border-[#E8DDD1] rounded-sm bg-[#FFFDF9] focus:outline-hidden focus:border-[#B06F5E]"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="px-4 py-2 bg-[#2B211C] hover:bg-[#B06F5E] text-white text-xs font-medium rounded-sm transition-colors"
                  >
                    {savingNote ? "Saving..." : "Save Stylist Note"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-[#7A6A5F]">
              Select an appointment from the left list to review details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
