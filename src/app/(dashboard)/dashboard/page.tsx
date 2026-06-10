import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { LogOut, Trophy, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your F26 Fantasy dashboard.",
};

async function signOutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch team name from our users table
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  const teamName = dbUser?.teamName ?? "Manager";

  return (
    <main className="min-h-screen bg-navy-gradient">
      {/* Nav */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-40 bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Trophy size={16} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">F26 Fantasy</span>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              id="btn-sign-out"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col gap-2 mb-12">
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
            Welcome back
          </p>
          <h1 className="text-4xl font-bold text-foreground">
            {teamName} 👋
          </h1>
          <p className="text-muted-foreground">
            FIFA World Cup 2026 starts June 11. Build your squad before the
            deadline!
          </p>
        </div>

        {/* Coming-soon cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Trophy size={20} className="text-primary" />,
              title: "My Squad",
              desc: "Pick your 15-player squad — coming soon",
              cta: "Pick Squad",
              href: "/squad",
            },
            {
              icon: <Zap size={20} className="text-primary" />,
              title: "Leaderboard",
              desc: "See how you rank globally — coming soon",
              cta: "View Leaderboard",
              href: "/leaderboard",
            },
            {
              icon: <Trophy size={20} className="text-primary" />,
              title: "Gameweeks",
              desc: "Track fixtures and points — coming soon",
              cta: "View Fixtures",
              href: "/fixtures",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="glass rounded-2xl p-6 flex flex-col gap-4 border border-border/30"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                {card.icon}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{card.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{card.desc}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary/60 uppercase tracking-widest">
                {card.cta} →
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
