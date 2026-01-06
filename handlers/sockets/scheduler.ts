// scheduler.ts
import { ClientEventMap } from "./event-bus.ts";
import {Round} from "./round.ts";
import { setTimeout, clearTimeout } from 'node:timers';
import {Room, RoomConfig} from "./room.ts";

export interface ScheduleConfig {
    outroDuration: number;
    revealDuration: number;
    introDuration: number;
    countdownDuration: number;
    roundDuration: number;
}
export enum Phase {
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

interface State {
    phase: Phase;
    round: Round | null;
    roundNumber: number;
}

export class Scheduler {
    private state: State;
    private timers: Map<string, NodeJS.Timeout> = new Map();

    constructor(
        private room: Room,
        private config: RoomConfig,
        private emit: <K extends keyof ClientEventMap>(event: K, payload: ClientEventMap[K]) => void
    ) {
        this.state = {
            phase: Phase.initializing,
            round: null,
            roundNumber: 0,
        };
    }

    start() {
        this.transition(Phase.lobby);
    }
    startGame() {
        this.state.roundNumber = 0;
        this.transition(Phase.countdown);
        this.schedule('countdown', this.config.countdownDuration, () => {
            this.startNextRound();
        })
    }
    private async startNextRound() {
        this.state.roundNumber++;
        this.state.round = new Round(this.config.roundDuration);

        try {
            const data = await this.state.round!.getRoundData();
            this.transition(Phase.intro);
            this.schedule('intro', this.config.introDuration, () => {
                this.transition(Phase.start);
                this.emit("client:round-start", {
                    roundId: this.state.round!.id,
                    round: this.state.roundNumber,
                    duration: this.config.roundDuration, // TODO Check if timestamp needed
                    data,
                })
                this.schedule('end', this.config.roundDuration, () => this.endCurrentRound());
            })
        } catch (err) {
            console.error("[Scheduler] Failed to load question: ", err);
            this.emit("client:cancel", { reason: "Failed to load question" });
            this.transition(Phase.lobby);
        }
    }
    private endCurrentRound() {
        this.state.round!.end();

        this.transition(Phase.end);
        this.emit('client:round-end', { roundId: this.state.round!.id, round: this.state.roundNumber });

        this.schedule('intro', this.config.introDuration, () => this.revealRoundStats());
    }

    private revealRoundStats() {
        const results = this.state.round!.calculateScores();

        this.transition(Phase.reveal);
        this.emit('client:round-stats', {
            roundId: this.state.round!.id,
            round: this.state.roundNumber,
            results,
        })
        this.schedule('reveal', this.config.revealDuration, () => {
            this.transition(Phase.outro);
            this.schedule('outro', this.config.outroDuration, () => {
                if (this.state.roundNumber >= this.config.maxRounds) { // maxRounds
                    this.transition(Phase.stats);
                    this.emit('client:game_over', { /* final results */ });
                } else this.startNextRound();
            });
        })
    }

    private schedule(event: string, delay: number, callback: () => void) {
        this.clearTimer(event);
        this.timers.set(event, setTimeout(() => {
            this.timers.delete(event);
            callback();
        }, delay));
    }
    private clearTimer(event: string) {
        const timer = this.timers.get(event);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(event);
        }
    }
    private clearAllTimers() {
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
    }

    private transition(phase: Phase) {
        this.state.phase = phase;
        this.emit('client:transition', {
            phase,
            round: this.state.roundNumber,
            endsAt: this.state.round?.endsAt ?? undefined,
        });
    }

    onPlayerJoined(playerCount: number): void {
        if (this.state.phase === Phase.lobby && playerCount >= this.config.minPlayers) {
            if (this.config.autoStart) {
                this.startGame();
            }
        }
        this.emit('client:state', {
            phase: this.state.phase,
            round: this.state.roundNumber,
            playerCount,
        })
    }

    onPlayerLeft(playerCount: number): void {
        if (this.state.phase === Phase.countdown && playerCount < this.config.minPlayers) {
            this.clearTimer('countdown');
            this.transition(Phase.lobby);
            this.emit('client:cancel', { reason: 'Not enough players' });
        }
        this.emit('client:state', {
            phase: this.state.phase,
            round: this.state.roundNumber,
            playerCount,
        })
    }
    submitAnswer(playerId: string, pick: boolean) {
        if (this.state.phase !== Phase.start) return false;
        if (!this.state.round) return false;

        const success = this.state.round.submitAnswer(playerId, pick);

        if (success) {
            const answerCount = this.state.round.getAnswerCount();
            const totalPlayers = this.room.getPlayerCount();

            this.emit('client:submit-state', {
                playerId,
                round: this.state.roundNumber,
                answerCount,
                totalPlayers,
            });
        }

        return success;
    }

    checkEarlyEnd(totalPlayers: number): void {
        if (!this.state.round) return;
        if (this.state.round?.getAnswerCount() >= totalPlayers) {
            this.clearTimer('round_end');
            this.endCurrentRound();
        }
    }
    getPhase() {
        return this.state.phase;
    }
}