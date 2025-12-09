import { define } from "../utils/utils.ts";
import { database, databaseWithKey } from "../utils/database/database.ts";

/**
 * POST /api/signup?room=id&session=id
 */
export const handleSignup = define.handlers({
  async POST(ctx) {
    const url = new URL(ctx.req.url);
    const room = url.searchParams.get("room");
    const session = url.searchParams.get("session");
    if (!room || !session) {
      return jsonError("Room or session id missing", 400);
    }
    try {
      // 1. validate session
      // 2. check room: can join?
      // 3. signup for membership
      // 4. forward for api/join
      const key = getJWT(ctx.req);
      if (!key) {
        throw new Error("Invalid credentials");
      }

      if (!(await validSession(ctx.req))) {
        throw new Error("Invalid or expired session");
      }
      // Does room exists
      if (!(await roomExists(ctx.req))) {
        throw new Error("Room not exists");
      }
      // has enough space to join
      const count = await roomPlayerCount(ctx.req);
      if (count >= 5) throw new Error("Room is full");

      await signUp(ctx.req);

      // if success
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.append(
        "Set-Cookie",
        `room=${
          encodeURIComponent(room)
        }; HttpOnly; Secure; Path=/; SameSite=Lax`,
      );
      headers.append("Location", `/api/join?room=${encodeURIComponent(room)}`);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers,
      });
    } catch (err) {
      console.error("Signup failed", err);
      return jsonError(err instanceof Error ? err.message : String(err), 400);
    }
  },
});
async function validSession(req: Request): Promise<boolean> {
  const session = new URL(req.url).searchParams.get("session");
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
