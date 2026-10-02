"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useLang } from "./providers";

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) return navigator.clipboard.writeText(text);
  // Fallback for non-secure contexts / older mobile browsers.
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  if (!ok) throw new Error("copy");
}

export default function CopyButton({ text, className = "btn-small", onError }: { text: string; className?: string; onError?: (m: string) => void }) {
  const { t } = useLang();
  const [done, setDone] = useState(false);

  const click = async () => {
    try {
      await copyText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      onError?.(t.errors.copy);
    }
  };

  return (
    <button onClick={click} className={`${className} ${done ? "!border-mint/40 !text-mint" : ""}`} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={done ? "ok" : "copy"}
          initial={{ opacity: 0, scale: 0.7, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: -4 }}
          transition={{ duration: 0.15 }}
          className="inline-flex items-center gap-2"
        >
          {done ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 012-2h9" /></svg>
          )}
          {done ? t.result.copied : t.result.copy}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
