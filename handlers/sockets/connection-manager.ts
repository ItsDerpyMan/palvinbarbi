import {Registry} from "./Registry.ts";
import { eventBus } from "./event-bus.ts";

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

    handlesNewConnection(socket: WebSocket): void {
        const socketId: string = crypto.randomUUID();

        this.reg.add(socketId, socket);

        eventBus.publish("socket:connected", { socketId });

        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            console.log(`[Server] Received message from ${socketId}:`, msg);
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