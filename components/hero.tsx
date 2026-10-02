"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import AiOrb from "./ai-orb";
import { useLang } from "./providers";

export default function Hero() {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const fade = (d: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section id="hero-section" className="grain relative overflow-hidden pb-16 pt-28 sm:pt-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(124,242,181,0.10),transparent_70%)]" />
      <div className="container-x relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        <div className="text-center lg:text-start">
          <motion.span {...fade(0)} className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_8px_2px_rgba(124,242,181,0.7)]" />
            {t.hero.badge}
          </motion.span>

          <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            <motion.span {...fade(0.08)} className="block">
              {t.hero.line1}
            </motion.span>
            <motion.span {...fade(0.18)} className="text-gradient block pb-2">
              {t.hero.line2}
            </motion.span>
          </h1>

          <motion.p {...fade(0.3)} className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg lg:mx-0">
            {t.hero.desc}
          </motion.p>

          <motion.div {...fade(0.42)} className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/engineer" className="btn-primary">
              {t.hero.primary}
              <span aria-hidden className="rtl:rotate-180">→</span>
            </Link>
            <a href="#how-it-works" className="btn-ghost">
              {t.hero.secondary}
            </a>
          </motion.div>

          <motion.p {...fade(0.55)} className="mt-6 text-sm text-zinc-500">
            {t.taglineAlt}
          </motion.p>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <AiOrb size={440} fragments={t.hero.fragments} />
        </motion.div>
      </div>
    </section>
  );
}
