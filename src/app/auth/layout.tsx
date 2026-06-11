import Link from "next/link";
import Image from "next/image";
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
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-background">
        <Image
          src="/images/groups.png"
          alt="World Cup Groups"
          fill
          className="object-cover"
        />


      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background relative">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Trophy size={16} className="text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">FWC 2026</span>
        </Link>

        {children}
      </div>
    </div>
  );
}
