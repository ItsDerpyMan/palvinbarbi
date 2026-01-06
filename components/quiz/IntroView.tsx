import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";

export interface IntroViewProps {
    controller: QuizControllerLogic;
}

const IntroView: FunctionComponent<IntroViewProps> = ({ controller }) => {
    return (
        <div class="text-center p-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300 shadow-xl">
            <div class="mb-4">
                <div class="text-7xl mb-4">🎯</div>
            </div>
            <h2 class="text-5xl font-bold text-purple-600 mb-4 animate-pulse">
                Round {controller.round.value}
            </h2>
            <p class="text-2xl text-gray-700 font-medium">
                Get ready...
            </p>
        </div>
    );
};

export default IntroView;