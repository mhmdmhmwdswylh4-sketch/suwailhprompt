"use client";
/**
 * Background Beams — Aceternity UI (https://ui.aceternity.com/components/background-beams), MIT.
 * Adapted: generated paths (fewer = lighter), mint/ice palette, only animated on desktop / no reduced motion.
 */
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useHeavyMotionOk } from "./use-motion-ok";

const PATHS = Array.from({ length: 22 }, (_, i) => {
  const o = i * 14;
  return `M-${380 - o} -${189 + i * 16}C-${380 - o} -${189 + i * 16} -${312 - o} ${216 - i * 8} ${152 + o} ${343 - i * 8}C${616 + o} ${470 - i * 8} ${684 + o} ${875 - i * 8} ${684 + o} ${875 - i * 8}`;
});

export const BackgroundBeams = React.memo(({ className }: { className?: string }) => {
  const animate = useHeavyMotionOk();
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center", className)}>
      <svg className="pointer-events-none absolute z-0 h-full w-full" width="100%" height="100%" viewBox="0 0 696 316" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={PATHS.join(" ")} stroke="url(#beam-radial)" strokeOpacity="0.35" strokeWidth="0.5" />
        {animate &&
          PATHS.map((path, index) => (
            <motion.path
              key={`beam-${index}`}
              d={path}
              stroke={`url(#beam-grad-${index})`}
              strokeOpacity="0.6"
              strokeWidth="0.6"
            />
          ))}
        <defs>
          {PATHS.map((_, index) => (
            <motion.linearGradient
              id={`beam-grad-${index}`}
              key={`beam-grad-${index}`}
              initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
              animate={{ x1: ["0%", "100%"], x2: ["0%", "95%"], y1: ["0%", "100%"], y2: ["0%", `${93 + (index % 8) * 1}%`] }}
              transition={{ duration: 8 + (index % 9), ease: "easeInOut", repeat: Infinity, delay: (index % 7) * 0.9 }}
            >
              <stop stopColor="#5ad1ff" stopOpacity="0" />
              <stop stopColor="#5ad1ff" />
              <stop offset="32.5%" stopColor="#7cf2b5" />
              <stop offset="100%" stopColor="#7cf2b5" stopOpacity="0" />
            </motion.linearGradient>
          ))}
          <radialGradient id="beam-radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(352 34) rotate(90) scale(555 1560.62)">
            <stop offset="0.0667" stopColor="#7cf2b5" />
            <stop offset="0.243" stopColor="#5ad1ff" />
            <stop offset="0.436" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
});
BackgroundBeams.displayName = "BackgroundBeams";
