"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const nations = [
  { id: "algeria", name: "Algeria" },
  { id: "argentina", name: "Argentina" },
  { id: "australia", name: "Australia" },
  { id: "austria", name: "Austria" },
  { id: "belgium", name: "Belgium" },
  { id: "bosnia-herzegovina", name: "Bosnia & Herzegovina" },
  { id: "brazil", name: "Brazil" },
  { id: "cabo-verde", name: "Cabo Verde" },
  { id: "canada", name: "Canada" },
  { id: "colombia", name: "Colombia" },
  { id: "congo-dr", name: "DR Congo" },
  { id: "cote-d'ivoire", name: "Côte d'Ivoire" },
  { id: "croatia", name: "Croatia" },
  { id: "curacao", name: "Curaçao" },
  { id: "czechia", name: "Czechia" },
  { id: "ecuador", name: "Ecuador" },
  { id: "egypt", name: "Egypt" },
  { id: "england", name: "England" },
  { id: "france", name: "France" },
  { id: "germany", name: "Germany" },
  { id: "ghana", name: "Ghana" },
  { id: "haiti", name: "Haiti" },
  { id: "iran", name: "Iran" },
  { id: "iraq", name: "Iraq" },
  { id: "japan", name: "Japan" },
  { id: "jordan", name: "Jordan" },
  { id: "mexico", name: "Mexico" },
  { id: "morocco", name: "Morocco" },
  { id: "netherlands", name: "Netherlands" },
  { id: "new-zealand", name: "New Zealand" },
  { id: "norway", name: "Norway" },
  { id: "panama", name: "Panama" },
  { id: "paraguay", name: "Paraguay" },
  { id: "portugal", name: "Portugal" },
  { id: "qatar", name: "Qatar" },
  { id: "saudi-arabia", name: "Saudi Arabia" },
  { id: "scotland", name: "Scotland" },
  { id: "senegal", name: "Senegal" },
  { id: "south-africa", name: "South Africa" },
  { id: "south-korea", name: "South Korea" },
  { id: "spain", name: "Spain" },
  { id: "sweden", name: "Sweden" },
  { id: "switzerland", name: "Switzerland" },
  { id: "tunisia", name: "Tunisia" },
  { id: "turkiye", name: "Türkiye" },
  { id: "uruguay", name: "Uruguay" },
  { id: "usa", name: "USA" },
  { id: "uzbekistan", name: "Uzbekistan" }
];

export function CountrySelect({ name, id }: { name: string; id?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedNation = nations.find((n) => n.id === selectedId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-sm font-medium text-foreground ml-1" htmlFor={id || name}>
        Favorite Team
      </label>

      {/* Hidden input to submit the value in the form */}
      <input type="hidden" name={name} id={id || name} value={selectedId} required />

      <div className="relative">
        <button
          type="button"
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-lg border bg-white/5 px-4 py-2 text-base text-foreground transition-colors",
            isOpen ? "border-primary/50 bg-white/10" : "border-white/10 hover:border-white/20 hover:bg-white/10"
          )}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-3">
            {selectedNation ? (
              <>
                <Image
                  src={`/images/flags/${selectedNation.id}.png`}
                  alt={selectedNation.name}
                  width={24}
                  height={16}
                  className="rounded-sm object-cover"
                />
                <span>{selectedNation.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Select a team...</span>
            )}
          </div>
          <ChevronDown
            size={16}
            className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#0B132B] p-1 shadow-xl"
            >
              {nations.map((nation) => (
                <button
                  key={nation.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/10",
                    selectedId === nation.id ? "bg-primary/20 text-primary font-medium" : "text-foreground"
                  )}
                  onClick={() => {
                    setSelectedId(nation.id);
                    setIsOpen(false);
                  }}
                >
                  <Image
                    src={`/images/flags/${nation.id}.png`}
                    alt={nation.name}
                    width={24}
                    height={16}
                    className="rounded-sm object-cover"
                  />
                  {nation.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
