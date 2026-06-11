import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Player } from "@/db/schema";

interface PlayerCardProps {
  player: Player;
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

export function PlayerCard({ player, className }: PlayerCardProps) {
  const formattedNation = formatNationForUrl(player.nation);
  
  // Format price (e.g. 10 -> $10m, 10.5 -> $10.5m)
  const formattedPrice = `$${player.price}m`;

  return (
    <div 
      className={cn(
        "relative w-[180px] h-[220px] rounded-2xl overflow-hidden shadow-lg flex flex-col bg-[#8c8c8c]", 
        className
      )}
    >
      {/* Top section: Nation background image */}
      <div className="relative flex-1 w-full bg-[#8c8c8c]">
        <Image
          src={`/images/nations/${formattedNation}.png`}
          alt={`${player.nation} kit`}
          fill
          className="object-cover object-top"
          sizes="180px"
          priority
        />
      </div>

      {/* Middle section: Player Name */}
      <div className="bg-white w-full py-2 flex items-center justify-center">
        <span className="text-black font-black text-2xl tracking-tight leading-none uppercase">
          {player.lastName || player.firstName}
        </span>
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
