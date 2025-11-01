import { define } from "./utils.ts";
import { getCookies } from "@std/http/cookie";
import {
  createSession,
  restoreUserSession,
  setAuthCookies,
  signInAnonymous,
} from "./auth.ts";
import { createUser } from "./user.ts";
import * as roomService from "./room.ts";
import { getDatabase } from "./database/database.ts";
import type { Auth } from "./auth.ts";

export interface State {
  auth: Auth & { userId?: string; sessionId?: string };
}

// -------------------------
// Room validation middleware
// -------------------------
export const Validation = define.middleware(async (ctx) => {
  const roomId = ctx.params.id;

  if (!roomId) {
    console.log("No room id provided");
    return ctx.redirect("/api/rooms", 400);
  }

  const exists = await roomService.exist(ctx, roomId);
  const members = await roomService.capacity(ctx, roomId);

  // change max capacity from 5 → 20
  if (exists && members < 20) {
    return await ctx.next();
  }

  console.log("Validation failed: room does not exist or is full");
  return ctx.redirect("/api/rooms", 403);
});

// -------------------------
// Validate user session
// -------------------------
export const validateSession = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);
  const sessionId = cookies["session_id"];
  const jwt = cookies["sb_jwt"];

  if (!sessionId || !jwt) return ctx.redirect("/api/rooms", 401);

  const database = getDatabase(jwt);

  const { data: sessionData } = await database
    .from("sessions")
    .select("id, user_id, token, expires_at")
    .eq("id", sessionId)
    .single();

  if (!sessionData) return ctx.redirect("/api/rooms", 403);
  if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
    return ctx.redirect("/api/rooms", 403);
  }

  const { data: userData, error } = await database.auth.getUser(jwt);
  if (!userData || error) return ctx.redirect("/api/rooms", 401);

  ctx.state.auth = {
    jwt,
    sessionId: sessionData.id,
    userId: sessionData.user_id ?? undefined,
  };

  return await ctx.next();
});

// -------------------------
// Signup for room membership
// -------------------------
export const signupForMembership = define.middleware(async (ctx) => {
  const userId = ctx.state.auth?.userId;
  const sessionId = ctx.state.auth?.sessionId;
  const roomId = ctx.params.id;

  if (!userId || !sessionId || !roomId) {
    return ctx.redirect("/api/rooms", 404);
  }

  const database = getDatabase(ctx.state.auth?.jwt);

  const { data: existing, error: existingError } = await database
    .from("room_memberships")
    .select("id")
    .eq("session_id", sessionId)
    .eq("room_id", roomId)
    .maybeSingle();

  if (existingError) return ctx.redirect("/api/rooms", 500);

  if (!existing) {
    const { error: insertError } = await database
      .from("room_memberships")
      .insert({ room_id: roomId, session_id: sessionId });

    if (insertError) return ctx.redirect("/api/rooms", 500);

    console.log(`✅ User ${userId} joined room ${roomId}`);
  } else {
    console.log(`User ${userId} is already a member of room ${roomId}`);
  }

  return await ctx.next();
});

// -------------------------
// Get username from form
// -------------------------
export const getUser = define.middleware(async (ctx) => {
  const form = await ctx.req.formData();
  const username = form.get("username")?.toString()?.trim();

  if (!username) {
    return new Response("Username is required", { status: 400 });
  }

  ctx.state.auth = { ...ctx.state.auth, username };
  return await ctx.next();
});

// -------------------------
// Restore session from cookies
// -------------------------
export const restoreSession = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);
  const session = await restoreUserSession(cookies);

  if (session) {
    ctx.state.auth = { ...ctx.state.auth, ...session };
  }

  return await ctx.next();
});

// -------------------------
// Create anonymous session
// -------------------------
export const createAnonSession = define.middleware(async (ctx) => {
  const auth = ctx.state.auth;

  if (auth?.jwt && auth?.userId && auth?.sessionId) {
    return await ctx.next();
  }

  const anon = await signInAnonymous();
  const username = auth?.username ?? "Guest";

  await createUser(ctx, anon.userId, username);

  const session = await createSession(ctx, anon.userId, anon.refreshToken);
  setAuthCookies(ctx, anon.jwt, session.id);

  ctx.state.auth = {
    jwt: anon.jwt,
    userId: anon.userId,
    username,
    sessionId: session.id,
  };

  return await ctx.next();
});
