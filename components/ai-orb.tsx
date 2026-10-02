"use client";

import { motion, useReducedMotion } from "motion/react";

export type OrbState = "idle" | "processing" | "done";

/**
 * The prompt engine visual. Only transform/opacity are animated so it stays smooth on low-end phones.
 */
export default function AiOrb({ state = "idle", size = 380, fragments = [] }: { state?: OrbState; size?: number; fragments?: readonly string[] }) {
  const reduce = useReducedMotion();
  const speed = state === "processing" ? 0.35 : 1; // multiplier on duration (lower = faster)
  const px = `min(${size}px, 82vw)`;

  const ring = (i: number) => ({
    animate: reduce ? {} : { rotate: i % 2 ? -360 : 360 },
    transition: { duration: (24 + i * 10) * speed, repeat: Infinity, ease: "linear" as const },
  });

  return (
    <div className="relative mx-auto aspect-square" style={{ width: px }} aria-hidden="true">
      {/* ambient glow */}
      <motion.div
        className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(124,242,181,0.35),rgba(90,209,255,0.12)_55%,transparent_72%)] blur-2xl"
        animate={reduce ? {} : { scale: state === "processing" ? [1, 1.18, 1] : [1, 1.06, 1], opacity: state === "done" ? 1 : [0.7, 1, 0.7] }}
        transition={{ duration: 5 * speed + 0.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* orbital rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          {...ring(i)}
          className="absolute rounded-full border border-white/10"
          style={{ inset: `${i * 11}%` }}
        >
          <span
            className="absolute -top-[3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-mint shadow-[0_0_14px_3px_rgba(124,242,181,0.7)]"
            style={{ opacity: 1 - i * 0.25 }}
          />
          {i === 1 && <span className="absolute -bottom-[3px] left-1/2 h-1.5 w-1.5 rounded-full bg-ice shadow-[0_0_12px_3px_rgba(90,209,255,0.6)]" />}
        </motion.div>
      ))}

      {/* core */}
      <motion.div
        className="absolute inset-[30%] rounded-full"
        style={{
          background: "radial-gradient(circle at 32% 28%, #e9fff4 0%, #7cf2b5 28%, #1c6b5a 62%, #07140f 100%)",
          boxShadow: "0 0 80px 8px rgba(124,242,181,0.28), inset 0 -10px 30px rgba(0,0,0,0.5)",
        }}
        animate={
          reduce
            ? {}
            : state === "done"
              ? { scale: [1, 1.14, 1] }
              : { scale: state === "processing" ? [1, 1.08, 0.97, 1.06, 1] : [1, 1.03, 1] }
        }
        transition={{ duration: state === "done" ? 0.7 : 4 * speed + 0.4, repeat: state === "done" ? 0 : Infinity, ease: "easeInOut" }}
      />

      {/* success ripple */}
      {state === "done" && !reduce && (
        <motion.span
          className="absolute inset-[30%] rounded-full border-2 border-mint"
          initial={{ scale: 1, opacity: 0.9 }}
          animate={{ scale: 2.3, opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      )}

      {/* floating prompt fragments */}
      {fragments.map((f, i) => {
        const a = (i / fragments.length) * Math.PI * 2 - Math.PI / 2;
        const r = 47;
        return (
          <motion.span
            key={f}
            className="glass absolute rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-300 sm:text-[11px]"
            style={{ left: `${50 + Math.cos(a) * r}%`, top: `${50 + Math.sin(a) * r}%`, translate: "-50% -50%" }}
            animate={reduce ? {} : { y: [0, -6, 0] }}
            transition={{ duration: (4 + i * 0.7) * speed + 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          >
            {f}
          </motion.span>
        );
      })}
    </div>
  );
}
