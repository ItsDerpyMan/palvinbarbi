import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { TimeStamp } from "../components/TimeStamp.tsx";
import { PlayerCount } from "../components/PlayerCount.tsx";
import {database} from "../utils/database/database.client.ts";

interface RoomData {
    id: string;
    name: string;
    created_at: string;
    join_code: string;
    player_count: number;
}

interface RoomIslandProps {
    roomId: string;
}

export default function RoomIsland({ roomId }: RoomIslandProps) {
    const room = useSignal<RoomData | null>(null);
    const playerCount = useSignal(0);
    const loading = useSignal(true);
    const error = useSignal<string | null>(null);
    const joining = useSignal(false);
    const deleted = useSignal(false);

    // Fetch initial room data
    useEffect(() => {
        let mounted = true;

        const fetchRoom = async () => {
            try {
                loading.value = true;
                const res = await fetch(`/api/room/${roomId}`, {
                    method: "POST",
                    credentials: "include",
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch room");
                }

                const data = await res.json();
                if (mounted) {
                    room.value = {
                        id: roomId,
                        name: data[0]?.name ?? "Unknown Room",
                        created_at: data[0]?.createdAt ?? new Date().toISOString(),
                        join_code: data.join_code ?? "null",
                        player_count: data.players_count?.data ?? 0,
                    };
                    playerCount.value = data.players_count?.data ?? 0;
                    loading.value = false;
                }
            } catch (err) {
                if (mounted) {
                    error.value = err instanceof Error ? err.message : "Failed to load room";
                    loading.value = false;
                }
            }
        };

        void fetchRoom();

        return () => {
            mounted = false;
        };
    }, [roomId]);

    // Supabase Realtime for live updates
    useEffect(() => {
        if (deleted.value) return;

        const channel = database().channel(`room-${roomId}`);

        channel
            .on('presence', { event: 'sync' }, () => {
                // Get current presence state and count users
                const state = channel.presenceState();
                const count = Object.keys(state).length;
                playerCount.value = count;
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('[Presence] join:', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('[Presence] leave:', key, leftPresences);
            })
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomId}`,
                },
                (_payload) => {
                    console.log(`[Realtime] Room ${roomId} was deleted`);
                    deleted.value = true;
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomId}`,
                },
                (payload) => {
                    console.log('[Realtime] Room updated:', payload.new);
                    if (room.value && payload.new) {
                        room.value = {
                            ...room.value,
                            name: payload.new.name ?? room.value.name,
                            join_code: payload.new.join_code ?? room.value.join_code,
                        };
                    }
                }
            )
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime] Subscribed to room-${roomId}`);
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [roomId, deleted.value]);

    const getUsername = (): string | null => {
        const input = document.getElementById("username") as HTMLInputElement | null;
        return input?.value.trim() || null;
    };

    const handleJoin = async () => {
        const username = getUsername();

        if (!username) {
            alert("Please enter a username!");
            return;
        }

        try {
            joining.value = true;

            // Step 1: Login
            const loginUrl = `/api/login?redirect=${encodeURIComponent(`/api/signup?room=${roomId}`)}`;
            const formData = new FormData();
            formData.append("username", username);

            globalThis.history.replaceState({}, "", loginUrl);
            const loginRes = await fetch(loginUrl, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (!loginRes.ok) {
                const err = await loginRes.json();
                throw new Error(err.error || "Login failed");
            }

            const loginData = await loginRes.json();

            // Step 2: Signup (join room)
            globalThis.history.replaceState({}, "", loginData.redirect);
            const signupRes = await fetch(loginData.redirect, {
                method: "POST",
                credentials: "include",
            });

            if (!signupRes.ok) {
                const err = await signupRes.json();
                throw new Error(err.error || "Failed to join room");
            }

            const signupData = await signupRes.json();

            // Step 3: Redirect to room
            globalThis.location.href = signupData.redirect;

        } catch (err) {
            console.error("Failed to join room:", err);
            alert(err instanceof Error ? err.message : "Failed to join room");
        } finally {
            joining.value = false;
        }
    };

    // Room was deleted
    if (deleted.value) {
        return null; // Remove from DOM
    }

    // Loading state
    if (loading.value) {
        return (
            <div class="card animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    // Error state
    if (error.value || !room.value) {
        return (
            <div class="card border-red-200 bg-red-50">
                <p class="text-red-600">{error.value || "Room not found"}</p>
            </div>
        );
    }

    return (
        <div class="card bg-[url(/images/bg-paper.jpg)] bg-cover mr-auto ml-auto text-black" data-room-id={roomId}>
            <div class="flex justify-between items-center mb-4 room">
                <h2 class="text-lg font-semibold truncate">{room.value.name}</h2>
                <span class="text-sm text-gray-500 font-mono">{room.value.id.slice(0, 8)}</span>
            </div>

            <div class="flex justify-between items-center inner">
                <Button onClick={handleJoin} disabled={joining.value} class="btn btn-outline btn-primary">
                    {joining.value ? "Joining..." : "Join"}
                </Button>
                <TimeStamp time={Date.parse(room.value.created_at)} />
                <PlayerCount count={playerCount.value} />
            </div>
        </div>
    );
}