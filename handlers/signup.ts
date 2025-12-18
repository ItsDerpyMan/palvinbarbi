import { setCookie} from "./utils/cookies.ts";
import {jsonError, validateSession} from "./utils/helpers.ts";
import { Auth, define } from "../utils/utils.ts";
import { databaseWithKey } from "../utils/database/database.ts";
import { Context } from "fresh";

// Configuration
const MAX_ROOM_PLAYERS = 5;

/**
 * POST /api/signup?room={roomId}
 * Adds authenticated user to a room
 */
export const handleSignup = define.handlers({
  async POST(ctx) {
    const url = new URL(ctx.req.url);
    const roomId = url.searchParams.get("room");

    console.info(`POST: ${url}`);

    if (!roomId) {
      return jsonError("Room ID required", 400);
    }

    try {
      // Extract authentication data from middleware state
      const { jwt, sessionId } = extractAuthData(ctx);

      // Validate session
      await validateSession(jwt, sessionId);

      // Validate room
      await validateRoom(jwt, roomId);

      // Add user to room
      await addUserToRoom(jwt, sessionId, roomId);

      // Success - set room cookie and return join URL
      return createSignupResponse(roomId);

    } catch (error) {
      console.error("Signup failed:", error);
      const message = error instanceof Error ? error.message : "Signup failed";
      return jsonError(message, 400);
    }
  },
});

// ============================================================================
// Response Helpers
// ============================================================================

function createSignupResponse(roomId: string): Response {
  const headers = new Headers({ "Content-Type": "application/json" });

  setCookie(headers, "room", roomId);

  const joinUrl = `/api/join?room=${encodeURIComponent(roomId)}`;

  return new Response(
      JSON.stringify({ ok: true, redirect: joinUrl }),
      { status: 200, headers }
  );
}


// ============================================================================
// Authentication
// ============================================================================

interface AuthData {
  jwt: string;
  sessionId: string;
}

function extractAuthData(ctx: Context<Auth>): AuthData {
  const jwt = ctx.state.jwt;
  const sessionId = ctx.state.sessionId;

  if (!jwt) {
    throw new Error("Authentication required - missing JWT");
  }

  if (!sessionId) {
    throw new Error("Authentication required - missing session");
  }

  return { jwt, sessionId };
}

// ============================================================================
// Room Validation
// ============================================================================

async function validateRoom(jwt: string, roomId: string): Promise<void> {
  console.info("Validating room:", roomId);

  // Check room exists
  const roomExists = await checkRoomExists(jwt, roomId);
  if (!roomExists) {
    throw new Error("Room not found");
  }

  // Check room has space
  const playerCount = await getRoomPlayerCount(jwt, roomId);

  if (playerCount >= MAX_ROOM_PLAYERS) {
    throw new Error(`Room is full (${MAX_ROOM_PLAYERS}/${MAX_ROOM_PLAYERS} players)`);
  }

  console.info(`Room has space: ${playerCount}/${MAX_ROOM_PLAYERS} players`);
}

async function checkRoomExists(jwt: string, roomId: string): Promise<boolean> {
  const { data, error } = await databaseWithKey(jwt)
      .from("rooms")
      .select("id")
      .eq("id", roomId)
      .maybeSingle();

  if (error) {
    console.error("Room existence check failed:", error);
    return false;
  }

  return Boolean(data);
}

async function getRoomPlayerCount(jwt: string, roomId: string): Promise<number> {
  const { count, error } = await databaseWithKey(jwt)
      .from("room_memberships") // Note: Make sure this matches your table name
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

  if (error) {
    console.error("Failed to get player count:", error);
    throw new Error("Failed to check room capacity");
  }

  return count ?? 0;
}

// ============================================================================
// Room Membership
// ============================================================================

async function addUserToRoom(
    jwt: string,
    sessionId: string,
    roomId: string
): Promise<void> {
  console.info(`Adding session ${sessionId} to room ${roomId}`);

  // Check if already a member
  const alreadyMember = await checkExistingMembership(jwt, sessionId, roomId);

  if (alreadyMember) {
    console.info("User already a member of this room");
    return; // Idempotent - not an error
  }

  // Insert membership
  const { error } = await databaseWithKey(jwt)
      .from("room_memberships")
      .insert({
        room_id: roomId,
        session_id: sessionId,
        joined_at: new Date().toISOString(),
      });

  if (error) {
    // Check if it's a duplicate key error (race condition)
    if (error.code === "23505") { // PostgresSQL unique violation
      console.info("Race condition detected - user already joined");
      return;
    }

    throw new Error(`Failed to join room: ${error.message}`);
  }

  console.info("Successfully joined room");
}

async function checkExistingMembership(
    jwt: string,
    sessionId: string,
    roomId: string
): Promise<boolean> {
  const { data } = await databaseWithKey(jwt)
      .from("room_memberships")
      .select("room_id")
      .eq("room_id", roomId)
      .eq("session_id", sessionId)
      .maybeSingle();

  return Boolean(data);
}