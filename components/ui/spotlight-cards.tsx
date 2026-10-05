"use client";
/**
 * Spotlight Cards — Kokonut UI (https://kokonutui.com, MIT, by @dorianbaffier).
 * Adapted to Tailwind 3, dark-only, RTL-safe. 3D tilt only for fine pointers.
 */
import type { LucideIcon } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const TILT_MAX = 8;
const TILT_SPRING = { stiffness: 300, damping: 28 } as const;
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const;

export interface SpotlightItem {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

function Card({ item, index }: { item: SpotlightItem; index: number }) {
  const Icon = item.icon;
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const nx = useMotionValue(0.5);
  const ny = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(ny, [0, 1], [TILT_MAX, -TILT_MAX]), TILT_SPRING);
  const rotateY = useSpring(useTransform(nx, [0, 1], [-TILT_MAX, TILT_MAX]), TILT_SPRING);
  const glow = useSpring(0, GLOW_SPRING);

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    nx.set((e.clientX - r.left) / r.width);
    ny.set((e.clientY - r.top) / r.height);
  };
  const leave = () => {
    nx.set(0.5);
    ny.set(0.5);
    glow.set(0);
  };

  return (
    <motion.article
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.09, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={move}
      onPointerEnter={() => glow.set(1)}
      onPointerLeave={leave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={cn(
        "group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6",
        "transition-[border-color] duration-300 hover:border-white/[0.16]",
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse at 20% 20%, ${item.color}14, transparent 65%)` }} />
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: glow, background: `radial-gradient(ellipse at 20% 20%, ${item.color}2e, transparent 65%)` }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 start-0 w-[55%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%] rtl:translate-x-full rtl:group-hover:-translate-x-[280%]" />

      <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${item.color}18`, boxShadow: `inset 0 0 0 1px ${item.color}30` }}>
        <Icon size={19} strokeWidth={1.9} style={{ color: item.color }} aria-hidden />
      </div>
      <div className="relative z-10 flex flex-col gap-2">
        <h3 className="text-base font-semibold tracking-tight text-white">{item.title}</h3>
        <p className="text-sm leading-relaxed text-white/50">{item.description}</p>
      </div>
      <div aria-hidden className="absolute bottom-0 start-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full" style={{ background: `linear-gradient(to right, ${item.color}90, transparent)` }} />
    </motion.article>
  );
}

export default function SpotlightCards({ items, className }: { items: SpotlightItem[]; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item, i) => (
        <Card key={item.title} item={item} index={i} />
      ))}
    </div>
  );
}
