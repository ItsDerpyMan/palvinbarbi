import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { database } from "../utils/database/database.client.ts";
import Box from "../components/Box.tsx";
import Controller from "./QuizController.tsx";

export enum State {
    initializing,
    waiting,
    playing
}

interface GameIslandProps {
    roomId: string;
    userId: string;
    username: string;
}

export default function GameIsland({ roomId, userId, username }: GameIslandProps) {
    const status = useSignal<State>(State.initializing);
    useEffect(() => {
        const channel = database().channel(`room-${roomId}`);

        channel
            .subscribe(async (channelStatus) => {
                if (channelStatus === 'SUBSCRIBED') {
                    console.log(`[GameIsland] Subscribed to room-${roomId}`);

                    // Track presence
                    await channel.track({
                        user_id: userId,
                        username: username,
                        online_at: new Date().toISOString(),
                    });

                    status.value = State.waiting;
                }
            });

        return () => {
            channel.untrack();
            channel.unsubscribe();
        };
    }, [roomId, userId, username]);

    return (
        <div class="flex flex-col gap-6">
            <div class="flex gap-4 justify-center items-center">
                <Controller>
                    <Box text={leftQuestion} />
                    <Box text={rightQuestion} />
                </Controller>
            </div>

            <div class="text-center text-gray-500">
                Status: {State[status.value]}
            </div>
        </div>
    );
}