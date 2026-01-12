import { define } from "../handlers/utils/utils.ts";
import { Partial } from "fresh/runtime";
import { database } from "../handlers/utils/database/database.ts";
import { UsernameInput } from "../components/UsernameInput.tsx";
import RoomIsland from "../islands/RoomIsland.tsx";

interface RoomId {
    id: string;
}

export const handler = define.handlers({
    async GET(_ctx) {
        const rooms = await fetchRoomIds();
        return { data: { rooms } };
    }
});

export default define.page(function HomePage(props) {
    const data = props.data as { rooms: RoomId[] } | undefined;
    const rooms = data?.rooms ?? [];

    return (
        <main class="px-4 py-8 mx-auto fresh-gradient min-h-screen bg-[url(/images/bg-plavin.jpg)] bg-cover">
            <h1> <span id="would">Would</span> You <span id="rather">Rather</span></h1>

            <section class="max-w-screen-md mx-auto">
                {/* Username input - plain HTML, queried by islands */}
                <div class="mb-8 flex justify-center">
                    <UsernameInput
                        id="username"
                        placeholder="Enter your username"
                        class="w-full max-w-sm text-lg"
                    />
                </div>

                {/* Room list */}
                <h2 class="w-fit mb-3 text-2xl mr-auto ml-auto">Available Rooms</h2>

                {rooms.length === 0 ? (
                    <div class="text-center py-8 bg-gray-50 rounded-lg">
                        <p class="text-gray-600">No rooms available</p>
                        <p class="text-sm text-gray-500 mt-1">Check back later!</p>
                    </div>
                ) : (
                    <div id="room-container" class="space-y-8 room-container">
                        {rooms.map((room) => (
                            <Partial name={`room-${room.id}`} key={room.id}>
                                <RoomIsland roomId={room.id} />
                            </Partial>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
});

async function fetchRoomIds(): Promise<RoomId[]> {
    const { data, error } = await database()
        .from("rooms")
        .select("id")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to fetch rooms:", error);
        return [];
    }

    return data ?? [];
}