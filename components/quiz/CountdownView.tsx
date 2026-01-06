import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";

export interface CountdownViewProps {
    controller: QuizControllerLogic;
}

const CountdownView: FunctionComponent<CountdownViewProps> = ({ controller }) => {
    return (
        <div class="text-center p-16 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 border-orange-300">
            <div class="mb-6">
                <div class="text-8xl font-bold text-orange-600 animate-pulse">
                    {controller.timeleft.value}
                </div>
            </div>
            <h2 class="text-4xl font-bold text-gray-800 mb-2">Get Ready!</h2>
            <p class="text-xl text-gray-600">
                Game starting soon...
            </p>
            <div class="mt-6 flex justify-center gap-2">
                <div class="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
        </div>
    );
};

export default CountdownView;