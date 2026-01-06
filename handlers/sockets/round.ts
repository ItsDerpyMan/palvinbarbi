// round.ts

export interface Submission {
    playerId: string;
    pick: boolean;
    submittedAt: number;
}

export class Round {
    id: string;
    startedAt: number;
    endsAt: number;
    private picks: Map<string, Submission> = new Map();
    ended = false;

    constructor(duration: number = 30000) {
        this.id = crypto.randomUUID();
        this.startedAt = Date.now();
        this.endsAt = this.startedAt + duration;
    }

    submitAnswer(playerId: string, pick: boolean): boolean {
        if (this.ended) return false;
        if (this.picks.has(playerId)) return false;

        this.picks.set(playerId, {
            playerId,
            pick,
            submittedAt: Date.now(),
        });
        return true;
    }
    end(): void {
        this.ended = true;
    }

    getAnswerCount(): number {
        return this.picks.size;
    }
    getRemainingTime(): number {
        return Math.max(0, this.endsAt - Date.now());
    }
    calculateScores(): { playerId: string; pick: boolean; score: number; correct: boolean }[] {
        const submissionsA: Submission[] = [];
        const submissionsB: Submission[] = [];

        for (const submission of this.picks.values()) {
            if (submission.pick) {
                submissionsA.push(submission);
            } else {
                submissionsB.push(submission);
            }
        }

        const countA = submissionsA.length;
        const countB = submissionsB.length;
        const basePoints = 100;
        const speedBonus = 50;
        const results: { playerId: string; pick: boolean; score: number; correct: boolean }[] = [];

        // Tie: everyone gets base points
        if (countA === countB) {
            for (const submission of submissionsA) {
                results.push({
                    playerId: submission.playerId,
                    pick: submission.pick,
                    score: basePoints,
                    correct: true,
                });
            }
            for (const submission of submissionsB) {
                results.push({
                    playerId: submission.playerId,
                    pick: submission.pick,
                    score: basePoints,
                    correct: true,
                });
            }
            return results;
        }

        // Determine majority and minority
        const majoritySubmissions = countA > countB ? submissionsA : submissionsB;
        const minoritySubmissions = countA > countB ? submissionsB : submissionsA;

        // Sort majority by submission time
        majoritySubmissions.sort((a, b) => a.submittedAt - b.submittedAt);

        // Calculate scores for majority (base + speed bonus)
        for (let i = 0; i < majoritySubmissions.length; i++) {
            const percentile = 1 - (i / majoritySubmissions.length);
            const score = basePoints + Math.floor(speedBonus * percentile);

            results.push({
                playerId: majoritySubmissions[i].playerId,
                pick: majoritySubmissions[i].pick,
                score,
                correct: true,
            });
        }

        // Minority gets 0 points
        for (const submission of minoritySubmissions) {
            results.push({
                playerId: submission.playerId,
                pick: submission.pick,
                score: 0,
                correct: false,
            });
        }

        return results;
    }
}