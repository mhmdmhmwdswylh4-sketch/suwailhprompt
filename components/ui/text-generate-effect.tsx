"use client";
/** Text Generate Effect — Aceternity UI (MIT). Adapted: dark-only, reduced-motion aware, re-runs when text changes. */
import { useEffect } from "react";
import { motion, stagger, useAnimate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}) => {
  const [scope, animate] = useAnimate();
  const reduce = useReducedMotion();
  const wordsArray = words.split(" ");
  useEffect(() => {
    if (reduce) return;
    animate("span", { opacity: 1, filter: filter ? "blur(0px)" : "none" }, { duration, delay: stagger(0.06) });
  }, [words, reduce, animate, filter, duration]);

  return (
    <div className={className}>
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={`${words}-${idx}`}
            className={cn("inline-block", reduce ? "opacity-100" : "opacity-0")}
            style={{ filter: filter && !reduce ? "blur(10px)" : "none" }}
          >
            {word}
            {"\u00A0"}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};
