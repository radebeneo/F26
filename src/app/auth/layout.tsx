import Link from "next/link";
import { Trophy } from "lucide-react";

/**
 * (auth) layout
 *
 * Full-page split-panel layout for login and register.
 * Left: animated illustration / hero panel (hidden on mobile)
 * Right: the auth form card
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left hero panel ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-navy-gradient">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[100px]" />
        </div>

        {/* Grid lines (subtle) */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
              <Trophy size={18} className="text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">F26 Fantasy</span>
          </Link>

          {/* Hero text */}
          <div className="flex flex-col gap-6">
            {/* Floating stat cards */}
            <div className="flex gap-4 mb-6">
              {[
                { label: "Nations", value: "48" },
                { label: "Players", value: "1,248" },
                { label: "Gameweeks", value: "8" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass rounded-xl px-4 py-3 flex flex-col gap-0.5"
                >
                  <span className="text-2xl font-bold text-gold-gradient"
                    style={{
                      background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-4xl font-bold text-foreground leading-tight">
                Build your{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  World Cup
                </span>
                <br />
                dream squad
              </h2>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-sm">
                Pick 15 players from all 48 nations, appoint your captain,
                and earn points across every match of FIFA World Cup 2026.
              </p>
            </div>

            {/* Feature list */}
            <ul className="flex flex-col gap-3">
              {[
                "£100m budget across 48 nations",
                "Captain doubles your points",
                "Live scoring across 8 gameweeks",
                "Global leaderboard — climb the ranks",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-foreground/80">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                    <span className="text-primary text-[10px]">✓</span>
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            FIFA World Cup 2026 · USA · Canada · Mexico
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background relative">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Trophy size={16} className="text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">F26 Fantasy</span>
        </Link>

        {children}
      </div>
    </div>
  );
}
