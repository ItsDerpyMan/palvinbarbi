import type { FunctionComponent } from "preact";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";

export interface LobbyViewProps {
    controller: QuizControllerLogic;
}

const LobbyView: FunctionComponent<LobbyViewProps> = ({ controller }) => {
    return (
        <div class="text-center p-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
            <div class="animate-bounce">
                <div class="text-6xl mb-4">👋</div>
            </div>
            <h2 class="text-3xl font-bold text-gray-800 mb-4">Welcome to the Lobby!</h2>
            <p class="text-lg text-gray-600 mb-2">
                Waiting for players to join...
            </p>
            <p class="text-xl font-semibold text-blue-600 mt-4">
                {controller.totalplayers.value} player(s) in room
            </p>
            <p class="text-sm text-gray-500 mt-6">
                Game will start when enough players join
            </p>
        </div>
    );
};

export default LobbyView;