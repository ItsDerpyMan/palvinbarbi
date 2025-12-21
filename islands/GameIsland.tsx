import { useSignal, Signal } from "@preact/signals";
import {State} from "../routes/(app)/room/[id].tsx";

interface GameIslandProps {
    roomId: string;
    status: Signal<State>;
}

export default function GameIsland({ roomId, status }: GameIslandProps) {
    // Check for valid connection
    // on success -> initialze page

    // INIT
    // 1. track presence
    // 2.

}