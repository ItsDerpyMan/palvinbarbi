import type { ComponentChildren, FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../islands/hooks/QuizController.class.ts";
import { State } from "../../islands/hooks/QuizController.class.ts";

export interface LayoutProps {
    controller: QuizControllerLogic;
    children: ComponentChildren;
}

const Layout: FunctionComponent<LayoutProps> = ({ controller, children }) => {
    return (
        <div class="quiz-container flex flex-col gap-6 p-6 max-w-4xl mx-auto min-h-screen">
            {/* Header */}
            <div class="text-center">
                <h1 class="text-3xl font-bold text-primary">Would You Rather?</h1>
                <div class="flex justify-center gap-4 mt-2 text-sm text-base-content/60">
                    <span>Round {controller.round.value}</span>
                    <span class="divider divider-horizontal mx-0"></span>
                    <span class="badge badge-ghost">{State[controller.state.value]}</span>
                </div>
            </div>

            {/* Content */}
            <div class="flex-1">
                {children}
            </div>
        </div>
    );
};

export default Layout;