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
    private startNextRound() {
        this.state.roundNumber++;
        this.state.round = new Round(this.config.roundDuration);

        this.transition(Phase.intro);
        this.schedule('intro', this.config.introDuration, () => {
            this.transition(Phase.start);
            this.schedule('end', this.config.roundDuration, () => this.endCurrentRound());
        })
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
    }

    onPlayerLeft(playerCount: number): void {
        if (this.state.phase === Phase.countdown && playerCount < this.config.minPlayers) {
            this.clearTimer('countdown');
            this.transition(Phase.lobby);
            this.emit('client:cancel', { reason: 'Not enough players' });
        }
    }
    submitAnswer(playerId: string, pick: boolean) {
        if (this.state.phase !== Phase.start) return false;
        if (!this.state.round) return false;

        return this.state.round.submitAnswer(playerId, pick);
    }

    checkEarlyEnd(totalPlayers: number): void {
        if (!this.state.round) return;
        if (this.state.round?.getAnswerCount() >= totalPlayers) {
            this.clearTimer('round_end');
            this.endCurrentRound();
        }
    }
}