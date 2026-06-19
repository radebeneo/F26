"use client";

/**
 * src/components/features/HowToPlayModal.tsx
 *
 * "How to Play" pop-up modal that appears automatically on a user's
 * first visit to the dashboard after sign-in.
 *
 * Detection: localStorage key `fwc26_htp_seen`.
 * If the key is absent the modal opens; once the user dismisses it the
 * key is written so it never shows again on the same device.
 *
 * Content:
 *  - Mirrors the homepage feature cards  (steps 1-3)
 *  - References the player showcase strip (step 4 — scoring highlights)
 *  - Scoring overview pulled from the same data as HowToScorePanel
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Users, TrendingUp, Trophy, Star } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface Step {
  id: string;
  icon: React.ElementType;
  accentColor: string;
  label: string;
  heading: string;
  body: string;
  /** Optional visual panel rendered on the right side */
  visual?: React.ReactNode;
}

// ── Scoring highlights (matching HowToScorePanel data) ───────────────────────

const SCORING_HIGHLIGHTS = [
  { action: "Appearance (60+ mins)", pts: "+2" },
  { action: "Goal (GK / DEF)", pts: "+9 / +7" },
  { action: "Goal (MID)", pts: "+6" },
  { action: "Goal (FWD)", pts: "+5" },
  { action: "Assist", pts: "+3" },
  { action: "Clean sheet (GK/DEF, 60+)", pts: "+5" },
  { action: "Yellow card", pts: "−1" },
  { action: "Red card", pts: "−2" },
];

// ── Featured player images (same as homepage showcase strip) ─────────────────

const SHOWCASE_PLAYERS = [
  { src: "/images/messi.png", name: "Messi" },
  { src: "/images/pulisic.png", name: "Pulisic" },
  { src: "/images/mctominay.png", name: "McTominay" },
  { src: "/images/jimenez.png", name: "Jiménez" },
  { src: "/images/davids.png", name: "David" },
];

// ── Step definitions ─────────────────────────────────────────────────────────

function ScoreVisual() {
  return (
    <div className="grid grid-cols-1 gap-1.5 w-full">
      {SCORING_HIGHLIGHTS.map(({ action, pts }) => {
        const isNeg = pts.startsWith("−") || pts.startsWith("-");
        return (
          <div
            key={action}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/8"
          >
            <span className="text-xs text-white/80 font-medium">{action}</span>
            <span
              className={cn(
                "text-xs font-black tabular-nums",
                isNeg ? "text-red-400" : "text-[#c8f000]"
              )}
            >
              {pts}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PlayersVisual() {
  return (
    <div className="flex items-end justify-center gap-2 w-full">
      {SHOWCASE_PLAYERS.map(({ src, name }, i) => (
        <motion.div
          key={name}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
          className={cn(
            "relative flex-shrink-0 rounded-lg overflow-hidden shadow-xl",
            // Middle card slightly larger
            i === 2
              ? "w-[68px] h-[92px]"
              : i === 1 || i === 3
              ? "w-[60px] h-[80px]"
              : "w-[52px] h-[68px]"
          )}
        >
          <Image
            src={src}
            alt={name}
            fill
            className="object-cover object-top"
            sizes="80px"
          />
        </motion.div>
      ))}
    </div>
  );
}

function PitchVisual() {
  return (
    <div className="relative w-[160px] h-[200px] mx-auto">
      {/* Pitch */}
      <div
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          background:
            "repeating-linear-gradient(to bottom, #018a32 0%, #018a32 20px, #009639 20px, #009639 40px)",
          border: "2px solid rgba(255,255,255,0.4)",
        }}
      />
      {/* Markings */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 80 100"
        fill="none"
      >
        <rect x="2" y="2" width="76" height="96" stroke="white" strokeWidth="0.6" />
        <rect x="20" y="2" width="40" height="18" stroke="white" strokeWidth="0.6" />
        <line x1="2" y1="50" x2="78" y2="50" stroke="white" strokeWidth="0.6" />
        <circle cx="40" cy="50" r="12" stroke="white" strokeWidth="0.6" />
        <circle cx="40" cy="50" r="0.8" fill="white" />
      </svg>
      {/* Player dots */}
      {[
        { cx: "40%", cy: "88%", pos: "GK" },
        { cx: "20%", cy: "72%", pos: "DEF" },
        { cx: "50%", cy: "72%", pos: "DEF" },
        { cx: "80%", cy: "72%", pos: "DEF" },
        { cx: "25%", cy: "54%", pos: "MID" },
        { cx: "50%", cy: "52%", pos: "MID" },
        { cx: "75%", cy: "54%", pos: "MID" },
        { cx: "30%", cy: "34%", pos: "FWD" },
        { cx: "70%", cy: "34%", pos: "FWD" },
      ].map(({ cx, cy, pos }, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 260 }}
          className="absolute flex flex-col items-center gap-0.5"
          style={{ left: cx, top: cy, transform: "translate(-50%, -50%)" }}
        >
          <div className="w-5 h-5 rounded-full bg-[#c8f000] border-2 border-white shadow-md flex items-center justify-center">
            <span className="text-[5px] font-black text-black">{pos[0]}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CaptainVisual() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#c8f000]/30 to-[#c8f000]/5 border-2 border-[#c8f000]/40 flex items-center justify-center shadow-[0_0_40px_rgba(200,240,0,0.2)]">
          <Star className="text-[#c8f000]" size={40} fill="currentColor" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#c8f000] flex items-center justify-center shadow-lg"
        >
          <span className="text-black font-black text-sm">C</span>
        </motion.div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-white font-black text-lg">2×</p>
        <p className="text-white/60 text-xs">Captain earns double points</p>
      </div>
      <div className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-center">
        <p className="text-xs text-white/50 mb-1">Vice-captain fallback</p>
        <p className="text-xs text-white/80 font-medium">
          If captain plays <span className="text-red-400 font-black">0 mins</span>, the
          vice-captain earns <span className="text-[#c8f000] font-black">2×</span> instead
        </p>
      </div>
    </div>
  );
}

// ── Steps config ─────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: "pick-squad",
    icon: Users,
    accentColor: "#c8f000",
    label: "Step 1",
    heading: "Build Your Team",
    body: "Select 15 players within a £100m budget — 2 GK, 5 DEF, 5 MID, 3 FWD. Your starting XI will earn points in every match. Choose wisely!",
    visual: <PitchVisual />,
  },
  {
    id: "showcase",
    icon: TrendingUp,
    accentColor: "#36b9ff",
    label: "Step 2",
    heading: "Maximise Your Performance",
    body: "Pick from world-class stars across 48 nations. Use transfers and boosters between gameweeks to stay ahead of the competition.",
    visual: <PlayersVisual />,
  },
  {
    id: "captain",
    icon: Star,
    accentColor: "#ffd700",
    label: "Step 3",
    heading: "Captain & Vice-Captain",
    body: "Appoint a captain to earn 2× points. If your captain doesn't play, your vice-captain steps up automatically — never waste a multiplier.",
    visual: <CaptainVisual />,
  },
  {
    id: "score",
    icon: Trophy,
    accentColor: "#ff6b4a",
    label: "Step 4",
    heading: "How Scoring Works",
    body: "Points are calculated from real match data after every fixture. Goals, assists, clean sheets, saves, and cards all count.",
    visual: <ScoreVisual />,
  },
  {
    id: "leagues",
    icon: Trophy,
    accentColor: "#a855f7",
    label: "Step 5",
    heading: "Challenge Your Friends",
    body: "Create or join a private league with your friends and colleagues. Compete on the global leaderboard — 8 gameweeks, one champion.",
    visual: undefined,
  },
];

// ── Local storage key ─────────────────────────────────────────────────────────

const LS_KEY = "fwc26_htp_seen";

// ── Modal component ───────────────────────────────────────────────────────────

interface HowToPlayModalProps {
  /** Force-open the modal regardless of localStorage (e.g. triggered from nav) */
  forceOpen?: boolean;
  onClose?: () => void;
}

export function HowToPlayModal({ forceOpen = false, onClose }: HowToPlayModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  // On mount, check localStorage to decide whether to auto-open
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    try {
      const seen = localStorage.getItem(LS_KEY);
      if (!seen) {
        setIsOpen(true);
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — show anyway
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleClose = () => {
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {
      // ignore
    }
    setIsOpen(false);
    setStep(0);
    onClose?.();
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => setStep((s) => Math.max(0, s - 1));

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const hasVisual = !!current.visual;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="htp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* ── Modal panel ── */}
          <motion.div
            key="htp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="htp-heading"
            id="how-to-play-modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-2xl pointer-events-auto rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Gradient header strip ── */}
              <div
                className="h-1.5 w-full"
                style={{
                  background: `linear-gradient(90deg, ${current.accentColor}, ${current.accentColor}88)`,
                }}
              />

              {/* ── Body ── */}
              <div className="bg-[#0d1526] border border-white/10 rounded-b-2xl">
                {/* Close button */}
                <button
                  id="btn-htp-close"
                  onClick={handleClose}
                  aria-label="Close How to Play"
                  className="absolute top-4 right-4 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-colors z-10"
                >
                  <X size={14} />
                </button>

                {/* ── Content area ── */}
                <div className={cn("flex gap-0", hasVisual ? "min-h-[420px]" : "min-h-[320px]")}>
                  {/* Left — text pane */}
                  <div className="flex-1 flex flex-col justify-between p-8">
                    {/* Top: badge + heading + body */}
                    <div className="flex-1 flex flex-col justify-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="space-y-5"
                        >
                          {/* Step badge */}
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: `${current.accentColor}22`, border: `1.5px solid ${current.accentColor}55` }}
                            >
                              <Icon size={20} style={{ color: current.accentColor }} />
                            </div>
                            <span
                              className="text-xs font-black uppercase tracking-widest"
                              style={{ color: current.accentColor }}
                            >
                              {current.label}
                            </span>
                          </div>

                          {/* Heading */}
                          <h2
                            id="htp-heading"
                            className="font-display font-black text-white text-2xl uppercase leading-tight tracking-wide"
                          >
                            {current.heading}
                          </h2>

                          {/* Body */}
                          <p className="text-sm text-white/65 leading-relaxed max-w-sm">
                            {current.body}
                          </p>

                          {/* Final-step call-to-action hint */}
                          {isLast && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 }}
                              className="flex items-center gap-2 p-3 rounded-xl bg-[#c8f000]/10 border border-[#c8f000]/25"
                            >
                              <Trophy size={16} className="text-[#c8f000] flex-shrink-0" />
                              <p className="text-xs text-white/80 font-medium">
                                You&apos;re ready! Head to the Squad Builder and pick your 15.
                              </p>
                            </motion.div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* ── Bottom: step dots + navigation ── */}
                    <div className="mt-8 flex items-center justify-between">
                      {/* Dot indicators */}
                      <div className="flex items-center gap-1.5">
                        {STEPS.map((_, i) => (
                          <button
                            key={i}
                            id={`btn-htp-dot-${i}`}
                            onClick={() => setStep(i)}
                            aria-label={`Go to step ${i + 1}`}
                            className="transition-all duration-200"
                          >
                            <span
                              className="block rounded-full transition-all duration-200"
                              style={{
                                width: i === step ? 20 : 7,
                                height: 7,
                                background:
                                  i === step ? current.accentColor : "rgba(255,255,255,0.2)",
                              }}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Prev / Next */}
                      <div className="flex items-center gap-2">
                        {step > 0 && (
                          <button
                            id="btn-htp-prev"
                            onClick={handlePrev}
                            className="flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                          >
                            <ChevronLeft size={14} />
                            Back
                          </button>
                        )}
                        <button
                          id="btn-htp-next"
                          onClick={handleNext}
                          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all duration-150 hover:brightness-110 hover:-translate-y-px active:translate-y-0"
                          style={{
                            background: current.accentColor,
                            color: isLast ? "#000" : "#000",
                          }}
                        >
                          {isLast ? "Let's Go!" : "Next"}
                          {!isLast && <ChevronRight size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right — visual pane (hidden on mobile) */}
                  {hasVisual && (
                    <div className="hidden md:flex w-[260px] flex-shrink-0 border-l border-white/8 items-center justify-center p-6 bg-white/[0.02]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`visual-${step}`}
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="w-full"
                        >
                          {current.visual}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
