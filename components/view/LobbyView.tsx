import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../islands/hooks/QuizController.class.ts";

export interface LobbyViewProps {
    controller: QuizControllerLogic;
}

const LobbyView: FunctionComponent<LobbyViewProps> = ({ controller }) => {
    return (
        <div class="quiz-view border-primary">
            <div class="animate-bounce">
                <div class="quiz-icon">👋</div>
            </div>
            <h2 class="text-3xl font-bold text-base-content mb-4">Welcome to the Lobby!</h2>
            <p class="text-lg text-base-content/70 mb-2">
                Waiting for players to join...
            </p>
            <p class="text-xl font-semibold text-primary mt-4">
                {controller.totalplayers.value} player(s) in room
            </p>
            <p class="text-sm text-base-content/50 mt-6">
                Game will start when enough players join
            </p>
        </div>
    );
};

export default LobbyView;