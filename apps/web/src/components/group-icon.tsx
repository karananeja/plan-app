import { cn } from "cn";
import { groupColourClass } from "@/lib/groups.ts";

export function GroupIcon({ emoji, colour, className }: { emoji: string; colour: string; className?: string }) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg text-xl", groupColourClass(colour), className)} aria-hidden>
      {emoji}
    </span>
  );
}
