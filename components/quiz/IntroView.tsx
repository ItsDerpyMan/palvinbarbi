import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";

export interface IntroViewProps {
    controller: QuizControllerLogic;
}

const IntroView: FunctionComponent<IntroViewProps> = ({ controller }) => {
    return (
        <div class="quiz-view border-secondary shadow-xl">
            <div class="mb-4">
                <div class="quiz-icon">🎯</div>
            </div>
            <h2 class="text-5xl font-bold text-secondary mb-4 animate-pulse">
                Round {controller.round.value}
            </h2>
            <p class="text-2xl text-base-content/80 font-medium">
                Get ready...
            </p>
        </div>
    );
};

export default IntroView;