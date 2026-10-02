import { Fragment } from "react";

/**
 * Renders engineered prompt text safely as React nodes (no HTML injection, no dangerouslySetInnerHTML).
 * Light formatting only: headings, list markers, **bold** and `code`.
 */
function inline(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) return <code key={i} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.9em] text-mint">{p.slice(1, -1)}</code>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

export default function PromptText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-[15px] leading-7 text-zinc-300" dir="auto">
      {lines.map((raw, i) => {
        const line = raw.replace(/\s+$/, "");
        if (!line.trim()) return <div key={i} className="h-2" />;
        const h = /^(#{1,4})\s+(.*)$/.exec(line);
        if (h) return <h4 key={i} className="pt-3 text-[13px] font-semibold uppercase tracking-wider text-mint">{inline(h[2]!)}</h4>;
        const li = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/.exec(line);
        if (li) {
          const num = /^\s*(\d+[.)])/.exec(line)?.[1];
          return (
            <p key={i} className="flex gap-2.5 ps-1">
              <span className="shrink-0 text-mint/70">{num ?? "•"}</span>
              <span className="min-w-0 break-words">{inline(li[1]!)}</span>
            </p>
          );
        }
        return <p key={i} className="break-words">{inline(line)}</p>;
      })}
    </div>
  );
}
