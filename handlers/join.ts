import { Auth, define } from "./utils/utils.ts";
import { databaseWithKey } from "./utils/database/database.ts";
import { deleteAuthCookies } from "./utils/cookies.ts";
import {jsonError, validateSession} from "./utils/helpers.ts";


/**
 * GET /api/join?room={roomId}
 * Verifies user membership and redirects to room
 */
export const handleJoin = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const roomId = url.searchParams.get("room");

    console.info(`GET: ${url}`);

    // Validate room parameter
    if (!roomId) {
      return jsonError("Room ID required", 400);
    }

    // Validate authentication
    if (!ctx.state.jwt) {
      const headers = new Headers({ "Content-Type": "application/json" });
      deleteAuthCookies(headers);
      return new Response(
          JSON.stringify({ ok: false, error: "Authentication required" }),
          { status: 401, headers }
      );
    }

    if (!ctx.state.sessionId) {
      const headers = new Headers({ "Content-Type": "application/json" });
      deleteAuthCookies(headers);
      return new Response(
          JSON.stringify({ ok: false, error: "Session required" }),
          { status: 401, headers }
      );
    }

    const jwt = ctx.state.jwt;
    const sessionId = ctx.state.sessionId;

    try {
      // Verify session is valid
      await validateSession(jwt, sessionId);

      // Verify user is a member of this room
      const isMember = await verifyRoomMembership(jwt, sessionId, roomId);

      if (!isMember) {
        return jsonError("Not a member of this room. Please sign up first.", 403);
      }

      // Success - redirect to room page
      console.info(`User ${sessionId} joining room ${roomId}`);

      return new Response(null, {
        status: 303, // See Other - GET redirect
        headers: {
          "Location": `/room/${roomId}`,
        },
      });

    } catch (error) {
      console.error("Join failed:", error);
      const message = error instanceof Error ? error.message : "Failed to join room";

      // If session expired, clear cookies
      if (message.includes("expired") || message.includes("Session not found")) {
        const headers = new Headers({ "Content-Type": "application/json" });
        deleteAuthCookies(headers);

        return new Response(
            JSON.stringify({ ok: false, error: message }),
            { status: 401, headers }
        );
      }

      return jsonError(message, 400);
    }
  },
});

// ============================================================================
// Room Membership Verification
// ============================================================================

async function verifyRoomMembership(
    jwt: string,
    sessionId: string,
    roomId: string
): Promise<boolean> {
  console.info(`Verifying membership: session=${sessionId}, room=${roomId}`);

  const { data, error } = await databaseWithKey(jwt)
      .from("room_memberships")
      .select("room_id, session_id, joined_at")
      .eq("room_id", roomId)
      .eq("session_id", sessionId)
      .maybeSingle();

  if (error) {
    console.error("Membership verification failed:", error);
    throw new Error(`Failed to verify room membership: ${error.message}`);
  }

  if (!data) {
    console.info("User is not a member of this room");
    return false;
  }

  console.info(`Membership verified - joined at: ${data.joined_at}`);
  return true;
}