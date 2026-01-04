import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";

export interface StatsViewProps {
    controller: QuizControllerLogic;
    currentPlayerId: string;
}

const StatsView: FunctionComponent<StatsViewProps> = ({ controller, currentPlayerId }) => {
    return (
        <div class="bg-white rounded-lg shadow-xl p-6">
            <h2 class="text-3xl font-bold mb-6 text-center text-purple-600">
                Round {controller.round.value} Results
            </h2>

            <div class="space-y-3">
                {controller.results.value.map((result, index) => (
                    <div
                        key={result.playerId}
                        class={`
                            p-4 rounded-lg flex items-center justify-between
                            ${result.playerId === currentPlayerId
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold'
                                : 'bg-gray-100'
                            }
                        `}
                    >
                        <div class="flex items-center gap-3">
                            <span class="text-2xl font-bold">#{index + 1}</span>
                            <span class="text-lg">
                                {result.playerId === currentPlayerId ? "You" : "Player"}
                            </span>
                        </div>

                        <div class="flex items-center gap-4">
                            <span class={`px-3 py-1 rounded ${result.correct ? 'bg-green-500' : 'bg-red-500'} text-white text-sm`}>
                                {result.pick ? "Left" : "Right"}
                            </span>
                            <span class="text-lg">
                                {result.correct ? "✓" : "✗"}
                            </span>
                            <span class="text-lg font-bold">
                                +{result.score}
                            </span>
                            <span class="text-sm opacity-75">
                                Total: {result.totalScore}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatsView;