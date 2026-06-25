"use client";

import { useState } from "react";
import { Search, LogOut, Menu, X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HowToPlayModal } from "@/components/features/HowToPlayModal";

interface LeagueData {
  id: number;
  name: string;
  isPublic: boolean;
  managerName: string | null;
  entries: number;
}

interface LeaderboardClientProps {
  leagues: LeagueData[];
  joinedLeagueIds: number[];
  signOutAction: () => Promise<void>;
}

export function LeaderboardClient({ leagues, joinedLeagueIds, signOutAction }: LeaderboardClientProps) {
  const [search, setSearch] = useState("");
  const [isJoining, setIsJoining] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const navLinks: { label: string; href?: string; action?: () => void }[] = [
    { label: "My Squad", href: "/dashboard" },
    { label: "Fixtures", href: "/fixtures" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "How to Play", action: () => setIsHowToPlayOpen(true) },
  ];

  const handleJoin = async (leagueId: number) => {
    setIsJoining(leagueId);
    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast({
          title: "Failed to join league",
          description: data.error || "Something went wrong.",
          variant: "error",
        });
        return;
      }
      toast({
        title: "Success",
        description: "You have joined the league!",
        variant: "success",
      });
      router.refresh();
    } catch {
      toast({
        title: "Network error",
        description: "Could not reach the server.",
        variant: "error",
      });
    } finally {
      setIsJoining(null);
    }
  };

  const filteredLeagues = leagues.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="squad-builder-root flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
      {/* ── How to Play modal ── */}
      <HowToPlayModal
        forceOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

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
                      href === "/leaderboard"
                        ? "text-[#c8f000]"
                        : "text-white/60 hover:text-white"
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
              {navLinks.map(({ label, href, action }) => {
                if (href) {
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "text-sm font-bold transition-colors uppercase tracking-wide",
                        href === "/leaderboard"
                          ? "text-[#c8f000]"
                          : "text-white/60 hover:text-white"
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

      <main className="flex-1 relative min-h-0 w-full overflow-hidden">
        {/* Full Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/host-cities.webp"
            alt="Host Cities Background"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-[#0a1128]/70 mix-blend-multiply"></div>
        </div>

        {/* Content Area */}
        <div className="relative z-10 w-full h-full overflow-y-auto p-4 md:p-8 text-black">
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">

            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-md">
                JOIN A LEAGUE
              </h1>
              <div className="relative w-full md:w-[350px]">
                <input
                  type="text"
                  placeholder="Search for a League"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 rounded-xl bg-white/90 backdrop-blur-md text-black font-semibold outline-none focus:ring-2 focus:ring-[#c8f000] transition-all shadow-md border border-white/20"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              </div>
            </div>

            {/* Cards container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-4">
              {/* League List */}
              <div className="flex flex-col gap-4 w-full">
                {filteredLeagues.map((league) => {
                  const hasJoined = joinedLeagueIds.includes(league.id);
                  return (
                    <div
                      key={league.id}
                      className="bg-white/85 backdrop-blur-md rounded-xl p-5 flex flex-col gap-3 shadow-lg shadow-black/10 relative border border-white/20"
                    >
                      {/* Public Badge */}
                      {league.isPublic && (
                        <div className="bg-[#00b259] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit">
                          Public
                        </div>
                      )}

                      <div className="flex items-start justify-between mt-1">
                        <div className="flex flex-col gap-1">
                          <h2 className="text-xl font-black text-black tracking-tight">
                            {league.name}
                          </h2>
                          <p className="text-sm font-bold text-black/80">
                            Manager: {league.managerName}
                          </p>
                          <p className="text-sm font-semibold text-black/60 mt-1">
                            {league.entries} Entries
                          </p>
                        </div>

                        {/* Join / View Button */}
                        {hasJoined ? (
                          <Link
                            href={`/leaderboard/${league.id}`}
                            className="px-6 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all h-fit self-end mb-2 bg-[#3b82f6] text-white hover:bg-[#2563eb] hover:scale-105 shadow-md shadow-[#3b82f6]/20"
                          >
                            VIEW LEAGUE
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleJoin(league.id)}
                            disabled={isJoining === league.id}
                            className={cn(
                              "px-6 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all h-fit self-end mb-2 bg-[#c8f000] text-black hover:bg-[#d4ff00] hover:scale-105 shadow-md shadow-[#c8f000]/20",
                              isJoining === league.id && "opacity-70 pointer-events-none"
                            )}
                          >
                            {isJoining === league.id ? (
                              <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin inline-block" />
                            ) : (
                              "JOIN"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredLeagues.length === 0 && (
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 text-center border border-white/10">
                    <p className="text-white/60 font-semibold">No leagues found matching &quot;{search}&quot;</p>
                  </div>
                )}
              </div>

              {/* Create a League Card */}
              <div className="group relative">
                <div className="bg-white/85 backdrop-blur-md rounded-xl p-6 flex flex-col gap-4 shadow-lg shadow-black/10 transition-all opacity-80 group-hover:opacity-100 relative overflow-hidden border border-white/20">
                  <h2 className="text-xl font-black text-black tracking-tight">
                    Create A League
                  </h2>
                  <p className="text-sm font-semibold text-black/80 leading-relaxed max-w-[90%]">
                    Can&apos;t find a league you want to join? Create your own here.
                  </p>
                  <button
                    disabled
                    className="w-full mt-2 py-3 rounded-xl bg-[#c8f000] text-black font-black uppercase tracking-widest opacity-60 cursor-not-allowed"
                  >
                    CREATE A LEAGUE
                  </button>

                  {/* Overlay for hover */}
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                    <span className="bg-black/80 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-xl drop-shadow-md">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
