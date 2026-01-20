import { signal } from "@preact/signals";
import {ConnectionConfig} from "../../backend/client-connection-manager.ts";
import {Controller, ControllerOptions} from "./Controller.interface.ts";

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

export class QuizControllerLogic extends Controller {
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

    constructor(config: ConnectionConfig, options: ControllerOptions) {
        super(config, options);
        this.roomId = config.roomId;
        this.playerId = config.playerId;

        this.subscribeToEvents();
    }
    submit(pick: boolean) {
        if (this.hasAnswered.value || this.state.value !== State.start) return;

        this.broadcast(
            `room:${this.roomId}`,
            "respond",
            { answer: pick }
        );
        this.hasAnswered.value = true;
    }
    protected override onConnected(): void {

    }

    protected override onDisconnect(): void {

    }

    protected override onError(err: Error): void {
    }

    private subscribeToEvents(): void {
        this.subscribe("local:connected", () => {
            console.log("[QuizController] Connected");
        });

        this.subscribe("local:disconnected", () => {
            console.log("[QuizController] Disconnected - back to initializing");
            this.state.value = State.initializing;
            this.timeleft.value = 0;
        });

        this.subscribe("client:transition", ({ phase, round, timeleft }) => {
            console.log(`[QuizController] Transition to phase ${phase}, round ${round}`);
            this.state.value = phase as unknown as State;
            this.round.value = round;
            this.timeleft.value = timeleft ?? 0;
        });

        this.subscribe("client:cancel", ({ reason }) => {
            console.log(`[QuizController] Game cancelled: ${reason}`);
            this.state.value = State.lobby;
            this.timeleft.value = 0;
        });

        this.subscribe("client:round-start", ({ data }) => {
            console.log(`[QuizController] Round started`);
            this.hasAnswered.value = false;
            this.count.value = 0;
            this.prompt.value = data;
        });

        this.subscribe("client:round-end", () => {
            console.log(`[QuizController] Round ended`);
            this.timeleft.value = 0;
        });

        this.subscribe("client:round-stats", ({ results }) => {
            console.log("[QuizController] Round stats received");
            this.results.value = results;
        });

        this.subscribe("client:submit-state", ({ answerCount, totalPlayers }) => {
            this.count.value = answerCount;
            this.totalplayers.value = totalPlayers;
        });

        this.subscribe("client:state", ({ phase, round, playerCount }) => {
            this.state.value = phase as unknown as State;
            this.round.value = round;
            this.totalplayers.value = playerCount;
        });

        this.subscribe("client:remaining_time", ({ timeleft }) => {
            this.timeleft.value = timeleft;
        });

        this.subscribe("client:game_over", ({ roundId, round }) => {
            console.log("[QuizController] Game over", roundId, round);
            this.destroy();
            setTimeout(() => {
                window.location.href = "/";
            }, 2000);
        });
    }
}