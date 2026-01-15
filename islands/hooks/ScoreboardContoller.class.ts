import { signal } from "@preact/signals";
import {clientConnectionManager} from "../../backend/client-connection-manager.ts";

export class ScoreboardControllerLogic {
    readonly count = signal<number>(0);
    readonly totalplayers = signal<number>(0);

    private playerId: string;
    private username: string;

    constructor(url: string, player: string, username: string) {
        this.playerId = player;
        this.username = username;

        clientConnectionManager.anonymConnect(
            url,
            player,
            username,
        );
    }
    destory(): void {

    }
}