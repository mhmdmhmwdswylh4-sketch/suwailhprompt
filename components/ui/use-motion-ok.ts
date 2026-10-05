"use client";
import { useEffect, useState } from "react";

/** True only on wide screens without prefers-reduced-motion: heavy decorative animation is skipped otherwise. */
export function useHeavyMotionOk() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setOk(wide.matches && !reduce.matches);
    sync();
    wide.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
    };
  }, []);
  return ok;
}
