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
    handlesNewConnection(socket: WebSocket): void;
    getRegistry(): Registry;
}

class ConnectionManager implements Connection {
    reg = new Registry();

    handlesReconnection(socket: WebSocket, socketId: string): void {
        this.reg.add(socketId, socket);

        eventBus.publish("socket:reconnect", { socketId });

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
    handlesNewConnection(socket: WebSocket): void {
        const socketId: string = crypto.randomUUID();

        this.reg.add(socketId, socket);

        // Send socketId to client so it can store it for reconnection
        socket.send(JSON.stringify({
            type: "socket:assigned",
            payload: { socketId }
        }));

        eventBus.publish("socket:connected", { socketId });

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