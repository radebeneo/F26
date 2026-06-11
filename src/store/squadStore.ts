/**
 * src/store/squadStore.ts
 *
 * Zustand store for live squad-builder state.
 * This is client-side only — never import in Server Components.
 *
 * Squad rules enforced here:
 *  - Max 15 players total
 *  - Composition: 2 GK, 5 DEF, 5 MID, 3 FWD
 *  - Budget cap: $100m
 */

import { create } from "zustand";
import type { Player } from "@/db/schema";

// ── Constants ────────────────────────────────────────────────────────────────

export const BUDGET_LIMIT = 100; // $m
export const MAX_SQUAD_SIZE = 15;

const POSITION_LIMITS: Record<string, number> = {
  GK: 2,
  DEF: 5,
  MID: 5,
  FWD: 3,
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SquadState {
  /** All players currently selected in the squad */
  selectedPlayers: Player[];

  /** Add a player — validates composition + budget rules */
  addPlayer: (player: Player) => { ok: boolean; reason?: string };

  /** Remove a player by id */
  removePlayer: (playerId: number) => void;

  /** Clear the entire squad */
  reset: () => void;

  /**
   * Auto-pick a valid 15-player squad from the provided pool.
   * Strategy: pick highest total-points players within budget,
   * respecting position quotas.
   */
  autoPick: (allPlayers: Player[]) => void;

  // ── Derived helpers (computed inline) ──
  /** $m spent so far */
  budget: () => number;
  /** $m remaining */
  budgetRemaining: () => number;
  /** Count of selected players per position */
  positionCounts: () => Record<string, number>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSquadStore = create<SquadState>((set, get) => ({
  selectedPlayers: [],

  // ── Add ──────────────────────────────────────────────────────────────────
  addPlayer: (player) => {
    const { selectedPlayers } = get();

    // Already selected
    if (selectedPlayers.some((p) => p.id === player.id)) {
      return { ok: false, reason: "Player already in squad" };
    }

    // Max squad size
    if (selectedPlayers.length >= MAX_SQUAD_SIZE) {
      return { ok: false, reason: "Squad is full (15 players max)" };
    }

    // Position quota
    const posCount = selectedPlayers.filter(
      (p) => p.position === player.position
    ).length;
    const limit = POSITION_LIMITS[player.position] ?? 0;
    if (posCount >= limit) {
      return {
        ok: false,
        reason: `Max ${limit} ${player.position} players allowed`,
      };
    }

    // Budget check
    const spent = selectedPlayers.reduce((sum, p) => sum + p.price, 0);
    if (spent + player.price > BUDGET_LIMIT) {
      return { ok: false, reason: "Exceeds $100m budget" };
    }

    set({ selectedPlayers: [...selectedPlayers, player] });
    return { ok: true };
  },

  // ── Remove ───────────────────────────────────────────────────────────────
  removePlayer: (playerId) => {
    set((s) => ({
      selectedPlayers: s.selectedPlayers.filter((p) => p.id !== playerId),
    }));
  },

  // ── Reset ─────────────────────────────────────────────────────────────────
  reset: () => set({ selectedPlayers: [] }),

  // ── Auto Pick ─────────────────────────────────────────────────────────────
  autoPick: (allPlayers) => {
    // Sort each position group by totalPoints desc
    const byPosition: Record<string, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of allPlayers) {
      if (p.isAvailable && byPosition[p.position]) {
        byPosition[p.position].push(p);
      }
    }
    for (const pos of Object.keys(byPosition)) {
      byPosition[pos].sort((a, b) => b.totalPoints - a.totalPoints);
    }

    const picked: Player[] = [];
    let spent = 0;

    const tryPick = (pos: string, count: number) => {
      let taken = 0;
      for (const p of byPosition[pos]) {
        if (taken >= count) break;
        if (spent + p.price <= BUDGET_LIMIT && !picked.some((x) => x.id === p.id)) {
          picked.push(p);
          spent += p.price;
          taken++;
        }
      }
    };

    tryPick("GK", 2);
    tryPick("DEF", 5);
    tryPick("MID", 5);
    tryPick("FWD", 3);

    set({ selectedPlayers: picked });
  },

  // ── Derived ──────────────────────────────────────────────────────────────
  budget: () =>
    get().selectedPlayers.reduce((sum, p) => sum + p.price, 0),

  budgetRemaining: () =>
    BUDGET_LIMIT - get().selectedPlayers.reduce((sum, p) => sum + p.price, 0),

  positionCounts: () => {
    const counts: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const p of get().selectedPlayers) {
      counts[p.position] = (counts[p.position] ?? 0) + 1;
    }
    return counts;
  },
}));
