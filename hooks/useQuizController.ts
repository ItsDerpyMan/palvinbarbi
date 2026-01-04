import { useState, useEffect } from "preact/hooks";
import { QuizControllerLogic } from "./QuizController.class.ts";

export function useQuizController(roomId: string, playerId: string, username: string) {
    const [controller, setController] = useState<QuizControllerLogic | null>(null);

    useEffect(() => {
        // Create controller with URL on client side only
        const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
        const url = `${wsProtocol}//${location.hostname}:${location.port}/ws`;
        const newController = new QuizControllerLogic(roomId, playerId, username, url);
        setController(newController);

        return () => {
            newController.destroy();
            setController(null);
        };
    }, [roomId, playerId, username]);

    return controller;
}