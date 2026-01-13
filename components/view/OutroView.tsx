import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../islands/hooks/QuizController.class.ts";

export interface OutroViewProps {
    controller: QuizControllerLogic;
}

const OutroView: FunctionComponent<OutroViewProps> = ({ controller }) => {
    return (
        <div class="quiz-view border-accent">
            <div class="mb-4">
                <div class="quiz-icon animate-bounce">🎊</div>
            </div>
            <h2 class="text-3xl font-bold text-base-content mb-4">
                Round {controller.round.value} Complete!
            </h2>
            <p class="text-lg text-base-content/70">
                Preparing next round...
            </p>
            <div class="quiz-loading-dots">
                <div class="quiz-loading-dot" style="animation-delay: 0ms"></div>
                <div class="quiz-loading-dot" style="animation-delay: 200ms"></div>
                <div class="quiz-loading-dot" style="animation-delay: 400ms"></div>
            </div>
        </div>
    );
};

export default OutroView;