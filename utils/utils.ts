import { createDefine } from "fresh";
import { supabase } from "./database.ts";
import { getCookies, setCookie } from "@std/http/cookie";

export interface State {
  session?: string;
  username?: string;
  user?: string;
}
export const define = createDefine<State>();

export const checkSession = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);
  const sessionId = cookies["session_id"];

  if (sessionId) {
    const { data: sessionData } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionData) {
      ctx.state.sessionId = sessionData.id;
      return ctx.redirect(`/api/rooms/${sessionData.room_id}`);
    }
  }

  return await ctx.next();
});

export const ensureUser = define.middleware(async (ctx) => {
  const formData = await ctx.req.formData();
  const username = formData.get("username")?.toString().trim().toLowerCase();
  if (!username) throw new Error("Username is required");

  const { data: userData, error } = await supabase
    .from("users")
    .insert({ username })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  ctx.state.userId = userData.id;
  ctx.state.username = userData.username;
  return await ctx.next();
});

export const createSession = define.middleware(async (ctx) => {
  const { data: sessionData, error } = await supabase
    .from("sessions")
    .insert({ room_id: ctx.params.id, user_id: ctx.state.userId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  ctx.state.sessionId = sessionData.id;
  return await ctx.next();
});

export const setSessionCookie = define.middleware(async (ctx) => {
  setCookie(ctx.res.headers, {
    name: "session_id",
    value: ctx.state.sessionId,
    path: "/",
    httpOnly: true,
  });
  return await ctx.next();
});
