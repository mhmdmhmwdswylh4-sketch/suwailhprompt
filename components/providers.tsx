"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { dictionaries, dirOf, LANG_COOKIE, type Dict, type Lang } from "@/lib/i18n";

/* ---------------- Language ---------------- */
type LangCtx = { lang: Lang; t: Dict; setLang: (l: Lang) => void; toggle: () => void };
const LangContext = createContext<LangCtx | null>(null);

export function useLang() {
  const c = useContext(LangContext);
  if (!c) throw new Error("useLang outside provider");
  return c;
}

/* ---------------- Auth ---------------- */
type AuthCtx = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Returns a fresh Firebase ID token or throws "auth". */
  getToken: () => Promise<string>;
};
const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}

export default function Providers({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    document.documentElement.dir = dirOf(l);
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const langValue = useMemo<LangCtx>(
    () => ({ lang, t: dictionaries[lang], setLang, toggle: () => setLang(lang === "en" ? "ar" : "en") }),
    [lang, setLang],
  );

  const authValue = useMemo<AuthCtx>(() => {
    const need = () => {
      const a = getFirebaseAuth();
      if (!a) throw Object.assign(new Error("not-configured"), { code: "not-configured" });
      return a;
    };
    return {
      user,
      loading,
      configured: isFirebaseConfigured,
      signInGoogle: async () => {
        await signInWithPopup(need(), new GoogleAuthProvider());
      },
      signInEmail: async (e, p) => {
        await signInWithEmailAndPassword(need(), e, p);
      },
      signUpEmail: async (e, p) => {
        await createUserWithEmailAndPassword(need(), e, p);
      },
      signOut: async () => {
        await fbSignOut(need());
      },
      getToken: async () => {
        const u = getFirebaseAuth()?.currentUser;
        if (!u) throw new Error("auth");
        try {
          return await u.getIdToken();
        } catch {
          throw new Error("auth");
        }
      },
    };
  }, [user, loading]);

  return (
    <LangContext.Provider value={langValue}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </LangContext.Provider>
  );
}
