"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LightboxItem {
  id: string;
  label: string;
  fixtureImage?: string;
  standingImage?: string;
  standingAspectRatio?: string;
  color: string;
  textColor?: string;
}

export function Lightbox({
  items,
  activeId,
  onClose,
  onPrev,
  onNext,
}: {
  items: LightboxItem[];
  activeId: string | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const index = items.findIndex((i) => i.id === activeId);
  const current = items[index] ?? null;
  if (!activeId || !current) return null;

  return (
    <motion.div
      key="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className={cn(
          "relative w-[92vw] rounded-2xl shadow-2xl flex flex-col",
          current.fixtureImage && current.standingImage ? "max-w-6xl" : "max-w-3xl"
        )}
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured header — sticky at the top */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-3 rounded-t-2xl"
          style={{ backgroundColor: current.color, color: current.textColor || "white" }}
        >
          <h2 className="font-display font-black text-xl tracking-widest uppercase">
            {current.label}
          </h2>
          <button
            id="btn-lightbox-close"
            onClick={onClose}
            className="hover:opacity-80 transition-opacity"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable image area */}
        <div className="overflow-y-auto rounded-b-2xl bg-[#111] w-full">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-6 p-4 md:p-6 w-full">
            {current.fixtureImage && (
              <div
                className={cn(
                  "relative w-full",
                  current.standingImage ? "md:w-3/5" : "max-w-4xl"
                )}
                style={{ aspectRatio: "1344/800" }}
              >
                <Image
                  src={current.fixtureImage}
                  alt={`${current.label} Fixtures`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 92vw, 60vw"
                  priority
                />
              </div>
            )}
            {current.standingImage && (
              <div
                className={cn(
                  "relative w-full",
                  current.fixtureImage ? "md:w-2/5" : "max-w-md mx-auto"
                )}
                style={{ aspectRatio: current.standingAspectRatio || "780/880" }}
              >
                <Image
                  src={current.standingImage}
                  alt={`${current.label} Standings`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 92vw, 40vw"
                  priority
                />
              </div>
            )}
          </div>
        </div>

        {/* Prev / Next arrows */}
        {index > 0 && (
          <button
            id="btn-lightbox-prev"
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="Previous"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {index < items.length - 1 && (
          <button
            id="btn-lightbox-next"
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="Next"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* Dot indicators */}
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === index ? "bg-white scale-125" : "bg-white/30"
              )}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
