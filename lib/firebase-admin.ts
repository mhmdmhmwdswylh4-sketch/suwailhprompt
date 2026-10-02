import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length) return (adminApp = getApps()[0]!);

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  // With service-account credentials we can verify tokens AND set custom claims.
  // Without them, token verification still works (it only needs the project id).
  adminApp = initializeApp(
    clientEmail && privateKey
      ? { credential: cert({ projectId, clientEmail, privateKey }), projectId }
      : { projectId },
  );
  return adminApp;
}

export class AuthError extends Error {}

/** Verifies the Firebase ID token in the `Authorization: Bearer` header. */
export async function verifyRequest(req: Request): Promise<DecodedIdToken> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) throw new AuthError("missing token");
  try {
    return await getAuth(getAdminApp()).verifyIdToken(match[1]!);
  } catch {
    throw new AuthError("invalid token");
  }
}

/** Marks the user as `role: authenticated` so Supabase's third-party auth accepts the JWT. */
export async function ensureSupabaseRole(uid: string) {
  await getAuth(getAdminApp()).setCustomUserClaims(uid, { role: "authenticated" });
}
