import { databaseWithKey } from "../utils/database/database.ts";
import type { Tables, TablesInsert } from "../utils/database/database.types.ts";
import { setCookie, deleteAuthCookies} from "./utils/cookies.ts";
import { jsonError} from "./utils/helpers.ts";
import {Auth, define} from "../utils/utils.ts";
import { Context } from "fresh";
/**
 * /api/login
 * /api/login?redirect=/api/join?room={id}
 * /api/login?redirect=/api/signup?room={id}
 */
export const handleLogin = define.handlers({
  async POST(ctx) {
    const url = new URL(ctx.req.url);
    const redirect = url.searchParams.get("redirect");

    console.info(`POST: ${url} - Redirected to: ${redirect}`)

    if (!redirect) {
      return jsonError("Redirect not found", 400);
    }
    try {
      // Try to restore existing session from cookies (set by middleware)
      const restoredSession = await tryRestoreSession(ctx);

      if (restoredSession) {
        console.info("Session restored successfully");
        return createLoginResponse(redirect, restoredSession);
      }

      console.info( "Creating anonymous user session");
      const username = await extractUsername(ctx.req);
      const newSession = await createAnonymousSession(username);

      // Clear old cookies and set new ones
      const headers = new Headers({ "Content-Type": "application/json" });
      deleteAuthCookies(headers);

      setCookie(headers, "jwt", newSession.jwt);
      setCookie(headers, "session", newSession.sessionId);
      setCookie(headers, "user", newSession.userId!);
      setCookie(headers, "username", newSession.username!);

      return new Response(
          JSON.stringify({ ok: true, redirect }),
          { status: 200, headers }
      );
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Login failed";
      return jsonError(message, 500);
    }
  },
});

// ============================================================================
// Response Helpers
// ============================================================================

interface SessionData {
  jwt: string;
  sessionId: string;
  userId?: string;
  username?: string;
}
function createLoginResponse(redirect: string, session: SessionData): Response {
  const headers = new Headers({ "Content-Type": "application/json" });

  setCookie(headers, "jwt", session.jwt);
  setCookie(headers, "session", session.sessionId);

  if (session.userId) {
    setCookie(headers, "user", session.userId);
  }
  if (session.username) {
    setCookie(headers, "username", session.username);
  }

  return new Response(
      JSON.stringify({ ok: true, redirect }),
      { status: 200, headers }
  );
}


// ============================================================================
// User Input Extraction
// ============================================================================

async function extractUsername(req: Request): Promise<string> {
  try {
    const form = await req.formData();
    const username = form.get("username")?.toString()?.trim();

    console.info("Extracted username: ", username);

    if (!username) {
      throw new Error("Username is required!");
    }

    // Basic validation
    if (username.length < 2 || username.length > 20) {
      throw new Error("Username has to be between 2 and 20 chars!");
    }

    return username;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Failed to extract username from form data");
  }
}

// ============================================================================
// Session Restoration
// ============================================================================

async function tryRestoreSession(
    ctx: Context<Auth>,
): Promise<SessionData | null> {
  console.info("Trying to restore user session.");

  try {
    // Get credentials from middleware state
    const jwt = ctx.state.jwt;
    const sessionId = ctx.state.sessionId;

    if (!jwt || !sessionId) {
      console.info("No JWT key or session id is in state");
      return null;
    }

    // Validate session hasn't expired
    const isValid = await validateSessionExpiry(jwt, sessionId);
    if (!isValid) {
      console.info("Session has expired");
      return null;
    }

    // Verify JWT is still valid
    const { error } = await databaseWithKey(jwt).auth.getUser(jwt);

    if (error) {
      console.info("JWT invalid, attempting refresh");
      const refreshedJwt = await refreshSessionJwt(sessionId);

      if (!refreshedJwt) {
        return null;
      }

      return { jwt: refreshedJwt, sessionId };
    }

    // Session is valid
    return { jwt, sessionId };

  } catch (error) {
    console.error("Session restoration failed:", error);
    return null;
  }
}
async function validateSessionExpiry(
    jwt: string,
    sessionId: string
): Promise<boolean> {
  const { data, error } = await databaseWithKey(jwt)
      .from("sessions")
      .select("expires_at")
      .eq("id", sessionId)
      .maybeSingle();

  if (error || !data) {
    return false;
  }

  return new Date(data.expires_at) > new Date();
}

async function refreshSessionJwt(sessionId: string): Promise<string | null> {
  console.info("Refreshing JWT for session:", sessionId);

  try {
    // Fetch refresh token
    const { data: sessionData, error: fetchError } = await databaseWithKey()
        .from("sessions")
        .select("token")
        .eq("id", sessionId)
        .single();

    if (fetchError || !sessionData) {
      throw new Error("Session not found");
    }

    // Refresh the session
    const { data: refreshed, error: refreshError } = await databaseWithKey()
        .auth
        .refreshSession({ refresh_token: sessionData.token });

    if (refreshError || !refreshed?.session) {
      throw new Error("Failed to refresh session");
    }

    // Update stored refresh token
    await databaseWithKey(refreshed.session.access_token)
        .from("sessions")
        .update({ token: refreshed.session.refresh_token })
        .eq("id", sessionId);

    return refreshed.session.access_token;

  } catch (error) {
    console.error("JWT refresh failed:", error);
    return null;
  }
}

// ============================================================================
// Anonymous Session Creation
// ============================================================================

async function createAnonymousSession(
    username: string
): Promise<SessionData> {
  console.info("Creating anonymous session for:", username);

  // Sign in anonymously
  const { data, error } = await databaseWithKey().auth.signInAnonymously();

  if (error || !data?.user || !data?.session) {
    throw new Error(`Anonymous sign-in failed: ${error?.message ?? "Unknown error"}`);
  }

  const { user, session } = data;
  const userId = user.id;
  const jwt = session.access_token;
  const refreshToken = session.refresh_token;

  // Store user in database
  await storeUser(jwt, userId, username);

  // Create session record
  const sessionRecord = await storeSession(jwt, userId, refreshToken);

  return {
    jwt,
    sessionId: sessionRecord.id,
    userId,
    username,
  };
}

async function storeUser(
    jwt: string,
    userId: string,
    username: string
): Promise<void> {
  const { error } = await databaseWithKey(jwt)
      .from("users")
      .upsert({
        id: userId,
        username: username,
      } satisfies TablesInsert<"users">);

  if (error) {
    throw new Error(`Failed to store user: ${error.message}`);
  }
}

async function storeSession(
    jwt: string,
    userId: string,
    refreshToken: string
): Promise<Tables<"sessions">> {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  const { data, error } = await databaseWithKey(jwt)
      .from("sessions")
      .insert({
        user_id: userId,
        token: refreshToken,
        expires_at: expiresAt.toISOString(),
      } satisfies TablesInsert<"sessions">)
      .select("*")
      .single<Tables<"sessions">>();

  if (error || !data) {
    throw new Error(`Session creation failed: ${error?.message ?? "Unknown error"}`);
  }

  return data;
}