import { NextResponse } from "next/server";
import { AuthError, verifyRequest } from "@/lib/firebase-admin";
import { engineerStream, NimError } from "@/lib/nim";
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

  let body: { idea?: unknown; category?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("invalid", 400);
  }
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  if (idea.length < MIN_IDEA_LENGTH || idea.length > MAX_IDEA_LENGTH) return fail("invalid", 400);
  const category = isCategory(body.category) ? body.category : "general";

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
        for await (const chunk of engineerStream(idea, category, ctrl.signal)) {
          if (chunk.mock && !sentMock) {
            sentMock = true;
            send({ mock: true });
          }
          if (chunk.delta) send({ d: chunk.delta });
        }
        send({ done: true });
      } catch (e) {
        console.error("[engineer] failure", e instanceof NimError ? e.status : "unknown");
        try {
          send({ error: "ai" });
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
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
