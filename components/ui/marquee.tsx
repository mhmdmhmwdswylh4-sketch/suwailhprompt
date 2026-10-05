"use client";
/** Infinite marquee (pure CSS, pauses on hover, RTL-safe). Pattern from Aceternity "Infinite Moving Cards" / Magic UI Marquee. */
import { cn } from "@/lib/utils";

export default function Marquee({ items, className, reverse = false }: { items: string[]; className?: string; reverse?: boolean }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className={cn("flex shrink-0 items-center gap-3 pe-3", reverse ? "animate-marquee-rev" : "animate-marquee")} dir="ltr">
      {items.map((x) => (
        <li key={x} className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm text-zinc-300">
          {x}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cn("group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)] [&:hover_ul]:[animation-play-state:paused]", className)}>
      {row(false)}
      {row(true)}
    </div>
  );
}
