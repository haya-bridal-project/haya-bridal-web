"use client";

import { useEffect } from "react";
import { AlertTriangle, LogOut, Trash2, X, Check, Truck } from "lucide-react";

export interface ConfirmDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "signout" | "success" | "info";
  loading?: boolean;
}

export function ConfirmDialogModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isSignOut = variant === "signout";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!loading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm max-w-md w-full p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={() => {
            if (!loading) onClose();
          }}
          className="absolute top-4 right-4 p-1.5 text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#FAF6F0] rounded-sm transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Icon Circle */}
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
              isSignOut
                ? "bg-stone-100 text-[#2B211C] border border-stone-200"
                : variant === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : variant === "info"
                ? "bg-blue-50 text-blue-800 border border-blue-200"
                : variant === "warning"
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {isSignOut ? (
              <LogOut className="w-5 h-5 stroke-[1.6]" />
            ) : variant === "success" ? (
              <Check className="w-5 h-5 stroke-[1.6]" />
            ) : variant === "info" ? (
              <Truck className="w-5 h-5 stroke-[1.6]" />
            ) : variant === "warning" ? (
              <AlertTriangle className="w-5 h-5 stroke-[1.6]" />
            ) : (
              <Trash2 className="w-5 h-5 stroke-[1.6]" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3
              id="confirm-dialog-title"
              className="font-serif text-xl text-[#2B211C] font-normal leading-snug"
            >
              {title}
            </h3>
            <p className="mt-2 text-xs text-[#7A6A5F] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-[#E8DDD1] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-[#E8DDD1] hover:bg-[#FAF6F0] text-[#2B211C] text-xs font-medium rounded-sm transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-medium rounded-sm transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 ${
              isSignOut
                ? "bg-[#2B211C] hover:bg-[#B06F5E] text-white"
                : variant === "success"
                ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                : variant === "info"
                ? "bg-[#2B211C] hover:bg-black text-white"
                : variant === "warning"
                ? "bg-amber-700 hover:bg-amber-800 text-white"
                : "bg-red-700 hover:bg-red-800 text-white"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

