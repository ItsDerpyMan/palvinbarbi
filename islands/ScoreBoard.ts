import { useScoreboardController } from "./hooks/useScoreboardController.ts";

export interface ScoreBoardProps {
    playerId: string;
    username: string;
}
export default function ScoreBoard({ playerId, username}: ScoreBoardProps) {
    const scoreBoardController = useScoreboardController(playerId, username);
}