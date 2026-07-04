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

export const BUDGET_LIMIT = 105; // $m
export const MAX_SQUAD_SIZE = 15;

const POSITION_LIMITS: Record<string, number> = {
  GK: 2,
  DEF: 5,
  MID: 5,
  FWD: 3,
};

function computeDefaultSquadState(players: Player[]) {
  if (players.length < MAX_SQUAD_SIZE) {
    return { startingXI: [], bench: [], captainId: null, viceCaptainId: null };
  }

  const byPos: Record<string, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) {
    byPos[p.position].push(p);
  }

  const startingGK = byPos.GK.slice(0, 1);
  const startingDEF = byPos.DEF.slice(0, 4);
  const startingMID = byPos.MID.slice(0, 4);
  const startingFWD = byPos.FWD.slice(0, 2);

  const startingPlayers = [...startingGK, ...startingDEF, ...startingMID, ...startingFWD];
  const benchPlayers = [
    ...byPos.GK.slice(1),
    ...byPos.DEF.slice(4),
    ...byPos.MID.slice(4),
    ...byPos.FWD.slice(2),
  ];

  const sorted = [...players].sort((a, b) => b.totalPoints - a.totalPoints);
  const captainId = sorted[0]?.id ?? null;
  const viceCaptainId = sorted[1]?.id ?? null;

  return {
    startingXI: startingPlayers.map((p) => p.id),
    bench: benchPlayers.map((p) => p.id),
    captainId,
    viceCaptainId,
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SquadState {
  /** All players currently selected in the squad */
  selectedPlayers: Player[];

  startingXI: number[];
  bench: number[];
  captainId: number | null;
  viceCaptainId: number | null;
  twelfthManId: number | null;
  activeBooster: string | null;

  /** Add a player — validates composition + budget rules */
  addPlayer: (player: Player) => { ok: boolean; reason?: string };

  /** Remove a player by id */
  removePlayer: (playerId: number) => void;

  /** Set the initial squad from the database (for returning users) */
  setInitialSquad: (players: Player[]) => void;

  /** Set the full squad state explicitly (e.g., from DB after loading) */
  setFullSquadState: (state: Partial<SquadState>) => void;

  /** Clear the entire squad */
  reset: () => void;

  /**
   * Auto-pick a valid 15-player squad from the provided pool.
   * Strategy: pick highest total-points players within budget,
   * respecting position quotas.
   */
  autoPick: (allPlayers: Player[]) => void;

  setCaptainId: (id: number) => void;
  setViceCaptainId: (id: number) => void;
  setTwelfthManId: (id: number | null) => void;
  setActiveBooster: (boosterId: string | null) => void;
  substitutePlayer: (subOutId: number, subInId: number) => { ok: boolean; reason?: string };

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
  startingXI: [],
  bench: [],
  captainId: null,
  viceCaptainId: null,
  twelfthManId: null,
  activeBooster: null,

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

    // Nation limit (max 4 per nation)
    const MAX_PER_NATION = 4;
    const nationCount = selectedPlayers.filter(
      (p) => p.nation === player.nation
    ).length;
    if (nationCount >= MAX_PER_NATION) {
      return {
        ok: false,
        reason: `Max ${MAX_PER_NATION} players from ${player.nation} allowed`,
      };
    }

    // Budget check
    const spent = selectedPlayers.reduce((sum, p) => sum + p.price, 0);
    if (spent + player.price > BUDGET_LIMIT) {
      return {
        ok: false,
        reason: `${player.firstName} ${player.lastName} costs $${player.price}m — exceeds your $${(BUDGET_LIMIT - spent).toFixed(1)}m remaining budget`,
      };
    }

    const newPlayers = [...selectedPlayers, player];
    set({
      selectedPlayers: newPlayers,
      ...computeDefaultSquadState(newPlayers),
    });
    return { ok: true };
  },

  // ── Remove ───────────────────────────────────────────────────────────────
  removePlayer: (playerId) => {
    set((s) => {
      const newPlayers = s.selectedPlayers.filter((p) => p.id !== playerId);
      return {
        selectedPlayers: newPlayers,
        ...computeDefaultSquadState(newPlayers),
      };
    });
  },

  // ── Set Initial Squad ─────────────────────────────────────────────────────
  setInitialSquad: (players) => {
    set({
      selectedPlayers: players,
      ...computeDefaultSquadState(players),
    });
  },

  setFullSquadState: (state) => set(state),

  // ── Reset ─────────────────────────────────────────────────────────────────
  reset: () => set({
    selectedPlayers: [],
    startingXI: [],
    bench: [],
    captainId: null,
    viceCaptainId: null,
    twelfthManId: null,
    activeBooster: null,
  }),

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

    set({
      selectedPlayers: picked,
      ...computeDefaultSquadState(picked),
    });
  },

  setCaptainId: (id) => {
    const { captainId, viceCaptainId } = get();
    if (id === viceCaptainId) {
      // Swap them
      set({ captainId: id, viceCaptainId: captainId });
    } else {
      set({ captainId: id });
    }
  },

  setViceCaptainId: (id) => {
    const { captainId, viceCaptainId } = get();
    if (id === captainId) {
      // Swap them
      set({ captainId: viceCaptainId, viceCaptainId: id });
    } else {
      set({ viceCaptainId: id });
    }
  },

  setTwelfthManId: (id) => set({ twelfthManId: id }),
  setActiveBooster: (boosterId) => set({ activeBooster: boosterId }),

  substitutePlayer: (subOutId, subInId) => {
    const { startingXI, bench, selectedPlayers } = get();
    
    // Ensure one is on pitch and one is on bench
    const isOutInXI = startingXI.includes(subOutId);
    const isInOnBench = bench.includes(subInId);
    
    if (!isOutInXI || !isInOnBench) {
      return { ok: false, reason: "Invalid substitution players" };
    }

    const playerOut = selectedPlayers.find((p) => p.id === subOutId);
    const playerIn = selectedPlayers.find((p) => p.id === subInId);

    if (!playerOut || !playerIn) {
      return { ok: false, reason: "Players not found" };
    }

    // If both are same position, it's always valid
    if (playerOut.position === playerIn.position) {
      const newXI = startingXI.map((id) => (id === subOutId ? subInId : id));
      const newBench = bench.map((id) => (id === subInId ? subOutId : id));
      set({ startingXI: newXI, bench: newBench });
      return { ok: true };
    }

    // GK can only swap with GK
    if (playerOut.position === "GK" || playerIn.position === "GK") {
      return { ok: false, reason: "Goalkeeper can only substitute for a Goalkeeper" };
    }

    // Check min/max bounds for positions
    const posCounts: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const id of startingXI) {
      const p = selectedPlayers.find((x) => x.id === id);
      if (p) posCounts[p.position]++;
    }

    posCounts[playerOut.position]--;
    posCounts[playerIn.position]++;

    if (posCounts.DEF < 3) return { ok: false, reason: "Must have at least 3 Defenders" };
    if (posCounts.DEF > 5) return { ok: false, reason: "Cannot have more than 5 Defenders" };
    if (posCounts.MID < 3) return { ok: false, reason: "Must have at least 3 Midfielders" };
    if (posCounts.MID > 5) return { ok: false, reason: "Cannot have more than 5 Midfielders" };
    if (posCounts.FWD < 1) return { ok: false, reason: "Must have at least 1 Forward" };
    if (posCounts.FWD > 3) return { ok: false, reason: "Cannot have more than 3 Forwards" };

    const newXI = startingXI.map((id) => (id === subOutId ? subInId : id));
    const newBench = bench.map((id) => (id === subInId ? subOutId : id));
    set({ startingXI: newXI, bench: newBench });
    return { ok: true };
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
