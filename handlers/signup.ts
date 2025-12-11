import { define } from "../utils/utils.ts";
import { database, databaseWithKey } from "../utils/database/database.ts";

/**
 * POST /api/signup?room=id
 */
export const handleSignup = define.handlers({
  async POST(ctx) {
    const url = new URL(ctx.req.url);
    try {
        const session: string = ctx.state.session ?? throw new Error("Session not found");
        const room: string = url.searchParams.get("room") ?? throw new Error("Room not found");
      const key = getJWT(ctx.req);
      if (!key) throw new Error("Invalid credentials");

      if (!(await validSession(ctx.req, session))) throw new Error("Invalid or expired session");
      // Does room exists
      if (!(await roomExists(ctx.req))) throw new Error("Room not exists");
      // has enough space to join
      const count = await roomPlayerCount(ctx.req);
      if (count >= 5) throw new Error("Room is full");

      await signUp(ctx.req);

      // if success
      const headers = new Headers({ "Content-Type": "application/json" });
      appendCookie(headers, "room", encodeURIComponent(room));
      return new Response(JSON.stringify({ ok: true, redirect: `/api/join?room=${encodeURIComponent(room)}`}), {
        status: 200,
        headers,
      });
    } catch (err) {
      console.error("Signup failed", err);
      return jsonError(err instanceof Error ? err.message : String(err), 400);
    }
  },
});
const appendCookie = (headers: Headers, key: string, value: string) => headers.append(
    "Set-Cookie",
    `${key}=${value}; HttpOnly; Secure; Path=/; SameSite=Lax`);

async function validSession(req: Request, session: string): Promise<boolean> {
  const { data, error } = await database(req)
    .from("sessions")
    .select("expires_at")
    .eq("id", session)
    .single();

  if (error || !data) return false;
  return new Date(data.expires_at) > new Date();
}

function jsonError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function signUp(req: Request) {
  const room = new URL(req.url).searchParams.get("room");
  if (!room) throw new Error("Invalid room identification");

  const session = new URL(req.url).searchParams.get("session");
  if (!session) throw new Error("Invalid session identification");
  const { error: signupError } = await database(req)
    .from("room_membership")
    .insert({
      room_id: room,
      session: session,
    });
  if (signupError) throw new Error("Signup failed");
}
async function roomPlayerCount(req: Request) {
  const id = new URL(req.url).searchParams.get("room");
  const { count, error } = await database(req)
    .from("room_memberships")
    .select("room_id", { count: "exact", head: true })
    .eq("room_id", id);
  if (error) return -1;
  return count ?? 0;
}
async function roomExists(req: Request): Promise<boolean> {
  const id = new URL(req.url).searchParams.get("room");
  const { data } = await database(req)
    .from("rooms")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  return Boolean(data);
}
function getJWT(req: Request): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  return auth.replace(/^Bearer\s+/i, "").trim();
}
