"use client";

/**
 * src/components/ui/toast.tsx
 *
 * Lightweight, self-contained toast notification system.
 *
 * Usage:
 *   1. Wrap your app (or the squad-builder layout) with <ToastProvider>.
 *   2. Call `const { toast } = useToast()` in any client component.
 *   3. toast({ title: "...", description: "...", variant: "error" })
 *
 * Variants: "error" | "warning" | "info" | "success"
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastVariant = "error" | "warning" | "info" | "success";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number; // ms, default 4000
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, "id">) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

// ── Visual config per variant ─────────────────────────────────────────────────

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ReactNode; borderClass: string; bgClass: string; iconClass: string }
> = {
  error: {
    icon: <AlertCircle size={16} />,
    borderClass: "border-l-4 border-l-[#e63757]",
    bgClass: "bg-[#1a0a0e]",
    iconClass: "text-[#e63757]",
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    borderClass: "border-l-4 border-l-[#f59e0b]",
    bgClass: "bg-[#130f04]",
    iconClass: "text-[#f59e0b]",
  },
  info: {
    icon: <Info size={16} />,
    borderClass: "border-l-4 border-l-[#3b82f6]",
    bgClass: "bg-[#060d1a]",
    iconClass: "text-[#3b82f6]",
  },
  success: {
    icon: <CheckCircle2 size={16} />,
    borderClass: "border-l-4 border-l-[#22c55e]",
    bgClass: "bg-[#040e07]",
    iconClass: "text-[#22c55e]",
  },
};

// ── Single Toast ──────────────────────────────────────────────────────────────

function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const config = VARIANT_CONFIG[item.variant];
  const duration = item.duration ?? 4000;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), duration);
  }, [item.id, duration, onDismiss]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 64, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 64, scale: 0.88 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      role="alert"
      aria-live="assertive"
      className={cn(
        "relative flex items-start gap-3 w-80 rounded-xl px-4 py-3 shadow-2xl",
        "border border-white/10",
        config.bgClass,
        config.borderClass
      )}
    >
      {/* Icon */}
      <span className={cn("mt-0.5 flex-shrink-0", config.iconClass)}>
        {config.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-snug">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs text-white/60 leading-snug">
            {item.description}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 mt-0.5 text-white/30 hover:text-white/70 transition-colors"
      >
        <X size={13} />
      </button>

      {/* Progress bar */}
      <motion.div
        className={cn("absolute bottom-0 left-0 h-[2px] rounded-full", config.iconClass.replace("text-", "bg-"))}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

// ── Provider + Toaster ────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toaster portal — fixed bottom-right */}
      <div
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      >
        <AnimatePresence mode="sync">
          {toasts.map((item) => (
            <div key={item.id} className="pointer-events-auto">
              <Toast item={item} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
