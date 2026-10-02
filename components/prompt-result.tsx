"use client";

import { motion } from "motion/react";
import CopyButton from "./copy-button";
import PromptText from "./prompt-text";
import { useLang } from "./providers";

export type SaveState = "idle" | "saving" | "saved";

export default function PromptResult({
  prompt,
  saveState,
  busy,
  onSave,
  onRegenerate,
  onError,
}: {
  prompt: string;
  saveState: SaveState;
  busy: boolean;
  onSave: () => void;
  onRegenerate: () => void;
  onError: (m: string) => void;
}) {
  const { t } = useLang();
  return (
    <motion.section
      id="result-card"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-3xl border-mint/20"
      aria-labelledby="result-title"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mint/60 to-transparent" />
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
        <h2 id="result-title" className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_10px_2px_rgba(124,242,181,0.7)]" />
          {t.result.title}
        </h2>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={prompt} onError={onError} />
          <button className="btn-small" onClick={onSave} disabled={saveState !== "idle" || busy}>
            {saveState === "saving" ? t.result.saving : saveState === "saved" ? `✓ ${t.result.saved}` : t.result.save}
          </button>
          <button className="btn-small" onClick={onRegenerate} disabled={busy}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-3-6.7M21 4v5h-5" /></svg>
            {t.result.regenerate}
          </button>
        </div>
      </header>
      <div className="max-h-[60vh] overflow-y-auto px-5 py-5 sm:px-6">
        <PromptText text={prompt} />
      </div>
    </motion.section>
  );
}
