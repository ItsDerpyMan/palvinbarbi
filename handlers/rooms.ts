import { define } from "./utils/utils.ts";
import { databaseWithKey } from "./utils/database/database.ts";

/**
 * GET /api/rooms
 * Returns list of all available rooms
 */
export const handleRooms = define.handlers({
    async GET(_ctx) {
        console.info("GET /api/rooms - Fetching all rooms");

        try {
            // Use server-side database connection (anonymous is fine for public data)
            const { data: rooms, error } = await databaseWithKey()
                .from("rooms")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                throw new Error(`Failed to fetch rooms: ${error.message}`);
            }

            // Optionally enhance with player count
            const roomsWithCount = await Promise.all(
                (rooms || []).map(async (room) => {
                    const count = await getRoomPlayerCount(room.id);
                    return {
                        ...room,
                        player_count: count,
                        is_full: count >= 5, // MAX_ROOM_PLAYERS
                    };
                })
            );

            return new Response(
                JSON.stringify({
                    ok: true,
                    rooms: roomsWithCount
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }
            );

        } catch (error) {
            console.error("Failed to fetch rooms:", error);
            const message = error instanceof Error ? error.message : "Failed to fetch rooms";

            return new Response(
                JSON.stringify({ ok: false, error: message }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
    },
});

// ============================================================================
// Helper Functions
// ============================================================================

async function getRoomPlayerCount(roomId: string): Promise<number> {
    const { count, error } = await databaseWithKey()
        .from("room_memberships")
        .select("*", { count: "exact", head: true })
        .eq("room_id", roomId);

    if (error) {
        console.error(`Failed to get player count for room ${roomId}:`, error);
        return 0;
    }

    return count ?? 0;
}