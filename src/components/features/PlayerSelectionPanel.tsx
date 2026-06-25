"use client";

/**
 * src/components/features/PlayerSelectionPanel.tsx
 *
 * Left panel of the Squad Builder.
 * Shows a filterable, searchable, paginated list of all players grouped by position.
 * Communicates add/remove actions via the Zustand squadStore.
 */

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RotateCcw,
  ChevronDown,
  Plus,
  Minus,
  Info,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSquadStore } from "@/store/squadStore";
import { useToast } from "@/components/ui/toast";
import type { Player } from "@/db/schema";

// ── Constants ─────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 30;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Converts "South Africa" → "south-africa" for flag image paths */
function nationToSlug(nation: string): string {
  if (nation === "United States") return "usa";
  if (nation === "Cote d'Ivoire" || nation === "Côte d'Ivoire" || nation === "Ivory Coast") return "cote-d'ivoire";
  if (nation === "Cape Verde" || nation === "Cabo Verde") return "cabo-verde";

  return nation
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const POSITION_LABELS: Record<string, string> = {
  GK: "Goalkeepers",
  DEF: "Defenders",
  MID: "Midfielders",
  FWD: "Forwards",
};

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"];

// ── Sub-components ────────────────────────────────────────────────────────────

interface PlayerRowProps {
  player: Player;
  isSelected: boolean;
  onAdd: () => void;
  onRemove: () => void;
  showFullName?: boolean;
  mode: "transfer" | "12th-man" | "view";
}

function PlayerRow({ player, isSelected, onAdd, onRemove, showFullName, mode }: PlayerRowProps) {
  const slug = nationToSlug(player.nation);
  // Priority: knownName (official known alias) → full name if duplicate → lastName → firstName
  const displayName = player.knownName
    ? player.knownName
    : showFullName
      ? `${player.firstName} ${player.lastName}`
      : (player.lastName || player.firstName);

  return (
    <div
      className={cn(
        "player-list-row group",
        isSelected && "player-list-row--selected"
      )}
    >
      {/* Info icon */}
      <button
        aria-label={`Info about ${displayName}`}
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
      >
        <Info size={12} />
      </button>

      {/* Flag */}
      <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-white/10">
        <Image
          src={`/images/kits/${slug}.png`}
          alt={player.nation}
          fill
          className="object-cover object-top"
          sizes="32px"
        />
      </div>

      {/* Name + nation meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate leading-none mb-0.5">
          {displayName}
        </p>
        <p className="text-xs text-white/40 truncate leading-none">
          {/* Nation instead of club */}
          {player.nation}
          <span className="ml-1.5 px-1 py-0 rounded text-[9px] font-bold uppercase tracking-wide bg-white/10 text-white/60">
            {player.position}
          </span>
          {!player.isAvailable && (
            <span className="ml-1 text-red-400">●</span>
          )}
        </p>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0 w-14">
        <p className="text-xs font-semibold text-white/80">
          ${player.price}m
        </p>
      </div>

      {/* Total points */}
      <div className="text-right flex-shrink-0 w-10">
        <p className="text-xs font-bold text-[#c8f000]">
          {player.totalPoints}
        </p>
      </div>

      {/* Add / Remove button */}
      {mode !== "view" && (
        <button
          id={`btn-player-${player.id}`}
          aria-label={isSelected ? `Remove ${displayName}` : `Add ${displayName}`}
          onClick={isSelected ? onRemove : onAdd}
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all duration-150 text-white",
            isSelected
              ? "bg-secondaryRed-600 hover:bg-secondaryRed-500"
              : "bg-[#c8f000] hover:bg-[#d4ff00] text-black"
          )}
        >
          {isSelected ? <Minus size={14} /> : <Plus size={14} className="text-black" />}
        </button>
      )}
    </div>
  );
}

// ── Pagination controls ────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  startItem: number;
  endItem: number;
  total: number;
}

function Pagination({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  startItem,
  endItem,
  total,
}: PaginationProps) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-white/10 bg-white/2">
      <span className="text-[11px] text-white/40 font-medium">
        {startItem}–{endItem} of {total} players
      </span>
      <div className="flex items-center gap-1">
        <button
          id="btn-page-prev"
          onClick={onPrev}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="w-7 h-7 rounded-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[11px] font-bold text-white/60 px-2">
          {currentPage} / {totalPages}
        </span>
        <button
          id="btn-page-next"
          onClick={onNext}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="w-7 h-7 rounded-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface PlayerSelectionPanelProps {
  players: Player[];
  mode?: "transfer" | "12th-man" | "view";
}

export function PlayerSelectionPanel({ players, mode = "transfer" }: PlayerSelectionPanelProps) {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [nationFilter, setNationFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"totalPoints" | "price">("totalPoints");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);

  // True when any filter deviates from its default value
  const hasActiveFilters =
    posFilter !== "All" || nationFilter !== "All" || sortBy !== "totalPoints";

  const { selectedPlayers, addPlayer, removePlayer, twelfthManId, setTwelfthManId } = useSquadStore();
  const { toast } = useToast();
  const selectedIds = new Set(selectedPlayers.map((p) => p.id));

  // Derive unique nation list
  const nations = useMemo(() => {
    const set = new Set(players.map((p) => p.nation));
    return ["All", ...Array.from(set).sort()];
  }, [players]);

  // Find which lastNames are duplicated within the same nation
  const duplicatedLastNames = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of players) {
      if (p.lastName) {
        const key = `${p.nation}|${p.lastName}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    const duplicated = new Set<string>();
    for (const [key, count] of Object.entries(counts)) {
      if (count > 1) duplicated.add(key);
    }
    return duplicated;
  }, [players]);

  // Filter + sort (reset page when filters change)
  const filtered = useMemo(() => {
    return players
      .filter((p) => {
        const nameMatch =
          search === "" ||
          `${p.firstName} ${p.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (p.knownName?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const posMatch = posFilter === "All" || p.position === posFilter;
        const natMatch = nationFilter === "All" || p.nation === nationFilter;
        return nameMatch && posMatch && natMatch;
      })
      .sort((a, b) =>
        sortBy === "totalPoints"
          ? b.totalPoints - a.totalPoints
          : b.price - a.price
      );
  }, [players, search, posFilter, nationFilter, sortBy]);

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * ITEMS_PER_PAGE;
  const pageEnd = pageStart + ITEMS_PER_PAGE;
  const paginated = filtered.slice(pageStart, pageEnd);

  // Group paginated results by position
  const grouped = useMemo(() => {
    const map: Record<string, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of paginated) {
      if (map[p.position]) map[p.position].push(p);
    }
    return map;
  }, [paginated]);

  // Reset page whenever filters change
  const resetPage = useCallback(() => setPage(1), []);

  const handleFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    resetPage();
  };

  const handleAdd = (player: Player) => {
    if (mode === "12th-man") {
      if (selectedIds.has(player.id)) {
        toast({
          variant: "warning",
          title: "Player already in squad",
          description: "Please select a different player for your 12th man.",
        });
        return;
      }
      setTwelfthManId(player.id);
      return;
    }

    const result = addPlayer(player);
    if (!result.ok && result.reason) {
      const reason = result.reason;

      // Budget exceeded
      if (reason.includes("budget") || reason.includes("exceeds")) {
        toast({
          variant: "error",
          title: "Over budget",
          description: reason,
        });
        return;
      }

      // Nation cap
      if (reason.includes("players from")) {
        toast({
          variant: "warning",
          title: "Nation limit reached",
          description: reason,
        });
        return;
      }

      // Position full
      if (reason.includes("Max") && (reason.includes("GK") || reason.includes("DEF") || reason.includes("MID") || reason.includes("FWD"))) {
        toast({
          variant: "warning",
          title: "Position full",
          description: reason,
        });
        return;
      }

      // Fallback
      toast({ variant: "info", title: reason });
    }
  };

  const handleRemove = (player: Player) => {
    if (mode === "12th-man") {
      setTwelfthManId(null);
      return;
    }
    removePlayer(player.id);
  };

  return (
    <aside className="squad-panel flex flex-col h-full overflow-hidden">
      {/* ── Panel header ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-white/10">
        {/* Row 1: title + filters toggle */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-display font-black text-white">
            {mode === "12th-man" ? "Select 12th Man" : "Player Selection"}
          </h2>

          <button
            id="btn-toggle-filters"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="player-filters-panel"
            className="relative flex-shrink-0 flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] font-bold transition-all duration-150 border"
            style={{
              background: showFilters ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.05)",
              borderColor: showFilters ? "rgba(10,132,255,0.4)" : "rgba(255,255,255,0.12)",
              color: showFilters ? "#50c3ff" : "rgba(255,255,255,0.5)",
            }}
          >
            <SlidersHorizontal size={12} />
            <span>{showFilters ? "Hide" : "Filters"}</span>
            {hasActiveFilters && !showFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primaryBrand-400 border border-[#0f0c1a]" />
            )}
          </button>
        </div>

        {/* Row 2: full-width search */}
        <div className="relative mb-2">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          />
          <input
            id="player-search"
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            className="w-full h-9 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm pl-9 pr-4 focus:outline-none focus:ring-1 focus:ring-primaryBrand-500 focus:border-primaryBrand-500 transition-all"
          />
        </div>

        {/* ── Collapsible filter panel ── */}
        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              id="player-filters-panel"
              key="filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-1 pb-0">
                {/* Filter row — single line, no wrap */}
                <div className="flex items-center gap-1.5">
                  {/* Position filter */}
                  <div className="relative flex-1 min-w-0">
                    <select
                      id="filter-position"
                      value={posFilter}
                      onChange={(e) => handleFilterChange(setPosFilter)(e.target.value)}
                      className="appearance-none w-full h-8 rounded-lg bg-white/5 border border-white/15 text-white text-xs font-semibold pl-2.5 pr-6 focus:outline-none focus:ring-1 focus:ring-primaryBrand-500 cursor-pointer hover:bg-white/10 transition-colors truncate"
                    >
                      <option value="All" className="bg-[#1a1733] text-white">All</option>
                      <option value="GK" className="bg-[#1a1733] text-white">GK</option>
                      <option value="DEF" className="bg-[#1a1733] text-white">DEF</option>
                      <option value="MID" className="bg-[#1a1733] text-white">MID</option>
                      <option value="FWD" className="bg-[#1a1733] text-white">FWD</option>
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                  </div>

                  {/* Sort filter */}
                  <div className="relative flex-1 min-w-0">
                    <select
                      id="filter-sort"
                      value={sortBy}
                      onChange={(e) =>
                        handleFilterChange(setSortBy)(e.target.value as "totalPoints" | "price")
                      }
                      className="appearance-none w-full h-8 rounded-lg bg-white/5 border border-white/15 text-white text-xs font-semibold pl-2.5 pr-6 focus:outline-none focus:ring-1 focus:ring-primaryBrand-500 cursor-pointer hover:bg-white/10 transition-colors truncate"
                    >
                      <option value="totalPoints" className="bg-[#1a1733] text-white">Points</option>
                      <option value="price" className="bg-[#1a1733] text-white">Price</option>
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                  </div>

                  {/* Nation filter */}
                  <div className="relative flex-1 min-w-0">
                    <select
                      id="filter-nation"
                      value={nationFilter}
                      onChange={(e) => handleFilterChange(setNationFilter)(e.target.value)}
                      className="appearance-none w-full h-8 rounded-lg bg-white/5 border border-white/15 text-white text-xs font-semibold pl-2.5 pr-6 focus:outline-none focus:ring-1 focus:ring-primaryBrand-500 cursor-pointer hover:bg-white/10 transition-colors truncate"
                    >
                      {nations.map((n) => (
                        <option key={n} value={n} className="bg-[#1a1733] text-white">
                          {n}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                  </div>

                  {/* Reset — icon only */}
                  <button
                    id="btn-reset-filters"
                    onClick={() => {
                      setSearch("");
                      setPosFilter("All");
                      setNationFilter("All");
                      setSortBy("totalPoints");
                      resetPage();
                    }}
                    aria-label="Reset filters"
                    title="Reset filters"
                    className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/15 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>

                {/* Count bar */}
                <div className="mt-3 rounded-lg bg-primaryBrand-700/50 border border-primaryBrand-500/30 px-3 py-1.5 text-center">
                  <span className="text-xs font-bold text-primaryBrand-300">
                    {filtered.length} player{filtered.length !== 1 ? "s" : ""} shown
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Player list (scrollable) ── */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {POSITION_ORDER.map((pos) => {
          const group = grouped[pos];
          if (!group || group.length === 0) return null;
          return (
            <section key={pos}>
              <h3 className="px-3 py-1.5 text-xs font-black text-white/70 uppercase tracking-widest">
                {POSITION_LABELS[pos]}
              </h3>
              <div className="space-y-0.5">
                {group.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    isSelected={mode === "12th-man" ? twelfthManId === player.id : selectedIds.has(player.id)}
                    onAdd={() => handleAdd(player)}
                    onRemove={() => handleRemove(player)}
                    showFullName={
                      !player.knownName &&
                      (player.lastName ? duplicatedLastNames.has(`${player.nation}|${player.lastName}`) : false)
                    }
                    mode={mode}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search size={32} className="text-white/20 mb-3" />
            <p className="text-sm text-white/40">No players match your filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setPosFilter("All");
                setNationFilter("All");
                resetPage();
              }}
              className="mt-3 text-xs text-primaryBrand-400 hover:text-primaryBrand-300 underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {filtered.length > 0 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          startItem={pageStart + 1}
          endItem={Math.min(pageEnd, filtered.length)}
          total={filtered.length}
        />
      )}
    </aside>
  );
}
