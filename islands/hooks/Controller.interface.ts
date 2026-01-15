import {clientConnectionManager, ConnectionConfig} from "../../backend/client-connection-manager.ts";
import {clientEventBus} from "../../backend/event-bus.ts";

export interface IController {
    unsubscribers: (() => void)[];
    anonymConnection: boolean;
    connect(config: ConnectionConfig): void;
    subscribe(): void;
    unsubscribe(): void;
    destroy(): void;
}

export class Controller implements IController {
    private unsubscribers: (() => void)[] = [];
    private anonymConnection: boolean = false;
    connect(config: ConnectionConfig): void {
        if (this.anonymConnection) clientConnectionManager.anonymConnect(config);
        clientConnectionManager.connect(config);
    }
    subscribe(event: any, handler: () => void): void {
        this.unsubscribers.push(clientEventBus.subscribe(event, handler))
    }

    destroy() {
        this.unsubscribers.forEach((unsub) => unsub());
        if (!this.anonymConnection) clientConnectionManager.disconnect();
    }

}