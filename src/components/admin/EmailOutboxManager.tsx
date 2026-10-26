"use client";

import { useState } from "react";
import {
  Mail,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  X,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/dates";

export interface EmailLogItem {
  id: string;
  dedupe_key?: string | null;
  event_type: string;
  to_email: string;
  subject: string;
  status: "queued" | "sent" | "failed" | "skipped" | "duplicate" | string;
  provider_message_id?: string | null;
  error?: string | null;
  attempts: number;
  payload?: { html?: string; to_name?: string } | null;
  related_type?: string | null;
  related_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface EmailOutboxManagerProps {
  initialLogs: EmailLogItem[];
}

export function EmailOutboxManager({ initialLogs = [] }: EmailOutboxManagerProps) {
  const [logs, setLogs] = useState<EmailLogItem[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewItem, setPreviewItem] = useState<EmailLogItem | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filtered = logs.filter((item) => {
    const matchesStatus =
      statusFilter === "all" ? true : item.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.to_email.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.event_type.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/emails/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_id: logId }),
      });
      const data = await res.json();
      if (res.ok && data.result?.status === "sent") {
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? { ...l, status: "sent", error: null, attempts: l.attempts + 1 }
              : l
          )
        );
        setActionMessage("Email dispatched successfully via Brevo.");
      } else {
        setActionMessage(`Retry result: ${data.result?.error || data.result?.status || "failed"}`);
      }
    } catch (e: unknown) {
      setActionMessage(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetryingId(null);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sent
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 text-red-600" /> Failed
          </span>
        );
      case "skipped":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs bg-amber-100 text-amber-800">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs bg-stone-100 text-stone-700">
            <Clock className="w-3 h-3 text-stone-500" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E8DDD1] gap-4">
        <div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Delivery Pipeline
          </span>
          <h1 className="font-serif text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
            Transactional Email Outbox
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7A6A5F] bg-white px-3 py-1.5 border border-[#E8DDD1] rounded-sm">
            Total Messages: <strong className="text-[#2B211C]">{logs.length}</strong>
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-[#FAF6F0] border border-[#B06F5E] text-xs text-[#2B211C] rounded-sm flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)}>
            <X className="w-3.5 h-3.5 text-[#7A6A5F]" />
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex items-center bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 max-w-md w-full shadow-xs">
          <Search className="w-4 h-4 text-[#7A6A5F] mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by recipient email, subject, or event..."
            className="w-full text-xs bg-transparent focus:outline-hidden text-[#2B211C]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "sent", label: "Sent" },
            { id: "failed", label: "Failed" },
            { id: "skipped", label: "Skipped" },
            { id: "queued", label: "Queued" },
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

      {/* Outbox Table */}
      <div className="bg-white border border-[#E8DDD1] rounded-sm shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FAF6F0] border-b border-[#E8DDD1] text-[10px] font-semibold uppercase tracking-wider text-[#7A6A5F]">
              <th className="py-3 px-4">Event &amp; Subject</th>
              <th className="py-3 px-4">Recipient</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Attempts</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DDD1]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-[#7A6A5F]">
                  No email logs found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#FFFDF9] transition-colors">
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="text-[10px] uppercase font-mono text-[#B06F5E] block truncate">
                      {item.event_type}
                    </span>
                    <span className="font-medium text-[#2B211C] block truncate">
                      {item.subject}
                    </span>
                    {item.error && (
                      <span className="text-[10px] text-red-600 block truncate mt-0.5" title={item.error}>
                        Err: {item.error}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-xs text-[#7A6A5F]">
                    {item.to_email}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[#7A6A5F]">
                    {item.attempts}
                  </td>

                  <td className="py-3.5 px-4 text-[#7A6A5F] whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {item.payload?.html && (
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#FAF6F0] rounded-xs"
                          title="Preview Email HTML"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {(item.status === "failed" || item.status === "skipped") && (
                        <button
                          onClick={() => handleRetry(item.id)}
                          disabled={retryingId === item.id}
                          className="px-2.5 py-1 text-[11px] font-medium bg-[#B06F5E] hover:bg-[#975D4E] text-white rounded-xs inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className={`w-3 h-3 ${retryingId === item.id ? "animate-spin" : ""}`} />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* HTML Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-[#E8DDD1] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl animate-fade-in">
            <div className="p-4 bg-[#FAF6F0] border-b border-[#E8DDD1] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#B06F5E] block">
                  {previewItem.event_type} • To: {previewItem.to_email}
                </span>
                <h3 className="font-serif text-lg text-[#2B211C] font-normal truncate">
                  {previewItem.subject}
                </h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#E8DDD1] rounded-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-stone-50">
              <div
                className="bg-white p-6 rounded-sm shadow-xs border border-[#E8DDD1] max-w-xl mx-auto"
                dangerouslySetInnerHTML={{
                  __html: previewItem.payload?.html || "<p>No HTML payload stored.</p>",
                }}
              />
            </div>

            <div className="p-4 bg-[#FAF6F0] border-t border-[#E8DDD1] flex items-center justify-between">
              <span className="text-xs text-[#7A6A5F]">
                Provider Message ID: {previewItem.provider_message_id || "None"}
              </span>
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-1.5 bg-[#2B211C] text-white text-xs rounded-sm hover:bg-[#B06F5E] transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
