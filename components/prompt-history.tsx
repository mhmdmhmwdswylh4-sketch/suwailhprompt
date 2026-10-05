"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import CopyButton from "./copy-button";
import PromptText from "./prompt-text";
import { useAuth, useLang } from "./providers";
import { ApiError, deletePrompt, listPrompts, type SavedPrompt } from "@/lib/api";
import type { Category } from "@/lib/categories";

type Status = "loading" | "ready" | "error";

export default function PromptHistory() {
  const { t, lang } = useLang();
  const { getToken } = useAuth();
  const [cursor, setCursor] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [items, setItems] = useState<SavedPrompt[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [open, setOpen] = useState<SavedPrompt | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const out = await listPrompts(await getToken());
      setItems(out.items);
      setCursor(out.nextCursor);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [getToken]);

  const loadMore = async () => {
    if (!cursor || more) return;
    setMore(true);
    try {
      const out = await listPrompts(await getToken(), cursor);
      setItems((xs) => [...xs, ...out.items.filter((n) => !xs.some((x) => x.id === n.id))]);
      setCursor(out.nextCursor);
    } catch {
      setMsg({ kind: "error", text: t.errors.db });
    } finally {
      setMore(false);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(id);
  }, [msg]);

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePrompt(await getToken(), id);
      setItems((xs) => xs.filter((x) => x.id !== id));
      setConfirmId(null);
      setOpen((o) => (o?.id === id ? null : o));
      setMsg({ kind: "success", text: t.history.deleted });
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof ApiError && e.code === "rate" ? t.errors.rate : t.errors.db });
    } finally {
      setDeletingId(null);
    }
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  const catLabel = (c: string) => (t.categories as Record<string, string>)[c as Category] ?? c;
  const preview = (s: string) => s.replace(/[#*`>\-]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);

  if (status === "loading")
    return (
      <ul className="space-y-3" role="status" aria-label={t.history.loading}>
        {[0, 1, 2].map((i) => (
          <li key={i} className="glass h-32 animate-pulse rounded-2xl" />
        ))}
      </ul>
    );

  if (status === "error")
    return (
      <div className="glass rounded-2xl p-8 text-center" role="alert">
        <p className="text-red-200">{t.errors.db}</p>
        <button className="btn-small mt-4" onClick={load}>{t.history.retry}</button>
      </div>
    );

  if (!items.length)
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <p className="text-zinc-400">{t.history.empty}</p>
        <Link href="/engineer" className="btn-primary mt-6">{t.history.emptyCta}</Link>
      </div>
    );

  return (
    <>
      <AnimatePresence>
        {msg && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role={msg.kind === "error" ? "alert" : "status"}
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${msg.kind === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-mint/30 bg-mint/10 text-mint"}`}
          >
            {msg.text}
          </motion.p>
        )}
      </AnimatePresence>

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map((p) => (
            <motion.li
              key={p.id}
              layout="position"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25 }}
              className="glass rounded-2xl p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 font-medium text-mint">{catLabel(p.category)}</span>
                <time dateTime={p.created_at} className="text-zinc-500">{fmt(p.created_at)}</time>
              </div>
              <p className="mt-3 line-clamp-2 font-medium text-white" dir="auto">{p.original_prompt}</p>
              <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500" dir="auto">{preview(p.optimized_prompt)}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button className="btn-small" onClick={() => setOpen(p)}>{t.history.open}</button>
                {confirmId === p.id ? (
                  <>
                    <span className="text-xs text-zinc-400">{t.history.confirmDelete}</span>
                    <button className="btn-small !border-red-400/40 !text-red-300" disabled={deletingId === p.id} onClick={() => remove(p.id)}>
                      {deletingId === p.id ? t.history.deleting : t.history.delete}
                    </button>
                    <button className="btn-small" onClick={() => setConfirmId(null)}>{t.history.cancel}</button>
                  </>
                ) : (
                  <button className="btn-small hover:!text-red-300" onClick={() => setConfirmId(p.id)}>{t.history.delete}</button>
                )}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {cursor && (
        <div className="mt-6 flex justify-center">
          <button className="btn-small" onClick={loadMore} disabled={more}>
            {more ? t.history.loading : t.history.loadMore}
          </button>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t.result.title}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="glass flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-ink-900/95 sm:rounded-3xl"
            >
              <header className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-4">
                <span className="rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-xs font-medium text-mint">{catLabel(open.category)}</span>
                <div className="flex gap-2">
                  <CopyButton text={open.optimized_prompt} onError={(m) => setMsg({ kind: "error", text: m })} />
                  <button className="btn-small" onClick={() => setOpen(null)}>{t.history.close}</button>
                </div>
              </header>
              <div className="overflow-y-auto px-5 py-5">
                <p className="text-xs uppercase tracking-widest text-zinc-500">{t.history.original}</p>
                <p className="mt-1.5 text-zinc-200" dir="auto">{open.original_prompt}</p>
                <hr className="my-5 border-white/[0.07]" />
                <PromptText text={open.optimized_prompt} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
