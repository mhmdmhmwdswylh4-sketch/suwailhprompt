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

function authHeaders(token: string, json = false): HeadersInit {
  return { ...(json ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${token}` };
}

async function readError(res: Response): Promise<ApiError> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return new ApiError(data.error || (res.status === 429 ? "rate" : res.status === 401 ? "auth" : "generic"));
}

export function stripFences(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^\s*```(?:markdown|md)?\n/i, "")
    .replace(/\n```\s*$/i, "")
    .trim();
}

/** Streams the engineered prompt. `onText` receives the full text so far. */
export async function streamEngineer(
  token: string,
  idea: string,
  category: string,
  onText: (full: string) => void,
  signal?: AbortSignal,
): Promise<{ prompt: string; mock: boolean }> {
  let res: Response;
  try {
    res = await fetch("/api/engineer", { method: "POST", headers: authHeaders(token, true), body: JSON.stringify({ idea, category }), signal });
  } catch {
    throw new ApiError("network");
  }
  if (!res.ok || !res.body) throw await readError(res);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  let mock = false;
  let finished = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n\n")) >= 0) {
        const block = buf.slice(0, nl);
        buf = buf.slice(nl + 2);
        const line = block.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        let ev: { d?: string; mock?: boolean; done?: boolean; error?: string };
        try {
          ev = JSON.parse(line.slice(5).trim());
        } catch {
          continue;
        }
        if (ev.error) throw new ApiError(ev.error);
        if (ev.mock) mock = true;
        if (ev.d) {
          full += ev.d;
          onText(stripFences(full));
        }
        if (ev.done) finished = true;
      }
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (signal?.aborted) throw new ApiError("aborted");
    throw new ApiError("network");
  }
  const prompt = stripFences(full);
  if (!finished || !prompt) throw new ApiError(prompt ? "network" : "ai");
  return { prompt, mock };
}

export type SavedPrompt = {
  id: string;
  original_prompt: string;
  optimized_prompt: string;
  category: string;
  created_at: string;
};

export async function listPrompts(token: string, before?: string | null, limit = 20): Promise<{ items: SavedPrompt[]; nextCursor: string | null }> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (before) qs.set("before", before);
  let res: Response;
  try {
    res = await fetch(`/api/prompts?${qs}`, { headers: authHeaders(token), cache: "no-store" });
  } catch {
    throw new ApiError("network");
  }
  if (!res.ok) throw await readError(res);
  return res.json();
}

export async function savePrompt(token: string, p: { original: string; optimized: string; category: string }): Promise<SavedPrompt> {
  let res: Response;
  try {
    res = await fetch("/api/prompts", { method: "POST", headers: authHeaders(token, true), body: JSON.stringify(p) });
  } catch {
    throw new ApiError("network");
  }
  if (!res.ok) throw await readError(res);
  return ((await res.json()) as { item: SavedPrompt }).item;
}

export async function deletePrompt(token: string, id: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`/api/prompts?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeaders(token) });
  } catch {
    throw new ApiError("network");
  }
  if (!res.ok) throw await readError(res);
}
