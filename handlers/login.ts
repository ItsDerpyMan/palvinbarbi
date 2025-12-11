import { define } from "../utils/utils.ts";
import { databaseWithKey } from "../utils/database/database.ts";
import type { Tables, TablesInsert } from "../utils/database/database.types.ts";
/**
 * /api/login?session={id}
 * /api/login?session={id}&redirect=/api/join?room={id}
 * /api/login?session={id}&redirect=/api/signup?room={id}
 */
export const handleLogin = define.handlers({
  async POST(ctx) {
    const url = new URL(ctx.req.url);
    const redirect = url.searchParams.get("redirect");
    console.info(`POST: ${url} - Redirected to: ${redirect}`)
    try {
      // try restore the session
      const { jwt: restored_key, session: session_id } =
        await (tryRestoreSession(ctx.req)) ?? {};
      if (!restored_key) {
        console.info("No Authorization key (JWT)");
        // registering new user
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
        headers.append(
          "Set-Cookie",
          `jwt=${jwt}; HttpOnly; Secure; Path=/; SameSite=Lax`,
        );
        headers.append(
          "Set-Cookie",
          `session=${new_session_id}; HttpOnly; Secure; Path=/; SameSite=Lax`,
        );
        headers.append(
          "Set-Cookie",
          `user=${user_id}; HttpOnly; Secure; Path=/; SameSite=Lax`,
        );
        // redirecting for example:
        // /api/login?session={id}&redirect=/api/join?room={id}
        // /api/login?session={id}&redirect=/api/signup?room={id}
        if (redirect) headers.append("Location", redirect);
        return new Response(JSON.stringify({ ok: true, redirect: redirect }), { headers });
      }
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.append(
        "Set-Cookie",
        `jwt=${restored_key}; HttpOnly; Secure; Path=/; SameSite=Lax`,
      );
      headers.append(
        "Set-Cookie",
        `session=${session_id}; HttpOnly; Secure; Path=/; SameSite=Lax`,
      );
      if (redirect) headers.append("Location", redirect);
      return new Response(JSON.stringify({ ok: true , redirect: redirect}), { headers });
    } catch (e) {
      console.error("LOGIN ERROR:", e);
      return new Response(JSON.stringify({ error: "Login failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
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
  req: Request,
): Promise<{ jwt: string; session: string } | null> {
  console.info("Trying to restore user session.");
  try {
    // Getting the JWT key and session ID from the header
    const token = getHeader(req);
    const session_id = new URL(req.url).searchParams.get("session");
    if (!session_id) throw "Session id is missing";
    // Fetch the session data to check for expiration
    const {data: sessionData, error: sessionError} = await databaseWithKey(token)
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
    const {error: userError} = await databaseWithKey(token).auth.getUser(token);
    if (userError) {
      console.info("Failed to retrieve user data from JWT.");
      const restored_key = await restoreJWT(session_id);
      if (!restored_key) return null;
      return {jwt: restored_key, session: session_id};
    }
    return {jwt: token, session: session_id};
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
