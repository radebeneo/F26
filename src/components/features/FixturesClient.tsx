"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import type { LightboxItem } from "@/components/features/Lightbox";

const HowToPlayModal = dynamic(() => import("@/components/features/HowToPlayModal").then((mod) => mod.HowToPlayModal));
const Lightbox = dynamic(() => import("@/components/features/Lightbox").then((mod) => mod.Lightbox));

interface FixturesClientProps {
  signOutAction: () => Promise<void>;
}

// ── Fixtures data ──────────────────────────────────────────────────────────────
const GROUPS = [
  { id: "A", label: "GROUP A", image: "/images/matches/groupA.webp", color: "#00C86E", teams: ["Mexico", "South Korea", "Czechia", "South Africa"] },
  { id: "B", label: "GROUP B", image: "/images/matches/groupB.webp", color: "#E8214A", teams: ["Canada", "Switzerland", "Bosnia-Herzegovina", "Qatar"] },
  { id: "C", label: "GROUP C", image: "/images/matches/groupC.webp", color: "#FF8C00", teams: ["Brazil", "Scotland", "Morocco", "Haiti"] },
  { id: "D", label: "GROUP D", image: "/images/matches/groupD.webp", color: "#3B5FE8", teams: ["United States", "Türkiye", "Australia", "Paraguay"] },
  { id: "E", label: "GROUP E", image: "/images/matches/groupE.webp", color: "#6C3DD8", teams: ["Germany", "Netherlands", "Ecuador", "Curacao"] },
  { id: "F", label: "GROUP F", image: "/images/matches/groupF.webp", color: "#C8A200", teams: ["Spain", "Belgium", "Uruguay", "Cabo Verde"] },
  { id: "G", label: "GROUP G", image: "/images/matches/groupG.webp", color: "#EC4899", teams: ["France", "Norway", "Senegal", "Iraq"] }, // Pink
  { id: "H", label: "GROUP H", image: "/images/matches/groupH.webp", color: "#34D399", teams: ["Argentina", "Austria", "Algeria", "Jordan"] }, // Mint
  { id: "I", label: "GROUP I", image: "/images/matches/groupI.webp", color: "#A855F7", teams: ["Portugal", "Colombia", "Uzbekistan", "Congo DR"] }, // Purple
  { id: "J", label: "GROUP J", image: "/images/matches/groupJ.webp", color: "#14B8A6", teams: ["England", "Panama", "Ghana", "Croatia"] }, // Teal
  { id: "K", label: "GROUP K", image: "/images/matches/groupK.webp", color: "#F97316", teams: ["Saudi Arabia", "Spain", "Iran", "New Zealand"] }, // Orange
  { id: "L", label: "GROUP L", image: "/images/matches/groupL.webp", color: "#1B6CA8", teams: ["Qatar", "Switzerland", "Egypt", "Belgium"] },
] as const;


const THIRD_PLACED = {
  id: "3RD",
  label: "Ranking of Third Placed Teams",
  image: "/images/standings/3RD.webp",
  color: "#FFFFFF",
  textColor: "#000000",
} as const;

type GroupId = typeof GROUPS[number]["id"] | "3RD";



// ── Main Component ─────────────────────────────────────────────────────────────
export function FixturesClient({ signOutAction }: FixturesClientProps) {
  const [activeLightbox, setActiveLightbox] = useState<GroupId | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const router = useRouter();

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    setPendingPath(href);
    startTransition(() => {
      router.push(href);
    });
  };

  const handleSignOut = () => {
    setPendingPath("signout");
    startTransition(() => {
      signOutAction();
    });
  };

  const navLinks: { label: string; href?: string; action?: () => void }[] = [
    { label: "My Squad", href: "/dashboard" },
    { label: "Group Stage", href: "/fixtures" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "How to Play", action: () => setIsHowToPlayOpen(true) },
  ];

  // ── Lightbox items ──────────────────────────────────────────────
  const lightboxItems: LightboxItem[] = [
    ...GROUPS.map((g) => ({
      id: g.id,
      label: g.label,
      fixtureImage: g.image,
      standingImage: `/images/standings/${g.id}.webp`,
      standingAspectRatio: "780/880",
      color: g.color,
    })),
    {
      id: THIRD_PLACED.id,
      label: THIRD_PLACED.label,
      standingImage: THIRD_PLACED.image,
      standingAspectRatio: "780/1420",
      color: THIRD_PLACED.color,
      textColor: THIRD_PLACED.textColor,
    },
  ];

  const lightboxIndex = lightboxItems.findIndex((i) => i.id === activeLightbox);

  return (
    <div className="squad-builder-root flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
      {/* ── How to Play modal ── */}
      <HowToPlayModal forceOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />

      {/* ── Lightboxes ── */}
      <AnimatePresence>
        {activeLightbox && (
          <Lightbox
            items={lightboxItems}
            activeId={activeLightbox}
            onClose={() => setActiveLightbox(null)}
            onPrev={() => lightboxIndex > 0 && setActiveLightbox(lightboxItems[lightboxIndex - 1].id as GroupId)}
            onNext={() => lightboxIndex < lightboxItems.length - 1 && setActiveLightbox(lightboxItems[lightboxIndex + 1].id as GroupId)}
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
                  <button
                    key={label}
                    onClick={() => handleNavClick(href)}
                    disabled={isPending}
                    className={cn(
                      "flex items-center gap-2 text-xs font-bold transition-colors uppercase tracking-wide",
                      href === "/fixtures" ? "text-[#c8f000]" : "text-white/60 hover:text-white",
                      isPending && pendingPath === href ? "opacity-70 cursor-wait" : ""
                    )}
                  >
                    {isPending && pendingPath === href && (
                      <span className="w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin inline-block" />
                    )}
                    {label}
                  </button>
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
            {/* Sign out */}
            <button
              onClick={handleSignOut}
              disabled={isPending}
              id="btn-sign-out"
              className={cn(
                "hidden md:flex items-center gap-2 text-xs font-semibold transition-colors",
                "text-white/50 hover:text-white",
                isPending && pendingPath === "signout" ? "opacity-70 cursor-wait" : ""
              )}
            >
              {isPending && pendingPath === "signout" ? (
                <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <LogOut size={14} />
              )}
              Sign out
            </button>
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
                    <button
                      key={label}
                      onClick={() => handleNavClick(href)}
                      disabled={isPending}
                      className={cn(
                        "flex items-center gap-2 text-sm font-bold transition-colors uppercase tracking-wide text-left",
                        href === "/fixtures" ? "text-[#c8f000]" : "text-white/60 hover:text-white",
                        isPending && pendingPath === href ? "opacity-70 cursor-wait" : ""
                      )}
                    >
                      {isPending && pendingPath === href && (
                        <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin inline-block" />
                      )}
                      {label}
                    </button>
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
              <button
                onClick={handleSignOut}
                disabled={isPending}
                className={cn(
                  "flex items-center gap-2 text-sm font-semibold transition-colors",
                  "text-white/50 hover:text-white",
                  isPending && pendingPath === "signout" ? "opacity-70 cursor-wait" : ""
                )}
              >
                {isPending && pendingPath === "signout" ? (
                  <span className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <LogOut size={16} />
                )}
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="flex-1 relative min-h-0 w-full overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/host-cities.webp"
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
            <div className="flex flex-col gap-1 text-center md:text-left">
              <p className="text-[#c8f000] text-xs font-black uppercase tracking-[0.2em]">
                FIFA World Cup 2026
              </p>
              <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-widest drop-shadow-lg">
                Group Stage
              </h1>
              <p className="text-white/50 text-sm font-semibold mt-1">
                Click any group card to view fixtures & standings side-by-side.
              </p>
            </div>

            {/* ── Tab content ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key="group-stage-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-10"
              >
                {/* 12 group fixtures grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                  {GROUPS.map((group, index) => (
                    <motion.button
                      key={group.id}
                      id={`btn-group-${group.id.toLowerCase()}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.35 }}
                      onClick={() => setActiveLightbox(group.id)}
                      className="group relative rounded-xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 text-left"
                      style={{ aspectRatio: "1344/800" }}
                      aria-label={`View ${group.label}`}
                    >
                      <Image
                        src={group.image}
                        alt={`${group.label}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                        style={{ backgroundColor: `${group.color}E6` }}
                      >
                        <span className="font-display font-black text-white text-lg tracking-widest uppercase drop-shadow-lg flex flex-col items-center gap-1">
                          {group.label}
                          <span className="text-[10px] font-bold text-white/80">Fixtures & Standings</span>
                        </span>
                      </div>
                      <div
                        className="absolute top-2 right-2 px-2.5 py-1 rounded-md text-[10px] font-black text-white tracking-wider uppercase shadow-lg transition-opacity group-hover:opacity-0"
                        style={{ backgroundColor: group.color }}
                      >
                        {group.label}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-3 px-3 transition-opacity group-hover:opacity-0">
                        <p className="text-white/80 text-[10px] font-bold tracking-wide truncate">
                          {group.teams.join(" · ")}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* 3rd placed teams — full-width prominent card */}
                <div className="flex flex-col gap-4 bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className="flex flex-col items-center text-center gap-2 mb-2">
                    <h3 className="text-xl font-display font-black uppercase tracking-widest text-white">
                      Wild Card Rankings
                    </h3>
                    <p className="text-sm text-white/50 max-w-md">
                      The top 8 third-placed teams will also advance to the knockout stage.
                    </p>
                  </div>

                  <motion.button
                    id="btn-standing-3rd"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.35 }}
                    onClick={() => setActiveLightbox("3RD")}
                    className="group relative rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f000] w-full max-w-sm mx-auto shadow-2xl"
                    style={{ aspectRatio: "780/1420" }}
                    aria-label="View ranking of third placed teams"
                  >
                    <Image
                      src={THIRD_PLACED.image}
                      alt="Ranking of Third Placed Teams"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 90vw, 384px"
                    />
                    {/* Gradient overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                      <span className="font-display font-black text-black text-sm tracking-widest uppercase drop-shadow-lg bg-[#c8f000] px-5 py-2 rounded-full">
                        View Full Ranking
                      </span>
                    </div>
                  </motion.button>
                </div>

                <p className="text-white/30 text-xs text-center font-medium pb-4">
                  Standings update after each group stage match is completed.
                </p>
              </motion.div>
            </AnimatePresence>

          </div>
        </div>
      </main>
    </div>
  );
}
