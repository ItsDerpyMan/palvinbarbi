import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import UsernameInput from "./Username.tsx";
import RoomIsland from "./Room.tsx";
import type { Room } from "../utils/database/database.ts";

export default function RoomController() {
    const username = useSignal("");
    const rooms = useSignal<Room[]>([]);
    const loading = useSignal(true);
    const error = useSignal<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadRooms = async () => {
            try {
                loading.value = true;
                error.value = null;

                const fetchedRooms = await fetchRooms();

                if (mounted) {
                    rooms.value = fetchedRooms;
                    loading.value = false;
                }
            } catch (err) {
                console.error("Failed to load rooms:", err);

                if (mounted) {
                    error.value = err instanceof Error ? err.message : "Failed to load rooms";
                    loading.value = false;
                }
            }
        };

        void loadRooms();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div class="max-w-4xl mx-auto p-6">
            <UsernameInput username={username} />

            <div class="mt-8">
                <h1 class="text-3xl font-bold mb-4">Available Rooms</h1>

                {loading.value && (
                    <div class="text-center py-8">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p class="mt-2 text-gray-600">Loading rooms...</p>
                    </div>
                )}

                {error.value && (
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        <p class="font-semibold">Error loading rooms</p>
                        <p class="text-sm mt-1">{error.value}</p>
                        <button
                            onClick={() => window.location.reload()}
                            class="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!loading.value && !error.value && rooms.value.length === 0 && (
                    <div class="text-center py-8 bg-gray-50 rounded-lg">
                        <p class="text-gray-600">No rooms available</p>
                        <p class="text-sm text-gray-500 mt-1">Check back later!</p>
                    </div>
                )}

                {!loading.value && !error.value && rooms.value.length > 0 && (
                    <ul class="space-y-4">
                        {rooms.value.map((room) => (
                            <li key={room.id}>
                                <RoomIsland data={room} input={username} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchRooms(): Promise<Room[]> {
    const res = await fetch("/api/rooms", {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to fetch rooms" }));
        throw new Error(errorData.error || "Failed to fetch rooms");
    }

    const data = await res.json();
    return data.rooms || [];
}
