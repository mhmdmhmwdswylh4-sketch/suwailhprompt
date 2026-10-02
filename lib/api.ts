import type { Dict } from "./i18n";

/** Maps any thrown value to a friendly, translated message. Never leaks internals. */
export function friendlyError(e: unknown, t: Dict): string {
  const code =
    typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : e instanceof Error ? e.message : "";
  const map = t.errors as Record<string, string>;
  if (map[code]) return map[code];
  if (code === "not-configured") return t.login.notConfigured;
  return t.errors.generic;
}

export class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export async function callEngineer(token: string, idea: string, category: string): Promise<{ prompt: string; mock: boolean }> {
  let res: Response;
  try {
    res = await fetch("/api/engineer", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ idea, category }),
    });
  } catch {
    throw new ApiError("network");
  }
  const data = (await res.json().catch(() => ({}))) as { prompt?: string; mock?: boolean; error?: string };
  if (!res.ok || !data.prompt) throw new ApiError(data.error || "generic");
  return { prompt: data.prompt, mock: Boolean(data.mock) };
}
