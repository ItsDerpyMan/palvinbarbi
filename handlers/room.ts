import {define} from "./utils/utils.ts";
import {database} from "./utils/database/database.ts";

export const handleRoom = define.handlers({
    async POST(ctx) {
        const roomId = ctx.params.id;
        try {
            const roomData = await fetchRoomData(roomId);
            return Response.json(roomData);
        } catch (error) {
            console.error(error);
            return Response.error();
        }
    }
});

async function fetchRoomData(roomId: string) {
    const { data, error } = await database()
        .from("rooms")
        .select("name, created_at, join_code")
        .eq("id", roomId);
    if (!data || error) throw error;

    const count = await database().rpc('get_room_member_count', {
        target_room_id: roomId,
    });
    if (!count) throw new Error("Could not get the room player count");

    return { ...data, players_count: count };
}