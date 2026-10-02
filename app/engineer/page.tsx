"use client";

import PromptEditor from "@/components/prompt-editor";
import RequireAuth from "@/components/require-auth";
import { useLang } from "@/components/providers";

export default function EngineerPage() {
  const { t } = useLang();
  return (
    <main className="container-x max-w-3xl pb-24 pt-28 sm:pt-32">
      <RequireAuth>
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t.engineer.title}</h1>
          <p className="mt-2 text-zinc-400">{t.engineer.subtitle}</p>
        </header>
        <PromptEditor />
      </RequireAuth>
    </main>
  );
}
