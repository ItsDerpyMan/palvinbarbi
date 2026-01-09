import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";

export interface StatsViewProps {
    controller: QuizControllerLogic;
    currentPlayerId: string;
}

const StatsView: FunctionComponent<StatsViewProps> = ({ controller, currentPlayerId }) => {
    return (
        <div class="quiz-card">
            <h2 class="text-3xl font-bold mb-6 text-center text-secondary">
                Round {controller.round.value} Results
            </h2>

            <div class="space-y-3">
                {controller.results.value.map((result, index) => {
                    const isCurrentPlayer = result.playerId === currentPlayerId;
                    return (
                        <div
                            key={result.playerId}
                            class={`quiz-result-item ${
                                isCurrentPlayer
                                    ? 'bg-gradient-to-r from-primary to-secondary text-primary-content'
                                    : 'bg-base-200 border-base-300'
                            }`}
                        >
                            <div class="flex items-center gap-3">
                                <span class="text-2xl font-bold">#{index + 1}</span>
                                <span class="text-lg">
                                    {isCurrentPlayer ? "You" : "Player"}
                                </span>
                            </div>

                            <div class="flex items-center gap-4">
                                <span class={`badge ${result.correct ? 'badge-success' : 'badge-error'}`}>
                                    {result.pick ? "Left" : "Right"}
                                </span>
                                <span class="text-lg">
                                    {result.correct ? "✓" : "✗"}
                                </span>
                                <span class="text-lg font-bold">
                                    +{result.score}
                                </span>
                                <span class={`text-sm ${isCurrentPlayer ? 'opacity-75' : 'text-base-content/60'}`}>
                                    Total: {result.totalScore}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatsView;