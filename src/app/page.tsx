import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Users, TrendingUp, Trophy, UserCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Home | F26 Fantasy",
  description:
    "Play the official FIFA World Cup 2026 Fantasy game. Build your 15-player squad and challenge other managers globally!",
};

const features = [
  {
    id: "feature-build-team",
    icon: Users,
    title: "Build Your Team",
    description: "Select 15 players with your $100m budget",
  },
  {
    id: "feature-performance",
    icon: TrendingUp,
    title: "Maximise Your Performance",
    description: "Use score, transfers, and boosters to get ahead of the game",
  },
  {
    id: "feature-friends",
    icon: Trophy,
    title: "Challenge Your Friends",
    description: "Play in leagues with friends and challenge other managers globally",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Top nav bar ─────────────────────────────────────── */}
      <header className="homepage-nav">
        <nav className="homepage-nav-inner" aria-label="Main navigation">
          <div className="homepage-nav-left">
            <Link id="nav-my-team" href="/dashboard" className="homepage-nav-link">
              My Team
            </Link>
            <div className="homepage-nav-dropdown">
              <button className="homepage-nav-link" aria-haspopup="true">
                Help <span className="homepage-nav-chevron">▾</span>
              </button>
            </div>
          </div>
          <div className="homepage-nav-right">
            <button className="homepage-nav-link">
              FWC 2026 FANTASY <span className="homepage-nav-chevron">▾</span>
            </button>
          </div>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <main>
        <section className="homepage-hero" aria-label="Hero">

          {/* Left — blue content panel */}
          <div className="homepage-hero-content">
            <div className="homepage-logo-lockup">
              <p className="homepage-logo-eyebrow">FWC</p>
              <h1 className="homepage-logo-headline">
                2026
                <br />
                FANTASY
              </h1>
            </div>
            <p className="homepage-tagline">
              Play the FWC<br />
              2026 Fantasy Tournament
            </p>
            <p className="homepage-sub-tagline">
              Build your 15-player squad and challenge other managers!
            </p>
            <Link id="cta-play-now" href="/auth/register" className="homepage-cta-btn">
              PLAY NOW
            </Link>
          </div>

          {/* Right — portrait pitch */}
          <div className="homepage-hero-visual" aria-hidden="true">
            <div className="homepage-pitch-wrapper">

              {/* Recreated Exact Pitch */}
              <div className="exact-pitch-container">
                {/* 3D Pitch Background */}
                <div className="exact-pitch-3d">
                  <svg viewBox="0 0 100 120" preserveAspectRatio="none" className="exact-pitch-svg">
                    {/* Outer line */}
                    <rect x="5" y="5" width="90" height="115" stroke="white" strokeWidth="0.5" fill="none" />
                    {/* Penalty Box */}
                    <rect x="25" y="5" width="50" height="20" stroke="white" strokeWidth="0.5" fill="none" />
                    {/* Goal Area */}
                    <rect x="38" y="5" width="24" height="6" stroke="white" strokeWidth="0.5" fill="none" />
                    {/* Penalty Arc */}
                    <path d="M 40 25 A 10 10 0 0 0 60 25" stroke="white" strokeWidth="0.5" fill="none" />
                    {/* Penalty Spot */}
                    <circle cx="50" cy="18" r="0.5" fill="white" />
                    {/* Halfway Line (bottom) */}
                    <line x1="5" y1="100" x2="95" y2="100" stroke="white" strokeWidth="0.5" />
                    {/* Center Circle (bottom) */}
                    <circle cx="50" cy="100" r="15" stroke="white" strokeWidth="0.5" fill="none" />
                    {/* Center Spot */}
                    <circle cx="50" cy="100" r="0.8" fill="white" />
                    {/* Corner Arcs */}
                    <path d="M 5 9 A 4 4 0 0 0 9 5" stroke="white" strokeWidth="0.5" fill="none" />
                    <path d="M 95 9 A 4 4 0 0 1 91 5" stroke="white" strokeWidth="0.5" fill="none" />
                  </svg>
                </div>

                {/* Top Banner & Goal */}
                <div className="exact-pitch-banner">
                  <div className="exact-pitch-banner-left">
                    <span className="mr-1 mt-[2px]">
                      <Image src="/assets/logo-black.png" alt="Logo" width={12} height={16} className="object-contain" />
                    </span> FANTASY
                  </div>

                  <div className="exact-pitch-banner-right">
                    <span className="mr-1 mt-[2px]">
                      <Image src="/assets/logo-white.png" alt="Logo" width={12} height={16} className="object-contain" />
                    </span> FANTASY
                  </div>
                </div>

                {/* Player Slots Layer */}
                <div className="exact-pitch-players">
                  {/* GKP Row */}
                  <div className="exact-pitch-row center">
                    <PlayerSlot pos="GKP" />
                    <PlayerSlot pos="GKP" />
                  </div>
                  {/* DEF Row */}
                  <div className="exact-pitch-row">
                    <PlayerSlot pos="DEF" />
                    <PlayerSlot pos="DEF" />
                    <PlayerSlot pos="DEF" />
                    <PlayerSlot pos="DEF" />
                    <PlayerSlot pos="DEF" />
                  </div>
                  {/* MID Row */}
                  <div className="exact-pitch-row">
                    <PlayerSlot pos="MID" />
                    <PlayerSlot pos="MID" />
                    <PlayerSlot pos="MID" />
                    <PlayerSlot pos="MID" />
                    <PlayerSlot pos="MID" />
                  </div>
                  {/* FWD Row */}
                  <div className="exact-pitch-row center fwd">
                    <PlayerSlot pos="FWD" />
                    <PlayerSlot pos="FWD" />
                    <PlayerSlot pos="FWD" />
                  </div>
                </div>
              </div>

              {/* Trophy floating beside the pitch */}
              <div className="homepage-trophy">
                <Image
                  src="/images/trophy.png"
                  alt="FIFA World Cup Trophy"
                  width={120}
                  height={190}
                  className="homepage-trophy-img"
                  priority
                />
              </div>
            </div>

            {/* Green diagonal slice */}
            <div className="homepage-green-slice" aria-hidden="true" />
          </div>
        </section>

        {/* ── Feature cards ─────────────────────────────────── */}
        <section className="homepage-features" aria-label="Key features">
          {features.map(({ id, icon: Icon, title, description }) => (
            <article key={id} id={id} className="homepage-feature-card">
              <div className="homepage-feature-icon">
                <Icon size={28} strokeWidth={1.5} />
              </div>
              <h2 className="homepage-feature-title">{title}</h2>
              <p className="homepage-feature-desc">{description}</p>
            </article>
          ))}
        </section>

        {/* ── Player showcase strip ──────────────────────────── */}
        <section className="homepage-players-showcase" aria-label="Featured players">
          <div className="homepage-players-showcase-inner">
            <h2 className="homepage-showcase-title">Featured Players</h2>
            <div className="homepage-showcase-grid">
              {[
                { src: "/images/messi.png", name: "Messi" },
                { src: "/images/pulisic.png", name: "Pulisic" },
                { src: "/images/mctominay.png", name: "McTominay" },
                { src: "/images/jimenez.png", name: "Jiménez" },
                { src: "/images/davids.png", name: "David" },
              ].map(({ src, name }) => (
                <div key={name} className="homepage-showcase-card">
                  <Image
                    src={src}
                    alt={`${name} player card`}
                    width={240}
                    height={300}
                    className="homepage-showcase-img"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="homepage-footer">
        <div className="homepage-footer-inner">
          <div className="homepage-footer-brand">
            <Image
              src="/images/logo.png"
              alt="FIFA World Cup logo"
              width={40}
              height={56}
              className="homepage-footer-logo"
            />
            <span className="homepage-footer-fifa">FWC 2026</span>
          </div>
          <div className="homepage-footer-links">
            <Link href="/auth/register" id="footer-play-now" className="homepage-footer-link">
              Play Now
            </Link>
            <Link href="/auth/login" id="footer-sign-in" className="homepage-footer-link">
              Sign In
            </Link>
            <Link href="/dashboard" id="footer-my-team" className="homepage-footer-link">
              My Team
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}

function PlayerSlot({ pos }: { pos: string }) {
  return (
    <div className="pitch-slot pitch-slot--empty">
      <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center mb-1">
        <UserCircle2 size={16} className="text-white/30" />
      </div>
      <span className="text-[9px] font-bold text-white/40 uppercase tracking-wide">
        {pos}
      </span>
    </div>
  );
}
