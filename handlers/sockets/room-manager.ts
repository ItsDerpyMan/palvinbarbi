// room-manager.ts
import { eventBus } from "./event-bus.ts";
import { connectionManager } from "./connection-manager.ts";
import {database} from "../../utils/database/database.client.ts";

class Player {
    id: string;
    username: string;
    created_at: number;
    score: number;
    socket: WebSocket;

    private constructor(id: string, username: string, created_at: number, score: number, socket: WebSocket) {
        this.id = id;
        this.username = username;
        this.created_at = created_at;
        this.score = score;
        this.socket = socket;
    }
    static async fromDatabase(socketId: string, playerId: string): Promise<Player> {
        const { data, error } = await database()
            .from("users")
            .select("id, username, created_at")
            .eq("id", playerId).single();

        if ( error || !data ) {
            throw new Error("Failed to initialize player information:", error);
        }
        if(!data.username) data.username = "Unnamed";
        const reg = connectionManager.getRegistry()
        const conn = reg.getBySocketId(socketId);
        if (!conn) throw new Error(`No connection available for socketId: ${socketId}`);

        return new Player(
            data.id,
            data.username,
            new Date(data.created_at).getTime(),
            0,
            conn.socket,
        )
    }

    static create(socketId: string, playerId: string, username: string) {
        const reg = connectionManager.getRegistry()
        const conn = reg.getBySocketId(socketId);
        if (!conn) throw new Error(`No connection available for socketId: ${socketId}`);

        return new Player(playerId, username, Date.now(), 0, conn.socket);
    }

    addScore(delta: number) {
        this.score += delta;
    }
}

interface Submission {
    playerId: string;
    pick: boolean;
    submittedAt: number;
}

class Round {
    id: string;
    startedAt: number;
    duration: number;
    private picks: Map<string, Submission> = new Map();
    private timerId: number | null = null;
    ended = false;

    constructor(duration: number = 30000) {
        this.id = crypto.randomUUID();
        this.startedAt = Date.now();
        this.duration = duration;
    }

    submitAnswer(playerId: string, pick: boolean): boolean {
        if (this.ended) {
            return false;
        }

        if (this.picks.has(playerId)) {
            return false;
        }

        this.picks.set(playerId, {
            playerId,
            pick,
            submittedAt: Date.now(),
        });

        return true;
    }

    calculateScores(): { playerId: string; pick: boolean; score: number; correct: boolean }[] {
        const submissionsA: Submission[] = [];
        const submissionsB: Submission[] = [];

        for (const submission of this.picks.values()) {
            if (submission.pick) {
                submissionsA.push(submission);
            } else {
                submissionsB.push(submission);
            }
        }

        const countA = submissionsA.length;
        const countB = submissionsB.length;
        const basePoints = 100;
        const speedBonus = 50;
        const results: { playerId: string; pick: boolean; score: number; correct: boolean }[] = [];

        // Tie: everyone gets base points
        if (countA === countB) {
            for (const submission of submissionsA) {
                results.push({
                    playerId: submission.playerId,
                    pick: submission.pick,
                    score: basePoints,
                    correct: true,
                });
            }
            for (const submission of submissionsB) {
                results.push({
                    playerId: submission.playerId,
                    pick: submission.pick,
                    score: basePoints,
                    correct: true,
                });
            }
            return results;
        }

        // Determine majority and minority
        const majoritySubmissions = countA > countB ? submissionsA : submissionsB;
        const minoritySubmissions = countA > countB ? submissionsB : submissionsA;

        // Sort majority by submission time
        majoritySubmissions.sort((a, b) => a.submittedAt - b.submittedAt);

        // Calculate scores for majority (base + speed bonus)
        for (let i = 0; i < majoritySubmissions.length; i++) {
            const percentile = 1 - (i / majoritySubmissions.length);
            const score = basePoints + Math.floor(speedBonus * percentile);

            results.push({
                playerId: majoritySubmissions[i].playerId,
                pick: majoritySubmissions[i].pick,
                score,
                correct: true,
            });
        }

        // Minority gets 0 points
        for (const submission of minoritySubmissions) {
            results.push({
                playerId: submission.playerId,
                pick: submission.pick,
                score: 0,
                correct: false,
            });
        }

        return results;
    }

    setTimer(callback: () => void): void {
        this.timerId = setTimeout(callback, this.duration);
    }

    clearTimer(): void {
        if (this.timerId !== null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    end(): void {
        this.ended = true;
        this.clearTimer();
    }

    getAnswerCount(): number {
        return this.picks.size;
    }
}

class Room {
    id: string;
    name: string;
    players: Player[] = []; // additional row
    created_at: number;
    join_code: string;
    currentRound: Round | null = null;
    round: number = 0;

    private constructor(id: string, name: string, createdAt: number, joinCode: string) {
        this.id = id;
        this.name = name;
        this.created_at = createdAt;
        this.join_code = joinCode;
    }

    static async fromDatabase(roomId: string): Promise<Room> {
        const { data, error } = await database()
            .from("rooms")
            .select("id, name, created_at, join_code")
            .eq("id", roomId)
            .single();

        if (error || !data) {
            throw new Error(`Failed to load room ${roomId}: ${error?.message}`);
        }

        return new Room(
            data.id,
            data.name,
            new Date(data.created_at).getTime(),
            data.join_code
        );
    }

    static create(id: string, name: string, joinCode: string): Room {
        return new Room(id, name, Date.now(), joinCode);
    }

    addPlayer(player: Player): void {
        const exists = this.players.find(p => p.id === player.id);
        if (!exists) {
            this.players.push(player);
            console.log(`Player ${player.username} joined room ${this.id}`);
        }
    }

    removePlayer(playerId: string | null): void {
        if (!playerId) return;

        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            const player = this.players[index];
            this.players.splice(index, 1);
            console.log(`Player ${player.username} left room ${this.id}`);
        }
    }

    handlePlayerDisconnect(playerId: string | null): void {
        this.removePlayer(playerId);
        // Broadcast to remaining players
        this.broadcast("client:disconnected", { playerId });
    }

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

    async startRound(duration: number = 30000): Promise<void> {
        if (this.currentRound && !this.currentRound.ended) {
            this.currentRound.end();
        }

        this.currentRound = new Round(duration);
        this.round++;

        this.currentRound.setTimer(() => {
            this.endRound();
        });

        await eventBus.publish("round:started", {
            roomId: this.id,
            roundId: this.currentRound.id,
            duration,
        });

        const data = await this.getPrompt(this.currentRound.id);

        this.broadcast("client:round-started", {
            roundId: this.currentRound.id,
            round: this.round,
            duration,
            data,
        });

        console.log(`Round ${this.currentRound.id} started in room ${this.id}`);
    }

    private async getPrompt(roundId: string): Promise<{ prompt: string; l_index: number; r_index: number }> {
        const { count, error: countError } = await database()
            .from("prompts")
            .select("*", { count: "exact", head: true });

        if (countError || count === null || count === 0) {
            throw new Error(`Failed to get prompt count: ${countError?.message || "No prompts available"}`);
        }

        const seed = parseInt(roundId.substring(0, 8), 16);
        const index = seed % count;

        const { data, error } = await database()
            .from("prompts")
            .select("prompt, l_index, r_index")
            .range(index, index)
            .single();

        if (error || !data) {
            throw new Error(`Failed to fetch prompt: ${error?.message}`);
        }

        return {
            prompt: data.prompt,
            l_index: data.l_index,
            r_index: data.r_index,
        };
    }

    endRound(): void {
        if (!this.currentRound || this.currentRound.ended) {
            return;
        }

        this.currentRound.end();

        const results = this.currentRound.calculateScores();

        for (const result of results) {
            const player = this.players.find(p => p.id === result.playerId);
            if (player) {
                player.addScore(result.score);
            }
        }

        eventBus.publish("round:ended", {
            roomId: this.id,
            roundId: this.currentRound.id,
            results,
        });

        // Signal round has ended
        this.broadcast("client:round-end", {
            roundId: this.currentRound.id,
            round: this.round,
        });

        // Send detailed statistics
        this.broadcast("client:round-stats", {
            roundId: this.currentRound.id,
            round: this.round,
            results: results.map(r => ({
                playerId: r.playerId,
                pick: r.pick,
                correct: r.correct,
                score: r.score,
                totalScore: this.players.find(p => p.id === r.playerId)?.score || 0,
            })),
        });

        console.log(`Round ${this.currentRound.id} ended in room ${this.id}`);
    }
    getPlayerCount(): number {
        return this.players.length;
    }
    getPlayers(): Player[] {
        return [...this.players];
    }

    submitRoundAnswer(playerId: string, pick: boolean): boolean {
        if (!this.currentRound || this.currentRound.ended) {
            return false;
        }

        const success = this.currentRound.submitAnswer(playerId, pick);

        if (success) {
            eventBus.publish("round:submit", {
                roomId: this.id,
                roundId: this.currentRound.id,
                playerId,
            });

            this.broadcast("client:submit-state", {
                playerId,
                round: this.round,
                answerCount: this.currentRound.getAnswerCount(),
                totalPlayers: this.getPlayerCount(),
            });
        }

        return success;
    }

    isEmpty(): boolean {
        return this.players.length === 0;
    }
}
class RoomManager {
    private rooms = new Map<string, Room>();

    constructor() {
        // Room Manager subscribes to events it cares about
        eventBus.subscribe("socket:message", (data) => this.handleMessage(data));
        eventBus.subscribe("socket:disconnected", (data) => this.handleDisconnect(data));
    }

    private handleMessage({ socketId, channel, event, payload }: {
        socketId: string;
        channel: string;
        event: string;
        payload: unknown;
    }) {
        if (channel === "room" && event === "join") {
            const data = payload as { roomId: string; playerId: string; username: string; };
            this.joinRoom(socketId, data.roomId, data.playerId, data.username);
        }

        if (channel.startsWith("room:") && event === "start") {
            const roomId = channel.split(":")[1];
            const data = payload as { duration?: number };
            this.handleStartRound(roomId, data.duration);
        }

        if (channel.startsWith("room:") && event === "respond") {
            const roomId = channel.split(":")[1];
            const data = payload as { answer: boolean };
            this.handleAnswer(roomId, socketId, data.answer);
        }
    }

    private handleDisconnect({ socketId: _socketId, roomId, playerId }: {
        socketId: string;
        roomId: string | null;
        playerId: string | null;
    }) {
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                room.handlePlayerDisconnect(playerId);

                // Clean up empty rooms
                if (room.isEmpty()) {
                    this.rooms.delete(roomId);
                    console.log(`Room ${roomId} removed (empty)`);
                }
            }
        }
    }

    private handleStartRound(roomId: string, duration?: number): void {
        const room = this.rooms.get(roomId);
        if (room) {
            room.startRound(duration);
        }
    }

    private handleAnswer(roomId: string, socketId: string, answer: boolean): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const registry = connectionManager.getRegistry();
        const conn = registry.getBySocketId(socketId);
        if (!conn || !conn.playerId) return;

        room.submitRoundAnswer(conn.playerId, answer);
    }

    private async joinRoom(socketId: string, roomId: string, playerId: string, username: string) {
        console.log(`[Server] Player ${username} (${playerId}) joining room ${roomId}`);

        const registry = connectionManager.getRegistry();
        const conn = registry.getBySocketId(socketId);
        if (!conn) {
            console.error(`[Server] No connection found for socketId ${socketId}`);
            return;
        }

        // Update connection metadata
        registry.setPlayer(socketId, playerId);
        registry.setRoom(socketId, roomId);

        let room = this.rooms.get(roomId);
        if (!room) {
            try {
                console.log(`[Server] Loading room ${roomId} from database`);
                room = await Room.fromDatabase(roomId);
                this.rooms.set(roomId, room);
            } catch (error) {
                console.error(`Failed to load room ${roomId}:`, error);
                return;
            }
        }

        // Add player to room
        room.addPlayer(Player.create(socketId, playerId, username));

        // Broadcast to room
        room.broadcast("client:connected", { playerId, username });
    }
}

export const roomManager = new RoomManager();