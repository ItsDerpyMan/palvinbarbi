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
// import type { Auth } from "./auth.ts";
//
// export interface State {
//   auth: Auth & { userId?: string; sessionId?: string };
// }

// Auth debug
export const authDebug = define.middleware(async (ctx) => {
  const jwt = ctx.state.auth?.jwt;
  const userId = ctx.state.auth?.userId ?? "no userId";
  const username = ctx.state.auth?.username ?? "no username";
  const sessionId = ctx.state.auth?.sessionId ?? "no sessionId";
  console.log(
    `jwt: ${jwt}\nuser: ${userId}\nusername: ${username}\nsessionId: ${sessionId}`,
  );
  return await ctx.next();
});

function redirect(url: string, err?: string, status = 302) {
  return new Response(err, {
    status,
    headers: { Location: url },
  });
}
// -------------------------
// Room validation middleware
// -------------------------
export const Validation = define.middleware(async (ctx) => {
  const roomId = ctx.params.id;

  if (!roomId) {
    return redirect("/rooms", "No room id provided", 400);
  }

  const exists = await roomService.exist(ctx, roomId);
  const members = await roomService.capacity(ctx, roomId);

  // change max capacity from 5 → 20
  if (exists && members < 20) {
    return ctx.next();
  }

  console.log();
  return redirect(
    "/api/rooms",
    "Validation failed: room does not exist or is full",
    403,
  );
});

// -------------------------
// Validate user session
// -------------------------
export const validateSession = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);
  const sessionId = cookies["session_id"];
  const jwt = cookies["sb_jwt"];

  if (!sessionId || !jwt) {
    return redirect(
      "/api/rooms",
      "Validation failed: browser cookies are not valid",
      401,
    );
  }

  const database = getDatabase(jwt);

  const { data: sessionData } = await database
    .from("sessions")
    .select("id, user_id, token, expires_at")
    .eq("id", sessionId)
    .single();

  if (!sessionData) {
    return redirect(
      "/api/rooms",
      `Not found any ${sessionId} id in the sessions table`,
      403,
    );
  }
  if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
    return redirect(
      "/api/rooms",
      `Session has been expired at ${sessionData.expires_at}`,
      403,
    );
  }

  const { data: userData, error } = await database.auth.getUser(jwt);
  if (!userData || error) return redirect("/api/rooms", "User not found", 401);

  ctx.state.auth = {
    ...ctx.state.auth,
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
    return redirect("/rooms", "Identification failed", 404);
  }

  const database = getDatabase(ctx.state.auth?.jwt);

  const { data: existing, error: existingError } = await database
    .from("room_memberships")
    .select("id")
    .eq("session_id", sessionId)
    .eq("room_id", roomId)
    .maybeSingle();

  if (existingError) {
    return redirect(
      "/rooms",
      `Not found any room membership that has matching session id and room id.\n${sessionId}\n${roomId}`,
      500,
    );
  }

  if (!existing) {
    const { error: insertError } = await database
      .from("room_memberships")
      .insert({ room_id: roomId, session_id: sessionId });

    if (insertError) {
      return redirect(
        "/rooms",
        "Failed to insert new room membership into the db",
        500,
      );
    }

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

  if (!username) return redirect("/rooms/", "Username is required", 400);

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
// // needs some fix and patches
export const createAnonSession = define.middleware(async (ctx) => {
  const auth = ctx.state.auth;

  if (auth?.jwt && auth?.userId && auth?.sessionId) {
    return await ctx.next();
  }

  const { userId, jwt, refreshToken } = await signInAnonymous();
  ctx.state.auth = { ...ctx.state.auth, userId, jwt };
  const username = auth?.username ?? "Guest";
  try {
    await createUser(jwt, userId, username)
      .then(() => {
        ctx.state.auth = { ...ctx.state.auth, username };
      }).catch((e) => {
        throw new Error(e);
      });
    // await getDatabase(jwt).auth.updateUser({
    //   user_metadata: { display_name: username },
    // })
  } catch (err) {
    // impl. user cleaning up.
    return redirect("/rooms", `Failed to update user's username: ${err}`, 403);
  }
  console.log("...");
  try {
    await createSession(jwt, userId, refreshToken)
      .then(
        (session) => {
          ctx.state.auth = {
            ...ctx.state.auth,
            sessionId: session.id,
          };
          console.log(`session_id: ${session.id}`);
          setAuthCookies(ctx, jwt, session.id);
        },
      ).catch((e) => {
        throw new Error(e);
      });
  } catch (err) {
    return redirect("/rooms", `Failed to create a session: ${err}`, 403);
  }
  return await ctx.next();
});
