"use client";

/**
 * src/components/features/SquadBuilderClient.tsx
 *
 * Top-level Client Component for the Squad Builder page.
 * Renders the nav bar, the two-panel layout, and handles
 * the "Enter Squad" action — saving the squad to the DB via POST /api/squad/enter.
 */

import { useState, useEffect, useRef } from "react";
import { LogOut, Menu, X, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PlayerSelectionPanel } from "@/components/features/PlayerSelectionPanel";
import { SquadSelectionPanel } from "@/components/features/SquadSelectionPanel";
import { MySquadView } from "@/components/features/MySquadView";
import { HowToPlayModal } from "@/components/features/HowToPlayModal";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { useSquadStore } from "@/store/squadStore";
import type { Player } from "@/db/schema";
import type { SquadState } from "@/store/squadStore";

type ViewMode = "builder" | "mySquad";

interface SquadBuilderClientProps {
  players: Player[];
  teamName: string;
  managerName: string;
  favoriteCountry: string;
  signOutAction: () => Promise<void>;
  opponentMap?: Record<string, string>;
  /** True when the user has already submitted a squad — skip the builder */
  hasExistingSquad?: boolean;
  /** Pre-populated state if hasExistingSquad is true */
  initialSquadState?: Partial<SquadState> | null;
  /** True when the user has already joined a league */
  hasJoinedLeague?: boolean;
}

// ── Inner component (needs ToastProvider in tree) ────────────────────────────

function SquadBuilderInner({
  players,
  teamName,
  managerName,
  favoriteCountry,
  signOutAction,
  opponentMap,
  hasExistingSquad = false,
  initialSquadState = null,
  hasJoinedLeague = false,
}: SquadBuilderClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { selectedPlayers, setFullSquadState } = useSquadStore();
  const [view, setView] = useState<ViewMode>(hasExistingSquad ? "mySquad" : "builder");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Initialize the squad store with the user's existing players
  const initialized = useRef(false);
  useEffect(() => {
    if (hasExistingSquad && initialSquadState && !initialized.current) {
      setFullSquadState(initialSquadState);
      initialized.current = true;
    }
  }, [hasExistingSquad, initialSquadState, setFullSquadState]);

  // Track whether squad has been saved this session (covers the post-submit case
  // where hasExistingSquad was false on load but the user just submitted).
  const [squadSaved, setSquadSaved] = useState(hasExistingSquad);

  const handleEnterSquad = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/squad/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerIds: selectedPlayers.map((p) => p.id),
        }),
      });

      const data = (await res.json()) as { success: boolean; error?: string };

      if (!res.ok || !data.success) {
        toast({
          title: "Failed to enter squad",
          description: data.error ?? "Something went wrong. Please try again.",
          variant: "error",
        });
        return;
      }

      toast({
        title: "Squad entered! 🎉",
        description: "Your squad has been saved. Good luck!",
        variant: "success",
      });
      // Lock the builder and switch to My Squad
      setSquadSaved(true);
      setView("mySquad");
      router.refresh();
    } catch {
      toast({
        title: "Network error",
        description: "Could not reach the server. Check your connection.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavClick = (target: ViewMode | null) => {
    if (!target) return;
    // Once a squad is saved, the builder is permanently locked
    if (target === "builder" && squadSaved) return;
    setView(target);
    setIsMobileMenuOpen(false); // Close mobile menu on navigate
  };

  // Nav links — Squad Builder is hidden once the user has a saved squad
  const navLinks: { label: string; target?: ViewMode; href?: string; action?: () => void }[] = [
    ...(!squadSaved ? [{ label: "Squad Builder", target: "builder" as ViewMode }] : []),
    { label: "My Squad", target: "mySquad" as ViewMode },
    { label: "Group Stage", href: "/fixtures" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "How to Play", action: () => setIsHowToPlayOpen(true) },
  ];

  return (
    <div className="squad-builder-root" id="squad-builder-root">
      {/* ── How to Play modal (auto-shows on first sign-in) ── */}
      <HowToPlayModal
        forceOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
      {/* ── Sticky top nav ── */}
      <header className="squad-nav">
        <div className="squad-nav-inner">
          {/* Wordmark */}
          <div className="flex items-center">
            <span className="font-display font-black text-white text-sm tracking-widest uppercase">
              FWC26 Fantasy
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(({ label, target, href, action }) => {
              if (href) {
                return (
                  <Link
                    key={label}
                    href={href}
                    className="text-xs font-bold transition-colors uppercase tracking-wide text-white/60 hover:text-white"
                  >
                    {label}
                  </Link>
                );
              }
              if (action) {
                return (
                  <button
                    key={label}
                    id="btn-how-to-play-nav"
                    onClick={action}
                    className="flex items-center gap-1.5 text-xs font-bold transition-colors uppercase tracking-wide text-white/60 hover:text-white"
                  >
                    <HelpCircle size={13} />
                    {label}
                  </button>
                );
              }
              return (
                <button
                  key={label}
                  onClick={() => target && handleNavClick(target)}
                  className={cn(
                    "text-xs font-bold transition-colors uppercase tracking-wide",
                    target && view === target
                      ? "text-[#c8f000]"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            {/* Sign out */}
            <form action={signOutAction} className="hidden md:block">
              <button
                type="submit"
                id="btn-sign-out"
                className="flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </form>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-white/80 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu dropdown ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-[#0a0a0a] border-b border-white/10 overflow-hidden absolute top-[52px] left-0 w-full z-40"
          >
            <div className="flex flex-col py-4 px-6 gap-4">
              {navLinks.map(({ label, target, href, action }) => {
                if (href) {
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-bold transition-colors uppercase tracking-wide text-white/60 hover:text-white"
                    >
                      {label}
                    </Link>
                  );
                }
                if (action) {
                  return (
                    <button
                      key={label}
                      onClick={() => { action(); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-1.5 text-sm font-bold transition-colors uppercase tracking-wide text-left text-white/60 hover:text-white"
                    >
                      <HelpCircle size={14} />
                      {label}
                    </button>
                  );
                }
                return (
                  <button
                    key={label}
                    onClick={() => target && handleNavClick(target)}
                    className={cn(
                      "text-sm font-bold transition-colors uppercase tracking-wide text-left",
                      target && view === target
                        ? "text-[#c8f000]"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
              <div className="h-px w-full bg-white/10 my-2" />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── View content ── */}
      <AnimatePresence mode="wait">
        {view === "builder" ? (
          <motion.div
            key="builder-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0 h-full w-full"
          >
            <main className="squad-builder-body" id="squad-builder-main">
              {/* Left: Player Selection */}
              <div className="squad-builder-left">
                <PlayerSelectionPanel players={players} opponentMap={opponentMap} />
              </div>

              {/* Right: Squad Selection */}
              <div className="squad-builder-right">
                <SquadSelectionPanel
                  teamName={teamName}
                  managerName={managerName}
                  favoriteCountry={favoriteCountry}
                  allPlayers={players}
                  onEnterSquad={handleEnterSquad}
                  isSubmitting={isSubmitting}
                  opponentMap={opponentMap}
                />
              </div>
            </main>
          </motion.div>
        ) : (
          <motion.div
            key="my-squad-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0 h-full w-full"
          >
            <MySquadView
              teamName={teamName}
              managerName={managerName}
              favoriteCountry={favoriteCountry}
              allPlayers={players}
              opponentMap={opponentMap}
              initialSquadState={initialSquadState}
              hasJoinedLeague={hasJoinedLeague}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ── Public export — wraps inner with ToastProvider ────────────────────────────

export function SquadBuilderClient(props: SquadBuilderClientProps) {
  return (
    <ToastProvider>
      <SquadBuilderInner {...props} />
    </ToastProvider>
  );
}
