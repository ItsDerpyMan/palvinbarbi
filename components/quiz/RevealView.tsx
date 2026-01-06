import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";

export interface RevealViewProps {
    controller: QuizControllerLogic;
}

const RevealView: FunctionComponent<RevealViewProps> = ({ controller }) => {
    return (
        <div class="bg-white rounded-lg shadow-lg p-8">
            <div class="text-center mb-6">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">Round Results</h2>
                <p class="text-gray-600">See how everyone did!</p>
            </div>

            <div class="space-y-4">
                {controller.results.value.map((result) => (
                    <div
                        key={result.playerId}
                        class={`
                            p-4 rounded-lg border-2 flex items-center justify-between
                            ${result.correct
                                ? 'bg-green-50 border-green-300'
                                : 'bg-red-50 border-red-300'
                            }
                        `}
                    >
                        <div class="flex items-center gap-3">
                            <div class="text-2xl">
                                {result.correct ? '✅' : '❌'}
                            </div>
                            <div>
                                <p class="font-semibold text-gray-800">
                                    Player {result.playerId.slice(0, 8)}
                                </p>
                                <p class="text-sm text-gray-600">
                                    Chose: {result.pick ? 'Left' : 'Right'}
                                </p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-2xl font-bold text-blue-600">
                                +{result.score}
                            </p>
                            <p class="text-xs text-gray-500">points</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RevealView;