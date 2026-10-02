"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import FeatureCard from "./feature-card";
import { Logo } from "./logo";
import { useLang } from "./providers";

const icons = [
  <path key="0" d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />,
  <path key="1" d="M4 6h7v7H4zM13 11h7v7h-7zM13 4h7v5h-7zM4 15h7v3H4z" />,
  <path key="2" d="M9 9h10v10H9zM5 15V5h10" />,
  <path key="3" d="M12 7v5l3 2M21 12a9 9 0 11-3-6.7M21 4v5h-5" />,
  <path key="4" d="M3 5h8M7 3v2M5 9c1.5 3 4 5 7 6M11 5c-.5 4-3 8-7 10M13 21l4-10 4 10M14.5 18h5" />,
  <path key="5" d="M6 11V8a6 6 0 1112 0v3M5 11h14v9H5z" />,
];

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
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.features.items.map((f, i) => (
          <FeatureCard
            key={f.title}
            index={i}
            title={f.title}
            desc={f.desc}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {icons[i]}
              </svg>
            }
          />
        ))}
      </div>
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
