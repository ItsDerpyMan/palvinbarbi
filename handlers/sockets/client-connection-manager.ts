import { clientEventBus } from "./event-bus.ts";

interface ConnectionConfig {
    url: string;
    roomId: string;
    playerId: string;
    username: string;
}

class ClientConnectionManager {
    private socket: WebSocket | null = null;
    private config: ConnectionConfig | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private readonly reconnectDelay = 1000;

    connect(config: ConnectionConfig) {
        this.config = config;
        console.log("[ClientWS] Attempting to connect to:", config.url);
        console.log("[ClientWS] Config:", { roomId: config.roomId, playerId: config.playerId, username: config.username });

        this.socket = new WebSocket(config.url);

        this.socket.onopen = () => {
            console.log("[ClientWS] ✅ Connected successfully!");
            console.log("[ClientWS] ReadyState:", this.socket!.readyState);
            this.reconnectAttempts = 0;

            this.socket!.send(JSON.stringify({
                channel: "room",
                event: "join",
                payload: {
                    roomId: config.roomId,
                    playerId: config.playerId,
                    username: config.username,
                },
            }));

            clientEventBus.publish("local:connected", {});
        };

        this.socket.onmessage = (e) => {
            console.log("[ClientWS] Message received:", e.data);
            const msg = JSON.parse(e.data);
            clientEventBus.publish(msg.type, msg.payload);
        };

        this.socket.onclose = (e) => {
            console.log("[ClientWS] ❌ Disconnected - Code:", e.code, "Reason:", e.reason, "Clean:", e.wasClean);
            clientEventBus.publish("local:disconnected", {});

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`[ClientWS] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                setTimeout(() => {
                    if (this.config) {
                        this.connect(this.config);
                    }
                }, this.reconnectDelay * this.reconnectAttempts);
            } else {
                console.error("[ClientWS] Max reconnection attempts reached");
                clientEventBus.publish("local:reconnect-failed", {});
            }
        };

        this.socket.onerror = (e) => {
            console.error("[ClientWS] ⚠️ WebSocket error event fired");
            console.error("[ClientWS] Error details:", e);
            console.error("[ClientWS] ReadyState at error:", this.socket?.readyState);
            clientEventBus.publish("local:error", { error: e });
        };
    }

    send(channel: string, event: string, payload: unknown) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn("[ClientWS] Cannot send - socket not open");
            return;
        }

        this.socket.send(JSON.stringify({ channel, event, payload }));
    }

    disconnect() {
        if (this.socket) {
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
            this.socket.close();
            this.socket = null;
            this.config = null;
        }
    }

    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    getState(): number {
        return this.socket?.readyState ?? WebSocket.CLOSED;
    }
}

export const clientConnectionManager = new ClientConnectionManager();