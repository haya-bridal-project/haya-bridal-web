"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Clock,
  Trash2,
  ExternalLink,
  Package,
  X,
  Check,
  Tag,
  Copy,
  MessageCircle,
  Eye,
} from "lucide-react";
import { formatDate } from "@/lib/dates";
import { ConfirmDialogModal } from "@/components/admin/ConfirmDialogModal";

export interface EnquiryItem {
  id: string;
  customer_id?: string | null;
  product_id?: string | null;
  kind: "product" | "contact" | string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
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
    primary_image_url?: string | null;
    category?: string | null;
  } | null;
}

interface EnquiriesManagerProps {
  initialEnquiries: EnquiryItem[];
}

export function EnquiriesManager({ initialEnquiries = [] }: EnquiriesManagerProps) {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>(initialEnquiries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "in_progress" | "closed">("all");
  
  // Detail Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState<EnquiryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status counts for header chips and filter tabs
  const countTotal = enquiries.length;
  const countNew = enquiries.filter((e) => e.status === "new").length;
  const countInProgress = enquiries.filter((e) => e.status === "in_progress").length;
  const countClosed = enquiries.filter((e) => e.status === "closed").length;

  const filtered = enquiries.filter((item) => {
    const matchesStatus =
      statusFilter === "all" ? true : item.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      (item.phone && item.phone.toLowerCase().includes(q)) ||
      (item.subject && item.subject.toLowerCase().includes(q)) ||
      (item.message && item.message.toLowerCase().includes(q)) ||
      (item.product?.name && item.product.name.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const handleOpenDetail = (item: EnquiryItem) => {
    setSelectedEnquiry(item);
    setAdminNote(item.admin_notes || "");
    setNoteSaved(false);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedEnquiry(null);
  };

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
    setNoteSaved(false);
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
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 3000);
      }
    } finally {
      setSavingNote(false);
    }
  };

  const promptDelete = (item: EnquiryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEnquiryToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!enquiryToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/enquiries?id=${enquiryToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEnquiries((prev) => prev.filter((e) => e.id !== enquiryToDelete.id));
        if (selectedEnquiry?.id === enquiryToDelete.id) {
          handleCloseDetail();
        }
        setDeleteModalOpen(false);
        setEnquiryToDelete(null);
      }
    } catch (e) {
      console.error("Failed to delete enquiry", e);
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getCleanPhone = (phone?: string | null) => {
    if (!phone) return "";
    return phone.replace(/[^0-9]/g, "");
  };

  return (
    <div className="space-y-6">
      {/* 01. Refined Page Header & Metric Chips */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-5 border-b border-[#E8DDD1] gap-4">
        <div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Client Communications &amp; Support
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
            Client Enquiries
          </h1>
          <p className="text-xs text-[#7A6A5F] mt-1">
            Click any row to open the full enquiry details, client contact, custom styling notes, and response options.
          </p>
        </div>

        {/* Quick status counters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm text-xs text-[#2B211C] shadow-2xs">
            <span className="text-[#7A6A5F]">Total:</span>
            <strong className="font-semibold">{countTotal}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/80 border border-amber-200/80 rounded-sm text-xs text-amber-900 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>New:</span>
            <strong className="font-semibold">{countNew}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/80 border border-blue-200/80 rounded-sm text-xs text-blue-900 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>In Progress:</span>
            <strong className="font-semibold">{countInProgress}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-sm text-xs text-emerald-900 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Resolved:</span>
            <strong className="font-semibold">{countClosed}</strong>
          </div>
        </div>
      </div>

      {/* 02. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input with clear button */}
        <div className="relative flex-1 max-w-lg">
          <div className="flex items-center bg-[#FFFDF9] border border-[#E8DDD1] focus-within:border-[#B06F5E] focus-within:ring-1 focus-within:ring-[#B06F5E] rounded-sm px-3.5 py-2 shadow-2xs transition-all">
            <Search className="w-4 h-4 text-[#7A6A5F] mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client name, email, phone, product, or message..."
              className="w-full text-xs bg-transparent focus:outline-hidden text-[#2B211C] placeholder:text-[#7A6A5F]/70"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-[#7A6A5F] hover:text-[#2B211C] p-0.5 ml-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          {(
            [
              { id: "all", label: "All", count: countTotal },
              { id: "new", label: "New", count: countNew },
              { id: "in_progress", label: "In Progress", count: countInProgress },
              { id: "closed", label: "Resolved", count: countClosed },
            ] as const
          ).map((tab) => {
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

      {/* 03. Single-Row Full Width Table View */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <>
            {/* Desktop Table: Single Row Per Enquiry */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F0] text-[#7A6A5F] uppercase tracking-wider font-sans border-b border-[#E8DDD1]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Client</th>
                    <th className="py-3 px-4 font-semibold">Contact</th>
                    <th className="py-3 px-4 font-semibold">Inquiry Subject / Item</th>
                    <th className="py-3 px-4 font-semibold">Message Preview</th>
                    <th className="py-3 px-4 font-semibold">Received</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDD1] text-[#2B211C]">
                  {filtered.map((item) => {
                    const initials = item.name
                      ? item.name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "CL";

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenDetail(item)}
                        className="hover:bg-[#FAF6F0]/70 cursor-pointer transition-colors group"
                      >
                        {/* Client Column */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#FAF6F0] border border-[#E8DDD1] text-[#B06F5E] flex items-center justify-center text-[10px] font-semibold shrink-0 group-hover:bg-[#B06F5E] group-hover:text-white transition-colors">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs block text-[#2B211C] group-hover:text-[#B06F5E] transition-colors truncate">
                                {item.name}
                              </span>
                              <span className="text-[11px] text-[#7A6A5F] truncate block">
                                {item.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact Column */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.phone ? (
                            <div className="space-y-0.5">
                              <span className="text-xs font-mono text-[#2B211C] block">
                                {item.phone}
                              </span>
                              <div className="flex items-center gap-2 text-[10px]">
                                <a
                                  href={`tel:${item.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#7A6A5F] hover:text-[#B06F5E] inline-flex items-center gap-0.5"
                                >
                                  <Phone className="w-2.5 h-2.5" /> Call
                                </a>
                                <span>•</span>
                                <a
                                  href={`https://wa.me/${getCleanPhone(item.phone)}?text=Hello%20${encodeURIComponent(
                                    item.name
                                  )},%20thank%20you%20for%20contacting%20Haya%20Bridal.`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-0.5"
                                >
                                  <MessageCircle className="w-2.5 h-2.5" /> WhatsApp
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#7A6A5F]/70 italic">
                              Email only
                            </span>
                          )}
                        </td>

                        {/* Subject / Item Column */}
                        <td className="py-3 px-4">
                          {item.product?.name ? (
                            <div className="inline-flex items-center gap-1.5 text-xs text-[#B06F5E] bg-white px-2 py-1 rounded-xs border border-[#E8DDD1]">
                              <Tag className="w-3 h-3 shrink-0" />
                              <span className="font-medium truncate max-w-[180px]">
                                {item.product.name}
                              </span>
                              <span className="text-[9px] uppercase font-semibold px-1 py-0.2 rounded-xs bg-[#FAF6F0] text-[#7A6A5F]">
                                {item.product.category === "ornament" ? "Ornament" : "Dress"}
                              </span>
                            </div>
                          ) : item.subject ? (
                            <span className="text-xs font-medium text-[#2B211C] truncate block max-w-[200px]">
                              {item.subject}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#7A6A5F] block">
                              General Boutique Inquiry
                            </span>
                          )}
                        </td>

                        {/* Message Preview Column */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-xs text-[#7A6A5F] truncate leading-relaxed">
                            {item.message}
                          </p>
                          {item.preferred_date && (
                            <span className="text-[10px] text-[#B06F5E] inline-flex items-center gap-1 mt-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>Event: {item.preferred_date}</span>
                            </span>
                          )}
                        </td>

                        {/* Date Column */}
                        <td className="py-3 px-4 whitespace-nowrap text-[11px] text-[#7A6A5F]">
                          <span className="block font-medium text-[#2B211C]">
                            {formatDate(item.created_at)}
                          </span>
                          <span className="text-[10px] text-[#7A6A5F]/80 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(item.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>

                        {/* Status Column */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs tracking-wider ${
                              item.status === "new"
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : item.status === "in_progress"
                                ? "bg-blue-100 text-blue-900 border border-blue-200"
                                : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === "new"
                                  ? "bg-amber-500 animate-pulse"
                                  : item.status === "in_progress"
                                  ? "bg-blue-500"
                                  : "bg-emerald-600"
                              }`}
                            />
                            {item.status === "closed" ? "Resolved" : item.status.replace("_", " ")}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(item);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2B211C] bg-[#FAF6F0] hover:bg-[#E8DDD1] border border-[#E8DDD1] rounded-xs transition-colors"
                            >
                              <Eye className="w-3 h-3 text-[#B06F5E]" />
                              <span>View Details</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => promptDelete(item, e)}
                              className="p-1.5 text-[#7A6A5F] hover:text-red-700 hover:bg-red-50 rounded-xs transition-colors"
                              title="Delete inquiry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (screens < md) */}
            <div className="md:hidden divide-y divide-[#E8DDD1]">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className="p-4 space-y-2 hover:bg-[#FAF6F0]/60 active:bg-[#FAF6F0] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#2B211C]">
                      {item.name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs tracking-wider ${
                        item.status === "new"
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : item.status === "in_progress"
                          ? "bg-blue-100 text-blue-900 border border-blue-200"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                      }`}
                    >
                      {item.status === "closed" ? "Resolved" : item.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#7A6A5F]">
                    {item.email} {item.phone ? `• ${item.phone}` : ""}
                  </div>

                  {item.product?.name && (
                    <div className="text-[11px] text-[#B06F5E] font-medium flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>{item.product.name}</span>
                    </div>
                  )}

                  <p className="text-xs text-[#7A6A5F] line-clamp-2">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E8DDD1]/50 text-[10px] text-[#7A6A5F]">
                    <span>{formatDate(item.created_at)}</span>
                    <span className="text-[#B06F5E] font-medium">
                      Tap to view details &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF6F0] text-[#7A6A5F] flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6 stroke-[1.4]" />
            </div>
            <h3 className="font-serif text-lg text-[#2B211C]">No Enquiries Found</h3>
            <p className="text-xs text-[#7A6A5F] max-w-sm mx-auto leading-relaxed">
              {search
                ? `No messages matched your search "${search}". Try clearing your search term.`
                : "There are currently no enquiries under this status filter."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="px-4 py-1.5 bg-[#2B211C] text-white text-xs font-medium rounded-sm hover:bg-[#B06F5E] transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* 04. Detailed Enquiry Modal Popup */}
      {isDetailModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={handleCloseDetail}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm shadow-2xl max-w-2xl w-full p-6 sm:p-8 z-10 max-h-[92vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E8DDD1]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-[#FAF6F0] border border-[#E8DDD1] text-[#7A6A5F]">
                    Client Inquiry Details
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs tracking-wider ${
                      selectedEnquiry.status === "new"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : selectedEnquiry.status === "in_progress"
                        ? "bg-blue-100 text-blue-900 border border-blue-300"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedEnquiry.status === "new"
                          ? "bg-amber-500 animate-pulse"
                          : selectedEnquiry.status === "in_progress"
                          ? "bg-blue-500"
                          : "bg-emerald-600"
                      }`}
                    />
                    {selectedEnquiry.status === "closed" ? "Resolved" : selectedEnquiry.status.replace("_", " ")}
                  </span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl text-[#2B211C]">
                  {selectedEnquiry.name}
                </h2>
                <p className="text-xs text-[#7A6A5F] mt-0.5 flex items-center gap-2">
                  <span>Received on {formatDate(selectedEnquiry.created_at)}</span>
                  <span>•</span>
                  <span className="font-mono text-[10px]">ID: {selectedEnquiry.id.slice(0, 8)}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-1.5 text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#FAF6F0] rounded-sm transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Switcher Toolbar */}
            <div className="p-3.5 bg-[#FAF6F0] rounded-sm border border-[#E8DDD1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#2B211C]">
                Update Inquiry Status:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedEnquiry.id, "new")}
                  className={`px-3 py-1.5 text-xs rounded-sm border font-medium transition-all ${
                    selectedEnquiry.status === "new"
                      ? "bg-amber-800 text-white border-amber-800 shadow-xs"
                      : "bg-white border-[#E8DDD1] text-[#7A6A5F] hover:bg-[#FAF6F0]"
                  }`}
                >
                  Mark as New
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedEnquiry.id, "in_progress")}
                  className={`px-3 py-1.5 text-xs rounded-sm border font-medium transition-all ${
                    selectedEnquiry.status === "in_progress"
                      ? "bg-blue-800 text-white border-blue-800 shadow-xs"
                      : "bg-white border-[#E8DDD1] text-[#7A6A5F] hover:bg-[#FAF6F0]"
                  }`}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedEnquiry.id, "closed")}
                  className={`px-3 py-1.5 text-xs rounded-sm border font-medium transition-all ${
                    selectedEnquiry.status === "closed"
                      ? "bg-emerald-800 text-white border-emerald-800 shadow-xs"
                      : "bg-white border-[#E8DDD1] text-[#7A6A5F] hover:bg-[#FAF6F0]"
                  }`}
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            {/* Client Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Email Card */}
              <div className="p-3.5 bg-white rounded-sm border border-[#E8DDD1] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[#7A6A5F] block">
                    Email Address
                  </span>
                  <button
                    type="button"
                    onClick={(e) => copyToClipboard(selectedEnquiry.email, "email", e)}
                    className="text-[#7A6A5F] hover:text-[#B06F5E] text-[10px] inline-flex items-center gap-1"
                    title="Copy email"
                  >
                    {copiedField === "email" ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="mt-1">
                  <a
                    href={`mailto:${selectedEnquiry.email}`}
                    className="text-xs font-medium text-[#2B211C] hover:text-[#B06F5E] hover:underline break-all"
                  >
                    {selectedEnquiry.email}
                  </a>
                </div>
                <div className="mt-2.5 pt-2 border-t border-[#E8DDD1]/50">
                  <a
                    href={`mailto:${selectedEnquiry.email}?subject=Haya Bridal - Regarding your enquiry`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#B06F5E] hover:underline"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Send Email Response</span>
                  </a>
                </div>
              </div>

              {/* Telephone & WhatsApp Card */}
              <div className="p-3.5 bg-white rounded-sm border border-[#E8DDD1] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[#7A6A5F] block">
                    Phone Number
                  </span>
                  {selectedEnquiry.phone && (
                    <button
                      type="button"
                      onClick={(e) => copyToClipboard(selectedEnquiry.phone || "", "phone", e)}
                      className="text-[#7A6A5F] hover:text-[#B06F5E] text-[10px] inline-flex items-center gap-1"
                      title="Copy phone"
                    >
                      {copiedField === "phone" ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
                <div className="mt-1">
                  {selectedEnquiry.phone ? (
                    <a
                      href={`tel:${selectedEnquiry.phone}`}
                      className="text-xs font-medium text-[#2B211C] hover:text-[#B06F5E] hover:underline"
                    >
                      {selectedEnquiry.phone}
                    </a>
                  ) : (
                    <span className="text-xs text-[#7A6A5F]/70 italic">
                      Not provided by client
                    </span>
                  )}
                </div>
                <div className="mt-2.5 pt-2 border-t border-[#E8DDD1]/50 flex items-center gap-3">
                  {selectedEnquiry.phone ? (
                    <>
                      <a
                        href={`tel:${selectedEnquiry.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7A6A5F] hover:text-[#2B211C]"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/${getCleanPhone(selectedEnquiry.phone)}?text=Hello%20${encodeURIComponent(
                          selectedEnquiry.name
                        )},%20thank%20you%20for%20contacting%20Haya%20Bridal.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </>
                  ) : (
                    <span className="text-[11px] text-[#7A6A5F]/60">Email response only</span>
                  )}
                </div>
              </div>

              {/* Referenced Product Card (if attached) */}
              {selectedEnquiry.product && (
                <div className="p-3.5 bg-[#FAF6F0]/70 rounded-sm border border-[#E8DDD1] sm:col-span-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedEnquiry.product.primary_image_url ? (
                      <div className="relative w-12 h-14 bg-[#E8DDD1] rounded-xs overflow-hidden shrink-0 border border-[#E8DDD1]">
                        <Image
                          src={selectedEnquiry.product.primary_image_url}
                          alt={selectedEnquiry.product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-14 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] flex items-center justify-center shrink-0 text-[#B06F5E]">
                        <Package className="w-5 h-5 stroke-[1.5]" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#7A6A5F] block">
                        Referenced Item
                      </span>
                      <h4 className="text-xs font-semibold text-[#2B211C] truncate mt-0.5">
                        {selectedEnquiry.product.name}
                      </h4>
                      <span className="text-[10px] text-[#B06F5E] font-medium uppercase tracking-wide">
                        {selectedEnquiry.product.category === "ornament"
                          ? "Fine Ornament"
                          : "Bridal Dress"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/products/${selectedEnquiry.product.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#FAF6F0] border border-[#E8DDD1] text-[#2B211C] rounded-sm text-xs font-medium shrink-0 transition-colors"
                  >
                    <span>View Item</span>
                    <ExternalLink className="w-3 h-3 text-[#7A6A5F]" />
                  </Link>
                </div>
              )}

              {/* Event Date & Size Info (if present) */}
              {(selectedEnquiry.preferred_date || selectedEnquiry.size) && (
                <div className="p-3.5 bg-white rounded-sm border border-[#E8DDD1] sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {selectedEnquiry.preferred_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#B06F5E] shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                          Requested Event Date
                        </span>
                        <span className="font-semibold text-[#2B211C]">
                          {selectedEnquiry.preferred_date}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedEnquiry.size && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#B06F5E] shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#7A6A5F] block">
                          Requested Fit / Sizing
                        </span>
                        <span className="font-semibold text-[#2B211C]">
                          {selectedEnquiry.size}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Client Message Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7A6A5F] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#B06F5E]" />
                  <span>Client Message</span>
                </h3>
                {selectedEnquiry.subject && (
                  <span className="text-xs font-medium text-[#2B211C]">
                    Subject: {selectedEnquiry.subject}
                  </span>
                )}
              </div>

              <div className="p-4 sm:p-5 bg-white border border-[#E8DDD1] rounded-sm text-xs sm:text-sm text-[#2B211C] leading-relaxed whitespace-pre-wrap font-sans shadow-2xs">
                {selectedEnquiry.message}
              </div>
            </div>

            {/* Internal Staff Notes & Follow-up */}
            <div className="space-y-2 pt-2 border-t border-[#E8DDD1]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7A6A5F]">
                  Internal Staff Notes &amp; Follow-up
                </h3>
                {noteSaved && (
                  <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Note saved</span>
                  </span>
                )}
              </div>

              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => {
                  setAdminNote(e.target.value);
                  setNoteSaved(false);
                }}
                placeholder="Record customer preferences, call summary, custom fitting measurements, or follow-up schedule..."
                className="w-full text-xs p-3.5 border border-[#E8DDD1] rounded-sm bg-[#FFFDF9] focus:outline-hidden focus:border-[#B06F5E] focus:ring-1 focus:ring-[#B06F5E] text-[#2B211C] placeholder:text-[#7A6A5F]/70"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#7A6A5F]">
                  Staff-only notes (never visible to clients)
                </span>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="px-4 py-2 bg-[#2B211C] hover:bg-[#B06F5E] text-white text-xs font-medium rounded-sm transition-colors shadow-xs disabled:opacity-50"
                >
                  {savingNote ? "Saving Note..." : "Save Internal Note"}
                </button>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-[#E8DDD1] flex items-center justify-between">
              <button
                type="button"
                onClick={() => promptDelete(selectedEnquiry)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-700 hover:text-red-900 hover:bg-red-50 rounded-sm border border-transparent hover:border-red-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Enquiry</span>
              </button>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="px-4 py-2 bg-[#FAF6F0] hover:bg-[#E8DDD1] text-[#2B211C] text-xs font-medium rounded-sm border border-[#E8DDD1] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Enquiry Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setEnquiryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Client Enquiry"
        message={
          enquiryToDelete
            ? `Are you sure you want to permanently delete the inquiry from "${enquiryToDelete.name}" (${enquiryToDelete.email})? This action cannot be undone.`
            : "Are you sure you want to delete this enquiry?"
        }
        confirmLabel="Yes, Delete Enquiry"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
