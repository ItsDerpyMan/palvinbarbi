import { database, databaseWithKey } from "../_shared/supabase_client.ts";
import type { Tables, TablesInsert } from "../_shared/database.types.ts";

export async function getUserFormdata(req: Request): Promise<string> {
  const form = await req.formData();
  const username = form.get("username")?.toString()?.trim();

  if (!username) {
    throw new Error("Username required!");
  }
  return username;
}

export async function tryRestoreSession(
  req: Request,
): Promise<{ jwt: string } | null> {
  // getting the JWT key from the header
  const [token, session_id] = getHeader(req);
  // trying to get user data from the auth by JWT
  const { error } = await database(req).auth.getUser(token);
  if (!error) return { jwt: token };

  // restoring the JWT key by requiring the refresh_token of the session
  return restoreJWT(session_id).catch((err) => console.error("Error: ", err));
}
export async function sigInAnonymously(
  req: Request,
): Promise<{ userId; jwt; refreshtoken }> {
  const { data, error } = await databaseWithKey().auth
    .signInAnonymously() as Response<{ user: User; session: Session }>;
  if (error) {
    throw new Error(
      "Anonymous sign-in failed: " + (error?.message ?? "unknown"),
    );
  }
  if (!data?.user || !data?.session) {
    throw new Error(
      "Missing fields in the return of the AnonSignIn: " +
        (error?.message ?? "unknown"),
    );
  }
  // Destructure user and session
  const { user, session } = data;
  const { id: userId } = user;
  const { access_token: jwt, refresh_token: refreshToken } = session;

  await databaseWithKey(jwt).from("users").upsert({ id: userId });
  return { userId, jwt, refreshtoken };
}

export async function createSession(
  jwt: string,
  userId: string,
  refreshToken: string,
): Promise<Tables<"sessions">> {
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
    .select()
    .single<Tables<"sessions">>();

  if (error) throw new Error("Session creation failed: " + error.message);
  return data;
}

async function restoreJWT(session_id: string): Promise<{ jwt: string }> {
  // Query refresh token from sessions table
  const { data: sessionData, error } = await databaseWithKey()
    .from("sessions")
    .select("token")
    .eq("id", session_id)
    .single();

  if (error) {
    throw new Error(
      `Failed to fetch session ${session_id}: ${error.message}`,
    );
  }
  if (!sessionData) {
    throw new Error(`No session found for id: ${session_id}`);
  }

  // Refresh the JWT using Supabase auth
  const { data: refreshedSession, error: tokenError } = await databaseWithKey()
    .auth
    .refreshSession({ refresh_token: sessionData.token });

  if (tokenError) {
    throw new Error(
      `Failed to refresh JWT for session ${session_id}: ${tokenError.message}`,
    );
  }
  if (!refreshedSession?.session) {
    throw new Error(
      `No session returned when refreshing JWT for session ${session_id}`,
    );
  }

  // Update the refresh token in the database
  await databaseWithKey(refreshedSession.session.access_token)
    .from("sessions")
    .update({ token: refreshedSession.session.refresh_token })
    .eq("id", session_id);

  // Return the new access token
  return { jwt: refreshedSession.session.access_token };
}
function getHeader(req: Request): [string, string] {
  const extract = (name: string): string => {
    const val = req.headers.get(name)?.trim();
    if (!val) throw new Error(`${name} header is empty`);
    return val.replace(/^Bearer\s+/i, "");
  };

  return [extract("Authorization"), extract("Session")];
}
