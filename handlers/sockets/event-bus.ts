// event-bus.ts

// Define all your events and their payload types here
import {Phase} from "./scheduler.ts";

export interface EventMap {
    "socket:message": {
        socketId: string;
        channel: string;
        event: string;
        payload: unknown;
    };
    "socket:connected": {
        socketId: string;
    };
    "socket:disconnected": {
        socketId: string;
        roomId?: string;
        playerId?: string;
    };
    "round:started": {
        roomId: string;
        roundId: string;
        duration: number;
    };
    "round:ended": {
        roomId: string;
        roundId: string;
        results: {
            playerId: string;
            pick: boolean;
            score: number;
            correct: boolean;
        }[];
    };
    "round:submit": {
        roomId: string;
        roundId: string;
        playerId: string;
    };
}
export interface ClientEventMap {
    "client:connected": { playerId: string; username: string };
    "client:disconnected": { playerId: string };
    "client:round-start": {
        roundId: string;
        round: number;
        duration: number;
        data: {
            text: string;
            l_index: number;
            r_index: number;
        }
    };
    "client:round-end": { roundId: string, round: number };
    "client:round-stats": {
        roundId: string;
        round: number;
        results: {
            playerId: string;
            pick: boolean;
            correct: boolean;
            score: number;
        }[];
    };
    "client:stats": {
        scores: {
            playerId: string;
            totalScore: number;
        }[]
    }
    "client:submit-state": {
        playerId: string;
        round: number;
        answerCount: number;
        totalPlayers: number;
    };
    "client:cancel": {
        reason: string;
    }
    "client:transition": {
        phase: Phase,
        round: number;
        endsAt?: number;
    }
    "client:game_over": {
        /* ... */
    }
    // local events
    "local:connected": Record<string, never>;
    "local:disconnected": Record<string, never>;
    "local:error": { error: Event };
    "local:reconnect-failed": Record<string, never>;
}

type Handler<T> = (payload: T) => void | Promise<void>;

export class EventBus<E> {
    private handlers = new Map<string, Set<Handler<any>>>();

    subscribe<K extends keyof E>(
        event: K,
        handler: Handler<E[K]>
    ): () => void {
        if (!this.handlers.has(event as string)) {
            this.handlers.set(event as string, new Set());
        }
        this.handlers.get(event as string)!.add(handler);

        return () => this.unsubscribe(event, handler);
    }

    unsubscribe<K extends keyof E>(event: K, handler: Handler<E[K]>): void {
        this.handlers.get(event as string)?.delete(handler);
    }

    async publish<K extends keyof E>(event: K, payload: E[K]) {
        const handlers = this.handlers.get(event as string);
        if (!handlers) return;

        for (const handler of handlers) {
            try {
                await handler(payload);
            } catch (err) {
                console.error(`Handler error for ${String(event)}:`, err);
            }
        }
    }
}

export const eventBus = new EventBus<EventMap>();
export const clientEventBus = new EventBus<ClientEventMap>();
