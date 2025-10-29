import { define } from "./utils.ts";
import { getCookies } from "@std/http/cookie";
import {
  signInAnonymous,
  restoreUserSession,
  createSession,
  setAuthCookies,
} from "./auth.ts";
import { createUser } from "./user.ts";
import * as Room from "./room.ts";
import { getDatabase } from "./database.ts";

export interface State {
  auth: {
    jwt?: string;
    user?: string;
    username?: string;
    session?: string;
  };
}
export const roomValidation = define.middleware(async (ctx) => {
  // check - room exist
  //       - room hasnt been filled up. has enough space for the user to join.
  if (room.exist && room.capacity < 5) { // change from 5 to 20
    return await ctx.next();
  }
  console.log("Room validation failed, room doesnot exist or its filled up");
  return await ctx.redirect("/api/rooms")
})

export const validateSession = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req);
  const sessionId = cookies["session_id"];
  const jwt = cookies["sb_jwt"];

  if (!sessionId || !jwt) return await ctx.redirect("/api/rooms");
  const database = getDatabase(jwt);
  const { data: sessionData } = await database
    .from("sessions")
    .select("id, user_id, token, expires_at")
    .eq("id", sessionId)
    .single();

  if (!sessionData) return await ctx.redirect("/api/rooms", 403);
  if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) return await ctx.redirect("/api/rooms", 403);

  const { data: userData, error } = await database.auth.getUser(jwt);
  if (!userData || error) return await ctx.redirect("/api/rooms", 401);

  ctx.state.auth = {
    session: sessionData.id,
    user: sessionData.user_id,
    jwt
  };

  return await ctx.next();
})
export const signupForRoomMembership = define.middleware(async (ctx) => {
  const user = ctx.state.auth?.user;
  const session = ctx.state.auth?.session;
  const room = ctx.params.id;

  if (!user || !session || !room) return await ctx.redirect("/api/rooms", 404)
  const database = getDatabase(ctx.auth.jwt)
  const { data: existing, error: existingError } = await database
    .from("room_memberships")
    .select("id")
    .eq("session_id", sessionId)
    .eq("room_id", roomId)
    .maybeSingle();

  if (existingError) return await ctx.redirect("/api/rooms", 500)

  if (!existing) {
    const { error: insertError } = await database
      .from("room_memberships")
      .insert({ room_id: roomId, session_id: sessionId });

    if (insertError) return await ctx.redirect("/api/rooms", 500)

    console.log(`✅ User ${userId} joined room ${roomId}`);
  } else {
    console.log(`User ${userId} already member of room ${roomId}`);
  }

  return await ctx.next();
});

export const getUser = define.middleware(async (ctx) => {
  const form = await ctx.req.formData();
  const username = form.get("username")?.toString()?.trim();

  if (!username) {
    return new Response("Username is required", { status: 400 });
  }

  ctx.state.auth = { username };
  return await ctx.next();
});


export const restoreSession = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);
  const session = await restoreUserSession(cookies);

  if (session) {
    ctx.state.auth = { ...ctx.state.auth, ...session };
  }

  return await ctx.next();
});

export const createAnonSession = define.middleware(async (ctx) => {
  if (ctx.state.auth.jwt && ctx.state.auth.userId && ctx.state.auth.sessionId) {
    return await ctx.next();
  }

  const anon = await signInAnonymous();
  const username = ctx.state.auth.username ?? "Guest";

  await createUser(anon.userId, username);

  const session = await createSession(ctx, anon.userId, anon.refreshToken);
  setAuthCookies(ctx.res.headers, anon.jwt, session.id);

  ctx.state.auth = {
    jwt: anon.jwt,
    userId: anon.userId,
    username,
    sessionId: session.id,
  };

  return await ctx.next();
});
