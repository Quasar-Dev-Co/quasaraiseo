"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface AlertDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function AlertDialog({
  open,
  title,
  description,
  confirmText = "OK",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  children,
}: AlertDialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm dark:bg-black/80"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
        {children}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            className={cn(
              variant === "danger" &&
                "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            )}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
