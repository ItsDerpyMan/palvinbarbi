import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";

export interface OutroViewProps {
    controller: QuizControllerLogic;
}

const OutroView: FunctionComponent<OutroViewProps> = ({ controller }) => {
    return (
        <div class="text-center p-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border-2 border-indigo-200">
            <div class="mb-4">
                <div class="text-6xl mb-4 animate-bounce">🎊</div>
            </div>
            <h2 class="text-3xl font-bold text-gray-800 mb-4">
                Round {controller.round.value} Complete!
            </h2>
            <p class="text-lg text-gray-600">
                Preparing next round...
            </p>
            <div class="mt-6">
                <div class="inline-block">
                    <div class="flex gap-2">
                        <div class="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        <div class="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style="animation-delay: 200ms"></div>
                        <div class="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style="animation-delay: 400ms"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutroView;