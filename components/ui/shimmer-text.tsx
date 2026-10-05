"use client";
/** Shimmer Text — Kokonut UI (https://kokonutui.com, MIT). Adapted: inline span, mint/ice palette. */
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export default function ShimmerText({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      animate={reduce ? undefined : { backgroundPosition: ["200% center", "-200% center"] }}
      transition={{ duration: 5, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
      className={cn("bg-[length:200%_100%] bg-gradient-to-r from-mint via-white to-ice bg-clip-text text-transparent", className)}
    >
      {text}
    </motion.span>
  );
}
