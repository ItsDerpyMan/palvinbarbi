import { signal } from "@preact/signals";
import { clientConnectionManager} from "../handlers/sockets/client-connection-manager.ts";
import { clientEventBus} from "../handlers/sockets/event-bus.ts";

export enum State {
    initializing,
    lobby,
    countdown, // countdown till round start
    intro, // small timeout
    start, // round start
    end, // round end
    reveal, // revealing round stats
    outro, // small timeout
    stats,
}

export class QuizControllerLogic {
    readonly state = signal<State>(State.initializing);
    readonly timeleft = signal(0);

    readonly hasAnswered = signal(false);
    readonly count = signal<number>(0);
    readonly totalplayers = signal<number>(0);
    readonly results = signal<any[]>([]);
    readonly round = signal<number>(0);

    readonly prompt = signal<{
        prompt: string;
        l_index: number;
        r_index: number;
    } | null>(null);

    private roomId: string;
    private playerId: string;
    private unsubscribers: (() => void)[] = [];

    constructor(url: string, roomId: string, playerId: string, username: string) {
        this.roomId = roomId;
        this.playerId = playerId;

        clientConnectionManager.connect({
            url,
            roomId,
            playerId,
            username,
        });

        this.subscribeToEvents();
    }


    private subscribeToEvents(): void {
        this.unsubscribers.push(
            clientEventBus.subscribe("local:connected", () => {
                console.log("[QuizController] Connected");
            }),
            clientEventBus.subscribe("local:disconnected", () => {
                console.log("[QuizController] Disconnected - back to initializing");
                this.state.value = State.initializing;
                this.timeleft.value = 0;
            }),
            clientEventBus.subscribe("client:transition", ({ phase, round, timeleft }) => {
                console.log(`[QuizController] Transition to phase ${phase}, round ${round}`);
                this.state.value = phase as unknown as State;
                this.round.value = round;
                this.timeleft.value = timeleft ?? 0;
            }),
            clientEventBus.subscribe("client:cancel", ({ reason }) => {
                console.log(`[QuizController] Game cancelled: ${reason}`);
                this.state.value = State.lobby;
                this.timeleft.value = 0;
            }),
            clientEventBus.subscribe("client:round-start", ({ data }) => {
                console.log(`[QuizController] Round started`);
                this.hasAnswered.value = false;
                this.count.value = 0;
                this.prompt.value = data;
            }),
            clientEventBus.subscribe("client:round-end", () => {
                console.log(`[QuizController] Round ended`);
                this.timeleft.value = 0;
            }),
            clientEventBus.subscribe("client:round-stats", ({ results }) => {
                console.log("[QuizController] Round stats received");
                this.results.value = results;
            }),
            clientEventBus.subscribe("client:submit-state", ({ answerCount, totalPlayers }) => {
                this.count.value = answerCount;
                this.totalplayers.value = totalPlayers;
            }),
            clientEventBus.subscribe("client:state", ({ phase, round, playerCount}) => {
                this.state.value = phase as unknown as State;
                this.round.value = round;
                this.totalplayers.value = playerCount;
            }),
            clientEventBus.subscribe("client:remaining_time", ({ timeleft }) => {
                this.timeleft.value = timeleft;
            }),
        );
    }

    submit(pick: boolean) {
        if (this.hasAnswered.value || this.state.value !== State.start) return;

        clientConnectionManager.send(
            `room:${this.roomId}`,
            "respond",
            { answer: pick }
        );
        this.hasAnswered.value = true;
    }

    destroy() {
        this.unsubscribers.forEach((unsub) => unsub());
        clientConnectionManager.disconnect();
    }
}