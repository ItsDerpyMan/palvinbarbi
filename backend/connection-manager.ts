import {Registry} from "./Registry.ts";
import { eventBus } from "./event-bus.ts";
import { logger } from "./server/logger.ts";

interface Metadata {
    socket: WebSocket;
    playerId?: string;
    roomId?: string;
    connectedAt: number;
    lastPing: number;
}
interface Connection {
    reg: Registry
    HandlesAnonymConnection(socket: WebSocket): void;
    handlesReconnection(socket: WebSocket, socketId: string, roomId: string, playerId: string, username: string): void;
    handlesNewConnection(socket: WebSocket, roomId: string, playerId: string, username: string): void;
    getRegistry(): Registry;
}

class ConnectionManager implements Connection {
    reg = new Registry();

    handlesAnonymConnection(socket: WebSocket): void {
        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            logger.ws.info(`Received message from anon:`, msg);
            eventBus.publish("socket:message", {
                socketId: undefined,
                channel: msg.channel,
                event: msg.event,
                payload: msg.payload,
            });
        }
    }
    handlesReconnection(socket: WebSocket, socketId: string, roomId: string, playerId: string, username: string): void {
        this.reg.add(socketId, socket);
        const registry = connectionManager.getRegistry();
        const conn = registry.getBySocketId(socketId);
        if (!conn) {
            logger.room.error(`No connection found for socketId ${socketId}`);
            return;
        }
        registry.setRoom(socketId, roomId);
        registry.setPlayer(socketId, playerId);

        eventBus.publish("socket:reconnect", { socketId, roomId, playerId, username});

        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            logger.ws.info(`Received message from ${socketId}:`, msg);
            eventBus.publish("socket:message", {
                socketId,
                channel: msg.channel,
                event: msg.event,
                payload: msg.payload,
            });
    };
        socket.onclose = () => {
            eventBus.publish("socket:disconnected", {
                socketId,
                playerId: conn?.playerId,
                roomId: conn?.roomId,
            });

            this.reg.remove(socketId);
        };
    }
    handlesNewConnection(socket: WebSocket, roomId: string, playerId: string, username: string): void {
        const socketId: string = crypto.randomUUID();

        this.reg.add(socketId, socket);

        const registry = connectionManager.getRegistry();
        const conn = registry.getBySocketId(socketId);
        if (!conn) {
            logger.room.error(`No connection found for socketId ${socketId}`);
            return;
        }

        registry.setPlayer(socketId, playerId);
        registry.setRoom(socketId, roomId);

        eventBus.publish("socket:connected", { socketId, roomId, playerId, username });

        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            logger.ws.info(`Received message from ${socketId}:`, msg);
            eventBus.publish("socket:message", {
                socketId,
                channel: msg.channel,
                event: msg.event,
                payload: msg.payload,
            });
        };
        socket.onclose = () => {
            const conn = this.reg.getBySocketId(socketId);

            eventBus.publish("socket:disconnected", {
                socketId,
                playerId: conn?.playerId,
                roomId: conn?.roomId,
            });

            this.reg.remove(socketId);
        };

    }

    getRegistry(): Registry {
        return this.reg;
    }
}

export const connectionManager = new ConnectionManager();