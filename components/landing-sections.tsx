"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import FeatureCard from "./feature-card";
import { Braces, Languages, LayoutGrid, Lock, Sparkles, History as HistoryIcon } from "lucide-react";
import SpotlightCards from "./ui/spotlight-cards";
import Marquee from "./ui/marquee";
import { CATEGORIES } from "@/lib/categories";
import { Logo } from "./logo";
import { useLang } from "./providers";

const FEATURE_STYLE = [
  { icon: Sparkles, color: "#7cf2b5" },
  { icon: LayoutGrid, color: "#5ad1ff" },
  { icon: Braces, color: "#a78bfa" },
  { icon: HistoryIcon, color: "#f59e0b" },
  { icon: Languages, color: "#f472b6" },
  { icon: Lock, color: "#34d399" },
];

export function CategoryMarquee() {
  const { t } = useLang();
  const labels = CATEGORIES.map((c) => t.categories[c]);
  return (
    <section aria-label={t.engineer.category} className="space-y-3 py-6">
      <Marquee items={labels} />
      <Marquee items={[...labels].reverse()} reverse />
    </section>
  );
}

export function Demo() {
  const { t } = useLang();
  const reduce = useReducedMotion();
  return (
    <section className="container-x py-16 sm:py-24" aria-labelledby="demo-title">
      <h2 id="demo-title" className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {t.demo.title}
      </h2>
      <div className="mt-10 grid items-stretch gap-4 md:grid-cols-[0.8fr_auto_1.2fr]">
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-5"
        >
          <p className="text-xs uppercase tracking-widest text-zinc-500">{t.demo.before}</p>
          <p className="mt-3 text-lg text-zinc-200">&ldquo;{t.demo.input}&rdquo;</p>
        </motion.div>
        <div className="grid place-items-center text-2xl text-mint" aria-hidden>
          <span className="rotate-90 md:rotate-0 md:rtl:rotate-180">→</span>
        </div>
        <motion.div
          initial={reduce ? false : { opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border-mint/20 p-5"
        >
          <p className="text-xs uppercase tracking-widest text-mint">{t.demo.after}</p>
          <div className="mt-3 space-y-1 font-mono text-[13px] leading-relaxed" dir="auto">
            {t.demo.lines.map((l, i) => (
              <motion.p
                key={i}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.09 }}
                className={l.startsWith("#") ? "pt-2 font-semibold text-mint" : "text-zinc-300"}
              >
                {l}
              </motion.p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const { t } = useLang();
  return (
    <section id="how-it-works" className="container-x scroll-mt-24 py-16 sm:py-24" aria-labelledby="how-title">
      <div className="text-center">
        <h2 id="how-title" className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t.how.title}</h2>
        <p className="mt-3 text-zinc-400">{t.how.subtitle}</p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {t.how.steps.map((s, i) => (
          <FeatureCard key={s.n} index={i} tag={s.n} title={s.title} desc={s.desc} />
        ))}
      </div>
    </section>
  );
}

export function Features() {
  const { t } = useLang();
  return (
    <section id="features" className="container-x py-16 sm:py-24" aria-labelledby="features-title">
      <h2 id="features-title" className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {t.features.title}
      </h2>
      <SpotlightCards
        className="mt-10"
        items={t.features.items.map((f, i) => ({ title: f.title, description: f.desc, icon: FEATURE_STYLE[i % FEATURE_STYLE.length].icon, color: FEATURE_STYLE[i % FEATURE_STYLE.length].color }))}
      />
    </section>
  );
}

export function FinalCta() {
  const { t } = useLang();
  return (
    <section className="container-x py-16 sm:py-24">
      <div className="glass relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(124,242,181,0.14),transparent_70%)]" />
        <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t.cta.title}</h2>
        <Link href="/engineer" className="btn-primary relative mt-8">
          {t.cta.button}
          <span aria-hidden className="rtl:rotate-180">→</span>
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <div className="container-x flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo />
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} SUWAILIH PROMPT. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
