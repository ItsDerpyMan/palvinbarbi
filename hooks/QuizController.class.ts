import { signal, Signal } from "@preact/signals";
import { clientConnectionManager} from "../handlers/sockets/client-connection-manager.ts";
import { clientEventBus} from "../handlers/sockets/event-bus.ts";

export enum State {
    initializing,
    waiting,
    playing,
    end,
    stats,
}

export class QuizControllerLogic {
    readonly state = signal<State>(State.initializing);
    readonly timeleft = signal(0);
    readonly time = signal<number | null>(null);

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

    constructor(roomId: string, playerId: string, username: string, url: string) {
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
            clientEventBus.subscribe("client:round-started", ({ round, duration, data }) => this.roundStart(round, duration, data)),
            clientEventBus.subscribe("client:round-end", ( round ) => {
                this.state.value = State.end;
                this.time.value = null;
            }),
            clientEventBus.subscribe("client:submit-state", ({ answerCount, totalPlayers }) => {
                this.count.value = answerCount;
                this.totalplayers.value = totalPlayers;
            }),
            clientEventBus.subscribe("client:round-stats", ({ results }) => {
                this.state.value = State.stats;
                this.results.value = results;
            }));
    }

   private startTimer(): void {
        this.timer = setInterval(() => {
            if (this.time.value) {
                const remaining = Math.max(0, (this.time.value - Date.now()) / 1000);
                this.timeleft.value = Math.ceil(remaining);

                if (remaining <= 0) {
                    this.time.value = null;
                }
            }
        }, 100);
   }

   private roundStart(
       round: number,
       duration: number,
       data: {
            text: string;
            l_index: number;
            r_index: number;
        }) {
        this.state.value = State.playing;
        this.round.value = round;
        this.time.value = Date.now() + duration * 1000;

        this.hasAnswered.value = false;
        this.count.value = 0;

        this.prompt.value = data;

       this.loadPrompt();
   }

   private loadPrompt() {

   }
   submit(pick: boolean) {
        if (this.hasAnswered.value || this.state.value !== State.playing) return;

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