import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Player } from "@/db/schema";
import { getCountrySlug } from "./SquadSelectionPanel";

interface PlayerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
  onSetCaptain?: () => void;
  onSetViceCaptain?: () => void;
  onSubOut?: () => void;
  onTransferOut?: () => void;
  opponentAcronym?: string | null;
}

export function PlayerDetailsModal({
  isOpen,
  onClose,
  player,
  isCaptain,
  isViceCaptain,
  onSetCaptain,
  onSetViceCaptain,
  onSubOut,
  onTransferOut,
  opponentAcronym,
}: PlayerDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "fixtures" | "results">("overview");

  if (!player) return null;

  const slug = getCountrySlug(player.nation);
  const formattedPrice = `$${player.price}m`;
  const name = player.lastName || player.firstName;
  // If player has both, we might want to show full name or just the display name
  const displayName = player.firstName && player.lastName ? `${player.firstName} ${player.lastName}` : name;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#181818] rounded-xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
            >
              {/* Header Section */}
              <div className="relative bg-[#0d82df] pt-6 pb-0 px-6 flex justify-between items-end overflow-hidden">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-black hover:bg-gray-200 transition-colors"
                >
                  <X size={20} strokeWidth={3} />
                </button>

                {/* Left side text details */}
                <div className="relative z-10 pb-6">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-1 shadow-black drop-shadow-md">
                    {displayName}
                  </h2>
                  <p className="text-white text-lg font-medium leading-tight shadow-black drop-shadow-md">
                    {player.nation}
                  </p>
                  <p className="text-white text-sm font-medium leading-tight shadow-black drop-shadow-md mt-1">
                    {player.position} | {formattedPrice}
                  </p>
                  <p className="text-white text-sm font-medium leading-tight shadow-black drop-shadow-md mt-1">
                    MD selection: 0%
                  </p>
                  <div className="mt-2">
                    <Image
                      src="/fantasy-icons/boosters.png" 
                      alt="Coin"
                      width={20}
                      height={20}
                      className="object-contain filter drop-shadow-md brightness-150"
                    />
                  </div>
                </div>

                {/* Right side player image */}
                <div className="relative w-[180px] h-[180px] -mb-2 z-0">
                  <Image
                    src={`/images/kits/${slug}.png`}
                    alt={player.nation}
                    fill
                    className="object-cover object-top drop-shadow-xl"
                  />
                </div>
                
                {/* Background decorative curve (optional, just to match aesthetic if needed, screenshot has some green curve on the right) */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#009639] rounded-l-full translate-x-1/2 opacity-80 z-[-1]" />
              </div>

              {/* Tabs */}
              <div className="bg-[#181818] flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={cn(
                    "flex-1 py-4 text-sm font-bold text-center transition-colors uppercase border-b-2",
                    activeTab === "overview" ? "text-[#eaff00] border-[#eaff00]" : "text-white border-transparent hover:text-white/80"
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("fixtures")}
                  className={cn(
                    "flex-1 py-4 text-sm font-bold text-center transition-colors uppercase border-b-2",
                    activeTab === "fixtures" ? "text-[#eaff00] border-[#eaff00]" : "text-white border-transparent hover:text-white/80"
                  )}
                >
                  Fixtures
                </button>
                <button
                  onClick={() => setActiveTab("results")}
                  className={cn(
                    "flex-1 py-4 text-sm font-bold text-center transition-colors uppercase border-b-2",
                    activeTab === "results" ? "text-[#eaff00] border-[#eaff00]" : "text-white border-transparent hover:text-white/80"
                  )}
                >
                  Results
                </button>
              </div>

              {/* Content Area */}
              <div className="p-4 flex flex-col gap-4">
                {activeTab === "overview" && (
                  <>
                    {/* Captain / Vice Captain row */}
                    <div className="flex gap-4">
                      <button
                        onClick={onSetCaptain}
                        disabled={isCaptain}
                        className={cn(
                          "flex-1 py-3 rounded-[100px] text-lg font-black uppercase text-center transition-all",
                          isCaptain 
                            ? "bg-white/10 text-white/30 cursor-not-allowed" 
                            : "bg-white text-gray-300 hover:bg-gray-100 shadow-md"
                        )}
                      >
                        <span className={cn(isCaptain ? "" : "text-gray-300")}>CAPTAIN</span>
                      </button>
                      <button
                        onClick={onSetViceCaptain}
                        disabled={isViceCaptain}
                        className={cn(
                          "flex-1 py-3 rounded-[100px] text-lg font-black uppercase text-center transition-all",
                          isViceCaptain 
                            ? "bg-white/10 text-white/30 cursor-not-allowed" 
                            : "bg-[#717171] text-black hover:bg-[#858585] shadow-md"
                        )}
                      >
                        <span className={cn(isViceCaptain ? "" : "text-black")}>VICE-CAPTAIN</span>
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded py-4 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-black uppercase">v {opponentAcronym || "TBD"}</span>
                        <span className="text-xs font-bold text-black mt-1">Next fixture</span>
                      </div>
                      <div className="bg-white rounded py-4 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-black uppercase">0%</span>
                        <span className="text-xs font-bold text-black mt-1">% Selected</span>
                      </div>
                      <div className="bg-white rounded py-4 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-black uppercase">0</span>
                        <span className="text-xs font-bold text-black mt-1">Last round pts</span>
                      </div>
                      <div className="bg-white rounded py-4 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-black uppercase">0</span>
                        <span className="text-xs font-bold text-black mt-1">Total pts</span>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "fixtures" && (
                  <div className="py-8 text-center text-white/50 text-sm">
                    Fixtures data not available yet.
                  </div>
                )}

                {activeTab === "results" && (
                  <div className="py-8 text-center text-white/50 text-sm">
                    Results data not available yet.
                  </div>
                )}
              </div>

              {/* Action Buttons (Sub Out / Transfer Out) */}
              <div className="p-4 bg-[#f8f8f8] flex flex-col gap-3">
                <button
                  onClick={onSubOut}
                  className="w-full py-3 bg-white border border-black rounded-[100px] text-black text-lg font-black uppercase text-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                  SUB OUT
                </button>
                <button
                  onClick={onTransferOut}
                  className="w-full py-3 bg-[#e0e0e0] rounded-[100px] text-[#b0b0b0] text-lg font-black uppercase text-center cursor-not-allowed"
                >
                  TRANSFER OUT
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
