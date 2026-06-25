"use client";

/**
 * src/components/features/BoosterModal.tsx
 *
 * "Apply a Booster" modal — shows 5 booster options.
 * Only 1 booster is allowed per round; each can be used once in the tournament.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (boosterId: string) => void;
  activeBoosterId?: string | null;
  onDeactivate?: () => void;
}

interface BoosterOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  disabled?: boolean;
}

const BOOSTERS: BoosterOption[] = [
  {
    id: "max-captain",
    name: "Maximum Captain",
    description:
      "Your highest scoring player will earn double points.",
    icon: "/fantasy-icons/captain.png",
  },
  {
    id: "12th-man",
    name: "12th Man",
    description:
      "Select another additional player to be your 12th man.",
    icon: "/fantasy-icons/substitute-in.png",
  },
  {
    id: "wild-card",
    name: "Wild Card",
    description: "Make unlimited transfers for one round.",
    icon: "/fantasy-icons/transfer.png",
    disabled: true,
  },
  {
    id: "qualification-booster",
    name: "Qualification Booster",
    description:
      "All players in your team who qualify for the next round will receive a +2 bonus points boost.",
    icon: "/fantasy-icons/boosters.png",
    disabled: false,
  },
  {
    id: "clean-sheet-shield",
    name: "Clean Sheet Shield",
    description: "Any goalkeeper, defender or midfielder in your team will only lose their clean sheet after conceding 2 goals.",
    icon: "/fantasy-icons/shield.png",
    disabled: false,
  },
];

export function BoosterModal({ isOpen, onClose, onActivate, activeBoosterId, onDeactivate }: BoosterModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(activeBoosterId || null);
    }
  }, [isOpen, activeBoosterId]);

  const isActive = selectedId === activeBoosterId && selectedId !== null;

  const handleActivate = () => {
    if (!selectedId) return;
    if (isActive && onDeactivate) {
      onDeactivate();
    } else {
      onActivate(selectedId);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="booster-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="booster-modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="booster-modal pointer-events-auto relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Top section — diagonal blue/green background ── */}
              <div className="booster-modal-header relative flex flex-col items-center pt-8 pb-10">
                {/* Close button */}
                <button
                  id="btn-close-booster"
                  onClick={onClose}
                  aria-label="Close booster modal"
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full border-2 border-black/80 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X size={16} className="text-black" />
                </button>

                {/* Lightning icon */}
                <div className="w-16 h-16 rounded-full bg-white border-4 border-[#f5a623] flex items-center justify-center mb-4 shadow-lg">
                  <Zap size={32} className="text-[#f5a623] fill-[#f5a623]" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-display font-black text-white italic tracking-tight">
                  Apply a Booster
                </h2>
              </div>

              {/* ── Body section — white background ── */}
              <div className="bg-white px-6 pt-6 pb-6">
                {/* Description */}
                <p className="text-center text-sm text-gray-700 mb-6 leading-relaxed">
                  Only <span className="font-bold text-black">1 Booster</span>{" "}
                  is allowed per Round.
                  <br />
                  You can use each booster once throughout the tournament.
                </p>

                {/* ── Booster grid ── */}
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {BOOSTERS.map((booster) => (
                    <div key={booster.id} className="relative">
                      <button
                        id={`btn-booster-${booster.id}`}
                        onClick={() =>
                          !booster.disabled && setSelectedId(
                            selectedId === booster.id ? null : booster.id
                          )
                        }
                        disabled={booster.disabled}
                        className={cn(
                          "booster-card group relative flex flex-col items-center justify-center gap-2 w-[120px] h-[110px] rounded-xl border-2 transition-all duration-200",
                          selectedId === booster.id
                            ? "border-[#f5a623] bg-[#fff8ec] shadow-md shadow-[#f5a623]/20"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100",
                          booster.disabled &&
                            "opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        {/* Info button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTooltipId(
                              tooltipId === booster.id ? null : booster.id
                            );
                          }}
                          aria-label={`Info about ${booster.name}`}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors z-10"
                        >
                          <Info size={10} />
                        </button>

                        {/* Icon */}
                        <div className="relative w-12 h-12">
                          <Image
                            src={booster.icon}
                            alt={booster.name}
                            fill
                            className="object-contain"
                            sizes="48px"
                          />
                        </div>

                        {/* Label */}
                        <span className="text-xs font-bold text-gray-800 text-center leading-tight px-1">
                          {booster.name}
                        </span>
                      </button>

                      {/* Tooltip */}
                      <AnimatePresence>
                        {tooltipId === booster.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full z-30 w-48 p-2.5 rounded-lg bg-gray-900 text-white text-[11px] leading-relaxed shadow-xl"
                          >
                            {booster.description}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* ── Activate button ── */}
                <button
                  id="btn-activate-booster"
                  onClick={handleActivate}
                  disabled={!selectedId}
                  className={cn(
                    "w-full py-3.5 rounded-xl text-sm font-display font-black uppercase tracking-widest transition-all duration-200",
                    selectedId
                      ? isActive
                        ? "bg-[#f44336] text-white hover:bg-[#d32f2f] shadow-md"
                        : "bg-[#f5a623] text-white hover:bg-[#e09515] shadow-md"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
