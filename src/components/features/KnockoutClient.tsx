"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X, HelpCircle, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const HowToPlayModal = dynamic(() =>
  import("@/components/features/HowToPlayModal").then((mod) => mod.HowToPlayModal)
);

interface KnockoutClientProps {
  signOutAction: () => Promise<void>;
}

// ── Zoom / Pan constants ──────────────────────────────────────────────────────
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;

export function KnockoutClient({ signOutAction }: KnockoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
    { label: "Knockout Stage", href: "/knockout" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "How to Play", action: () => setIsHowToPlayOpen(true) },
  ];

  // ── Zoom helpers ─────────────────────────────────────────────────────────────
  const zoomIn = () =>
    setScale((s) => Math.min(s + SCALE_STEP, MAX_SCALE));
  const zoomOut = () => {
    setScale((s) => {
      const next = Math.max(s - SCALE_STEP, MIN_SCALE);
      if (next === MIN_SCALE) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // ── Pan (mouse drag) ─────────────────────────────────────────────────────────
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y };
    },
    [scale, position]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStart.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPosition({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
    },
    [isDragging]
  );

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  // ── Touch / pinch helpers (simple translate only) ────────────────────────────
  const touchStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, px: position.x, py: position.y };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    setPosition({ x: touchStart.current.px + dx, y: touchStart.current.py + dy });
  };

  const onTouchEnd = () => {
    touchStart.current = null;
  };

  // ── Fullscreen toggle ─────────────────────────────────────────────────────────
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="squad-builder-root flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
      {/* ── How to Play modal ── */}
      <HowToPlayModal forceOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />

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
                      href === "/knockout" ? "text-[#c8f000]" : "text-white/60 hover:text-white",
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
                        href === "/knockout" ? "text-[#c8f000]" : "text-white/60 hover:text-white",
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
          <div className="absolute inset-0 bg-gradient-to-br from-[#001a44] via-[#0a0a0a] to-[#001a44]" />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(200,240,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,240,0,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Scrollable / pannable content */}
        <div className="relative z-10 w-full h-full flex flex-col">
          {/* ── Page header ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-shrink-0 px-4 pt-6 pb-4 md:px-8 flex flex-col gap-1 text-center md:text-left"
          >
            <p className="text-[#c8f000] text-xs font-black uppercase tracking-[0.2em]">
              FIFA World Cup 2026
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-widest drop-shadow-lg">
              Knockout Stage
            </h1>
            <p className="text-white/50 text-sm font-semibold mt-1">
              Drag to pan · Pinch or use controls to zoom
            </p>
          </motion.div>

          {/* ── Bracket container ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 relative min-h-0 mx-4 mb-4 md:mx-8 md:mb-6"
          >
            {/* Outer card */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
              {/* Zoom / pan interactive area */}
              <div
                ref={containerRef}
                className={cn(
                  "absolute inset-0 overflow-hidden",
                  scale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
                )}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: "center center",
                    transition: isDragging ? "none" : "transform 0.2s ease",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/matches/ko-bracket.webp"
                      alt="FIFA World Cup 2026 Knockout Bracket"
                      fill
                      className="object-contain"
                      priority
                      sizes="100vw"
                      draggable={false}
                      unoptimized={true}
                    />
                  </div>
                </div>
              </div>

              {/* ── Zoom Controls (top-right) ── */}
              <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                <button
                  id="btn-zoom-in"
                  onClick={zoomIn}
                  disabled={scale >= MAX_SCALE}
                  aria-label="Zoom in"
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                    "bg-black/60 border border-white/20 text-white/80 hover:text-white hover:bg-black/80 hover:border-[#c8f000]/50",
                    "shadow-lg backdrop-blur-sm",
                    scale >= MAX_SCALE && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  id="btn-zoom-out"
                  onClick={zoomOut}
                  disabled={scale <= MIN_SCALE}
                  aria-label="Zoom out"
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                    "bg-black/60 border border-white/20 text-white/80 hover:text-white hover:bg-black/80 hover:border-[#c8f000]/50",
                    "shadow-lg backdrop-blur-sm",
                    scale <= MIN_SCALE && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  id="btn-zoom-reset"
                  onClick={resetZoom}
                  aria-label="Reset view"
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                    "bg-black/60 border border-white/20 text-white/80 hover:text-white hover:bg-black/80 hover:border-[#c8f000]/50",
                    "shadow-lg backdrop-blur-sm",
                    scale === 1 && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <Maximize2 size={15} />
                </button>
              </div>

              {/* ── Zoom level pill (bottom-left) ── */}
              <AnimatePresence>
                {scale !== 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-3 left-3 z-20 px-3 py-1 rounded-full bg-black/70 border border-white/20 text-white/70 text-xs font-bold tracking-wide backdrop-blur-sm"
                  >
                    {Math.round(scale * 100)}%
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Fullscreen button (bottom-right) ── */}
              <button
                id="btn-fullscreen"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
                className="absolute bottom-3 right-3 z-20 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 bg-black/60 border border-white/20 text-white/80 hover:text-[#c8f000] hover:border-[#c8f000]/50 shadow-lg backdrop-blur-sm"
              >
                <Maximize2 size={15} />
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
