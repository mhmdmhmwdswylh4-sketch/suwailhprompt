"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, useLang } from "./providers";

/** Client-side gate: sends signed-out users to /login. Real enforcement is the token check on the server + RLS. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (configured && !loading && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [configured, loading, user, router, path]);

  if (!configured) {
    return (
      <div className="container-x pt-40 text-center">
        <p className="glass mx-auto max-w-md rounded-2xl p-6 text-zinc-300">{t.login.notConfigured}</p>
        <Link href="/" className="btn-ghost mt-6">{t.nav.home}</Link>
      </div>
    );
  }
  if (loading || !user) {
    return (
      <div className="grid min-h-[60vh] place-items-center pt-24" role="status" aria-label="Loading">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-mint" />
      </div>
    );
  }
  return <>{children}</>;
}
