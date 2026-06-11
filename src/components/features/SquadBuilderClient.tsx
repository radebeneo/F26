"use client";

/**
 * src/components/features/SquadBuilderClient.tsx
 *
 * Top-level Client Component for the Squad Builder page.
 * Renders the nav bar, the two-panel layout, and handles
 * the "Enter Squad" action (placeholder toast for now).
 */

import { useState } from "react";
import { LogOut, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayerSelectionPanel } from "@/components/features/PlayerSelectionPanel";
import { SquadSelectionPanel } from "@/components/features/SquadSelectionPanel";
import type { Player } from "@/db/schema";

interface SquadBuilderClientProps {
  players: Player[];
  teamName: string;
  managerName: string;
  signOutAction: () => Promise<void>;
  opponentMap?: Record<string, string>;
}

// ── Toast component ───────────────────────────────────────────────────────────

function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-secondaryGreen-700 border border-secondaryGreen-500/40 shadow-2xl shadow-black/50 text-white text-sm font-semibold max-w-sm"
    >
      <CheckCircle2 size={18} className="text-secondaryGreen-300 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:text-white/70 transition-colors"
        aria-label="Close notification"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SquadBuilderClient({
  players,
  teamName,
  managerName,
  signOutAction,
  opponentMap,
}: SquadBuilderClientProps) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleEnterSquad = () => {
    showToast(
      "Squad submitted! Save functionality coming in the next feature update."
    );
  };

  return (
    <div className="squad-builder-root">
      {/* ── Sticky top nav ── */}
      <header className="squad-nav">
        <div className="squad-nav-inner">
          {/* Wordmark */}
          <div className="flex items-center">
            <span className="font-display font-black text-white text-sm tracking-widest uppercase">
              F26 Fantasy
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {["My Squad", "Fixtures", "Leaderboard", "How to Play"].map(
              (link) => (
                <button
                  key={link}
                  className="text-xs font-bold text-white/60 hover:text-white transition-colors uppercase tracking-wide"
                >
                  {link}
                </button>
              )
            )}
          </nav>

          {/* Sign out */}
          <form action={signOutAction}>
            <button
              type="submit"
              id="btn-sign-out"
              className="flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* ── Two-panel layout ── */}
      <main className="squad-builder-body" id="squad-builder-main">
        {/* Left: Player Selection */}
        <div className="squad-builder-left">
          <PlayerSelectionPanel players={players} />
        </div>

        {/* Right: Squad Selection */}
        <div className="squad-builder-right">
          <SquadSelectionPanel
            teamName={teamName}
            managerName={managerName}
            allPlayers={players}
            onEnterSquad={handleEnterSquad}
            opponentMap={opponentMap}
          />
        </div>
      </main>

      {/* ── Toast notifications ── */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
