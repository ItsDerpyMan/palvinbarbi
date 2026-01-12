import {databaseWithKey} from "./database/database.ts";

export function jsonError(message: string, status: number): Response {
    return new Response(
        JSON.stringify({ ok: false, error: message }),
        { status, headers: { "Content-Type": "application/json" } }
    );
}

// ============================================================================
// Session Validation
// ============================================================================

export async function validateSession(jwt: string, sessionId: string): Promise<void> {
    console.info("Validating session:", sessionId);

    const { data, error } = await databaseWithKey(jwt)
        .from("sessions")
        .select("id, expires_at, user_id")
        .eq("id", sessionId)
        .maybeSingle();

    if (error) {
        throw new Error(`Session validation failed: ${error.message}`);
    }

    if (!data) {
        throw new Error("Session not found");
    }

    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (expiresAt <= now) {
        throw new Error("Session has expired - please log in again");
    }

    console.info("Session valid until:", expiresAt.toISOString());
}
