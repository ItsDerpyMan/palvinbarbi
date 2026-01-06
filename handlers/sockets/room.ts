// room.ts
import { Player } from "./player.ts";
import {ScheduleConfig, Scheduler} from "./scheduler.ts";

export interface RoomConfig extends ScheduleConfig {
    minPlayers: number;
    maxRounds: number;
    autoStart: boolean;
}
export class Room {
    private id: string;
    private players: Player[];
    private scheduler: Scheduler;
    private config: RoomConfig = {
        minPlayers: 2,
        maxRounds: 5,
        autoStart: true,
        outroDuration: 1500,
        revealDuration: 5000,
        introDuration: 1500,
        countdownDuration: 10000,
        roundDuration: 30000,
    };

    private constructor(id: string, config?: RoomConfig) {
        this.id = id;
        this.players = [];
        if (config) this.config = config;

        this.scheduler = new Scheduler(
            this,
            this.config,
            (event, payload) => this.broadcast(event, payload)
        );
        this.scheduler.start();
    }

    static create(id: string, config?: Partial<RoomConfig>): Room {
        return new Room(id, config as RoomConfig);
    }

    // Player management stays here
    addPlayer(player: Player): void {
        const exists = this.players.find(p => p.id === player.id);
        if (!exists) {
            this.players.push(player);
            console.log(`Player ${player.username} joined room ${this.id}`);

            // Let scheduler decide what to do
            this.scheduler.onPlayerJoined(this.players.length);
        }
    }

    removePlayer(playerId: string | null): void {
        if (!playerId) return;
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
            this.scheduler.onPlayerLeft(this.players.length);
        }
    }

    // Delegate to scheduler
    startRound(duration?: number): void {
        this.scheduler.startGame();
    }

    submitRoundAnswer(playerId: string, pick: boolean): boolean {
        const success = this.scheduler.submitAnswer(playerId, pick);

        if (success) {
            this.scheduler.checkEarlyEnd(this.players.length);
        }

        return success;
    }

    // Room keeps broadcast, getters, etc.
    broadcast(event: string, payload: unknown): void {
        const message = JSON.stringify({
            type: event,
            payload,
        });

        console.log(`[Server] Broadcasting to room ${this.id}:`, { event, payload, playerCount: this.players.length });
        for (const player of this.players) {
            if (player.socket.readyState === WebSocket.OPEN) {
                player.socket.send(message);
            }
        }
    }
    getPlayerCount(): number { return this.players.length; }
    getPlayers(): Player[] { return [...this.players]; }
    isEmpty(): boolean { return this.players.length === 0; }
}