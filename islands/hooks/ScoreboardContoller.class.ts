import { signal } from "@preact/signals";
import {ConnectionConfig} from "../../backend/client-connection-manager.ts";
import {Controller} from "./Controller.interface.ts";
import { Player } from "../../backend/player.ts";

export class ScoreboardControllerLogic extends Controller {
    readonly count = signal<number>(0);
    readonly totalplayers = signal<number>(0);
    readonly players = signal<Player[]>([]);

    private playerId: string;
    private username: string;

    constructor(config: ConnectionConfig) {
        super(config);
        this.playerId = config.playerId;
        this.username = config.username;
    }
    subscribeToEvents(): void {
        this.subscribe("client:room-stats", ({ players, playerCount, totalPlayers}) => {
            this.count.value = playerCount;
            this.totalplayers.value = totalPlayers;
            this.players.value = players;
        });
    }
}