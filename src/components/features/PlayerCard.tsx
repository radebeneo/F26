"use client";

import Image from "next/image";
import { useState } from "react";
import { cn, ELIMINATED_NATIONS } from "@/lib/utils";
import type { Player } from "@/db/schema";

interface PlayerCardProps {
  player: Player;
  nextFixtures?: { acronym: string; name: string }[];
  className?: string;
}

export function formatNationForUrl(nation: string) {
  const normalized = nation
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove accents (côte -> cote)

  if (normalized === "united states") return "usa";
  if (normalized === "cote d'ivoire") return "cote-d'ivoire";

  return normalized
    .replace(/[^a-z0-9]+/g, "-") // replace any non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, ""); // trim hyphens
}

export function PlayerCard({ player, nextFixtures, className }: PlayerCardProps) {
  const [imgError, setImgError] = useState(false);
  const formattedNation = formatNationForUrl(player.nation);

  // Format price (e.g. 10 -> $10m, 10.5 -> $10.5m)
  const formattedPrice = `$${player.price}m`;

  // Use official FIFA portrait when available, otherwise fall back to kit image.
  // Portraits are full-body — object-top anchors the head/shoulders in the crop area.
  const fallbackSrc = `/images/kits/${formattedNation}.webp`;
  const imageSrc = !imgError && player.imageUrl ? player.imageUrl : fallbackSrc;
  const isPortrait = !imgError && !!player.imageUrl;
  const isEliminated = ELIMINATED_NATIONS.includes(player.nation);

  return (
    <div
      className={cn(
        "relative w-[180px] h-[270px] rounded-2xl overflow-hidden shadow-lg flex flex-col bg-[#8c8c8c]",
        isEliminated && "grayscale-[100%] opacity-90",
        className
      )}
    >
      {isEliminated && (
        <div className="absolute top-2 left-2 z-20 bg-white rounded-full p-1 shadow-sm">
          <Image src="/fantasy-icons/eliminated.webp" alt="Eliminated" width={24} height={24} className="object-contain" />
        </div>
      )}
      {/* Top section: Player portrait or nation kit */}
      <div className="relative flex-1 w-full bg-[#8c8c8c] overflow-hidden">
        <Image
          src={imageSrc}
          alt={isPortrait ? `${player.firstName} ${player.lastName}` : `${player.nation} kit`}
          fill
          className="object-cover object-top"
          sizes="180px"
          priority
          onError={() => setImgError(true)}
        />
      </div>

      {/* Middle section: Player Name & Next Fixture */}
      <div className="bg-white w-full py-2 flex flex-col items-center justify-center">
        <span className="text-black font-black text-2xl tracking-tight leading-none uppercase">
          {player.knownName || player.lastName || player.firstName}
        </span>
        {nextFixtures && nextFixtures.length > 0 && (
          <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
            {nextFixtures.map((fixture, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-black/60">v</span>
                <span className="text-[12px] font-black text-[#cca64f] uppercase">{fixture.acronym}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats section: %selected, Last Rd Pts, Total Pts */}
      <div className="bg-[#f8f8f8] w-full py-1.5 flex items-center justify-around border-t border-gray-200">
        <div className="flex flex-col items-center">
          <span className="text-black font-black text-sm">{player.percentSelected ?? 0}%</span>
          <span className="text-[8px] font-bold text-black/50 uppercase tracking-widest">Selected</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-black font-black text-sm">{player.lastRoundPoints ?? 0}</span>
          <span className="text-[8px] font-bold text-black/50 uppercase tracking-widest">Last Rd</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-black font-black text-sm">{player.totalPoints ?? 0}</span>
          <span className="text-[8px] font-bold text-black/50 uppercase tracking-widest">Total</span>
        </div>
      </div>

      {/* Bottom section: Player Price */}
      <div className="bg-[#111111] w-full py-2 flex items-center justify-center rounded-b-2xl">
        <span className="text-white font-black text-[1.4rem] tracking-wider leading-none uppercase">
          {formattedPrice}
        </span>
      </div>
    </div>
  );
}
