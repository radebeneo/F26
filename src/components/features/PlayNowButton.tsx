"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function PlayNowButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    startTransition(() => {
      router.push("/auth/register");
    });
  };

  return (
    <button
      id="cta-play-now"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "homepage-cta-btn flex items-center justify-center gap-2",
        isPending && "opacity-70 cursor-wait"
      )}
    >
      {isPending ? (
        <>
          <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block" />
          LOADING...
        </>
      ) : (
        "PLAY NOW"
      )}
    </button>
  );
}
