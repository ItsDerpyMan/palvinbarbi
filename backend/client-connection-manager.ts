import { clientEventBus } from "./event-bus.ts";

const STORAGE_KEY = "ws_session";

interface StoredSession {
    socketId: string;
    roomId: string;
    playerId: string;
    username: string;
}

export interface ConnectionConfig {
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
    private socketId: string | null = null;

    // localStorage helpers
    private saveSession(session: StoredSession): void {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
            console.log("[ClientWS] Session saved to localStorage:", session);
        } catch (e) {
            console.warn("[ClientWS] Failed to save session:", e);
        }
    }

    private loadSession(): StoredSession | null {
        try {
            const data = sessionStorage.getItem(STORAGE_KEY);
            if (data) {
                const session = JSON.parse(data) as StoredSession;
                console.log("[ClientWS] Session loaded from localStorage:", session);
                return session;
            }
        } catch (e) {
            console.warn("[ClientWS] Failed to load session:", e);
        }
        return null;
    }

    private clearSession(): void {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
            console.log("[ClientWS] Session cleared from localStorage");
        } catch (e) {
            console.warn("[ClientWS] Failed to clear session:", e);
        }
    }

    anonymConnect(config: ConnectionConfig): void {
        const session = this.loadSession();

        const url = new URL(config.url);
        if (session) {
            url.searchParams.set("socketId", session!.socketId);
            url.searchParams.append("room", config.roomId);
            url.searchParams.append("user", config.playerId);
            url.searchParams.append("username", config.username);
            console.log("[ClientWS] Reconnecting with stored socketId:", session!.socketId);
        }

        console.log("[ClientWS] Attempting to connect to:", url);
        console.log("[ClientWS] Config:", { roomId: config.roomId, playerId: config.playerId, username: config.username });

        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log("[ClientWS] ✅ Connected successfully!");
            this.reconnectAttempts = 0;

            clientEventBus.publish("local:connected", {});
        };

        this.socket.onmessage = (e) => {
            console.log("[ClientWS] Message received:", e.data);
            const msg = JSON.parse(e.data);

            // Handle socket:assigned message - store the socketId
            if (msg.type === "socket:assigned" && msg.payload?.socketId) {
                const assignedSocketId = msg.payload.socketId as string;
                this.socketId = assignedSocketId;
                console.log("[ClientWS] Received socketId:", this.socketId);

                // Save session to localStorage
                this.saveSession({
                    socketId: assignedSocketId,
                    roomId: config.roomId,
                    playerId: config.playerId,
                    username: config.username,
                });
            }

            clientEventBus.publish(msg.type, msg.payload);
        };

        this.socket.onclose = (e) => {
            console.log("[ClientWS] ❌ Disconnected - Code:", e.code, "Reason:", e.reason, "Clean:", e.wasClean);
            clientEventBus.publish("local:disconnected", {});

            // Don't clear session on disconnect - we want to reconnect
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
            clientEventBus.publish("local:error", { error: e });
        };
    }
    connect(config: ConnectionConfig): void {
        this.config = config;

        // Check for existing session
        const storedSession = this.loadSession();
        const isReconnect = storedSession &&
            storedSession.roomId === config.roomId &&
            storedSession.playerId === config.playerId;

        // Build URL with socketId if reconnecting
        const url = new URL(config.url);
        if (isReconnect && storedSession.socketId) {
            url.searchParams.set("socketId", storedSession.socketId);
            url.searchParams.append("room", config.roomId);
            url.searchParams.append("user", config.playerId);
            url.searchParams.append("username", config.username);
            console.log("[ClientWS] Reconnecting with stored socketId:", storedSession.socketId);
        }

        console.log("[ClientWS] Attempting to connect to:", url);
        console.log("[ClientWS] Config:", { roomId: config.roomId, playerId: config.playerId, username: config.username });

        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log("[ClientWS] ✅ Connected successfully!");
            this.reconnectAttempts = 0;

            // Send join or reconnect event
            const event = isReconnect ? "reconnect" : "join";
            this.socket!.send(JSON.stringify({
                channel: "room",
                event,
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

            // Handle socket:assigned message - store the socketId
            if (msg.type === "socket:assigned" && msg.payload?.socketId) {
                const assignedSocketId = msg.payload.socketId as string;
                this.socketId = assignedSocketId;
                console.log("[ClientWS] Received socketId:", this.socketId);

                // Save session to localStorage
                this.saveSession({
                    socketId: assignedSocketId,
                    roomId: config.roomId,
                    playerId: config.playerId,
                    username: config.username,
                });
            }

            clientEventBus.publish(msg.type, msg.payload);
        };

        this.socket.onclose = (e) => {
            console.log("[ClientWS] ❌ Disconnected - Code:", e.code, "Reason:", e.reason, "Clean:", e.wasClean);
            clientEventBus.publish("local:disconnected", {});

            // Don't clear session on disconnect - we want to reconnect
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
        console.log("[ClientWS] Disconnected");
        if (this.socket) {
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
            this.socket.close();
            this.socket = null;
            this.config = null;
            this.socketId = null;
            this.clearSession();
        }
    }

    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    getState(): number {
        return this.socket?.readyState ?? WebSocket.CLOSED;
    }

    getSocketId(): string | null {
        return this.socketId;
    }
}

export const clientConnectionManager = new ClientConnectionManager();
