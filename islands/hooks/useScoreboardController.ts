import { useEffect, useMemo } from "preact/hooks";
import {ScoreboardControllerLogic} from "./ScoreboardContoller.class.ts";

export function useScoreboardController(playerId: string, username: string) {
    const controller = useMemo(() => {
        if ( typeof window === "undefined" ) {
            return null;
        }

        const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
        const url = `${wsProtocol}//${location.host}/api`;

        return new ScoreboardControllerLogic(url, playerId, username);
    }, [playerId, username]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            controller?.destroy();
        };
    }, [controller]);

    return controller;
}