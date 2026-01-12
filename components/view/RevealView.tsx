import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../islands/hooks/QuizController.class.ts";

export interface RevealViewProps {
    controller: QuizControllerLogic;
}

const RevealView: FunctionComponent<RevealViewProps> = ({ controller }) => {
    return (
        <div class="quiz-card">
            <div class="text-center mb-6">
                <h2 class="text-3xl font-bold text-base-content mb-2">Round Results</h2>
                <p class="text-base-content/60">See how everyone did!</p>
            </div>

            <div class="space-y-4">
                {controller.results.value.map((result) => (
                    <div
                        key={result.playerId}
                        class={`quiz-result-item ${
                            result.correct
                                ? 'bg-success/20 border-success'
                                : 'bg-error/20 border-error'
                        }`}
                    >
                        <div class="flex items-center gap-3">
                            <div class="text-2xl">
                                {result.correct ? '✅' : '❌'}
                            </div>
                            <div>
                                <p class="font-semibold text-base-content">
                                    Player {result.playerId.slice(0, 8)}
                                </p>
                                <p class="text-sm text-base-content/60">
                                    Chose: {result.pick ? 'Left' : 'Right'}
                                </p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-2xl font-bold text-primary">
                                +{result.score}
                            </p>
                            <p class="text-xs text-base-content/50">points</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RevealView;