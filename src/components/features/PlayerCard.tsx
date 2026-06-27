import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Player } from "@/db/schema";

interface PlayerCardProps {
  player: Player;
  nextFixture?: string;
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

export function PlayerCard({ player, nextFixture, className }: PlayerCardProps) {
  const formattedNation = formatNationForUrl(player.nation);

  // Format price (e.g. 10 -> $10m, 10.5 -> $10.5m)
  const formattedPrice = `$${player.price}m`;

  // Use official FIFA portrait when available, otherwise fall back to kit image.
  // Portraits are full-body — object-top anchors the head/shoulders in the crop area.
  const imageSrc = player.imageUrl ?? `/images/kits/${formattedNation}.webp`;
  const isPortrait = !!player.imageUrl;

  return (
    <div
      className={cn(
        "relative w-[180px] h-[220px] rounded-2xl overflow-hidden shadow-lg flex flex-col bg-[#8c8c8c]",
        className
      )}
    >
      {/* Top section: Player portrait or nation kit */}
      <div className="relative flex-1 w-full bg-[#8c8c8c] overflow-hidden">
        <Image
          src={imageSrc}
          alt={isPortrait ? `${player.firstName} ${player.lastName}` : `${player.nation} kit`}
          fill
          className="object-cover object-top"
          sizes="180px"
          priority
        />
      </div>

      {/* Middle section: Player Name & Next Fixture */}
      <div className="bg-white w-full py-2 flex flex-col items-center justify-center">
        <span className="text-black font-black text-2xl tracking-tight leading-none uppercase">
          {player.knownName || player.lastName || player.firstName}
        </span>
        {nextFixture && (
          <div className="mt-1 flex items-center justify-center gap-1">
            <span className="text-[10px] font-bold text-black/60">v</span>
            <span className="text-[12px] font-black text-[#cca64f] uppercase">{nextFixture}</span>
          </div>
        )}
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
