import { getdb } from "./database.ts";
import { getCookies, setCookie } from "@std/http/cookie";
import type { Context } from "$fresh/server.ts";

export interface Auth {
  jwt?: string;
  user?: string;
  username?: string;
  session?: string;
}
export function getCookiesFromReq(req: Request) {
  return getCookies(req.headers)
}

export async function verifyCookies(cookies: Record<string, string>): Promise<Auth | null> {
  const sessionId = cookies["session_id"];
  const jwt = cookies["sb_jwt"];

  if (!sessionId || !jwt) return null;

  const { data: sessionData } = await getDatabase(jwt)
    .from("sessions")
    .select("id, user_id, token, expires_at")
    .eq("id", sessionId)
    .single();

  if (!sessionData) return null;
  if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) return null;

  return {
    sessionId: sessionData.id,
    userId: sessionData.user_id,
    jwt
  };
}

export async function signInAnonymous(): Promise<{ userId: string, jwt: string, refreshToken: string }> {
  const { data, error } = await getDatabase().auth.signInAnonymously();
  if (error) throw new Error("Anonymous sign-in failed: " + error.message);

  // Ensure public.users exists
  await getDatabase(data.session.access_token).from("users").upsert({ id: data.user.id });

  return {
    userId: data.user.id,
    jwt: data.session.access_token,
    refreshToken: data.session.refresh_token
  };
}

export async function restoreJWT(sessionId: string): Promise<{ jwt: string } | null> {
  // Retrieve refresh token from DB
  const database = getDatabase();
  const { data: sessionData } = await database
    .from("sessions")
    .select("token")
    .eq("id", sessionId)
    .single();

  if (!sessionData) return null;

  // Use refresh token to get new JWT
  const { data, error } = await database.auth.refreshSession({ refresh_token: sessionData.token });
  if (error) return null;

  // Update DB with new refresh token
  await getDatabase(data.session.access_token)
    .from("sessions")
    .update({ token: data.session.refresh_token })
    .eq("id", sessionId);

  return { jwt: data.session.access_token };
}

export async function restoreUserSession(cookies: Record<string, string>): Promise<Auth | null> {
  const verified = await verifyCookies(cookies);
  if (!verified) return null;

  // Try to validate the JWT by fetching the user
  try {
    await getDatabase(verified.jwt).auth.getUser(verified.jwt);
  } catch {
    // JWT invalid → refresh
    const restored = await restoreJWT(verified.sessionId!);
    if (!restored) return null;
    verified.jwt = restored.jwt;
  }

  return verified;
}

export async function createSession(ctx: Context, userId: string, refreshToken: string) {
  const { data, error } = await getDatabase(ctx.state.auth.jwt)
    .from("sessions")
    .insert({
      user_id: userId,
      token: refreshToken,
      expires_at: new Date(Date.now() + 1000 * 60 * 60),
    })
    .select()
    .single();

  if (error) throw new Error("Session creation failed: " + error.message);
  return data;
}

export function setAuthCookies(headers: Headers, jwt: string, sessionId: string) {
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
}
