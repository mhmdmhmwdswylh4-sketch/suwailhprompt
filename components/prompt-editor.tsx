"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AiOrb, { type OrbState } from "./ai-orb";
import ModelPicker, { type ModelSelection } from "./model-picker";
import PromptResult, { type SaveState } from "./prompt-result";
import { useAuth, useLang } from "./providers";
import { CATEGORIES, MAX_IDEA_LENGTH, MIN_IDEA_LENGTH, type Category } from "@/lib/categories";
import { ApiError, savePrompt, streamEngineer } from "@/lib/api";

type Toast = { kind: "error" | "success"; text: string } | null;

export default function PromptEditor() {
  const { t } = useLang();
  const { getToken } = useAuth();
  const router = useRouter();

  const [idea, setIdea] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [phase, setPhase] = useState<"idle" | "working" | "done">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<{ idea: string; category: Category } | null>(null);
  const [mock, setMock] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [toast, setToast] = useState<Toast>(null);
  const [sel, setSel] = useState<ModelSelection>({ provider: "nvidia", model: "openai/gpt-oss-20b", ready: true });
  const onSel = useCallback((s: ModelSelection) => setSel(s), []);
  const resultRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = phase === "working";
  const trimmed = idea.trim();
  const valid = trimmed.length >= MIN_IDEA_LENGTH && trimmed.length <= MAX_IDEA_LENGTH && sel.ready;

  // Advance the 4 visual stages while the request is in flight (the last one waits for the response).
  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const timers = [1, 2, 3].map((n) => setTimeout(() => setStep(n), n * 1800));
    return () => timers.forEach(clearTimeout);
  }, [busy]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.kind === "success" ? 3000 : 6000);
    return () => clearTimeout(id);
  }, [toast]);

  const run = useCallback(
    async (req: { idea: string; category: Category }) => {
      setToast(null);
      setPhase("working");
      setSaveState("idle");
      setLastRequest(req);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let revealed = false;
      try {
        const token = await getToken();
        const out = await streamEngineer(
          token,
          req.idea,
          req.category,
          (full) => {
            // First tokens arrived: show the result live under the orb overlay.
            setResult(full);
            if (!revealed) {
              revealed = true;
              setStep(3);
            }
          },
          ctrl.signal,
          { provider: sel.provider, model: sel.model, apiKey: sel.apiKey },
        );
        setResult(out.prompt);
        setMock(out.mock);
        setStep(3);
        setPhase("done");
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
        setTimeout(() => setPhase((p) => (p === "done" ? "idle" : p)), 1300);
      } catch (e) {
        setPhase("idle");
        const code = e instanceof ApiError ? e.code : e instanceof Error ? e.message : "";
        if (code === "aborted") return;
        if (code === "auth") {
          setToast({ kind: "error", text: t.errors.auth });
          setTimeout(() => router.replace("/login?next=/engineer"), 1200);
          return;
        }
        const text =
          code === "ai" ? t.errors.ai : code === "busy" ? t.errors.busy : code === "key" ? t.errors.key : code === "key_missing" ? t.errors.key_missing : code === "model" ? t.errors.model : code === "provider_rate" ? t.errors.provider_rate : code === "network" ? t.errors.network : code === "rate" ? t.errors.rate : code === "invalid" ? t.errors.invalid : t.errors.generic;
        setToast({ kind: "error", text });
      }
    },
    [getToken, router, t, sel],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    void run({ idea: trimmed, category });
  };

  const save = async () => {
    if (!result || !lastRequest || saveState !== "idle") return;
    setSaveState("saving");
    try {
      const token = await getToken(); // fails fast with "auth" if the session is gone
      await savePrompt(token, { original: lastRequest.idea, optimized: result, category: lastRequest.category });
      setSaveState("saved");
      setToast({ kind: "success", text: t.result.saveSuccess });
    } catch (e) {
      setSaveState("idle");
      const code = e instanceof ApiError ? e.code : e instanceof Error ? e.message : "";
      setToast({ kind: "error", text: code === "auth" ? t.errors.auth : code === "rate" ? t.errors.rate : code === "limit" ? t.errors.limit : t.errors.db });
    }
  };

  const orbState: OrbState = phase === "working" ? "processing" : phase === "done" ? "done" : "idle";

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="glass relative overflow-hidden rounded-3xl p-4 sm:p-6" aria-busy={busy}>
        <label htmlFor="idea-input" className="sr-only">{t.engineer.placeholder}</label>
        <textarea
          id="idea-input"
          value={idea}
          onChange={(e) => setIdea(e.target.value.slice(0, MAX_IDEA_LENGTH))}
          placeholder={t.engineer.placeholder}
          rows={6}
          disabled={busy}
          dir="auto"
          className="field min-h-[160px] resize-y leading-relaxed sm:min-h-[200px]"
        />
        <div className="mt-1.5 flex justify-end text-xs text-zinc-500">
          <span className={idea.length > MAX_IDEA_LENGTH * 0.95 ? "text-amber-400" : ""}>
            {idea.length}/{MAX_IDEA_LENGTH} {t.engineer.chars}
          </span>
        </div>

        <fieldset className="mt-3" disabled={busy}>
          <legend className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">{t.engineer.category}</legend>
          <div className="-mx-1 flex flex-wrap gap-2 px-1" role="radiogroup">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={category === c}
                onClick={() => setCategory(c)}
                className={`min-h-[44px] rounded-full border px-4 text-sm transition-colors active:scale-95 ${
                  category === c ? "border-mint/50 bg-mint/10 text-mint" : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                }`}
              >
                {t.categories[c]}
              </button>
            ))}
          </div>
        </fieldset>

        <ModelPicker onChange={onSel} disabled={busy} />

        <button type="submit" disabled={!valid || busy} className="btn-primary mt-5 w-full sm:w-auto">
          {busy ? t.engineer.working : t.engineer.button}
        </button>

        {/* processing overlay */}
        <AnimatePresence>
          {(busy || phase === "done") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 grid place-items-center bg-ink-950/85 backdrop-blur-md"
              role="status"
              aria-live="polite"
            >
              <div className="flex w-full flex-col items-center px-4">
                <div className="w-[190px] sm:w-[230px]">
                  <AiOrb state={orbState} size={230} />
                </div>
                <ol className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm">
                  {t.engineer.steps.map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className={`transition-colors duration-300 ${i === step && phase !== "done" ? "font-semibold text-mint" : i < step || phase === "done" ? "text-zinc-400" : "text-zinc-600"}`}>
                        {i < step || phase === "done" ? "✓ " : ""}
                        {s}
                      </span>
                      {i < 3 && <span className="text-zinc-700 rtl:rotate-180">→</span>}
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <AnimatePresence>
        {toast && (
          <motion.p
            key={toast.text}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role={toast.kind === "error" ? "alert" : "status"}
            className={`rounded-2xl border px-4 py-3 text-sm ${
              toast.kind === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-mint/30 bg-mint/10 text-mint"
            }`}
          >
            {toast.text}
          </motion.p>
        )}
      </AnimatePresence>

      <div ref={resultRef} className="scroll-mt-24">
        {result && (
          <div className="space-y-3">
            {mock && <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-200">{t.engineer.demoNotice}</p>}
            <PromptResult
              prompt={result}
              saveState={saveState}
              busy={busy}
              onSave={save}
              onRegenerate={() => lastRequest && run(lastRequest)}
              onError={(text) => setToast({ kind: "error", text })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
