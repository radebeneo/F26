"use client";

/**
 * src/components/features/HowToScorePanel.tsx
 *
 * Right-side panel for My Squad view.
 * Tabbed scoring reference: ALL PLAYERS | GK & DEF | MID & FWD
 * Data matches the exact screenshot scoring rules.
 */

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tab content data ──────────────────────────────────────────────────────────

interface ScoringRule {
  action: string;
  note?: string;
  points: string;
  /** e.g. +3, -1 */
}

interface ScoringSection {
  title?: string;
  rules: ScoringRule[];
}

const ALL_PLAYERS: ScoringSection[] = [
  {
    rules: [
      { action: "Appearance", note: "(Up to 60 mins)", points: "+1" },
      { action: "Appearance", note: "(60+ minutes)", points: "+1" },
      { action: "Assist", points: "+3" },
      { action: "Yellow card", points: "-1" },
      { action: "Red card", points: "-2" },
      { action: "Own goal", points: "-2" },
      { action: "Conceding a penalty", points: "-1" },
    ],
  },
  {
    title: "BONUS POINTS",
    rules: [
      {
        action: "Goal from direct free-kick",
        note: "If any of your players scores a goal from a direct free-kick (in addition to the goal points)",
        points: "+1",
      },
      {
        action: "Scouting bonus",
        note: "If any of your players scores more than 4pts in a match and is in fewer than 5% of all teams selection",
        points: "+2",
      },
    ],
  },
];

const GK_DEF: ScoringSection[] = [
  {
    title: "GOALKEEPERS",
    rules: [
      { action: "Clean sheet", note: "(60+ minutes)", points: "+5" },
      { action: "First goal conceded", points: "+0" },
      { action: "Each additional goal conceded", points: "-1" },
      { action: "Goal scored", points: "+9" },
      { action: "Penalty save", note: "(Not including shootouts)", points: "+3" },
      { action: "Every 3 saves", points: "+1" },
    ],
  },
  {
    title: "DEFENDERS",
    rules: [
      { action: "Clean sheet", note: "(60+ minutes)", points: "+5" },
      { action: "First goal conceded", points: "+0" },
      { action: "Each additional goal conceded", points: "-1" },
      { action: "Goal scored", points: "+7" },
    ],
  },
];

const MID_FWD: ScoringSection[] = [
  {
    title: "MIDFIELDERS",
    rules: [
      { action: "Clean sheet", note: "(60+ minutes)", points: "+1" },
      { action: "Goal scored", points: "+6" },
      { action: "Every 3 tackles", points: "+1" },
      { action: "Every 2 Chances Created", points: "+1" },
    ],
  },
  {
    title: "FORWARDS",
    rules: [
      { action: "Goal scored", points: "+5" },
      { action: "Every 2 shots on target", points: "+1" },
    ],
  },
];

type TabId = "all" | "gk-def" | "mid-fwd";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "ALL PLAYERS" },
  { id: "gk-def", label: "GK & DEF" },
  { id: "mid-fwd", label: "MID & FWD" },
];

const TAB_DATA: Record<TabId, ScoringSection[]> = {
  all: ALL_PLAYERS,
  "gk-def": GK_DEF,
  "mid-fwd": MID_FWD,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function HowToScorePanel() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sections = TAB_DATA[activeTab];

  return (
    <div className="how-to-score-panel flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-base font-display font-black text-white italic uppercase tracking-wide">
          How to Score
        </h2>
        <button
          id="btn-toggle-how-to-score"
          onClick={() => setIsCollapsed((v) => !v)}
          aria-label={isCollapsed ? "Expand scoring rules" : "Collapse scoring rules"}
          className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* ── Tabs ── */}
          <div className="flex items-center border-b border-white/10 px-5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`btn-score-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-all duration-150 relative",
                  activeTab === tab.id
                    ? "text-white"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-[15%] right-[15%] h-[2px] bg-[#c8f000] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* ── Scoring rows ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
            {sections.map((section, si) => (
              <div key={si}>
                {/* Section title */}
                {section.title && (
                  <div className="pt-4 pb-2">
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-widest">
                      {section.title}
                    </h3>
                    <div className="h-px w-full bg-white/10 mt-2" />
                  </div>
                )}

                {/* Rules */}
                {section.rules.map((rule, ri) => {
                  const isPositive = rule.points.startsWith("+");
                  const isZero = rule.points === "+0";
                  const isNegative = rule.points.startsWith("-");

                  return (
                    <div
                      key={ri}
                      className="how-to-score-row flex items-start justify-between py-3 border-b border-white/5"
                    >
                      <div className="flex-1 pr-4">
                        <span className="text-sm font-bold text-white">
                          {rule.action}
                        </span>
                        {rule.note && (
                          <span className="text-xs text-white/40 ml-1.5">
                            {rule.note}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-black flex-shrink-0",
                          isNegative && "text-red-400",
                          isPositive && !isZero && "text-[#c8f000]",
                          isZero && "text-[#c8f000]"
                        )}
                      >
                        {rule.points}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
