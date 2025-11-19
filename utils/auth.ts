import { getDatabase } from "./database/database.ts";
import { getCookies, setCookie } from "@std/http/cookie";
import type { Context } from "fresh";
import type { State } from "./utils.ts";
import type { AuthApiError, Session, User } from "@supabase/supabase-js";
import type { Tables, TablesInsert } from "./database/database.types.ts";

// -------------------------
// Auth interface
// -------------------------
export interface Auth {
  jwt?: string;
  userId?: string;
  username?: string;
  sessionId?: string;
}

// -------------------------
// getCookiesFromReq()
// -------------------------
export function getCookiesFromReq(req: Request): Record<string, string> {
  return getCookies(req.headers);
}

// -------------------------
// verifyCookies()
// -------------------------
export async function verifyCookies(
  cookies: Record<string, string>,
): Promise<Auth | null> {
  const session: string | null = cookies["session_id"];
  const jwt: string | null = cookies["sb_jwt"];

  if (!session || !jwt) return null;

  const { data: sessionData, error } = await getDatabase(jwt)
    .from("sessions")
    .select("id, user_id, token, expires_at")
    .eq("id", session)
    .single<Tables<"sessions">>();

  if (error || !sessionData) return null;
  if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
    return null;
  }

  return {
    sessionId: sessionData.id,
    userId: sessionData.user_id ?? undefined,
    jwt,
  };
}

// -------------------------
// signInAnonymous()
// -------------------------
type AuthRes = {
  user: User;
  session: Session;
};
type Response<T> = { data: T | null; error: AuthApiError | null };

export async function signInAnonymous(): Promise<{
  userId: string;
  jwt: string;
  refreshToken: string;
}> {
  const { data, error } = await getDatabase().auth
    .signInAnonymously() as Response<
      AuthRes
    >;

  if (error || !data?.user || !data?.session) {
    throw new Error(
      "Anonymous sign-in failed: " + (error?.message ?? "unknown"),
    );
  }

  // Destructure user and session
  const { user, session } = data;
  const { id: userId } = user;
  const { access_token: jwt, refresh_token: refreshToken } = session;

  // Ensure user exists in the database
  await getDatabase(jwt)
    .from("users")
    .upsert(
      {
        id: userId,
      } satisfies TablesInsert<"users">,
    );

  return {
    userId,
    jwt,
    refreshToken,
  };
}

// -------------------------
// restoreJWT()
// -------------------------
export async function restoreJWT(
  sessionId: string,
): Promise<{ jwt: string } | null> {
  const database = getDatabase();
  const { data: sessionData, error } = await database
    .from("sessions")
    .select("token")
    .eq("id", sessionId)
    .single<Tables<"sessions">>();

  if (error || !sessionData) return null;

  const { data, error: refreshError } = await database.auth.refreshSession({
    refresh_token: sessionData.token,
  });

  if (refreshError || !data?.session) return null;

  await getDatabase(data.session.access_token)
    .from("sessions")
    .update(
      {
        token: data.session.refresh_token,
      } satisfies TablesInsert<"sessions">,
    )
    .eq("id", sessionId);

  return { jwt: data.session.access_token };
}

// -------------------------
// restoreUserSession()
// -------------------------
export async function restoreUserSession(
  cookies: Record<string, string>,
): Promise<Auth | null> {
  const verified = await verifyCookies(cookies);
  if (!verified) return null;

  try {
    await getDatabase(verified.jwt).auth.getUser(verified.jwt);
  } catch {
    const restored = await restoreJWT(verified.sessionId!);
    if (!restored) return null;
    verified.jwt = restored.jwt;
  }
  return verified;
}

// -------------------------
// createSession()
// -------------------------
export async function createSession(
  jwt: string,
  userId: string,
  refreshToken: string,
): Promise<Tables<"sessions">> {
  if (!jwt) {
    throw new Error("No jwt key is available for session creation.");
  }
  const { data, error } = await getDatabase(jwt)
    .from("sessions")
    .insert(
      {
        user_id: userId,
        token: refreshToken,
        expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      } satisfies TablesInsert<"sessions">,
    )
    .select()
    .single<Tables<"sessions">>();

  if (error) throw new Error("Session creation failed: " + error.message);
  return data;
}

// -------------------------
// setAuthCookies()
// -------------------------
export function setAuthCookies(
  response: Response,
  jwt: string,
  sessionId: string,
): Response {
  const headers = new Headers(response.headers);
  setCookie(headers, {
    name: "sb_jwt",
    value: jwt,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 3600,
  });

  setCookie(headers, {
    name: "session_id",
    value: sessionId,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 3600,
  });
  return new Response(response.body, {
    ...response,
    headers,
  });
}
