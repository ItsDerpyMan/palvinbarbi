import { signal, Signal } from "@preact/signals";
import { clientConnectionManager} from "../handlers/sockets/client-connection-manager.ts";
import { clientEventBus} from "../handlers/sockets/event-bus.ts";
import { Phase } from "../handlers/sockets/scheduler.ts";

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
    readonly endsAt = signal<number | null>(null);

    readonly hasAnswered = signal(false);
    readonly count = signal<number>(0);
    readonly totalplayers = signal<number>(0);
    readonly results = signal<any[]>([]);
    readonly round = signal<number>(0);

    readonly prompt = signal<{
        text: string;
        l_index: number;
        r_index: number;
    } | null>(null);

    private roomId: string;
    private playerId: string;
    private unsubscribers: (() => void)[] = [];
    private timer?: number;

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
        this.startTimer();
    }


    private subscribeToEvents(): void {
        this.unsubscribers.push(
            clientEventBus.subscribe("local:connected", () => {
                console.log("[QuizController] Connected");
            }),
            clientEventBus.subscribe("local:disconnected", () => {
                console.log("[QuizController] Disconnected - back to initializing");
                this.state.value = State.initializing;
                this.endsAt.value = null;
            }),
            clientEventBus.subscribe("client:transition", ({ phase, round, endsAt }) => {
                console.log(`[QuizController] Transition to phase ${phase}, round ${round}`);
                this.state.value = phase as unknown as State;
                this.round.value = round;
                this.endsAt.value = endsAt ?? null;
            }),
            clientEventBus.subscribe("client:cancel", ({ reason }) => {
                console.log(`[QuizController] Game cancelled: ${reason}`);
                this.state.value = State.lobby;
                this.endsAt.value = null;
            }),
            clientEventBus.subscribe("client:round-start", ({ round, duration, data }) => {
                console.log(`[QuizController] Round ${round} started`);
                this.hasAnswered.value = false;
                this.count.value = 0;
                this.prompt.value = data;
                this.loadPrompt();
            }),
            clientEventBus.subscribe("client:round-stats", ({ results }) => {
                console.log("[QuizController] Round stats received");
                this.results.value = results;
            }),
            clientEventBus.subscribe("client:submit-state", ({ answerCount, totalPlayers }) => {
                this.count.value = answerCount;
                this.totalplayers.value = totalPlayers;
            })
        );
    }

   private startTimer(): void {
        this.timer = setInterval(() => {
            if (this.endsAt.value) {
                const remaining = Math.max(0, (this.endsAt.value - Date.now()) / 1000);
                this.timeleft.value = Math.ceil(remaining);

                if (remaining <= 0) {
                    this.timeleft.value = 0;
                }
            } else {
                this.timeleft.value = 0;
            }
        }, 100);
   }

   private loadPrompt() {

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
        clearInterval(this.timer);
        clientConnectionManager.disconnect();
    }

}