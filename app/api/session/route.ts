import { NextResponse } from "next/server";
import { AuthError, ensureSupabaseRole, verifyRequest } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/**
 * Called once after sign-in. Verifies the Firebase ID token, then sets the
 * `role: authenticated` custom claim that Supabase's Firebase third-party auth requires.
 * Returns { refresh: true } when the client must force-refresh its token to pick the claim up.
 */
export async function POST(req: Request) {
  try {
    const decoded = await verifyRequest(req);
    if ((decoded as Record<string, unknown>).role === "authenticated") {
      return NextResponse.json({ ok: true, refresh: false });
    }
    try {
      await ensureSupabaseRole(decoded.uid);
      return NextResponse.json({ ok: true, refresh: true });
    } catch {
      // Admin credentials missing: auth still works, database access will be unavailable.
      return NextResponse.json({ ok: true, refresh: false, warning: "role-claim" });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof AuthError ? "auth" : "generic" }, { status: e instanceof AuthError ? 401 : 500 });
  }
}
