"use client";

/**
 * src/components/features/MySquadView.tsx
 *
 * My Squad page — shown after user clicks "Enter Squad".
 *
 * Two-panel layout:
 *  Left:  Squad pitch with captain/VC, booster button, transfers button
 *  Right: "How to Score" panel (default) or PlayerSelectionPanel (transfer mode)
 */

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSquadStore } from "@/store/squadStore";
import { getCountrySlug } from "@/components/features/SquadSelectionPanel";
import { HowToScorePanel } from "@/components/features/HowToScorePanel";
import { PlayerSelectionPanel } from "@/components/features/PlayerSelectionPanel";
import { BoosterModal } from "@/components/features/BoosterModal";
import { PlayerDetailsModal } from "@/components/features/PlayerDetailsModal";
import { useToast } from "@/components/ui/toast";
import type { Player } from "@/db/schema";
import type { SquadState } from "@/store/squadStore";

interface MySquadViewProps {
  teamName: string;
  managerName: string;
  favoriteCountry: string;
  allPlayers: Player[];
  opponentMap?: Record<string, string>;
  initialSquadState?: Partial<SquadState> | null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** A single player card on the pitch */
function MySquadPitchSlot({
  player,
  pos,
  opponentMap,
  captainId,
  viceCaptainId,
  isTransferMode,
  onClick,
  isSubOutSelected,
  isSubInValid,
  benchIndex,
  isSubDisabled,
}: {
  player?: Player;
  pos: string;
  opponentMap?: Record<string, string>;
  captainId: number | null;
  viceCaptainId: number | null;
  isTransferMode: boolean;
  onClick?: () => void;
  isSubOutSelected?: boolean;
  isSubInValid?: boolean;
  benchIndex?: number;
  isSubDisabled?: boolean;
}) {
  const slug = player ? getCountrySlug(player.nation) : null;
  const opponentAcronym =
    player && opponentMap ? opponentMap[player.nation] : null;

  const isCaptain = player && captainId === player.id;
  const isViceCaptain = player && viceCaptainId === player.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "pitch-slot",
        player
          ? "pitch-slot--filled !bg-transparent !border-transparent !p-0 cursor-pointer transition-all duration-300"
          : "pitch-slot--empty cursor-pointer",
        isSubDisabled && "opacity-40 grayscale-[80%] cursor-not-allowed"
      )}
      onClick={onClick}
    >
      {player ? (
        <div className="relative flex flex-col items-center w-[54px]">
          {/* Sub Out Icon */}
          {isSubOutSelected && (
            <div className="absolute -top-2 -left-2 z-40 w-5 h-5 bg-white rounded-full border-[1.5px] border-[#f44336] flex items-center justify-center shadow-sm">
              <Image src="/fantasy-icons/substitute-out.png" alt="Sub Out" width={12} height={12} />
            </div>
          )}

          {/* Sub In Icon */}
          {isSubInValid && (
            <>
              <div className="absolute -top-2 -left-2 z-40 w-5 h-5 bg-white rounded-full border-[1.5px] border-[#4caf50] flex items-center justify-center shadow-sm">
                <Image src="/fantasy-icons/substitute-in.png" alt="Sub In" width={12} height={12} />
              </div>
              {benchIndex !== undefined && (
                <div className="absolute -top-2 -right-2 z-40 w-5 h-5 bg-white rounded-full border-[1.5px] border-black flex items-center justify-center text-[10px] font-black text-black shadow-sm">
                  {benchIndex + 1}
                </div>
              )}
            </>
          )}

          {/* Captain / Vice-Captain badge */}
          {!isSubOutSelected && !isSubInValid && (isCaptain || isViceCaptain) && (
            <div className="absolute -top-1 -left-2 z-30 w-6 h-6">
              <Image
                src={
                  isCaptain
                    ? "/fantasy-icons/captain.png"
                    : "/fantasy-icons/vice-captain.png"
                }
                alt={isCaptain ? "Captain" : "Vice Captain"}
                width={24}
                height={24}
                className="object-contain drop-shadow-md"
              />
            </div>
          )}

          {/* Transfer icon (only in transfer mode) */}
          {isTransferMode && (
            <div className="absolute -top-1 -right-2 z-30 w-5 h-5">
              <Image
                src="/fantasy-icons/transfer.png"
                alt="Transfer"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
          )}

          {/* Nation kit image */}
          <div className="relative w-11 h-11 z-10 -mb-1 flex-shrink-0 drop-shadow-md">
            <Image
              src={`/images/kits/${slug}.png`}
              alt={player.nation}
              fill
              className="object-contain object-bottom"
              sizes="44px"
            />
          </div>

          {/* Card body */}
          <div className="w-full bg-[#111] border-[1.5px] border-white rounded-md flex flex-col overflow-hidden relative z-0">
            <div className="bg-white px-0.5 py-[2px] text-center">
              <span className="block text-[9px] font-bold text-black truncate w-full">
                {player.lastName || player.firstName}
              </span>
            </div>
            <div className="bg-[#111] px-0.5 py-[2px] text-center flex items-center justify-center gap-[2px]">
              {isTransferMode ? (
                /* In transfer mode, show price */
                <span className="text-[9px] font-black text-[#cca64f]">
                  ${player.price}m
                </span>
              ) : (
                /* Default mode, show opponent */
                <>
                  <span className="text-[8px] font-bold text-white">v</span>
                  <span className="text-[9px] font-black text-[#cca64f]">
                    {opponentAcronym || "TBD"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Empty slot */}
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center mb-1">
            <div className="w-4 h-4 rounded-full bg-white/10" />
          </div>
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-wide">
            {pos}
          </span>
        </>
      )}
    </motion.div>
  );
}

/** Squad Key legend */
function SquadKey() {
  const iconProps = { width: 24, height: 24, className: "object-contain" };

  return (
    <div className="mx-4 mt-6 bg-[#0f0c1a] rounded-xl border border-white/10 p-4">
      <h3 className="text-white text-sm font-bold mb-3">Key</h3>
      <div className="h-px w-full bg-white/10 mb-4" />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 px-2">
        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/captain.png" alt="Captain" {...iconProps} />
          <span className="text-white text-xs font-semibold">Captain</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/fantasy-icons/vice-captain.png"
            alt="Vice Captain"
            {...iconProps}
          />
          <span className="text-white text-xs font-semibold">Vice Captain</span>
        </div>
        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/injured.png" alt="Injured" {...iconProps} />
          <span className="text-white text-xs font-semibold">Injured</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/fantasy-icons/suspended.png"
            alt="Suspended"
            {...iconProps}
          />
          <span className="text-white text-xs font-semibold">Suspended</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/fantasy-icons/eliminated.png"
            alt="Eliminated"
            {...iconProps}
          />
          <span className="text-white text-xs font-semibold">Eliminated</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/fantasy-icons/starting.png"
            alt="Starting"
            {...iconProps}
          />
          <span className="text-white text-xs font-semibold">Starting</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/fantasy-icons/out-of-squad.png"
            alt="Out of squad"
            {...iconProps}
          />
          <span className="text-white text-xs font-semibold">Out of squad</span>
        </div>
        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/bench.png" alt="Bench" {...iconProps} />
          <span className="text-white text-xs font-semibold">Bench</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/fantasy-icons/substitute-in.png"
            alt="Substitute In"
            {...iconProps}
          />
          <span className="text-white text-xs font-semibold">Subs In</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/fantasy-icons/substitute-out.png"
            alt="Substitute Out"
            {...iconProps}
          />
          <span className="text-white text-xs font-semibold">Sub Out</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/fantasy-icons/boosters.png"
            alt="Boosters"
            {...iconProps}
          />
          <span className="text-white text-xs font-semibold">Boosters</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/fantasy-icons/transfer.png"
            alt="Transfer"
            {...iconProps}
          />
          <span className="text-white text-xs font-semibold">Transfer</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MySquadView({
  teamName,
  managerName,
  favoriteCountry,
  allPlayers,
  opponentMap,
  initialSquadState,
}: MySquadViewProps) {
  const { toast } = useToast();
  const {
    selectedPlayers,
    startingXI,
    bench,
    captainId,
    viceCaptainId,
    setCaptainId,
    setViceCaptainId,
    substitutePlayer,
    activeBooster,
    setActiveBooster,
    twelfthManId,
    setFullSquadState
  } = useSquadStore();

  const [isTransferMode, setIsTransferMode] = useState(false);
  const [is12thManMode, setIs12thManMode] = useState(false);
  const [isBoosterOpen, setIsBoosterOpen] = useState(false);
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState<Player | null>(null);

  const [isSubstitutionMode, setIsSubstitutionMode] = useState(false);
  const [subOutPlayerId, setSubOutPlayerId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/squad/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startingXI,
          bench,
          captainId,
          viceCaptainId,
          activeBooster,
          twelfthManId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast({
          title: "Failed to update squad",
          description: data.error ?? "Something went wrong.",
          variant: "error",
        });
        return;
      }
      toast({
        title: "Squad updated! 🎉",
        description: "Your changes have been saved successfully.",
        variant: "success",
      });
      // Optionally update the initial state if passed a setter, but since it's an object from page reload, a reload will fetch new.
    } catch {
      toast({
        title: "Network error",
        description: "Could not reach the server.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (initialSquadState) {
      setFullSquadState(initialSquadState);
      toast({
        title: "Squad reset",
        description: "Your squad has been reset to the last saved state.",
        variant: "info",
      });
    }
  };

  const handleBoosterActivate = (boosterId: string) => {
    setActiveBooster(boosterId);
    if (boosterId === "12th-man") {
      setIs12thManMode(true);
      setIsTransferMode(false);
    }
  };

  // Helper to check if a sub is valid
  const checkSubstitutionValid = (outId: number, inId: number) => {
    const playerOut = selectedPlayers.find((p) => p.id === outId);
    const playerIn = selectedPlayers.find((p) => p.id === inId);
    if (!playerOut || !playerIn) return false;
    if (playerOut.position === playerIn.position) return true;
    if (playerOut.position === "GK" || playerIn.position === "GK") return false;

    const posCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const id of startingXI) {
      const p = selectedPlayers.find((x) => x.id === id);
      if (p) posCounts[p.position]++;
    }
    posCounts[playerOut.position]--;
    posCounts[playerIn.position]++;

    if (posCounts.DEF < 3 || posCounts.DEF > 5) return false;
    if (posCounts.MID < 3 || posCounts.MID > 5) return false;
    if (posCounts.FWD < 1 || posCounts.FWD > 3) return false;
    return true;
  };

  // Group players by position
  const byPos: Record<string, Player[]> = useMemo(() => {
    const groups: Record<string, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of selectedPlayers) {
      if (groups[p.position]) groups[p.position].push(p);
    }
    return groups;
  }, [selectedPlayers]);

  const startingPlayersObj = useMemo(() => startingXI.map(id => selectedPlayers.find(p => p.id === id)!).filter(Boolean), [startingXI, selectedPlayers]);
  const benchPlayersObj = useMemo(() => bench.map(id => selectedPlayers.find(p => p.id === id)!).filter(Boolean), [bench, selectedPlayers]);

  const byPosStarting: Record<string, Player[]> = useMemo(() => {
    const groups: Record<string, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of startingPlayersObj) {
      if (groups[p.position]) groups[p.position].push(p);
    }
    return groups;
  }, [startingPlayersObj]);

  const renderRow = (
    pos: string,
    players: Player[],
    totalSlots: number,
    rowClass?: string
  ) => {
    const slots: (Player | undefined)[] = [...players];
    while (slots.length < totalSlots) slots.push(undefined);
    return (
      <div key={pos} className={cn("exact-pitch-row", rowClass)}>
        {slots.map((p, i) => {
          const isOut = isSubstitutionMode && subOutPlayerId === p?.id;
          const isSubDisabled = isSubstitutionMode && !isOut;
          return (
            <div key={p?.id ?? `${pos}-${i}`} className="group/slot relative">
              <MySquadPitchSlot
                player={p}
                pos={pos}
                opponentMap={opponentMap}
                captainId={captainId}
                viceCaptainId={viceCaptainId}
                isTransferMode={isTransferMode}
                isSubOutSelected={isOut}
                isSubDisabled={isSubDisabled}
                onClick={() => {
                  if (!p || isTransferMode) return;
                  if (isSubstitutionMode && subOutPlayerId) {
                    if (p.id === subOutPlayerId) {
                      setIsSubstitutionMode(false);
                      setSubOutPlayerId(null);
                    }
                  } else {
                    setSelectedPlayerForModal(p);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const twelfthManPlayer = useMemo(
    () => (twelfthManId ? allPlayers.find((p) => p.id === twelfthManId) : undefined),
    [twelfthManId, allPlayers]
  );

  return (
    <>
      <main className="my-squad-body" id="my-squad-main">
        {/* ── Left Panel: Squad Pitch ── */}
        <div className="squad-builder-left">
          <section className="squad-panel flex flex-col h-full overflow-hidden">
            {/* Team header */}
            <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative w-5 h-5 drop-shadow-md">
                  <Image
                    src={`/images/flags/${getCountrySlug(favoriteCountry)}.png`}
                    alt={`${favoriteCountry} flag`}
                    fill
                    className="object-contain"
                    sizes="20px"
                  />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wide">
                    {teamName}
                  </p>
                  <p className="text-[10px] text-white/50">{managerName}</p>
                </div>
              </div>
            </div>

            {/* Pitch area */}
            <div className="flex-1 overflow-y-auto pb-6">
              <div className="flex flex-col items-center pt-6 pb-4 w-full px-2">
                <div className="exact-pitch-container w-full relative">
                  {/* 3D Pitch Background */}
                  <div className="exact-pitch-3d">
                    <svg
                      viewBox="0 0 100 120"
                      preserveAspectRatio="none"
                      className="exact-pitch-svg"
                    >
                      <rect
                        x="5"
                        y="5"
                        width="90"
                        height="115"
                        stroke="white"
                        strokeWidth="0.5"
                        fill="none"
                      />
                      <rect
                        x="25"
                        y="5"
                        width="50"
                        height="20"
                        stroke="white"
                        strokeWidth="0.5"
                        fill="none"
                      />
                      <rect
                        x="38"
                        y="5"
                        width="24"
                        height="6"
                        stroke="white"
                        strokeWidth="0.5"
                        fill="none"
                      />
                      <path
                        d="M 40 25 A 10 10 0 0 0 60 25"
                        stroke="white"
                        strokeWidth="0.5"
                        fill="none"
                      />
                      <circle cx="50" cy="18" r="0.5" fill="white" />
                      <line
                        x1="5"
                        y1="100"
                        x2="95"
                        y2="100"
                        stroke="white"
                        strokeWidth="0.5"
                      />
                      <circle
                        cx="50"
                        cy="100"
                        r="15"
                        stroke="white"
                        strokeWidth="0.5"
                        fill="none"
                      />
                      <circle cx="50" cy="100" r="0.8" fill="white" />
                      <path
                        d="M 5 9 A 4 4 0 0 0 9 5"
                        stroke="white"
                        strokeWidth="0.5"
                        fill="none"
                      />
                      <path
                        d="M 95 9 A 4 4 0 0 1 91 5"
                        stroke="white"
                        strokeWidth="0.5"
                        fill="none"
                      />
                    </svg>
                  </div>

                  {/* Top-Left Controls */}
                  <div className="absolute top-2 left-2 z-30 flex items-start gap-2">
                    {activeBooster === "12th-man" && twelfthManPlayer && (
                      <div className="scale-[0.8] origin-top-left opacity-80 blur-[0.5px]">
                        <MySquadPitchSlot
                          player={twelfthManPlayer}
                          pos={twelfthManPlayer.position}
                          opponentMap={opponentMap}
                          captainId={null}
                          viceCaptainId={null}
                          isTransferMode={false}
                        />
                      </div>
                    )}

                    <button
                      id="btn-apply-booster"
                      onClick={() => setIsBoosterOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f5a623]/90 hover:bg-[#f5a623] text-white text-[10px] font-bold uppercase tracking-wide shadow-lg transition-all hover:scale-105"
                    >
                      <Image
                        src={
                          activeBooster === "12th-man"
                            ? "/fantasy-icons/substitute-in.png"
                            : activeBooster === "max-captain"
                              ? "/fantasy-icons/captain.png"
                              : "/fantasy-icons/boosters.png"
                        }
                        alt="Boosters"
                        width={18}
                        height={18}
                        className="object-contain"
                      />
                      {activeBooster ? activeBooster.replace("-", " ") : "Booster"}
                    </button>
                  </div>

                  {/* Next Fixture / Make Transfers button (top-right) */}
                  {isSubstitutionMode ? (
                    <button
                      onClick={() => {
                        setIsSubstitutionMode(false);
                        setSubOutPlayerId(null);
                      }}
                      className="absolute top-2 right-2 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f44336] hover:bg-[#d32f2f] text-white text-[10px] font-bold uppercase tracking-wide shadow-lg transition-all hover:scale-105"
                    >
                      Cancel Sub
                    </button>
                  ) : is12thManMode ? (
                    <button
                      onClick={() => setIs12thManMode(false)}
                      className="absolute top-2 right-2 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f5a623] hover:bg-[#e09515] text-white text-[10px] font-bold uppercase tracking-wide shadow-lg transition-all hover:scale-105"
                    >
                      Done
                    </button>
                  ) : (
                    <div className="absolute top-2 right-2 z-30 flex flex-col items-end gap-1 group">
                      <button
                        id="btn-make-transfers"
                        disabled={true}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-lg bg-white/50 text-black/50 cursor-not-allowed"
                      >
                        <Image
                          src="/fantasy-icons/transfer.png"
                          alt="Transfer"
                          width={16}
                          height={16}
                          className="object-contain opacity-50"
                        />
                        Make Transfers
                      </button>
                      <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 bg-black/70 backdrop-blur-sm text-[#cca64f] text-[9px] font-bold px-2 py-1 rounded text-center leading-tight max-w-[130px] border border-white/10 shadow-lg">
                        Transfers are Disabled for the Duration of GameWeek 2
                      </div>
                    </div>
                  )}

                  {/* Top Banner & Goal */}
                  <div className="exact-pitch-banner">
                    <div className="exact-pitch-banner-left">
                      <span className="mr-1 mt-[2px]">
                        <Image
                          src="/assets/logo-black.png"
                          alt="Logo"
                          width={12}
                          height={16}
                          className="object-contain"
                        />
                      </span>{" "}
                      FANTASY
                    </div>
                    <div className="exact-pitch-banner-right">
                      <span className="mr-1 mt-[2px]">
                        <Image
                          src="/assets/logo-white.png"
                          alt="Logo"
                          width={12}
                          height={16}
                          className="object-contain"
                        />
                      </span>{" "}
                      FANTASY
                    </div>
                  </div>

                  {/* Player Slots Layer */}
                  <div className="exact-pitch-players">
                    <AnimatePresence mode="wait">
                      {isTransferMode ? (
                        <motion.div
                          key="transfer-layout"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col justify-between h-full"
                        >
                          {/* Transfer mode: 2-5-5-3 */}
                          {renderRow("GK", byPos.GK, 2, "center")}
                          {renderRow("DEF", byPos.DEF, 5)}
                          {renderRow("MID", byPos.MID, 5)}
                          {renderRow("FWD", byPos.FWD, 3, "center fwd")}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="default-layout"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col justify-between h-full"
                        >
                          {/* Default mode: Dynamic rendering of starting XI */}
                          {renderRow("GK", byPosStarting.GK, byPosStarting.GK.length, "center")}
                          {renderRow("DEF", byPosStarting.DEF, byPosStarting.DEF.length)}
                          {renderRow("MID", byPosStarting.MID, byPosStarting.MID.length)}
                          {renderRow("FWD", byPosStarting.FWD, byPosStarting.FWD.length, "center fwd")}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Bench (only in default mode) */}
              {!isTransferMode && benchPlayersObj.length > 0 && (
                <div className="flex-shrink-0 flex items-center justify-center gap-2 py-4 mt-2 bg-black/20 border-y border-white/10 w-full px-4">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mr-1">
                    Bench
                  </span>
                  {benchPlayersObj.map((p, index) => {
                    // For field players on bench, we show their number (1, 2, 3)
                    // The first bench player is always GK, so field player index is index (since GK is index 0)
                    const benchIndex = p.position === "GK" ? undefined : index;
                    const isSubInValid = isSubstitutionMode && subOutPlayerId !== null && checkSubstitutionValid(subOutPlayerId, p.id);
                    const isSubDisabled = isSubstitutionMode && !isSubInValid;

                    return (
                      <div key={p.id} className="group/slot relative">
                        <MySquadPitchSlot
                          player={p}
                          pos={p.position}
                          opponentMap={opponentMap}
                          captainId={captainId}
                          viceCaptainId={viceCaptainId}
                          isTransferMode={false}
                          isSubInValid={isSubInValid}
                          isSubDisabled={isSubDisabled}
                          benchIndex={benchIndex}
                          onClick={() => {
                            if (!p || isTransferMode) return;
                            if (isSubstitutionMode && subOutPlayerId) {
                              if (isSubInValid) {
                                substitutePlayer(subOutPlayerId, p.id);
                                setIsSubstitutionMode(false);
                                setSubOutPlayerId(null);
                              }
                            } else {
                              setSelectedPlayerForModal(p);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                  {/* Empty bench slots up to 4 */}
                  {Array.from({
                    length: Math.max(0, 4 - benchPlayersObj.length),
                  }).map((_, i) => (
                    <div key={`bench-empty-${i}`} className="group/slot relative">
                      <MySquadPitchSlot
                        pos="?"
                        captainId={null}
                        viceCaptainId={null}
                        isTransferMode={false}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm / Reset Action Buttons */}
              {!isTransferMode && !isSubstitutionMode && !is12thManMode && (
                <div className="flex items-center justify-center gap-4 mt-6 px-4">
                  <button
                    onClick={handleReset}
                    disabled={!initialSquadState || isSaving}
                    className="px-6 py-2 rounded-xl border border-white/20 text-white/80 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSaving}
                    className="px-8 py-2 rounded-xl bg-[#c8f000] text-black text-xs font-black uppercase tracking-widest hover:bg-[#d4ff00] transition-colors shadow-lg shadow-[#c8f000]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving && (
                      <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    )}
                    Confirm
                  </button>
                </div>
              )}

              <SquadKey />
            </div>
          </section>
        </div>

        {/* ── Right Panel ── */}
        <div className="squad-builder-right">
          <AnimatePresence mode="wait">
            {isTransferMode || is12thManMode ? (
              <motion.div
                key="transfer-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <PlayerSelectionPanel players={allPlayers} mode={is12thManMode ? "12th-man" : "transfer"} />
              </motion.div>
            ) : (
              <motion.div
                key="how-to-score-panel"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <HowToScorePanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Booster Modal ── */}
      <BoosterModal
        isOpen={isBoosterOpen}
        onClose={() => setIsBoosterOpen(false)}
        onActivate={handleBoosterActivate}
        activeBoosterId={activeBooster}
        onDeactivate={() => {
          setActiveBooster(null);
          setIs12thManMode(false);
          if (twelfthManId) {
            const { setTwelfthManId } = useSquadStore.getState();
            setTwelfthManId(null);
          }
        }}
      />

      {/* ── Player Details Modal ── */}
      <PlayerDetailsModal
        isOpen={!!selectedPlayerForModal}
        onClose={() => setSelectedPlayerForModal(null)}
        player={selectedPlayerForModal}
        isCaptain={selectedPlayerForModal?.id === captainId}
        isViceCaptain={selectedPlayerForModal?.id === viceCaptainId}
        isBench={selectedPlayerForModal ? bench.includes(selectedPlayerForModal.id) : false}
        opponentAcronym={
          selectedPlayerForModal && opponentMap
            ? opponentMap[selectedPlayerForModal.nation]
            : null
        }
        onSetCaptain={() => {
          if (selectedPlayerForModal) setCaptainId(selectedPlayerForModal.id);
        }}
        onSetViceCaptain={() => {
          if (selectedPlayerForModal) setViceCaptainId(selectedPlayerForModal.id);
        }}
        onSubOut={() => {
          if (selectedPlayerForModal) {
            setSubOutPlayerId(selectedPlayerForModal.id);
            setIsSubstitutionMode(true);
            setSelectedPlayerForModal(null);
          }
        }}
      />
    </>
  );
}
