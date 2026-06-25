"use client";

import { useState } from "react";
import { LogOut, Menu, X, HelpCircle, ChevronLeft, ChevronRight, Calendar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HowToPlayModal } from "@/components/features/HowToPlayModal";

interface FixturesClientProps {
  signOutAction: () => Promise<void>;
}

type PageTab = "fixtures" | "standings";

// ── Fixtures data ──────────────────────────────────────────────────────────────
const GROUPS = [
  { id: "A", label: "GROUP A", image: "/images/matches/groupA.png", color: "#00C86E", teams: ["Mexico", "South Korea", "Czechia", "South Africa"] },
  { id: "B", label: "GROUP B", image: "/images/matches/groupB.png", color: "#E8214A", teams: ["Canada", "Switzerland", "Bosnia-Herzegovina", "Qatar"] },
  { id: "C", label: "GROUP C", image: "/images/matches/groupC.png", color: "#FF8C00", teams: ["Brazil", "Scotland", "Morocco", "Haiti"] },
  { id: "D", label: "GROUP D", image: "/images/matches/groupD.png", color: "#3B5FE8", teams: ["United States", "Türkiye", "Australia", "Paraguay"] },
  { id: "E", label: "GROUP E", image: "/images/matches/groupE.png", color: "#6C3DD8", teams: ["Germany", "Netherlands", "Ecuador", "Curacao"] },
  { id: "F", label: "GROUP F", image: "/images/matches/groupF.png", color: "#C8A200", teams: ["Spain", "Belgium", "Uruguay", "Cabo Verde"] },
  { id: "G", label: "GROUP G", image: "/images/matches/groupG.png", color: "#EC4899", teams: ["France", "Norway", "Senegal", "Iraq"] }, // Pink
  { id: "H", label: "GROUP H", image: "/images/matches/groupH.png", color: "#34D399", teams: ["Argentina", "Austria", "Algeria", "Jordan"] }, // Mint
  { id: "I", label: "GROUP I", image: "/images/matches/groupI.png", color: "#A855F7", teams: ["Portugal", "Colombia", "Uzbekistan", "Congo DR"] }, // Purple
  { id: "J", label: "GROUP J", image: "/images/matches/groupJ.png", color: "#14B8A6", teams: ["England", "Panama", "Ghana", "Croatia"] }, // Teal
  { id: "K", label: "GROUP K", image: "/images/matches/groupK.png", color: "#F97316", teams: ["Saudi Arabia", "Spain", "Iran", "New Zealand"] }, // Orange
  { id: "L", label: "GROUP L", image: "/images/matches/groupL.png", color: "#1B6CA8", teams: ["Qatar", "Switzerland", "Egypt", "Belgium"] },
] as const;

// ── Standings data ─────────────────────────────────────────────────────────────
const STANDINGS = [
  { id: "A", label: "GROUP A", image: "/images/standings/A.png", color: "#00C86E" },
  { id: "B", label: "GROUP B", image: "/images/standings/B.png", color: "#E8214A" },
  { id: "C", label: "GROUP C", image: "/images/standings/C.png", color: "#FF8C00" },
  { id: "D", label: "GROUP D", image: "/images/standings/D.png", color: "#3B5FE8" },
  { id: "E", label: "GROUP E", image: "/images/standings/E.png", color: "#6C3DD8" },
  { id: "F", label: "GROUP F", image: "/images/standings/F.png", color: "#C8A200" },
  { id: "G", label: "GROUP G", image: "/images/standings/G.png", color: "#EC4899" }, // Pink
  { id: "H", label: "GROUP H", image: "/images/standings/H.png", color: "#34D399" }, // Mint
  { id: "I", label: "GROUP I", image: "/images/standings/I.png", color: "#A855F7" }, // Purple
  { id: "J", label: "GROUP J", image: "/images/standings/J.png", color: "#14B8A6" }, // Teal
  { id: "K", label: "GROUP K", image: "/images/standings/K.png", color: "#F97316" }, // Orange
  { id: "L", label: "GROUP L", image: "/images/standings/L.png", color: "#1B6CA8" },
] as const;

const THIRD_PLACED = {
  id: "3RD",
  label: "Ranking of Third Placed Teams",
  image: "/images/standings/3RD.png",
  color: "#FFFFFF",
  textColor: "#000000",
} as const;

type FixtureGroupId = typeof GROUPS[number]["id"];
type StandingGroupId = typeof STANDINGS[number]["id"] | "3RD";

// ── Reusable Lightbox ─────────────────────────────────────────────────────────
interface LightboxItem {
  id: string;
  label: string;
  image: string;
  color: string;
  textColor?: string;
  aspectRatio?: string;
}

function Lightbox({
  items,
  activeId,
  onClose,
  onPrev,
  onNext,
}: {
  items: LightboxItem[];
  activeId: string | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const index = items.findIndex((i) => i.id === activeId);
  const current = items[index] ?? null;
  if (!activeId || !current) return null;

  return (
    <motion.div
      key="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className="relative max-w-3xl w-[92vw] rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured header — sticky at the top */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-3 rounded-t-2xl"
          style={{ backgroundColor: current.color, color: current.textColor || "white" }}
        >
          <h2 className="font-display font-black text-xl tracking-widest uppercase">
            {current.label}
          </h2>
          <button
            id="btn-lightbox-close"
            onClick={onClose}
            className="hover:opacity-80 transition-opacity"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable image area */}
        <div className="overflow-y-auto rounded-b-2xl bg-[#111]">
          <div
            className="relative w-full"
            style={{ aspectRatio: current.aspectRatio ?? "780/880" }}
          >
            <Image
              src={current.image}
              alt={current.label}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 92vw, 768px"
              priority
            />
          </div>
        </div>

        {/* Prev / Next arrows */}
        {index > 0 && (
          <button
            id="btn-lightbox-prev"
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="Previous"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {index < items.length - 1 && (
          <button
            id="btn-lightbox-next"
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="Next"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* Dot indicators */}
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === index ? "bg-white scale-125" : "bg-white/30"
              )}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function FixturesClient({ signOutAction }: FixturesClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PageTab>("fixtures");

  // Fixtures lightbox
  const [fixtureLightbox, setFixtureLightbox] = useState<FixtureGroupId | null>(null);
  // Standings lightbox — includes all 12 groups + 3RD
  const [standingLightbox, setStandingLightbox] = useState<StandingGroupId | null>(null);

  const navLinks: { label: string; href?: string; action?: () => void }[] = [
    { label: "My Squad", href: "/dashboard" },
    { label: "Fixtures", href: "/fixtures" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "How to Play", action: () => setIsHowToPlayOpen(true) },
  ];

  // ── Fixture lightbox helpers ──────────────────────────────────────────────
  const fixtureItems: LightboxItem[] = GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    image: g.image,
    color: g.color,
    aspectRatio: "1344/800",
  }));
  const fixtureIndex = fixtureItems.findIndex((i) => i.id === fixtureLightbox);

  // ── Standings lightbox helpers ─────────────────────────────────────────────
  const standingItems: LightboxItem[] = [
    ...STANDINGS.map((s) => ({
      id: s.id,
      label: s.label,
      image: s.image,
      color: s.color,
      aspectRatio: "780/880",
    })),
    {
      id: THIRD_PLACED.id,
      label: THIRD_PLACED.label,
      image: THIRD_PLACED.image,
      color: THIRD_PLACED.color,
      textColor: THIRD_PLACED.textColor,
      aspectRatio: "780/1420",
    },
  ];
  const standingIndex = standingItems.findIndex((i) => i.id === standingLightbox);

  return (
    <div className="squad-builder-root flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
      {/* ── How to Play modal ── */}
      <HowToPlayModal forceOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />

      {/* ── Lightboxes ── */}
      <AnimatePresence>
        {fixtureLightbox && (
          <Lightbox
            items={fixtureItems}
            activeId={fixtureLightbox}
            onClose={() => setFixtureLightbox(null)}
            onPrev={() => fixtureIndex > 0 && setFixtureLightbox(fixtureItems[fixtureIndex - 1].id as FixtureGroupId)}
            onNext={() => fixtureIndex < fixtureItems.length - 1 && setFixtureLightbox(fixtureItems[fixtureIndex + 1].id as FixtureGroupId)}
          />
        )}
        {standingLightbox && (
          <Lightbox
            items={standingItems}
            activeId={standingLightbox}
            onClose={() => setStandingLightbox(null)}
            onPrev={() => standingIndex > 0 && setStandingLightbox(standingItems[standingIndex - 1].id as StandingGroupId)}
            onNext={() => standingIndex < standingItems.length - 1 && setStandingLightbox(standingItems[standingIndex + 1].id as StandingGroupId)}
          />
        )}
      </AnimatePresence>

      {/* ── Top Navigation ── */}
      <header className="squad-nav">
        <div className="squad-nav-inner">
          <div className="flex items-center">
            <span className="font-display font-black text-white text-sm tracking-widest uppercase">
              FWC26 Fantasy
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(({ label, href, action }) => {
              if (href) {
                return (
                  <Link
                    key={label}
                    href={href}
                    className={cn(
                      "text-xs font-bold transition-colors uppercase tracking-wide",
                      href === "/fixtures" ? "text-[#c8f000]" : "text-white/60 hover:text-white"
                    )}
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
              return null;
            })}
          </nav>

          <div className="flex items-center gap-4">
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
            <button
              className="md:hidden text-white/80 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-[#0a0a0a] border-b border-white/10 overflow-hidden absolute top-[52px] left-0 w-full z-40"
          >
            <div className="flex flex-col py-4 px-6 gap-4">
              {navLinks.map(({ label, href, action }) => {
                if (href) {
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "text-sm font-bold transition-colors uppercase tracking-wide",
                        href === "/fixtures" ? "text-[#c8f000]" : "text-white/60 hover:text-white"
                      )}
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
                return null;
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

      {/* ── Main content ── */}
      <main className="flex-1 relative min-h-0 w-full overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/host-cities.png"
            alt="Host Cities Background"
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/40 to-[#0a0a0a]/80" />
        </div>

        {/* Scrollable content */}
        <div className="relative z-10 w-full h-full overflow-y-auto px-4 py-8 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">

            {/* ── Page header ── */}
            <div className="flex flex-col gap-1">
              <p className="text-[#c8f000] text-xs font-black uppercase tracking-[0.2em]">
                FIFA World Cup 2026 · Group Stage
              </p>
              <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-widest drop-shadow-lg">
                {activeTab === "fixtures" ? "Fixtures" : "Standings"}
              </h1>
              <p className="text-white/50 text-sm font-semibold mt-1">
                {activeTab === "fixtures"
                  ? "Click any group card to view the full fixtures & results."
                  : "Click any group to view the current group standings."}
              </p>
            </div>

            {/* ── Tab switcher ── */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit backdrop-blur-sm">
              <button
                id="tab-fixtures"
                onClick={() => setActiveTab("fixtures")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-black uppercase tracking-widest transition-all duration-200",
                  activeTab === "fixtures"
                    ? "bg-[#c8f000] text-black shadow-lg shadow-[#c8f000]/20"
                    : "text-white/50 hover:text-white"
                )}
              >
                <Calendar size={14} />
                Fixtures
              </button>
              <button
                id="tab-standings"
                onClick={() => setActiveTab("standings")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-black uppercase tracking-widest transition-all duration-200",
                  activeTab === "standings"
                    ? "bg-[#c8f000] text-black shadow-lg shadow-[#c8f000]/20"
                    : "text-white/50 hover:text-white"
                )}
              >
                <Trophy size={14} />
                Standings
              </button>
            </div>

            {/* ── Tab content ── */}
            <AnimatePresence mode="wait">

              {/* FIXTURES TAB */}
              {activeTab === "fixtures" && (
                <motion.div
                  key="fixtures-tab"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {GROUPS.map((group, index) => (
                      <motion.button
                        key={group.id}
                        id={`btn-fixture-${group.id.toLowerCase()}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.35 }}
                        onClick={() => setFixtureLightbox(group.id)}
                        className="group relative rounded-xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 text-left"
                        style={{ aspectRatio: "1344/800" }}
                        aria-label={`View ${group.label} fixtures`}
                      >
                        <Image
                          src={group.image}
                          alt={`${group.label} Fixtures`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                          style={{ backgroundColor: `${group.color}CC` }}
                        >
                          <span className="font-display font-black text-white text-lg tracking-widest uppercase drop-shadow-lg">
                            {group.label}
                          </span>
                        </div>
                        <div
                          className="absolute top-2 right-2 px-2.5 py-1 rounded-md text-[10px] font-black text-white tracking-wider uppercase shadow-lg transition-opacity group-hover:opacity-0"
                          style={{ backgroundColor: group.color }}
                        >
                          {group.label}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-6 pb-2 px-2 transition-opacity group-hover:opacity-0">
                          <p className="text-white/70 text-[9px] font-bold tracking-wide truncate">
                            {group.teams.join(" · ")}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STANDINGS TAB */}
              {activeTab === "standings" && (
                <motion.div
                  key="standings-tab"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-8"
                >
                  {/* 12 group standings grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {STANDINGS.map((standing, index) => (
                      <motion.button
                        key={standing.id}
                        id={`btn-standing-${standing.id.toLowerCase()}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.3 }}
                        onClick={() => setStandingLightbox(standing.id)}
                        className="group relative rounded-xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        style={{ aspectRatio: "780/880" }}
                        aria-label={`View ${standing.label} standings`}
                      >
                        <Image
                          src={standing.image}
                          alt={`${standing.label} Standings`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        />
                        {/* Hover overlay */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                          style={{ backgroundColor: `${standing.color}CC` }}
                        >
                          <span className="font-display font-black text-white text-base tracking-widest uppercase drop-shadow-lg">
                            {standing.label}
                          </span>
                        </div>
                        {/* Badge */}
                        <div
                          className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-black text-white tracking-wider uppercase shadow-md transition-opacity group-hover:opacity-0"
                          style={{ backgroundColor: standing.color }}
                        >
                          GRP {standing.id}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* 3rd placed teams — full-width prominent card */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-white/40 text-xs font-black uppercase tracking-widest">
                        Wild Card Rankings
                      </span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <motion.button
                      id="btn-standing-3rd"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.35 }}
                      onClick={() => setStandingLightbox("3RD")}
                      className="group relative rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 w-full max-w-md mx-auto"
                      style={{ aspectRatio: "780/1420" }}
                      aria-label="View ranking of third placed teams"
                    >
                      <Image
                        src={THIRD_PLACED.image}
                        alt="Ranking of Third Placed Teams"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 90vw, 448px"
                      />
                      {/* Gradient overlay at bottom */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                        <span className="font-display font-black text-white text-sm tracking-widest uppercase drop-shadow-lg bg-black/40 px-4 py-2 rounded-full">
                          Tap to expand
                        </span>
                      </div>
                      {/* Badge */}
                      <div
                        className="absolute top-3 right-3 px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase shadow-lg"
                        style={{ backgroundColor: THIRD_PLACED.color, color: THIRD_PLACED.textColor || "white" }}
                      >
                        3rd Place Ranking
                      </div>
                    </motion.button>
                  </div>

                  <p className="text-white/30 text-xs text-center font-medium pb-4">
                    Standings update after each group stage match is completed.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>

          </div>
        </div>
      </main>
    </div>
  );
}
