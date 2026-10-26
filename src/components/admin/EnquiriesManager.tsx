"use client";

import { useState } from "react";
import {
  Search,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Clock,
  Trash2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/dates";

export interface EnquiryItem {
  id: string;
  customer_id?: string | null;
  product_id?: string | null;
  kind: "product" | "contact" | string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  size?: string | null;
  preferred_date?: string | null;
  status: "new" | "in_progress" | "closed" | string;
  admin_notes?: string | null;
  created_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface EnquiriesManagerProps {
  initialEnquiries: EnquiryItem[];
}

export function EnquiriesManager({ initialEnquiries = [] }: EnquiriesManagerProps) {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>(initialEnquiries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(
    initialEnquiries[0] || null
  );
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const filtered = enquiries.filter((item) => {
    const matchesStatus =
      statusFilter === "all" ? true : item.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      (item.phone && item.phone.toLowerCase().includes(q)) ||
      (item.product?.name && item.product.name.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
        );
        if (selectedEnquiry?.id === id) {
          setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
        }
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedEnquiry) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/admin/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedEnquiry.id, admin_notes: adminNote }),
      });
      if (res.ok) {
        setEnquiries((prev) =>
          prev.map((e) =>
            e.id === selectedEnquiry.id ? { ...e, admin_notes: adminNote } : e
          )
        );
        setSelectedEnquiry({ ...selectedEnquiry, admin_notes: adminNote });
      }
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this client enquiry?")) return;
    try {
      const res = await fetch(`/api/admin/enquiries?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const next = enquiries.filter((e) => e.id !== id);
        setEnquiries(next);
        if (selectedEnquiry?.id === id) {
          setSelectedEnquiry(next[0] || null);
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
            Client Communications
          </span>
          <h1 className="font-serif text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
            Outfit Inquiries &amp; Requests
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7A6A5F] bg-white px-3 py-1.5 border border-[#E8DDD1] rounded-sm">
            Total Inquiries: <strong className="text-[#2B211C]">{enquiries.length}</strong>
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
            placeholder="Search by client name, email, phone, or gown..."
            className="w-full text-xs bg-transparent focus:outline-hidden text-[#2B211C]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "new", label: "New" },
            { id: "in_progress", label: "In Progress" },
            { id: "closed", label: "Resolved" },
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
        {/* Inquiries list */}
        <div className="lg:col-span-5 bg-white border border-[#E8DDD1] rounded-sm shadow-xs overflow-hidden">
          <div className="p-3 bg-[#FAF6F0] border-b border-[#E8DDD1] text-[11px] font-medium uppercase tracking-wider text-[#7A6A5F]">
            Showing {filtered.length} Inquiries
          </div>

          <div className="divide-y divide-[#E8DDD1] max-h-[700px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7A6A5F]">
                No customer inquiries matching this filter.
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedEnquiry?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedEnquiry(item);
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
                          item.status === "new"
                            ? "bg-amber-100 text-amber-800"
                            : item.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </div>

                    {item.product?.name ? (
                      <span className="text-[11px] text-[#B06F5E] truncate">
                        Gown: {item.product.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#7A6A5F] truncate">
                        General Consultation Enquiry
                      </span>
                    )}

                    <p className="text-xs text-[#7A6A5F] line-clamp-2">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#7A6A5F]/80 pt-1">
                      <span>{formatDate(item.created_at)}</span>
                      {item.preferred_date && (
                        <span>Event: {item.preferred_date}</span>
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
          {selectedEnquiry ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-[#E8DDD1]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-2xl text-[#2B211C]">
                      {selectedEnquiry.name}
                    </h2>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs tracking-wider ${
                        selectedEnquiry.status === "new"
                          ? "bg-amber-100 text-amber-800"
                          : selectedEnquiry.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {selectedEnquiry.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A6A5F] mt-1">
                    Received on {formatDate(selectedEnquiry.created_at)}
                  </p>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleStatusChange(selectedEnquiry.id, "new")}
                    className={`px-2.5 py-1 text-[11px] rounded-xs border transition-colors ${
                      selectedEnquiry.status === "new"
                        ? "bg-amber-800 text-white border-amber-800"
                        : "border-[#E8DDD1] text-[#7A6A5F] hover:bg-[#FAF6F0]"
                    }`}
                  >
                    Mark New
                  </button>
                  <button
                    onClick={() =>
                      handleStatusChange(selectedEnquiry.id, "in_progress")
                    }
                    className={`px-2.5 py-1 text-[11px] rounded-xs border transition-colors ${
                      selectedEnquiry.status === "in_progress"
                        ? "bg-blue-800 text-white border-blue-800"
                        : "border-[#E8DDD1] text-[#7A6A5F] hover:bg-[#FAF6F0]"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedEnquiry.id, "closed")}
                    className={`px-2.5 py-1 text-[11px] rounded-xs border transition-colors ${
                      selectedEnquiry.status === "closed"
                        ? "bg-stone-800 text-white border-stone-800"
                        : "border-[#E8DDD1] text-[#7A6A5F] hover:bg-[#FAF6F0]"
                    }`}
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => handleDelete(selectedEnquiry.id)}
                    className="p-1 text-red-600 hover:text-red-800 rounded-xs hover:bg-red-50"
                    title="Delete inquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Client Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAF6F0] rounded-sm border border-[#E8DDD1]">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#B06F5E] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                      Email Address
                    </span>
                    <a
                      href={`mailto:${selectedEnquiry.email}`}
                      className="text-xs text-[#2B211C] hover:underline truncate block"
                    >
                      {selectedEnquiry.email}
                    </a>
                  </div>
                </div>

                {selectedEnquiry.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#B06F5E] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                        Telephone
                      </span>
                      <a
                        href={`tel:${selectedEnquiry.phone}`}
                        className="text-xs text-[#2B211C] hover:underline truncate block"
                      >
                        {selectedEnquiry.phone}
                      </a>
                    </div>
                  </div>
                )}

                {selectedEnquiry.product && (
                  <div className="flex items-center gap-2.5 sm:col-span-2">
                    <ExternalLink className="w-4 h-4 text-[#B06F5E] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                        Referenced Gown
                      </span>
                      <a
                        href={`/products/${selectedEnquiry.product.slug}`}
                        target="_blank"
                        className="text-xs text-[#B06F5E] font-medium hover:underline inline-flex items-center gap-1"
                      >
                        {selectedEnquiry.product.name}
                      </a>
                    </div>
                  </div>
                )}

                {selectedEnquiry.preferred_date && (
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#B06F5E] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                        Client Event Date
                      </span>
                      <span className="text-xs text-[#2B211C]">
                        {selectedEnquiry.preferred_date}
                      </span>
                    </div>
                  </div>
                )}

                {selectedEnquiry.size && (
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#B06F5E] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                        Requested Size
                      </span>
                      <span className="text-xs text-[#2B211C] font-semibold">
                        {selectedEnquiry.size}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7A6A5F] mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#B06F5E]" />
                  <span>Client Message</span>
                </h3>
                <div className="p-4 bg-white border border-[#E8DDD1] rounded-sm text-xs text-[#2B211C] leading-relaxed whitespace-pre-wrap">
                  {selectedEnquiry.message}
                </div>
              </div>

              {/* Internal Staff Notes */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7A6A5F] mb-2">
                  Internal Staff Notes &amp; Follow-up
                </h3>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Record call summary, client measurements, custom fitting notes, or follow-up schedule..."
                  className="w-full text-xs p-3 border border-[#E8DDD1] rounded-sm bg-[#FFFDF9] focus:outline-hidden focus:border-[#B06F5E]"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="px-4 py-2 bg-[#2B211C] hover:bg-[#B06F5E] text-white text-xs font-medium rounded-sm transition-colors"
                  >
                    {savingNote ? "Saving..." : "Save Internal Note"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-[#7A6A5F]">
              Select an enquiry from the left list to review details and respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
