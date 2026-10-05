"use client";
/** Hover Border Gradient — Aceternity UI (MIT). Adapted: mint highlight, a11y-friendly, rotation paused for reduced motion. */
import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";
const DIRS: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];

const movingMap: Record<Direction, string> = {
  TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(0,0%,100%) 0%, rgba(255,255,255,0) 100%)",
  LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, hsl(0,0%,100%) 0%, rgba(255,255,255,0) 100%)",
  BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, hsl(0,0%,100%) 0%, rgba(255,255,255,0) 100%)",
  RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, hsl(0,0%,100%) 0%, rgba(255,255,255,0) 100%)",
};
const highlight = "radial-gradient(75% 181% at 50% 50%, #7cf2b5 0%, rgba(255,255,255,0) 100%)";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1.2,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  { as?: React.ElementType; containerClassName?: string; className?: string; duration?: number; clockwise?: boolean } & Record<string, unknown>
>) {
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState<Direction>("TOP");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (hovered || reduce) return;
    const id = setInterval(() => {
      setDirection((d) => {
        const i = DIRS.indexOf(d);
        return DIRS[clockwise ? (i - 1 + DIRS.length) % DIRS.length : (i + 1) % DIRS.length];
      });
    }, duration * 1000);
    return () => clearInterval(id);
  }, [hovered, reduce, clockwise, duration]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex h-min w-fit flex-col flex-nowrap items-center justify-center overflow-visible rounded-full border border-white/10 bg-white/10 p-px transition duration-500 hover:bg-white/5 active:scale-[0.97]",
        containerClassName,
      )}
      {...props}
    >
      <div className={cn("z-10 w-auto rounded-[inherit] bg-ink-950 px-5 py-3 text-white", className)}>{children}</div>
      <motion.div
        aria-hidden
        className="absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]"
        style={{ filter: "blur(2px)", position: "absolute", width: "100%", height: "100%" }}
        initial={{ background: movingMap[direction] }}
        animate={{ background: hovered ? [movingMap[direction], highlight] : movingMap[direction] }}
        transition={{ ease: "linear", duration }}
      />
      <div aria-hidden className="absolute inset-[2px] z-[1] flex-none rounded-[100px] bg-ink-950" />
    </Tag>
  );
}
