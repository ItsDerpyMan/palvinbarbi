// deno-lint-ignore-file no-explicit-any
import {clientConnectionManager, ConnectionConfig} from "../../backend/client-connection-manager.ts";
import {clientEventBus, Handler, ClientEventMap} from "../../backend/event-bus.ts";

export interface IController {
    readonly isConnected: boolean;
    readonly isConnecting: boolean;
    readonly isAnonymous: boolean;
    subscribe(event: keyof ClientEventMap, handler: Handler<any>): void | Promise<void>;
    unsubscribe(): void;
    destroy(): Promise<void>;
}

export interface ControllerOptions {
    anonymous?: boolean;
}

export abstract class Controller implements IController {
    private unsubscribers: (() => void)[] = [];
    private _isConnected: boolean = false;
    private _isConnecting: boolean = false;
    private readonly _isAnonymous: boolean;
    protected readonly config: ConnectionConfig;
    protected readonly options: ControllerOptions;
    protected constructor(config: ConnectionConfig, options: ControllerOptions = {}) {
        this.config = config;
        this._isAnonymous = options.anonymous ?? false;
        this.options = options;

        if(!this._isAnonymous) this.setupInternalEventListeners();

        this.connect(config);
    }

    get isConnected(): boolean {
        return this._isConnected;
    }

    get isConnecting(): boolean {
        return this._isConnecting;
    }

    get isAnonymous(): boolean {
        return this._isAnonymous;
    }
    private setupInternalEventListeners(): void {
        this.subscribe("local:connected", () => {
            this._isConnected = true;
            this._isConnecting = false;

            this.onConnected();
        });

        this.subscribe("local:disconnected", () => {
            const wasConnected = this._isConnected;
            this._isConnected = false;
            this._isConnecting = false;

            if (wasConnected) {
                this.onDisconnected();
            }
        });
    }
    protected connect(config: ConnectionConfig): void {
        if (this._isConnected || this._isConnecting) {
            console.warn(`[${this.constructor.name}] Already connected or connecting`);
            return;
        }

        try {
            this._isConnecting = true;

            this.onConnectionInitiated(); // TODO

            if (this._isAnonymous) {
                clientConnectionManager.anonymConnect(config);
            } else {
                clientConnectionManager.connect(config);
            }
        } catch (err) {
            this._isConnecting = false;
            this.handleError(err as Error);
        }
    }
    protected onConnected() {
        console.log("[QuizController] Connected");
    }
    protected disconnect() {
        if (!this._isAnonymous) {
         try {
             clientConnectionManager.disconnect();
         } catch (err) {
             this.handleError(err as Error);
         }
        }
    }
    protected onDisconnected() {
        console.log("[QuizController] Disconnected");
    }
    protected broadcast<K extends keyof ClientEventMap>(channel: string, event: K, payload: ClientEventMap[K]): void {
        if (!this._isConnected) {
            console.warn(`[${this.constructor.name}] Cannot broadcast - not connected`);
            return;
        }

        try {
            clientConnectionManager.send(channel, event, payload);
        } catch (err) {
            this.handleError(err as Error);
        }
    }
    protected abstract setupEventListeners(): void;
    protected onConnectionInitiated(): void {
        if(this._isAnonymous) return;
        // TODO
    }
    subscribe(event: keyof ClientEventMap, handler: Handler<any>): void | Promise<void> {
        try {
            const unsubscribe = clientEventBus.subscribe(event, handler);
            this.unsubscribers.push(unsubscribe);
        } catch (error) {
            this.handleError(error as Error);
        }
    }
    unsubscribe(): void {
        this.unsubscribers.forEach((unsub) => {
            try {
                unsub();
            } catch (error) {
                console.error("Error during unsubscribe:", error);
            }
        });
        this.unsubscribers = [];
    }
    protected onBeforeDestroy() {}
    protected onAfterDestroy() {}
    async destroy() {
            try {
                this.onBeforeDestroy();
                this.unsubscribe();
                this.disconnect();
                this.onAfterDestroy();
            } catch (error) {
                this.handleError(error as Error);
            }
    }
    protected abstract onError(err: Error): void;
    protected handleError(err: Error): void {
        console.error(`[${this.constructor.name}] Error:`, err);
        this.onError(err);
    }
}