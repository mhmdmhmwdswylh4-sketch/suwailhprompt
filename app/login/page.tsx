"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LogoMark } from "@/components/logo";
import { useAuth, useLang } from "@/components/providers";
import { friendlyError } from "@/lib/api";

function LoginForm() {
  const { t } = useLang();
  const { user, loading, configured, signInGoogle, signInEmail, signUpEmail } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "/engineer";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/engineer"; // prevent open redirect

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  const wrap = (kind: "google" | "email", fn: () => Promise<void>) => async () => {
    setError(null);
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e, t));
      setBusy(null);
    }
  };

  const onEmail = (e: React.FormEvent) => {
    e.preventDefault();
    void wrap("email", () => (mode === "in" ? signInEmail(email.trim(), password) : signUpEmail(email.trim(), password)))();
  };

  return (
    <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
      <div className="flex justify-center"><LogoMark size={52} /></div>
      <h1 className="mt-5 text-center text-2xl font-semibold text-white">{mode === "in" ? t.login.title : t.login.titleSignUp}</h1>
      <p className="mt-1.5 text-center text-sm text-zinc-400">{t.login.subtitle}</p>

      {!configured && <p className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{t.login.notConfigured}</p>}

      <button className="btn-ghost mt-6 w-full" disabled={!configured || busy !== null} onClick={wrap("google", signInGoogle)}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z" />
          <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.9 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        {busy === "google" ? "…" : t.login.google}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-zinc-600">
        <span className="h-px flex-1 bg-white/10" />{t.login.or}<span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={onEmail} className="space-y-3">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs text-zinc-400">{t.login.email}</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" dir="ltr" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs text-zinc-400">{t.login.password}</label>
          <input id="password" type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="field" dir="ltr" />
        </div>
        {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={!configured || busy !== null}>
          {busy === "email" ? "…" : mode === "in" ? t.login.signIn : t.login.signUp}
        </button>
      </form>

      <button className="mt-5 w-full text-center text-sm text-zinc-400 hover:text-white" onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(null); }}>
        {mode === "in" ? t.login.noAccount : t.login.haveAccount}
      </button>
      <p className="mt-4 text-center"><Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400">← {t.nav.home}</Link></p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 pb-10 pt-28">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
