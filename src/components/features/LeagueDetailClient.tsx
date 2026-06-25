"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Menu, X, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HowToPlayModal } from "@/components/features/HowToPlayModal";


export interface LeagueMember {
  id: string;
  managerName: string;
  teamName: string;
  favoriteCountry: string;
  rdPts: number;
  totalPts: number;
  roundPoints: Record<string, number>;
}

export interface LeagueDetail {
  id: number;
  name: string;
  managerName: string | null;
  isPublic: boolean;
  inviteCode: string | null;
  createdAt: Date;
}

interface LeagueDetailClientProps {
  league: LeagueDetail;
  members: LeagueMember[];
  rounds: { id: number; name: string }[];
  currentRoundId: number | null;
  signOutAction: () => Promise<void>;
}

type TabType = "Table" | "Invites" | "About";

function getCountrySlug(nation: string) {
  if (!nation) return "south-africa";
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

export function LeagueDetailClient({
  league,
  members,
  rounds,
  currentRoundId,
  signOutAction,
}: LeagueDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("Table");
  const [selectedRound, setSelectedRound] = useState<string>(currentRoundId ? currentRoundId.toString() : "All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLeaving, setIsLeaving] = useState(false);
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

  const membersPerPage = 10;

  // Always sort members by Total Points descending
  const sortedMembers = [...members].sort((a, b) => b.totalPts - a.totalPts);

  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / membersPerPage));
  const currentMembers = sortedMembers.slice(
    (currentPage - 1) * membersPerPage,
    currentPage * membersPerPage
  );



  const handleLeaveLeague = async () => {
    if (!window.confirm("Are you sure you want to leave this league? You can rejoin later with the invite code.")) {
      return;
    }

    setIsLeaving(true);
    try {
      const res = await fetch("/api/leagues/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId: league.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast({ title: "Error", description: data.error || "Failed to leave league", variant: "error" });
        return;
      }

      toast({ title: "Left League", description: "You have left the league.", variant: "success" });
      router.push("/leaderboard");
      router.refresh();
    } catch {
      toast({ title: "Error", description: "Network error occurred.", variant: "error" });
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="squad-builder-root" id="leaderboard-root">
      {/* ── How to Play modal ── */}
      <HowToPlayModal
        forceOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* ── Sticky top nav ── */}
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

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight drop-shadow-md">
                {league.name}
              </h1>

              <div className="flex flex-col gap-1 w-full md:w-64">
                <label className="text-white text-xs font-bold uppercase tracking-wider">Round</label>
                <div className="relative">
                  <select
                    value={selectedRound}
                    onChange={(e) => setSelectedRound(e.target.value)}
                    className="w-full h-10 px-3 pr-8 rounded bg-white text-black font-semibold appearance-none outline-none shadow-sm cursor-pointer"
                  >
                    <option value="All">All</option>
                    {rounds.map((r) => (
                      <option key={r.id} value={r.id.toString()}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/50">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-white/85 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
              {/* Tabs */}
              <div className="flex w-full bg-[#1a1a1a] text-white">
                {(["Table", "Invites", "About"] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-4 text-sm font-black tracking-widest uppercase transition-all border-b-2",
                      activeTab === tab
                        ? "border-white bg-[#2a2a2a]"
                        : "border-transparent text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-0 flex flex-col min-h-[400px]">

                {/* TABLE TAB */}
                {activeTab === "Table" && (
                  <div className="flex flex-col h-full w-full">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 px-6 py-4 bg-[#4a4a4a] text-white/90 text-sm font-semibold">
                      <div className="col-span-2 text-center border-r border-white/20">Rank</div>
                      <div className="col-span-6 px-4">Team and Manager</div>
                      <div className="col-span-2 text-center">RD Pts</div>
                      <div className="col-span-2 text-center">Total Pts</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex flex-col flex-1 divide-y divide-gray-100">
                      {currentMembers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 font-semibold">
                          No members in this league yet.
                        </div>
                      ) : (
                        currentMembers.map((member, idx) => {
                          const rank = (currentPage - 1) * membersPerPage + idx + 1;
                          
                          let displayRdPts: string | number = 0;
                          if (selectedRound === "All") {
                            displayRdPts = member.totalPts === 0 ? "-" : member.totalPts;
                          } else {
                            const pts = member.roundPoints[selectedRound] || 0;
                            const isCurrentOrFuture = currentRoundId !== null && parseInt(selectedRound) >= currentRoundId;
                            if (pts === 0 && isCurrentOrFuture) {
                              displayRdPts = "-";
                            } else {
                              displayRdPts = pts;
                            }
                          }

                          return (
                            <div key={member.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                              <div className="col-span-2 text-center font-bold text-gray-700">
                                {member.totalPts === 0 ? "-" : rank}
                              </div>
                              <div className="col-span-6 px-4 flex items-center gap-3">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 drop-shadow-sm">
                                  <Image
                                    src={`/images/flags/${getCountrySlug(member.favoriteCountry)}.webp`}
                                    alt={member.favoriteCountry}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black text-black tracking-tight leading-tight">{member.teamName}</span>
                                  <span className="text-xs font-semibold text-gray-500 leading-tight">{member.managerName}</span>
                                </div>
                              </div>
                              <div className="col-span-2 text-center font-bold text-gray-800">
                                {displayRdPts}
                              </div>
                              <div className="col-span-2 text-center font-black text-black">
                                {member.totalPts === 0 ? "-" : member.totalPts}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-white border border-gray-200 rounded text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-100"
                        >
                          Prev
                        </button>
                        <span className="text-sm font-semibold text-gray-500">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-white border border-gray-200 rounded text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-100"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* INVITES TAB */}
                {activeTab === "Invites" && (
                  <div className="flex flex-col p-6 md:p-10 gap-8 max-w-2xl">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl font-black tracking-tight">Invite your friends</h3>
                      <p className="text-sm font-bold text-gray-600">
                        Your unique league code is: <span className="text-black">OGCTA26</span>
                      </p>
                      <button
                        disabled
                        className="mt-2 py-3 px-6 w-full max-w-sm rounded-full border-2 border-gray-300 text-gray-400 font-black tracking-widest uppercase cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        COPY CODE
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl font-black tracking-tight">Invite via Link</h3>
                      <p className="text-sm font-bold text-gray-600">
                        Copy the URL for the league to share with friends.
                      </p>
                      <button
                        disabled
                        className="mt-2 py-3 px-6 w-full max-w-sm rounded-full bg-gray-200 text-gray-400 font-black tracking-widest uppercase cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        COPY LINK
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <h3 className="text-xl font-black tracking-tight">Invite via Social</h3>
                      <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-full bg-[#c8f000] flex items-center justify-center text-black hover:bg-[#d4ff00] transition-colors">
                          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="fill-current">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                          </svg>
                        </button>
                        <button className="w-10 h-10 rounded-full bg-[#c8f000] flex items-center justify-center text-black hover:bg-[#d4ff00] transition-colors">
                          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="fill-current">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABOUT TAB */}
                {activeTab === "About" && (
                  <div className="flex flex-col p-6 md:p-10 gap-6 max-w-2xl">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-black tracking-tight">About This League</h3>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-black tracking-tight">Starting Round</h3>
                      <p className="text-sm font-semibold text-gray-800">Group Stage MD2</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-black tracking-tight">Privacy Settings</h3>
                      <p className="text-sm font-semibold text-gray-800">
                        {league.isPublic ? "Public" : "Private"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-black tracking-tight">Chairman</h3>
                      <p className="text-sm font-semibold text-gray-800">{league.managerName}</p>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-black tracking-tight">Leave League</h3>
                      <p className="text-sm font-semibold text-gray-800">
                        If you leave a league, you can always rejoin if you wish to do so.
                      </p>
                      <button
                        onClick={handleLeaveLeague}
                        disabled={isLeaving}
                        className="mt-2 py-3 px-6 w-fit rounded-full bg-[#da291c] text-white font-black tracking-widest uppercase hover:bg-red-700 transition-colors"
                      >
                        {isLeaving ? "LEAVING..." : "LEAVE LEAGUE"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
