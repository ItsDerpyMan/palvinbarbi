import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";

export interface WaitingViewProps {
    controller: QuizControllerLogic;
}

const WaitingView: FunctionComponent<WaitingViewProps> = ({ controller }) => {
    return (
        <div class="text-center p-12 bg-gray-50 rounded-lg">
            <div class="animate-pulse">
                <div class="text-6xl mb-4">⏳</div>
                <p class="text-xl text-gray-700">Waiting for next round...</p>
                <p class="text-sm text-gray-500 mt-2">
                    {controller.totalplayers.value} players in room
                </p>
            </div>
        </div>
    );
};

export default WaitingView;