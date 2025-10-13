import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import {Button} from "../components/Button.tsx";
import {TimeStamp} from "../components/TimeStamp.tsx";
import {PlayerCount} from "../components/PlayerCount.tsx";
import { supabase } from "../utils/database.ts";
import type { Room } from "../utils/database.ts";

export default function RoomIsland({ data }: RoomProps) {
    const room = useSignal({ ...data, created_at: data.created_at.toString() });
    const count = useSignal<number>(0);
    const users = useSignal<string[]>([]);
    const key = useSignal<string>("");
    useEffect(() => {
        const stored = localStorage.getItem("presence_key") ?? crypto.randomUUID();
        localStorage.setItem("presence_key", stored);
        key.value = stored;
        const channel = supabase.channel(`room:${room.value.id}`, {
            config: { presence: { key: crypto.randomUUID() } },
        });
        channel.on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            const presences = Object.values(state).flatMap(v => v.metas);
            users.value = presences.map(p => p.username);
            count.value = presences.length;
        });
        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const onJoin = async () => {
        const username = localStorage.getItem("username") ?? "";
        if (!username.trim()) return;

        const form = new FormData();
        form.append("username", username);
        await fetch(`/api/${room.value.id}`, { method: "POST", body: form });
        console.log("Joined room");
    };

    return (
        <div class="card">
            <div class="flex justify-between items-center">
                <h2 class="text-lg font-semibold truncate">{room.value.name}</h2>
                <span class="text-sm text-gray-500">{room.value.id}</span>
            </div>

            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <button id="joinButton" class="join-button" onClick={() => (count.value++)}>Join</button>
                </div>
                <PlayerCount count={count.value} class="player-count" />
            </div>
        </div>
    );
}

//<TimeStamp time={room.value.created_at} />
