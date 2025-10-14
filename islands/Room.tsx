import { useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import {Button} from "../components/Button.tsx";
import {TimeStamp} from "../components/TimeStamp.tsx";
import {PlayerCount} from "../components/PlayerCount.tsx";
import type { Room } from "../utils/database.ts";
import {database} from "../utils/database.ts";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import type { Database } from "../utils/supabase.ts";
interface RoomProps {
    key?: string;
    id?: string;
    data: Room;
}
export default function RoomIsland({ data }: RoomProps) {
    const room = useSignal({ ...data, created_at: data.created_at.toString() });
    const count = useSignal<number>(0);

    //const users = useSignal<string[]>([]);
    //const key = useSignal<string>("");


    const channelRef = useRef<RealtimeChannel>(null);
    useEffect(() => {
        console.log("jhello")
        if (channelRef.current?.state === 'subscribed') return;
        const channel = database.channel(`room:${room.value.id}:users`, {
            config: {
                broadcast: { self: false, ack: true },
                presence: { key: 'user-session-id', enabled: true },
                private: false  // Required for RLS authorization
            }
        })

        channelRef.current = channel;
        channel.on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            const presences = Object.values(state).flatMap((v) => v.metas);
            count.value = presences.length;
        })
        channel.subscribe((status, err) => {
            switch (status) {
                case 'SUBSCRIBED':
                    console.log('Connected (or reconnected)')
                    break
                case 'CHANNEL_ERROR':
                    console.error('Channel error:', err)
                    break
                case 'CLOSED':
                    console.log('Channel closed')
                    break
            }
        });
        return () => {
            if (channelRef.current) {
                channel.unsubscribe();
                database.removeChannel(channelRef.current);
                channelRef.current = null;
                console.log("unsubscribed")
            }
        }
    }, []);
    useEffect(() => {
       console.log(count.value)
    }, [count.value]);
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
                    <Button id="joinButton" class="join-button" onClick={onJoin}>Join</Button>
                </div>
                <PlayerCount count={count.value} class="player-count" />
            </div>
        </div>
    );
}

//<TimeStamp time={room.value.created_at} />
