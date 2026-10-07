// Pure helpers (no imports) so they can be unit-tested with plain Node.

/** Yields the `data:` payload of each Server-Sent Event (multi-line data joined with \n). */
export async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let i: number;
      while ((i = buf.indexOf("\n\n")) >= 0) {
        const block = buf.slice(0, i);
        buf = buf.slice(i + 2);
        const data = block
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).replace(/^ /, ""))
          .join("\n");
        if (data) yield data;
      }
    }
    // Flush a trailing event that had no final blank line.
    const tail = buf
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).replace(/^ /, ""))
      .join("\n");
    if (tail) yield tail;
  } finally {
    reader.releaseLock?.();
  }
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json | null => (v && typeof v === "object" ? (v as Json) : null);

/** OpenAI-compatible chunk -> answer text (reasoning fields are ignored on purpose). */
export function openaiText(j: unknown): string {
  const c = obj(obj(j)?.choices && (obj(j)!.choices as unknown[])[0]);
  const d = obj(c?.delta);
  return typeof d?.content === "string" ? d.content : "";
}

/** Anthropic Messages stream event -> text / error. */
export function anthropicEvent(j: unknown): { text?: string; error?: boolean } {
  const o = obj(j);
  if (!o) return {};
  if (o.type === "error") return { error: true };
  if (o.type === "content_block_delta") {
    const d = obj(o.delta);
    if (d?.type === "text_delta" && typeof d.text === "string") return { text: d.text };
  }
  return {};
}

/** Gemini streamGenerateContent chunk -> text (skips "thought" parts) / blocked flag. */
export function geminiChunk(j: unknown): { text?: string; blocked?: boolean } {
  const o = obj(j);
  if (!o) return {};
  if (obj(o.promptFeedback)?.blockReason) return { blocked: true };
  const cand = Array.isArray(o.candidates) ? obj(o.candidates[0]) : null;
  const parts = obj(cand?.content)?.parts;
  if (!Array.isArray(parts)) return {};
  const text = parts
    .map((p) => obj(p))
    .filter((p): p is Json => !!p && p.thought !== true && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("");
  return text ? { text } : {};
}
