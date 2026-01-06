import { useEffect, useMemo } from "preact/hooks";
import { QuizControllerLogic } from "./QuizController.class.ts";

export function useQuizController(roomId: string, playerId: string, username: string) {
    // Create controller lazily only on client side
    const controller = useMemo(() => {
        // During SSR, return null
        if (typeof window === "undefined") {
            return null;
        }

        console.log("useQuizController - creating controller");
        // Connect to standalone WebSocket server on port 8000
        const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
        const url = `${wsProtocol}//${location.hostname}:8000/api`;
        console.log("WebSocket URL:", url);

        return new QuizControllerLogic(url, roomId, playerId, username);
    }, [roomId, playerId, username]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            controller?.destroy();
        };
    }, [controller]);

    return controller;
}