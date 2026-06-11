"use client";

/**
 * src/components/features/SquadSelectionPanel.tsx
 *
 * Right panel of the Squad Builder.
 *
 * Displays:
 *  - Team info header (team name, manager, players count, budget)
 *  - Pitch View / List View toggle
 *  - Pitch with position slot placeholders (or selected players)
 *  - Auto Pick, Reset, Enter Squad action buttons
 */

import { useState } from "react";
import Image from "next/image";
import { UserCircle2, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useSquadStore,
  MAX_SQUAD_SIZE,
} from "@/store/squadStore";
import type { Player } from "@/db/schema";

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = "pitch" | "list";

interface SquadSelectionPanelProps {
  teamName: string;
  managerName: string;
  allPlayers: Player[];
  onEnterSquad: () => void;
  opponentMap?: Record<string, string>;
}

// ── Pitch slot definitions ────────────────────────────────────────────────────

// Starting XI layout: 1 GK, 4 DEF, 4 MID, 2 FWD  (display formation)
// We show ALL selected players in their position rows.
// The bench (slots 12-15) appears below.

// ── Sub-components ────────────────────────────────────────────────────────────

/** A single slot on the pitch — empty or filled */
function PitchSlot({
  player,
  pos,
  onRemove,
  opponentMap,
}: {
  player?: Player;
  pos: string;
  onRemove?: () => void;
  opponentMap?: Record<string, string>;
}) {
  const slug = player
    ? (() => {
      if (player.nation === "United States") return "usa";
      if (player.nation === "Cote d'Ivoire" || player.nation === "Côte d'Ivoire" || player.nation === "Ivory Coast") return "cote-d'ivoire";
      if (player.nation === "Cape Verde" || player.nation === "Cabo Verde") return "cabo-verde";
      return player.nation
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    })()
    : null;

  const opponentAcronym = player && opponentMap ? opponentMap[player.nation] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "pitch-slot",
        player ? "pitch-slot--filled !bg-transparent !border-transparent !p-0" : "pitch-slot--empty"
      )}
    >
      {player ? (
        <div className="relative flex flex-col items-center w-[54px]">
          {/* Nation kit image */}
          <div className="relative w-11 h-11 z-10 -mb-1 flex-shrink-0 drop-shadow-md">
            <Image
              src={`/images/nations/${slug}.png`}
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
              <span className="text-[8px] font-bold text-white">v</span>
              <span className="text-[9px] font-black text-[#cca64f]">{opponentAcronym || "TBD"}</span>
            </div>
          </div>
          {/* Remove button */}
          <button
            onClick={onRemove}
            aria-label={`Remove ${player.lastName || player.firstName}`}
            className="absolute -top-1 -right-2 z-20 w-5 h-5 rounded-full bg-secondaryRed-600 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg"
          >
            <Minus size={9} className="text-white" />
          </button>
        </div>
      ) : (
        <>
          {/* Empty slot icon */}
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center mb-1">
            <UserCircle2 size={16} className="text-white/30" />
          </div>
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-wide">
            {pos}
          </span>
        </>
      )}
    </motion.div>
  );
}

/** Pitch view — renders position rows over the football pitch */
function PitchView({
  selectedPlayers,
  onRemove,
  opponentMap,
}: {
  selectedPlayers: Player[];
  onRemove: (id: number) => void;
  opponentMap?: Record<string, string>;
}) {
  const byPos: Record<string, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of selectedPlayers) {
    if (byPos[p.position]) byPos[p.position].push(p);
  }

  // Bench = players beyond the starting XI quotas
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
    starters: Player[],
    totalSlots: number,
    rowClass?: string
  ) => {
    const slots: (Player | undefined)[] = [...starters];
    while (slots.length < totalSlots) slots.push(undefined);
    return (
      <div
        key={pos}
        className={cn("exact-pitch-row", rowClass)}
      >
        {slots.map((p, i) => (
          <div key={p?.id ?? `${pos}-${i}`} className="group/slot relative">
            <PitchSlot
              player={p}
              pos={pos}
              onRemove={p ? () => onRemove(p.id) : undefined}
              opponentMap={opponentMap}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#100d1e]">
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="flex flex-col items-center pt-6 pb-4 w-full px-2">
          {/* Exact Pitch Recreation */}
          <div className="exact-pitch-container w-full">
            {/* 3D Pitch Background */}
            <div className="exact-pitch-3d">
              <svg viewBox="0 0 100 120" preserveAspectRatio="none" className="exact-pitch-svg">
                {/* Outer line */}
                <rect x="5" y="5" width="90" height="115" stroke="white" strokeWidth="0.5" fill="none" />
                {/* Penalty Box */}
                <rect x="25" y="5" width="50" height="20" stroke="white" strokeWidth="0.5" fill="none" />
                {/* Goal Area */}
                <rect x="38" y="5" width="24" height="6" stroke="white" strokeWidth="0.5" fill="none" />
                {/* Penalty Arc */}
                <path d="M 40 25 A 10 10 0 0 0 60 25" stroke="white" strokeWidth="0.5" fill="none" />
                {/* Penalty Spot */}
                <circle cx="50" cy="18" r="0.5" fill="white" />
                {/* Halfway Line (bottom) */}
                <line x1="5" y1="100" x2="95" y2="100" stroke="white" strokeWidth="0.5" />
                {/* Center Circle (bottom) */}
                <circle cx="50" cy="100" r="15" stroke="white" strokeWidth="0.5" fill="none" />
                {/* Center Spot */}
                <circle cx="50" cy="100" r="0.8" fill="white" />
                {/* Corner Arcs */}
                <path d="M 5 9 A 4 4 0 0 0 9 5" stroke="white" strokeWidth="0.5" fill="none" />
                <path d="M 95 9 A 4 4 0 0 1 91 5" stroke="white" strokeWidth="0.5" fill="none" />
              </svg>
            </div>

            {/* Top Banner & Goal */}
            <div className="exact-pitch-banner">
              <div className="exact-pitch-banner-left">
                <span className="mr-1 mt-[2px]">
                  <Image src="/assets/logo-black.png" alt="Logo" width={12} height={16} className="object-contain" />
                </span> FANTASY
              </div>

              <div className="exact-pitch-banner-right">
                <span className="mr-1 mt-[2px]">
                  <Image src="/assets/logo-white.png" alt="Logo" width={12} height={16} className="object-contain" />
                </span> FANTASY
              </div>
            </div>

            {/* Player Slots Layer */}
            <div className="exact-pitch-players">
              {renderRow("GK", startingGK, 1, "center")}
              {renderRow("DEF", startingDEF, 4)}
              {renderRow("MID", startingMID, 4)}
              {renderRow("FWD", startingFWD, 2, "center fwd")}
            </div>
          </div>
        </div>

        {/* Bench */}
        {bench.length > 0 && (
          <div className="flex-shrink-0 flex items-center justify-center gap-2 py-4 mt-2 bg-black/20 border-y border-white/10 w-full px-4">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mr-1">
              Bench
            </span>
            {bench.map((p) => (
              <div key={p.id} className="group/slot relative">
                <PitchSlot
                  player={p}
                  pos={p.position}
                  onRemove={() => onRemove(p.id)}
                  opponentMap={opponentMap}
                />
              </div>
            ))}
            {/* Empty bench slots up to 4 */}
            {Array.from({ length: Math.max(0, 4 - bench.length) }).map((_, i) => (
              <div key={`bench-empty-${i}`} className="group/slot relative">
                <PitchSlot pos="?" />
              </div>
            ))}
          </div>
        )}

        <SquadKey />
      </div>
    </div>
  );
}

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
          <Image src="/fantasy-icons/vice-captain.png" alt="Vice Captain" {...iconProps} />
          <span className="text-white text-xs font-semibold">Vice Captain</span>
        </div>

        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/injured.png" alt="Injured" {...iconProps} />
          <span className="text-white text-xs font-semibold">Injured</span>
        </div>

        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/suspended.png" alt="Suspended" {...iconProps} />
          <span className="text-white text-xs font-semibold">Suspended</span>
        </div>

        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/eliminated.png" alt="Eliminated" {...iconProps} />
          <span className="text-white text-xs font-semibold">Eliminated</span>
        </div>

        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/starting.png" alt="Starting" {...iconProps} />
          <span className="text-white text-xs font-semibold">Starting</span>
        </div>

        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/out-of-squad.png" alt="Out of squad" {...iconProps} />
          <span className="text-white text-xs font-semibold">Out of squad</span>
        </div>

        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/bench.png" alt="Bench" {...iconProps} />
          <span className="text-white text-xs font-semibold">Bench</span>
        </div>

        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/substitute-in.png" alt="Substitute In" {...iconProps} />
          <span className="text-white text-xs font-semibold">Subs In</span>
        </div>

        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/substitute-out.png" alt="Substitute out" {...iconProps} />
          <span className="text-white text-xs font-semibold">Sub Out</span>
        </div>

        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/boosters.png" alt="Boosters" {...iconProps} />
          <span className="text-white text-xs font-semibold">Boosters</span>
        </div>

        <div className="flex items-center gap-2">
          <Image src="/fantasy-icons/bench-swap.png" alt="Bench swap" {...iconProps} />
          <span className="text-white text-xs font-semibold">Bench swap</span>
        </div>

      </div>
    </div>
  );
}

/** List view — flat table of selected players */
function ListView({
  selectedPlayers,
  onRemove,
}: {
  selectedPlayers: Player[];
  onRemove: (id: number) => void;
}) {
  if (selectedPlayers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
        No players selected yet.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
      {selectedPlayers.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
        >
          <span
            className={cn(
              "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide",
              p.position === "GK" && "bg-yellow-500/20 text-yellow-400",
              p.position === "DEF" && "bg-green-500/20 text-green-400",
              p.position === "MID" && "bg-blue-500/20 text-blue-400",
              p.position === "FWD" && "bg-red-500/20 text-red-400"
            )}
          >
            {p.position}
          </span>
          <span className="flex-1 text-sm font-semibold text-white truncate">
            {p.firstName} {p.lastName}
          </span>
          <span className="text-xs text-white/50">{p.club ?? p.nation}</span>
          <span className="text-xs font-semibold text-white/70 w-12 text-right">
            ${p.price}m
          </span>
          <button
            onClick={() => onRemove(p.id)}
            aria-label={`Remove ${p.lastName || p.firstName}`}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-secondaryRed-600 flex items-center justify-center transition-colors"
          >
            <Minus size={11} className="text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SquadSelectionPanel({
  teamName,
  managerName,
  allPlayers,
  onEnterSquad,
  opponentMap,
}: SquadSelectionPanelProps) {
  const [view, setView] = useState<ViewMode>("pitch");
  const { selectedPlayers, reset, autoPick, removePlayer, budgetRemaining } =
    useSquadStore();

  const count = selectedPlayers.length;
  const isFull = count >= MAX_SQUAD_SIZE;
  const remaining = budgetRemaining();

  return (
    <section className="squad-panel flex flex-col h-full overflow-hidden">
      {/* ── Panel header ── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          {/* Left: title + meta */}
          <div>
            <h2 className="text-lg font-display font-black text-white mb-0.5">
              Squad Selection
            </h2>
            <p className="text-xs text-white/50">
              Select a maximum of 3 players from a single nation or &apos;Auto
              Pick&apos; if you&apos;re short of time.
            </p>
          </div>

          {/* Right: view toggle */}
          <div className="flex-shrink-0 flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 mt-1">
            <button
              id="btn-pitch-view"
              onClick={() => setView("pitch")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-150",
                view === "pitch"
                  ? "bg-primaryBrand-600 text-white shadow-sm"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              Pitch View
            </button>
            <button
              id="btn-list-view"
              onClick={() => setView("list")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-150",
                view === "list"
                  ? "bg-primaryBrand-600 text-white shadow-sm"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              List View
            </button>
          </div>
        </div>

        {/* Team meta row */}
        <div className="flex items-center gap-4 mt-4">
          {/* Team name + manager */}
          <div className="flex-1">
            <p className="text-xs font-black text-white uppercase tracking-wide">
              {teamName}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {/* South Africa flag placeholder for manager */}
              <div className="relative w-4 h-4 rounded-sm overflow-hidden">
                <Image
                  src="/images/nations/south-africa.png"
                  alt="Manager flag"
                  fill
                  className="object-cover"
                  sizes="16px"
                />
              </div>
              <p className="text-xs text-white/50">{managerName}</p>
            </div>
          </div>

          {/* Players selected badge */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "px-3 py-1 rounded-md text-sm font-black text-white transition-colors",
                isFull ? "bg-secondaryGreen-600" : "bg-secondaryRed-600"
              )}
            >
              {count} / {MAX_SQUAD_SIZE}
            </div>
            <p className="text-[10px] text-white/40 mt-1">Players selected</p>
          </div>

          {/* Budget badge */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "px-3 py-1 rounded-md text-sm font-black text-white transition-colors",
                remaining < 5
                  ? "bg-secondaryRed-600"
                  : remaining < 20
                    ? "bg-secondaryYellow-600"
                    : "bg-secondaryGreen-600"
              )}
            >
              ${remaining.toFixed(1)}m
            </div>
            <p className="text-[10px] text-white/40 mt-1">Bank</p>
          </div>
        </div>
      </div>

      {/* ── Pitch / List area ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        <AnimatePresence mode="wait">
          {view === "pitch" ? (
            <motion.div
              key="pitch"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <PitchView
                selectedPlayers={selectedPlayers}
                onRemove={removePlayer}
                opponentMap={opponentMap}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <ListView
                selectedPlayers={selectedPlayers}
                onRemove={removePlayer}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer actions ── */}
      <div className="flex-shrink-0 grid grid-cols-3 border-t border-white/10">
        <button
          id="btn-auto-pick"
          onClick={() => autoPick(allPlayers)}
          className="flex items-center justify-center gap-2 py-4 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all border-r border-white/10"
        >
          Auto Pick
        </button>

        <button
          id="btn-reset-squad"
          onClick={reset}
          disabled={count === 0}
          className="flex items-center justify-center gap-2 py-4 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all border-r border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset
        </button>

        <button
          id="btn-enter-squad"
          onClick={onEnterSquad}
          disabled={count < MAX_SQUAD_SIZE}
          className={cn(
            "flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all",
            count >= MAX_SQUAD_SIZE
              ? "text-white bg-primaryBrand-600 hover:bg-primaryBrand-500"
              : "text-white/40 cursor-not-allowed"
          )}
        >
          Enter Squad
        </button>
      </div>
    </section>
  );
}
