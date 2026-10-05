import { NextResponse } from "next/server";
import { AuthError, verifyRequest } from "@/lib/firebase-admin";
import { getDb, isDbConfigured } from "@/lib/supabase-admin";
import { isCategory, MAX_IDEA_LENGTH } from "@/lib/categories";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const COLS = "id, original_prompt, optimized_prompt, category, created_at";
const MAX_OUT = 20_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE = { "Cache-Control": "private, no-store" };

const fail = (code: string, status: number) => NextResponse.json({ error: code }, { status, headers: NO_STORE });
const ok = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

async function authed(req: Request) {
  try {
    const d = await verifyRequest(req);
    return { uid: d.uid, email: d.email ?? null, name: (d.name as string | undefined) ?? null, picture: (d.picture as string | undefined) ?? null };
  } catch (e) {
    throw e instanceof AuthError ? fail("auth", 401) : fail("generic", 500);
  }
}

/** GET /api/prompts?limit=20&before=<ISO date>  -> newest first, cursor pagination */
export async function GET(req: Request) {
  let u;
  try {
    u = await authed(req);
  } catch (r) {
    return r as Response;
  }
  if (!isDbConfigured()) return fail("db", 503);
  if (!rateLimit(`p:${u.uid}`, 120)) return fail("rate", 429);

  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 1), 50);
  const before = url.searchParams.get("before");
  if (before && Number.isNaN(Date.parse(before))) return fail("invalid", 400);

  let q = getDb().from("prompts").select(COLS).eq("firebase_uid", u.uid).order("created_at", { ascending: false }).limit(limit + 1);
  if (before) q = q.lt("created_at", before);
  const { data, error } = await q;
  if (error) return fail("db", 500);
  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return ok({ items, nextCursor: hasMore ? items[items.length - 1].created_at : null });
}

/** POST /api/prompts  { original, optimized, category } */
export async function POST(req: Request) {
  let u;
  try {
    u = await authed(req);
  } catch (r) {
    return r as Response;
  }
  if (!isDbConfigured()) return fail("db", 503);
  if (!rateLimit(`p:${u.uid}`, 120)) return fail("rate", 429);

  let b: { original?: unknown; optimized?: unknown; category?: unknown };
  try {
    b = await req.json();
  } catch {
    return fail("invalid", 400);
  }
  const original = typeof b.original === "string" ? b.original.trim() : "";
  const optimized = typeof b.optimized === "string" ? b.optimized.trim() : "";
  if (!original || original.length > MAX_IDEA_LENGTH || !optimized || optimized.length > MAX_OUT) return fail("invalid", 400);
  const category = isCategory(b.category) ? b.category : "general";

  const db = getDb();
  // Keep the profile row fresh (idempotent). Failure here must not block saving.
  await db.from("profiles").upsert({ firebase_uid: u.uid, name: u.name, email: u.email, avatar: u.picture }, { onConflict: "firebase_uid" });

  // Cap storage per user so one account cannot grow the table without bound.
  const { count } = await db.from("prompts").select("id", { count: "exact", head: true }).eq("firebase_uid", u.uid);
  if ((count ?? 0) >= 1000) return fail("limit", 409);

  const { data, error } = await db
    .from("prompts")
    .insert({ firebase_uid: u.uid, original_prompt: original, optimized_prompt: optimized, category })
    .select(COLS)
    .single();
  if (error) return fail("db", 500);
  return ok({ item: data }, 201);
}

/** DELETE /api/prompts?id=<uuid>  (only the caller's own row) */
export async function DELETE(req: Request) {
  let u;
  try {
    u = await authed(req);
  } catch (r) {
    return r as Response;
  }
  if (!isDbConfigured()) return fail("db", 503);
  if (!rateLimit(`p:${u.uid}`, 120)) return fail("rate", 429);

  const id = new URL(req.url).searchParams.get("id") || "";
  if (!UUID.test(id)) return fail("invalid", 400);
  const { error } = await getDb().from("prompts").delete().eq("id", id).eq("firebase_uid", u.uid);
  if (error) return fail("db", 500);
  return ok({ ok: true });
}
