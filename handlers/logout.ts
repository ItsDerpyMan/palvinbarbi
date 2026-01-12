import {define} from "./utils/utils.ts";
import {databaseWithKey} from "./utils/database/database.ts";
import { deleteAuthCookies} from "./utils/cookies.ts";

/**
 * POST /api/logout
 * Clears session and removes cookies
 */
export const handleLogout = define.handlers({
    async POST(ctx) {
        console.info("Processing logout request");

        try {
            const sessionId = ctx.state.sessionId;
            const jwt = ctx.state.jwt;

            // Delete session from database if it exists
            if (sessionId && jwt) {
                await databaseWithKey(jwt)
                    .from("sessions")
                    .delete()
                    .eq("id", sessionId);

                console.info("Session deleted from database:", sessionId);
            }

            // Clear all auth cookies
            const headers = new Headers({ "Content-Type": "application/json" });
            deleteAuthCookies(headers);

            return new Response(
                JSON.stringify({ ok: true, message: "Logged out successfully" }),
                { status: 200, headers }
            );

        } catch (error) {
            console.error("Logout error:", error);

            // Even if database deletion fails, clear cookies
            const headers = new Headers({ "Content-Type": "application/json" });
            deleteAuthCookies(headers);

            return new Response(
                JSON.stringify({ ok: true, message: "Logged out" }),
                { status: 200, headers }
            );
        }
    },
});