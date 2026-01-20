import { useScoreboardController } from "./hooks/useScoreboardController.ts";
import { computed, ReadonlySignal } from "@preact/signals";

export interface ScoreBoardProps {
    roomId: string;
    playerId: string;
    username: string;
}
export default function ScoreBoard({ roomId, playerId, username}: ScoreBoardProps) {
    const controller = useScoreboardController(roomId, playerId, username);

    const scoreboard: ReadonlySignal<{ username: string, score: number}[]> = computed(() => {
        if(!controller?.players.value) return Array.from({ length: controller?.totalplayers.value ?? 20}, () => {
            username: 'undefined';
            score: -1
        });
        return controller.players.value
            .sort((a, b) => b.score - a.score) // Descending (highest first)
            .map(({ username, score }) => ({ username, score }));
    })
}