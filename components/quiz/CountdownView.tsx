import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";

export interface CountdownViewProps {
    controller: QuizControllerLogic;
}

const CountdownView: FunctionComponent<CountdownViewProps> = ({ controller }) => {
    return (
        <div class="quiz-view border-warning">
            <div class="mb-6">
                <span class="countdown font-mono text-8xl text-warning">
                    <span style={{ "--value": controller.timeleft.value } as any}></span>
                </span>
            </div>
            <h2 class="text-4xl font-bold text-base-content mb-2">Get Ready!</h2>
            <p class="text-xl text-base-content/70">
                Game starting soon...
            </p>
            <div class="quiz-loading-dots">
                <div class="quiz-loading-dot" style="animation-delay: 0ms"></div>
                <div class="quiz-loading-dot" style="animation-delay: 150ms"></div>
                <div class="quiz-loading-dot" style="animation-delay: 300ms"></div>
            </div>
        </div>
    );
};

export default CountdownView;