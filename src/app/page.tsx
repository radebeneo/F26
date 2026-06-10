import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-400">
          FIFA World Cup 2026
        </span>

        <h1 className="text-5xl font-bold tracking-tight text-gold-gradient sm:text-7xl">
          F26 Fantasy
        </h1>

        <p className="max-w-md text-lg text-muted-foreground">
          Pick your 15-player squad, captain your star, and climb the global
          leaderboard across all 8 gameweeks.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex gap-4">
        <Link
          id="cta-get-started"
          href="/auth/signup"
          className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:brightness-110 hover:scale-105 active:scale-95"
        >
          Get Started
        </Link>
        <Link
          id="cta-sign-in"
          href="/auth/login"
          className="rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition-all hover:bg-secondary hover:scale-105 active:scale-95"
        >
          Sign In
        </Link>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
        {[
          "15-player squads",
          "8 Gameweeks",
          "Captain × 2 pts",
          "Global Leaderboard",
        ].map((feat) => (
          <span
            key={feat}
            className="rounded-full border border-border/50 bg-muted/50 px-3 py-1"
          >
            {feat}
          </span>
        ))}
      </div>

      <p className="text-xs text-muted-foreground/50">
        Scaffold complete — Step 1 of 8 ✓
      </p>
    </main>
  );
}
