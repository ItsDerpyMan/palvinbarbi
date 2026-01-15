// room-manager.ts
import {eventBus} from "./event-bus.ts";
import {connectionManager} from "./connection-manager.ts";
import {Player, Status} from "./player.ts";
import {Room} from "./room.ts";
import {Phase} from "./scheduler.ts";
import {database} from "../handlers/utils/database/database.ts";
import {logger} from "./server/logger.ts";

class RoomManager {
    private rooms = new Map<string, Room>();

    constructor() {
        eventBus.subscribe("socket:message", (data) => this.handleMessage(data));
        eventBus.subscribe("socket:disconnected", (data) => this.handleDisconnect(data));
        eventBus.subscribe("socket:connected", ({ socketId, ...data}) => this.handleConnection(socketId, data));
        eventBus.subscribe("socket:reconnect", (data) => this.handleReconnect(data))
    }

    private handleMessage({ socketId, channel, event, payload }: {
        socketId?: string;
        channel: string;
        event: string;
        payload: unknown;
    }) {
        if (channel.startsWith("room:") && event === "start") {
            const roomId = channel.split(":")[1];
            const data = payload as { duration?: number };
            this.handleStartRound(roomId, data.duration);
        }

        if (channel.startsWith("room:") && event === "respond") {
            const roomId = channel.split(":")[1];
            const data = payload as { answer: boolean };
            if (socketId) this.handleAnswer(roomId, socketId, data.answer);
            else logger.ws.error("No socket id found. event: ", event);
        }
    }
    private handleReconnect({ roomId, playerId, username }: { roomId: string; playerId: string; username: string; }) {
        let room = this.rooms.get(roomId);
        if (!room) {
            logger.room.info(`Creating room ${roomId}`);
            room = Room.create(roomId);
            this.rooms.set(roomId, room);
        }

        room.broadcast('client:reconnect', { playerId, username })
    }
    private async handleDisconnect({ socketId: _socketId, roomId, playerId }: {
        socketId: string;
        roomId?: string;
        playerId?: string;
    }) {
        if (roomId && playerId) {
            const room = this.rooms.get(roomId);
            if (room) {
                const hasStarted = room.getSchedulePhase() > Phase.countdown
                if (!hasStarted) {
                    room.removePlayer(playerId!);

                    try {
                       const { data: deletedCount, error } = await database().rpc("delete_room_membership_for_user", {
                           p_user_id: playerId,
                           p_room_id: roomId,
                       });

                        if (error) throw new Error(`Failed to delete room_membership for ${playerId}:`, error);
                        if (deletedCount <= 0) throw "No room membership found.";

                    } catch (err) {
                        logger.room.error('Error deleting player room_membership:', err);
                    }
                } else {
                    const p = room.getPlayerById(playerId);
                    if (!p) logger.room.error(`HandleDisconnect: player not found, id: ${playerId}`);
                    else p.status = Status.offline;
                }
                // Clean up empty rooms
                if (room.isEmpty()) {
                    this.rooms.delete(roomId);
                    logger.room.info(`Room ${roomId} removed (empty)`);
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

    private handleConnection(socketId: string, { roomId, playerId, username }: { roomId: string; playerId: string; username: string; }) {
        logger.room.info(`Player ${username} (${playerId}) joining room ${roomId}`);

        let room = this.rooms.get(roomId);
        if (!room) {
            logger.room.info(`Creating room ${roomId}`);
            room = Room.create(roomId);
            this.rooms.set(roomId, room);
        }

        // Add player to room
        room.addPlayer(Player.create(socketId, playerId, username));

        // Broadcast to room
        room.broadcast("client:connected", { playerId, username });
    }


    getRooms(): Map<string, Room> {
        return this.rooms;
    }
}

export const roomManager = new RoomManager();