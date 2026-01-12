interface Metadata {
    socket: WebSocket;
    playerId?: string;
    roomId?: string;
    connectedAt: number;
    lastPing: number;
}

export class Registry {
    private bySocketId = new Map<string, Metadata>();

    // Indexes for fast lookups
    private byPlayerId = new Map<string, string>();      // playerId → socketId
    private byRoomId = new Map<string, Set<string>>();   // roomId → Set<socketId>

    add(socketId: string, socket: WebSocket) {
        this.bySocketId.set(socketId, {
            socket,
            connectedAt: Date.now(),
            lastPing: Date.now(),
        });
    }

    remove(socketId: string) {
        const conn = this.bySocketId.get(socketId);
        if (!conn) return;

        // Clean up indexes
        if (conn.playerId) {
            this.byPlayerId.delete(conn.playerId);
        }
        if (conn.roomId) {
            this.byRoomId.get(conn.roomId)?.delete(socketId);
        }

        this.bySocketId.delete(socketId);
    }

    setPlayer(socketId: string, playerId: string) {
        const conn = this.bySocketId.get(socketId);
        if (!conn) return;

        conn.playerId = playerId;
        this.byPlayerId.set(playerId, socketId);
    }

    setRoom(socketId: string, roomId: string) {
        const conn = this.bySocketId.get(socketId);
        if (!conn) return;

        // Remove from old room index
        if (conn.roomId) {
            this.byRoomId.get(conn.roomId)?.delete(socketId);
        }

        // Add to new room index
        conn.roomId = roomId;
        if (!this.byRoomId.has(roomId)) {
            this.byRoomId.set(roomId, new Set());
        }
        this.byRoomId.get(roomId)!.add(socketId);
    }

    // Lookups
    getBySocketId(socketId: string): Metadata | undefined {
        return this.bySocketId.get(socketId);
    }

    getByPlayerId(playerId: string): Metadata | undefined {
        const socketId = this.byPlayerId.get(playerId);
        return socketId ? this.bySocketId.get(socketId) : undefined;
    }

    getSocketsInRoom(roomId: string): Metadata [] {
        const socketIds = this.byRoomId.get(roomId);
        if (!socketIds) return [];

        return [...socketIds]
            .map(id => this.bySocketId.get(id))
            .filter((c): c is Metadata => c !== undefined);
    }

    // Utilities
    all(): IterableIterator<Metadata> {
        return this.bySocketId.values();
    }

    size(): number {
        return this.bySocketId.size;
    }
}