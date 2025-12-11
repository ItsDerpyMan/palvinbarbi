import {Auth, define} from "../utils/utils.ts";
import { databaseWithKey } from "../utils/database/database.ts";
import type { Tables, TablesInsert } from "../utils/database/database.types.ts";
import Http = Deno.errors.Http;
/**
 * /api/login?session={id}
 * /api/login?session={id}&redirect=/api/join?room={id}
 * /api/login?session={id}&redirect=/api/signup?room={id}
 */
export const handleLogin = define.handlers({
  async POST(ctx) {
    console.info(`POST: ${url} - Redirected to: ${redirect}`)
    try {
      const url = new URL(ctx.req.url);
      const redirect = url.searchParams.get("redirect");
      if (!redirect) throw new Error("Redirect not found");

      // try restore the session
      const { jwt: restored_key, session: session_id } =
        await (tryRestoreSession(ctx)) ?? {}; // TODO have workaround on this return value deconstruction
      if (!restored_key) {
          // registering new user
          console.info( "No Authorization key (JWT)");
          const username = await getUserFormdata(ctx.req) ?? "Guest";

        const { user_id, jwt, refreshToken } = await signInAnonymously(
          username,
        );
        const { id: new_session_id } = await createSession(
          jwt,
          user_id,
          refreshToken,
        );
        // storing the neccessary identification on the client.
        console.info("Storing metadata in the cookies.");
        const headers = new Headers({ "Content-Type": "application/json" });
          appendCookie(headers, "jwt", jwt);
          appendCookie(headers, "session", new_session_id);
          appendCookie(headers, "user", user_id);
          appendCookie(headers, "username", username);

        // redirecting for example:
        // /api/login?session={id}&redirect=/api/join?room={id}
        // /api/login?session={id}&redirect=/api/signup?room={id}
        return new Response(JSON.stringify({ ok: true, redirect: redirect }), { headers });
      }
      console.info("Restored session");
      const headers = new Headers({ "Content-Type": "application/json" });
        appendCookie(headers, "jwt", restored_key);
        appendCookie(headers, "session", session_id);
      return new Response(JSON.stringify({ ok: true , redirect: redirect}), { headers });
    } catch (e) {
      console.error("Login error:", e);
      return new Response(JSON.stringify({ error: "Login failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});


const appendCookie = (headers: Headers, key: string, value: string) => headers.append(
        "Set-Cookie",
        `${key}=${value}; HttpOnly; Secure; Path=/; SameSite=Lax`);

async function getUserFormdata(req: Request): Promise<string> {
  const form = await req.formData();
  const username = form.get("username")?.toString()?.trim();
  console.info("Getting userdata from the request.\n- Username: ", username);
  if (!username) {
    throw new Error("Username required!");
  }
  return username;
}
export async function createSession(
  jwt: string,
  userId: string,
  refreshToken: string,
): Promise<Tables<"sessions">> {
  console.info("Creating a new session with the necessary userdata.");
  if (!jwt) {
    throw new Error("No jwt key is available for session creation.");
  }
  const { data, error } = await databaseWithKey(jwt)
    .from("sessions")
    .insert(
      {
        user_id: userId,
        token: refreshToken,
        expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      } satisfies TablesInsert<"sessions">,
    )
    .select("*")
    .single<Tables<"sessions">>();

  if (error) throw new Error("Session creation failed: " + error.message);
  return data;
}

async function signInAnonymously(username: string): Promise<{
  user_id: string;
  jwt: string;
  refreshToken: string;
}> {
  console.info("Signing in anonymously, only with a username. (temporary session)");
  const { data, error } = await databaseWithKey().auth
    .signInAnonymously();

  if (error || !data?.user || !data?.session) {
    throw new Error(
      "Anonymous sign-in failed: " + (error?.message ?? "unknown"),
    );
  }

  // Destructure user and session
  const { user, session } = data;
  const { id: user_id } = user;
  const { access_token: jwt, refresh_token: refreshToken } = session;

  // Ensure user exists in the database
  await databaseWithKey(jwt)
    .from("users")
    .upsert(
      {
        id: user_id,
        username: username,
      } satisfies TablesInsert<"users">,
    );

  return {
    user_id,
    jwt,
    refreshToken,
  };
}
function getHeader(req: Request): string {
  const extract = (name: string): string => {
    const val = req.headers.get(name)?.trim();
    if (!val) throw `${name} header is empty`;
    return val.replace(/^Bearer\s+/i, "");
  };
  return extract("Authorization");
}
async function tryRestoreSession(
  ctx: Context<Auth>,
): Promise<{ jwt: string; session: string } | null> {
  console.info("Trying to restore user session.");
  try {
    // Getting the JWT key and session ID from the header
    const key = ctx.state.jwt ?? throw "Authentication key is missing";
    const session_id = ctx.state.session ?? throw "Session id is missing";
    // Fetch the session data to check for expiration
    const {data: sessionData, error: sessionError} = await databaseWithKey(key)
        .from("sessions")
        .select("id, expires_at")
        .eq("id", session_id)
        .single();

    if (sessionError || !sessionData) {
      throw new Error("Session not found or error fetching session data.");
    }

    // Check if session is expired
    if (new Date(sessionData.expires_at) < new Date()) {
      throw new Error(`Session ${session_id} has expired.`);
    }

    // Try to get user data using the JWT
    const {error: userError} = await databaseWithKey(key).auth.getUser(key);
    if (userError) {
      console.info("Failed to retrieve user data from JWT.");
      const restored_key = await restoreJWT(session_id);
      if (!restored_key) return null;
      return {jwt: restored_key, session: session_id};
    }
    return {jwt: key, session: session_id};
  } catch (e) {
    if( typeof e !== "string") console.error(e);
    console.info(e);
    return null;
  }
}

async function restoreJWT(id: string): Promise<string> {
  console.info("Restores the session authentication (JWT) key.");
  // Query refresh token from sessions table
  const { data: sessionData, error } = await databaseWithKey()
    .from("sessions")
    .select("token")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(
      `Failed to fetch session ${id}: ${error.message}`,
    );
  }
  if (!sessionData) {
    throw new Error(`No session found for id: ${id}`);
  }

  // Refresh the JWT using Supabase auth
  const { data: refreshedSession, error: tokenError } = await databaseWithKey()
    .auth
    .refreshSession({ refresh_token: sessionData.token });

  if (tokenError) {
    throw new Error(
      `Failed to refresh JWT for session ${id}: ${tokenError.message}`,
    );
  }
  if (!refreshedSession?.session) {
    throw new Error(
      `No session returned when refreshing JWT for session ${id}`,
    );
  }

  // Update the refresh token in the database
  await databaseWithKey(refreshedSession.session.access_token)
    .from("sessions")
    .update({ token: refreshedSession.session.refresh_token })
    .eq("id", id);

  // Return the new access token
  return refreshedSession.session.access_token ?? "";
}
