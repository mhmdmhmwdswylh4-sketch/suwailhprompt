"use client";

import { motion, useReducedMotion } from "motion/react";

export default function FeatureCard({ title, desc, index, icon, tag }: { title: string; desc: string; index: number; icon?: React.ReactNode; tag?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="glass group relative overflow-hidden rounded-2xl p-6 transition-colors hover:border-mint/25"
    >
      <div className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full bg-mint/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      {tag && <span className="font-mono text-sm text-mint">{tag}</span>}
      {icon && <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-mint">{icon}</div>}
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{desc}</p>
    </motion.article>
  );
}
