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
import type { Player } from "@/db/schema";

interface MySquadViewProps {
  teamName: string;
  managerName: string;
  favoriteCountry: string;
  allPlayers: Player[];
  opponentMap?: Record<string, string>;
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
}: {
  player?: Player;
  pos: string;
  opponentMap?: Record<string, string>;
  captainId: number | null;
  viceCaptainId: number | null;
  isTransferMode: boolean;
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
          ? "pitch-slot--filled !bg-transparent !border-transparent !p-0"
          : "pitch-slot--empty"
      )}
    >
      {player ? (
        <div className="relative flex flex-col items-center w-[54px]">
          {/* Captain / Vice-Captain badge */}
          {(isCaptain || isViceCaptain) && (
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
}: MySquadViewProps) {
  const { selectedPlayers } = useSquadStore();
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [isBoosterOpen, setIsBoosterOpen] = useState(false);

  // Captain = highest totalPoints, Vice-Captain = 2nd highest
  const { captainId, viceCaptainId } = useMemo(() => {
    if (selectedPlayers.length === 0)
      return { captainId: null, viceCaptainId: null };

    const sorted = [...selectedPlayers].sort(
      (a, b) => b.totalPoints - a.totalPoints
    );
    return {
      captainId: sorted[0]?.id ?? null,
      viceCaptainId: sorted[1]?.id ?? null,
    };
  }, [selectedPlayers]);

  // Group players by position
  const byPos: Record<string, Player[]> = useMemo(() => {
    const groups: Record<string, Player[]> = {
      GK: [],
      DEF: [],
      MID: [],
      FWD: [],
    };
    for (const p of selectedPlayers) {
      if (groups[p.position]) groups[p.position].push(p);
    }
    return groups;
  }, [selectedPlayers]);

  // Starting XI + Bench (default mode)
  const startingGK = byPos.GK.slice(0, 1);
  const startingDEF = byPos.DEF.slice(0, 4);
  const startingMID = byPos.MID.slice(0, 4);
  const startingFWD = byPos.FWD.slice(0, 2);

  const bench = [
    ...byPos.GK.slice(1),
    ...byPos.DEF.slice(4),
    ...byPos.MID.slice(4),
    ...byPos.FWD.slice(2),
  ];

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
        {slots.map((p, i) => (
          <div key={p?.id ?? `${pos}-${i}`} className="group/slot relative">
            <MySquadPitchSlot
              player={p}
              pos={pos}
              opponentMap={opponentMap}
              captainId={captainId}
              viceCaptainId={viceCaptainId}
              isTransferMode={isTransferMode}
            />
          </div>
        ))}
      </div>
    );
  };

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

                  {/* Booster button (top-left) */}
                  <button
                    id="btn-apply-booster"
                    onClick={() => setIsBoosterOpen(true)}
                    className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f5a623]/90 hover:bg-[#f5a623] text-white text-[10px] font-bold uppercase tracking-wide shadow-lg transition-all hover:scale-105"
                  >
                    <Image
                      src="/fantasy-icons/boosters.png"
                      alt="Boosters"
                      width={18}
                      height={18}
                      className="object-contain"
                    />
                    Booster
                  </button>

                  {/* Next Fixture / Make Transfers button (top-right) */}
                  <button
                    id="btn-make-transfers"
                    onClick={() => setIsTransferMode((v) => !v)}
                    className={cn(
                      "absolute top-2 right-2 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-lg transition-all hover:scale-105",
                      isTransferMode
                        ? "bg-secondaryRed-600 hover:bg-secondaryRed-500 text-white"
                        : "bg-white/90 hover:bg-white text-black"
                    )}
                  >
                    {isTransferMode ? (
                      "Cancel"
                    ) : (
                      <>
                        <Image
                          src="/fantasy-icons/transfer.png"
                          alt="Transfer"
                          width={16}
                          height={16}
                          className="object-contain"
                        />
                        Make Transfers
                      </>
                    )}
                  </button>

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
                          {/* Default mode: 1-4-4-2 */}
                          {renderRow("GK", startingGK, 1, "center")}
                          {renderRow("DEF", startingDEF, 4)}
                          {renderRow("MID", startingMID, 4)}
                          {renderRow("FWD", startingFWD, 2, "center fwd")}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Bench (only in default mode) */}
              {!isTransferMode && bench.length > 0 && (
                <div className="flex-shrink-0 flex items-center justify-center gap-2 py-4 mt-2 bg-black/20 border-y border-white/10 w-full px-4">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mr-1">
                    Bench
                  </span>
                  {bench.map((p) => (
                    <div key={p.id} className="group/slot relative">
                      <MySquadPitchSlot
                        player={p}
                        pos={p.position}
                        opponentMap={opponentMap}
                        captainId={captainId}
                        viceCaptainId={viceCaptainId}
                        isTransferMode={false}
                      />
                    </div>
                  ))}
                  {/* Empty bench slots up to 4 */}
                  {Array.from({
                    length: Math.max(0, 4 - bench.length),
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

              <SquadKey />
            </div>
          </section>
        </div>

        {/* ── Right Panel ── */}
        <div className="squad-builder-right">
          <AnimatePresence mode="wait">
            {isTransferMode ? (
              <motion.div
                key="transfer-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <PlayerSelectionPanel players={allPlayers} />
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
      />
    </>
  );
}
