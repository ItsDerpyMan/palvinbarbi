import GameIsland from "../../../islands/GameIsland.tsx";
import { define } from "../../../utils/utils.ts";
import { databaseWithKey } from "../../../utils/database/database.ts";
import { deleteAuthCookies } from "../../../handlers/utils/cookies.ts";
import { validateSession } from "../../../handlers/utils/helpers.ts";

/**
 * GET /room/[id]
 * Verifies user membership and renders room page
 */
export const handler = define.handlers({
    async GET(ctx) {
        const roomId = ctx.params.id;
        console.log(`Room ID: ${roomId}`);
        // Validate authentication
        if (!ctx.state.jwt || !ctx.state.sessionId) {
            const headers = new Headers();
            deleteAuthCookies(headers);
            headers.set("Location", "/?error=auth_required");
            return new Response(null, { status: 303, headers });
        }

        const { jwt, sessionId, username } = ctx.state;

        try {
            // Verify session is valid
            await validateSession(jwt, sessionId);

            // Verify user is a member of this room
            const isMember = await verifyRoomMembership(jwt, sessionId, roomId);

            if (!isMember) {
                return new Response(null, {
                    status: 303,
                    headers: { "Location": "/?error=not_member" },
                });
            }

            // Success - return data for page rendering

            return {
                data: {
                    roomId,
                    sessionId,
                    username: username ?? "Anonymous",
                },
            };

        } catch (error) {
            console.error("Room access failed:", error);
            const headers = new Headers();
            deleteAuthCookies(headers);
            headers.set("Location", "/?error=session_expired");
            return new Response(null, { status: 303, headers });
        }
    },
});

export default define.page<typeof handler>((props)=> {
    console.log("Running")
    const data = props.data as { roomId: string; sessionId: string; username: string };
    return (
        <>
            <h2 class="text-2xl font-bold mb-4">Room: {data.roomId}</h2>
            <p class="text-white-600 mb-2">Welcome, {data.username}!</p>
            <p class="text-white-600 mb-2">Session: {data.sessionId}</p>

            <main class="mt-8">
                <GameIsland
                    roomId={data.roomId}
                    userId={data.sessionId}
                    username={data.username}
                />
            </main>
        </>
    );
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

