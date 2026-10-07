"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { useLang } from "./providers";
import { DEFAULT_PROVIDER, getProvider, isValidApiKey, isValidModelId, PROVIDERS, type ProviderId } from "@/lib/providers";

/**
 * AI model selection + bring-your-own-key.
 * KEY HANDLING: the key lives only in React state (memory) by default. If the user ticks "remember", it is kept in
 * localStorage of THIS browser only. It is never put in a URL/cookie, never sent anywhere except the request header
 * to our own /api/engineer, and never written to the database or logs.
 */
export type ModelSelection = { provider: ProviderId; model: string; apiKey?: string; ready: boolean };

const PREF = "sp_ai_pref"; // { provider, models: {id: model} }  — no secrets
const KEYS = "sp_ai_keys"; // { id: key } — only when the user opted in
const CUSTOM = "__custom__";

type Pref = { provider: ProviderId; models: Partial<Record<ProviderId, string>>; custom?: Partial<Record<ProviderId, string>> };

function readPref(): Pref {
  try {
    const p = JSON.parse(localStorage.getItem(PREF) || "null") as Pref | null;
    if (p && getProvider(p.provider)) return p;
  } catch {
    /* ignore */
  }
  return { provider: DEFAULT_PROVIDER, models: {} };
}
function readKeys(): Partial<Record<ProviderId, string>> {
  try {
    const k = JSON.parse(localStorage.getItem(KEYS) || "{}");
    return k && typeof k === "object" ? k : {};
  } catch {
    return {};
  }
}

export default function ModelPicker({ onChange, disabled }: { onChange: (s: ModelSelection) => void; disabled?: boolean }) {
  const { t } = useLang();
  const [provider, setProvider] = useState<ProviderId>(DEFAULT_PROVIDER);
  const [models, setModels] = useState<Partial<Record<ProviderId, string>>>({});
  const [keys, setKeys] = useState<Partial<Record<ProviderId, string>>>({}); // in-memory
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [customs, setCustoms] = useState<Partial<Record<ProviderId, string>>>({}); // custom model id per provider (not secret)
  const [loaded, setLoaded] = useState(false);

  const info = getProvider(provider)!;
  const modelValue = models[provider] ?? info.models[0].id;
  const isCustom = modelValue === CUSTOM || !info.models.some((m) => m.id === modelValue);
  const customText = customs[provider] ?? "";
  const effectiveModel = isCustom ? customText.trim() : modelValue;
  const key = keys[provider] ?? "";

  // load saved prefs (client only)
  useEffect(() => {
    const p = readPref();
    setProvider(p.provider);
    setModels(p.models);
    const saved = readKeys();
    if (Object.keys(saved).length) {
      setKeys(saved);
      setRemember(true);
    }
    const c: Partial<Record<ProviderId, string>> = {};
    for (const [k, v] of Object.entries(p.custom ?? {})) if (getProvider(k) && typeof v === "string" && isValidModelId(v)) c[k as ProviderId] = v;
    setCustoms(c);
    setLoaded(true);
  }, []);

  // persist non-secret prefs; persist keys ONLY if the user opted in
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(PREF, JSON.stringify({ provider, models, custom: customs } satisfies Pref));
      if (remember) localStorage.setItem(KEYS, JSON.stringify(keys));
      else localStorage.removeItem(KEYS);
    } catch {
      /* storage blocked */
    }
  }, [provider, models, customs, keys, remember, loaded]);

  const ready = useMemo(() => {
    if (!isValidModelId(effectiveModel)) return false;
    return info.needsKey ? isValidApiKey(key) : true;
  }, [effectiveModel, info.needsKey, key]);

  useEffect(() => {
    onChange({ provider, model: effectiveModel, apiKey: info.needsKey ? key : undefined, ready });
  }, [provider, effectiveModel, key, info.needsKey, ready, onChange]);

  const setModel = (m: string) => setModels((x) => ({ ...x, [provider]: m }));
  const forget = () => {
    setKeys((k) => {
      const n = { ...k };
      delete n[provider];
      return n;
    });
  };

  return (
    <fieldset className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4" disabled={disabled} id="model-picker">
      <legend className="flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-widest text-zinc-500">
        <Sparkles size={13} aria-hidden /> {t.engineer.ai.title}
      </legend>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-zinc-400">
          {t.engineer.ai.provider}
          <select
            id="provider-select"
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value as ProviderId);
              setShow(false);
            }}
            className="field mt-1.5 !py-2.5"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id} className="bg-ink-900">
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-zinc-400">
          {t.engineer.ai.model}
          <select
            id="model-select"
            value={isCustom ? CUSTOM : modelValue}
            onChange={(e) => setModel(e.target.value === CUSTOM ? CUSTOM : e.target.value)}
            className="field mt-1.5 !py-2.5"
          >
            {info.models.map((m) => (
              <option key={m.id} value={m.id} className="bg-ink-900">
                {m.label}
              </option>
            ))}
            {info.needsKey && (
              <option value={CUSTOM} className="bg-ink-900">
                {t.engineer.ai.custom}
              </option>
            )}
          </select>
        </label>
      </div>

      {info.needsKey && isCustom && (
        <input
          id="custom-model"
          value={customText}
          onChange={(e) => setCustoms((c) => ({ ...c, [provider]: e.target.value.slice(0, 120) }))}
          placeholder={t.engineer.ai.customPlaceholder}
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          className="field mt-3 !py-2.5 font-mono text-sm"
          aria-label={t.engineer.ai.model}
        />
      )}

      {info.needsKey ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <label htmlFor="api-key-input" className="flex items-center gap-1.5">
              <KeyRound size={13} aria-hidden /> {t.engineer.ai.apiKey} · {info.name}
            </label>
            {info.keyUrl && (
              <a href={info.keyUrl} target="_blank" rel="noopener noreferrer nofollow" referrerPolicy="no-referrer" className="text-mint hover:underline">
                {t.engineer.ai.getKey} ↗
              </a>
            )}
          </div>
          <div className="relative mt-1.5">
            <input
              id="api-key-input"
              type={show ? "text" : "password"}
              value={key}
              onChange={(e) => setKeys((k) => ({ ...k, [provider]: e.target.value.trim().slice(0, 400) }))}
              placeholder={t.engineer.ai.keyPlaceholder}
              dir="ltr"
              // Keep password managers/autofill/spellcheck from copying the key elsewhere.
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              name="sp-user-api-key"
              className="field !py-2.5 pe-24 font-mono text-sm"
            />
            <div className="absolute inset-y-0 end-1.5 flex items-center gap-1">
              <button type="button" onClick={() => setShow((v) => !v)} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white" aria-label={show ? t.engineer.ai.hide : t.engineer.ai.show}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              {key && (
                <button type="button" onClick={forget} className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-white/10 hover:text-red-300">
                  {t.engineer.ai.forget}
                </button>
              )}
            </div>
          </div>

          <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-xs text-zinc-400">
            <input id="remember-key" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#7cf2b5]" />
            <span>
              <span className="text-zinc-200">{t.engineer.ai.remember}</span>
              <br />
              {t.engineer.ai.rememberHint}
            </span>
          </label>
        </div>
      ) : (
        <p className="mt-3 text-xs text-mint">{t.engineer.ai.included}</p>
      )}

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-mint" aria-hidden />
        {t.engineer.ai.privacy}
      </p>
    </fieldset>
  );
}
