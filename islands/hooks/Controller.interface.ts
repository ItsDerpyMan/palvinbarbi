// deno-lint-ignore-file no-explicit-any
import {clientConnectionManager, ConnectionConfig} from "../../backend/client-connection-manager.ts";
import {clientEventBus, Handler, ClientEventMap} from "../../backend/event-bus.ts";

export interface IController {
    // deno-lint-ignore no-explicit-any
    subscribe(event: keyof ClientEventMap, handler: Handler<any>): void | Promise<void>;
    unsubscribe(): void;
    destroy(): void;
}

export class Controller implements IController {
    private unsubscribers: (() => void)[] = [];
    private readonly anonymConnection: boolean;
    constructor(config: ConnectionConfig, anonymous: boolean = false) {
        this.anonymConnection = anonymous;
        this.connect(config);
    }

    private connect(config: ConnectionConfig): void {
        if (this.anonymConnection) {
            clientConnectionManager.anonymConnect(config);
        } else {
            clientConnectionManager.connect(config);
        }
    }

    broadcast<K extends keyof ClientEventMap>(channel: string, event: K, payload: ClientEventMap[K]): void {
        clientConnectionManager.send(channel, event, payload);
    }
    subscribe(event: keyof ClientEventMap, handler: Handler<any>): void | Promise<void> {
        this.unsubscribers.push(clientEventBus.subscribe(event, handler))
    }
    unsubscribe(): void {
        this.unsubscribers.forEach((unsub) => unsub());
        this.unsubscribers = [];
    }

    destroy() {
        this.unsubscribe();
        if (!this.anonymConnection) clientConnectionManager.disconnect();
    }

}