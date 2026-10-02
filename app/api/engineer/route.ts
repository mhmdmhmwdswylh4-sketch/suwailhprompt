import { NextResponse } from "next/server";
import { AuthError, verifyRequest } from "@/lib/firebase-admin";
import { engineerPrompt, NimError } from "@/lib/nim";
import { isCategory, MAX_IDEA_LENGTH, MIN_IDEA_LENGTH } from "@/lib/categories";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const fail = (code: string, status: number) => NextResponse.json({ error: code }, { status });

export async function POST(req: Request) {
  let uid: string;
  try {
    uid = (await verifyRequest(req)).uid;
  } catch (e) {
    if (e instanceof AuthError) return fail("auth", 401);
    return fail("generic", 500);
  }

  if (!rateLimit(uid)) return fail("rate", 429);

  let body: { idea?: unknown; category?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("invalid", 400);
  }

  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  if (idea.length < MIN_IDEA_LENGTH || idea.length > MAX_IDEA_LENGTH) return fail("invalid", 400);
  const category = isCategory(body.category) ? body.category : "general";

  try {
    const { prompt, mock } = await engineerPrompt(idea, category);
    return NextResponse.json({ prompt, mock });
  } catch (e) {
    // Log only a safe summary, never the key, headers, or stack to the client.
    console.error("[engineer] NIM failure", e instanceof NimError ? e.status : "unknown");
    return fail("ai", 502);
  }
}
