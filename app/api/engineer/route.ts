import { NextResponse } from "next/server";
import { AuthError, verifyRequest } from "@/lib/firebase-admin";
import { engineerStream } from "@/lib/nim";
import { errorCode } from "@/lib/llm";
import { getProvider, isValidApiKey, isValidModelId, KEY_HEADER, PROVIDERS } from "@/lib/providers";
import { isCategory, MAX_IDEA_LENGTH, MIN_IDEA_LENGTH } from "@/lib/categories";
import { rateLimit } from "@/lib/rate-limit";
import { acquire } from "@/lib/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fail = (code: string, status: number, extra?: HeadersInit) =>
  NextResponse.json({ error: code }, { status, headers: { "Cache-Control": "no-store", ...extra } });

function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

/**
 * POST /api/engineer -> Server-Sent-Events style stream (one JSON object per `data:` line):
 *   {"d":"text"}   token chunk        {"mock":true}  demo mode marker
 *   {"done":true}  finished           {"error":"ai"} failed mid-stream
 * Pre-stream problems (auth, rate limit, invalid input, overload) are plain JSON with a status code.
 */
export async function POST(req: Request) {
  // Cheap IP gate first (protects token verification from floods), then per-user limit.
  if (!rateLimit(`ip:${clientIp(req)}`, 60)) return fail("rate", 429, { "Retry-After": "60" });

  let uid: string;
  try {
    uid = (await verifyRequest(req)).uid;
  } catch (e) {
    if (e instanceof AuthError) return fail("auth", 401);
    return fail("generic", 500);
  }

  if (!rateLimit(`u:${uid}`, 10)) return fail("rate", 429, { "Retry-After": "60" });

  let body: { idea?: unknown; category?: unknown; provider?: unknown; model?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("invalid", 400);
  }
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  if (idea.length < MIN_IDEA_LENGTH || idea.length > MAX_IDEA_LENGTH) return fail("invalid", 400);
  const category = isCategory(body.category) ? body.category : "general";

  // ---- provider / model selection -------------------------------------------------------------
  // The client may only pick a provider ID from our allowlist (never a URL). A user-supplied API key is read
  // from a request header, kept in a local variable for this one request, and never stored, logged or echoed.
  const provider = getProvider(body.provider ?? "nvidia");
  if (!provider) return fail("invalid", 400);
  const nvidiaAllowed = PROVIDERS[0].models.map((m) => m.id);
  const model = typeof body.model === "string" && body.model ? body.model : provider.models[0].id;
  if (!isValidModelId(model)) return fail("model", 400);
  if (provider.id === "nvidia" && !nvidiaAllowed.includes(model)) return fail("model", 400); // server pays: allowlist only

  let userKey: string | undefined;
  if (provider.needsKey) {
    const k = req.headers.get(KEY_HEADER);
    if (!k) return fail("key_missing", 400);
    if (!isValidApiKey(k)) return fail("key", 400);
    userKey = k;
  }

  const release = await acquire();
  if (!release) return fail("busy", 503, { "Retry-After": "5" });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 58_000);
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));
      let sentMock = false;
      try {
        for await (const chunk of engineerStream(idea, category, ctrl.signal, { provider: provider.id, model, userKey })) {
          if (chunk.mock && !sentMock) {
            sentMock = true;
            send({ mock: true });
          }
          if (chunk.delta) send({ d: chunk.delta });
        }
        send({ done: true });
      } catch (e) {
        // Log ONLY provider id + error class. Never the key, headers, request body or upstream response.
        const code = errorCode(e);
        console.error("[engineer] failure", provider.id, code);
        try {
          send({ error: code });
        } catch {
          /* client gone */
        }
      } finally {
        clearTimeout(timer);
        release();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      // Client disconnected: stop the upstream request and free the slot.
      ctrl.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Referrer-Policy": "no-referrer",
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
