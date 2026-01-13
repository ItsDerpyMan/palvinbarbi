// player.ts
import { connectionManager } from "./connection-manager.ts";
import { database } from "../handlers/utils/database/database.ts";

export enum Status {
    online,
    offline,
}
export class Player {
    id: string;
    username: string;
    created_at: number;
    score: number;
    status: Status;
    socket: WebSocket;

    private constructor(id: string, username: string, created_at: number, score: number, status: Status, socket: WebSocket) {
        this.id = id;
        this.username = username;
        this.created_at = created_at;
        this.score = score;
        this.status = status
        this.socket = socket;
    }

    static async fromDatabase(socketId: string, playerId: string): Promise<Player> {
        const { data, error } = await database()
            .from("users")
            .select("id, username, created_at")
            .eq("id", playerId).single();

        if (error || !data) {
            throw new Error("Failed to initialize player information:", error);
        }
        if (!data.username) data.username = "Unnamed";
        const reg = connectionManager.getRegistry();
        const conn = reg.getBySocketId(socketId);
        if (!conn) throw new Error(`No connection available for socketId: ${socketId}`);

        return new Player(
            data.id,
            data.username,
            new Date(data.created_at).getTime(),
            0,
            Status.online,
            conn.socket,
        );
    }

    static create(socketId: string, playerId: string, username: string) {
        const reg = connectionManager.getRegistry();
        const conn = reg.getBySocketId(socketId);
        if (!conn) throw new Error(`No connection available for socketId: ${socketId}`);

        return new Player(playerId, username, Date.now(), 0, Status.online, conn.socket);
    }

    addScore(delta: number) {
        this.score += delta;
    }
}