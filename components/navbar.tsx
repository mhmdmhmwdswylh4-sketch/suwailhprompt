"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Logo } from "./logo";
import { useAuth, useLang } from "./providers";

export default function Navbar() {
  const { t, toggle } = useLang();
  const { user, signOut, configured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/engineer", label: t.nav.engineer },
    { href: "/history", label: t.nav.history },
  ];

  const handleSignOut = async () => {
    setOpen(false);
    try {
      await signOut();
    } finally {
      router.push("/");
    }
  };

  const linkCls = (href: string) =>
    `rounded-full px-4 py-2 text-sm transition-colors ${
      pathname === href ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:text-white"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="container-x pt-3">
        <nav className="glass flex h-14 items-center justify-between rounded-2xl px-3 sm:px-4" aria-label="Main">
          <Link href="/" aria-label={t.brand} className="rounded-lg px-1">
            <Logo />
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkCls(l.href)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button onClick={toggle} className="btn-small !min-h-[40px] !px-3" aria-label="Switch language">
              {t.nav.language}
            </button>

            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <>
                  {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full border border-white/10" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-semibold text-mint">
                      {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <button onClick={handleSignOut} className="btn-small !min-h-[40px]">
                    {t.nav.signOut}
                  </button>
                </>
              ) : (
                configured && (
                  <Link href="/login" className="btn-small !min-h-[40px]">
                    {t.nav.signIn}
                  </Link>
                )
              )}
            </div>

            <button
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={t.nav.menu}
            >
              <span className="relative block h-3.5 w-5">
                <span className={`absolute inset-x-0 h-0.5 rounded bg-white transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute inset-x-0 top-1.5 h-0.5 rounded bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
                <span className={`absolute inset-x-0 h-0.5 rounded bg-white transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="glass mt-2 rounded-2xl bg-ink-900/90 p-3 md:hidden"
            >
              <ul className="flex flex-col">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={`block rounded-xl px-4 py-3.5 text-base ${pathname === l.href ? "bg-white/[0.07] text-white" : "text-zinc-300"}`}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-2 border-t border-white/10 pt-2">
                {user ? (
                  <button onClick={handleSignOut} className="w-full rounded-xl px-4 py-3.5 text-start text-base text-zinc-300">
                    {t.nav.signOut} <span className="text-xs text-zinc-500">· {user.email}</span>
                  </button>
                ) : (
                  <Link href="/login" className="block rounded-xl px-4 py-3.5 text-base text-mint">
                    {t.nav.signIn}
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
