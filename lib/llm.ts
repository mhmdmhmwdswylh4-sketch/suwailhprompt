import "server-only";
import { getProvider, type ProviderId } from "./providers";
import { anthropicEvent, geminiChunk, openaiText, sseData } from "./llm-sse";

/** `status` is the upstream HTTP status (or 504 timeout / 499 aborted / 502 other). Never carries bodies or keys. */
export class LlmError extends Error {
  /** `reason` is a coarse class derived from the upstream error body (never the body itself). */
  constructor(
    public status: number,
    public reason?: "key" | "model",
  ) {
    super(`LLM ${status}`);
  }
}

/**
 * Some providers (Google, xAI) answer 400 for a bad key. Peek at the (small) error body ONLY to classify it,
 * then discard it: the text is never stored, logged or forwarded.
 */
async function classify400(res: Response): Promise<"key" | "model" | undefined> {
  try {
    const t = (await res.text()).slice(0, 4000).toLowerCase();
    if (/api[ _-]?key|api_key_invalid|unauthori[sz]ed|authentication|invalid[ _-]?token|incorrect api/.test(t)) return "key";
    if (/model/.test(t)) return "model";
  } catch {
    /* ignore */
  }
  return undefined;
}

export type StreamArgs = {
  provider: ProviderId;
  model: string;
  /** Server key for NVIDIA, the user's own key for everyone else. Only ever placed in an outgoing header. */
  apiKey: string;
  system: string;
  user: string;
  signal: AbortSignal;
  firstTokenMs: number;
};

const MAX_TOKENS = 3500;

function build(a: StreamArgs): { url: string; headers: Record<string, string>; body: unknown; kind: "openai" | "anthropic" | "gemini" } {
  const p = getProvider(a.provider);
  if (!p) throw new LlmError(400);

  if (p.kind === "anthropic") {
    return {
      kind: "anthropic",
      url: p.url,
      headers: { "x-api-key": a.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json", accept: "text/event-stream" },
      body: { model: a.model, max_tokens: MAX_TOKENS, temperature: 0.5, stream: true, system: a.system, messages: [{ role: "user", content: a.user }] },
    };
  }

  if (p.kind === "gemini") {
    return {
      kind: "gemini",
      // The key goes in a header, never in the URL (URLs end up in logs/proxies). Model id is regex-validated upstream.
      url: `${p.url}/${encodeURIComponent(a.model)}:streamGenerateContent?alt=sse`,
      headers: { "x-goog-api-key": a.apiKey, "content-type": "application/json", accept: "text/event-stream" },
      body: {
        systemInstruction: { parts: [{ text: a.system }] },
        contents: [{ role: "user", parts: [{ text: a.user }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: MAX_TOKENS },
      },
    };
  }

  // OpenAI-compatible family
  const m = a.model;
  const openaiReasoning = a.provider === "openai" && /^(gpt-5|o\d)/i.test(m);
  const body: Record<string, unknown> = {
    model: m,
    messages: [
      { role: "system", content: a.system },
      { role: "user", content: a.user },
    ],
    stream: true,
  };
  if (openaiReasoning) {
    // GPT-5 / o-series: no custom temperature, `max_completion_tokens`, keep reasoning short.
    body.max_completion_tokens = 8000;
    body.reasoning_effort = "low";
  } else {
    body.max_tokens = MAX_TOKENS;
    body.temperature = 0.5;
    if (/gpt-oss/i.test(m) && ["nvidia", "groq", "cerebras"].includes(a.provider)) body.reasoning_effort = "low";
  }
  return {
    kind: "openai",
    url: p.url,
    headers: { authorization: `Bearer ${a.apiKey}`, "content-type": "application/json", accept: "text/event-stream" },
    body,
  };
}

/** Streams answer text from any supported provider. Throws LlmError (no secrets in it). */
export async function* streamChat(a: StreamArgs): AsyncGenerator<string> {
  const req = build(a);
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  a.signal.addEventListener("abort", onAbort);
  let got = false;
  let ttft: ReturnType<typeof setTimeout> | undefined = setTimeout(() => ctrl.abort(), a.firstTokenMs);

  try {
    const res = await fetch(req.url, {
      method: "POST",
      signal: ctrl.signal,
      headers: req.headers,
      body: JSON.stringify(req.body),
      redirect: "error", // never follow a redirect with the key attached
      cache: "no-store",
    });
    if (!res.ok || !res.body) {
      // Body is never forwarded. For 400/404/422 we only classify it (key vs model problem) and discard it.
      throw new LlmError(res.status || 502, [400, 404, 422].includes(res.status) ? await classify400(res) : undefined);
    }

    for await (const data of sseData(res.body)) {
      if (data === "[DONE]") return;
      let j: unknown;
      try {
        j = JSON.parse(data);
      } catch {
        continue;
      }
      let text = "";
      if (req.kind === "openai") text = openaiText(j);
      else if (req.kind === "anthropic") {
        const ev = anthropicEvent(j);
        if (ev.error) throw new LlmError(502);
        text = ev.text ?? "";
      } else {
        const ch = geminiChunk(j);
        if (ch.blocked) throw new LlmError(422);
        text = ch.text ?? "";
      }
      if (text) {
        if (!got) {
          got = true;
          clearTimeout(ttft);
          ttft = undefined;
        }
        yield text;
      }
    }
    if (!got) throw new LlmError(502);
  } catch (e) {
    if (e instanceof LlmError) throw e;
    throw new LlmError(got ? 499 : 504); // abort/timeout/network — original error (may hold URLs) is dropped
  } finally {
    if (ttft) clearTimeout(ttft);
    a.signal.removeEventListener("abort", onAbort);
    ctrl.abort();
  }
}

/** Maps an upstream status to a short, safe client-facing error code. */
export function errorCode(e: unknown): string {
  const s = e instanceof LlmError ? e.status : 0;
  if (e instanceof LlmError && e.reason) return e.reason;
  if (s === 401 || s === 403) return "key";
  if (s === 402 || s === 429) return "provider_rate";
  if (s === 400 || s === 404 || s === 422) return "model";
  return "ai";
}
