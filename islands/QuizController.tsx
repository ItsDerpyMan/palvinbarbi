import { computed } from "@preact/signals";
import { State } from "./hooks/QuizController.class.ts";
import { useQuizController } from "./hooks/useQuizController.ts";
import Layout from "../components/view/Layout.tsx";
import InitializingView from "../components/view/InitializingView.tsx";
import LobbyView from "../components/view/LobbyView.tsx";
import CountdownView from "../components/view/CountdownView.tsx";
import IntroView from "../components/view/IntroView.tsx";
import PlayingView from "../components/view/PlayingView.tsx";
import RoundEndView from "../components/view/RoundEndView.tsx";
import RevealView from "../components/view/RevealView.tsx";
import OutroView from "../components/view/OutroView.tsx";
import StatsView from "../components/view/StatsView.tsx";

interface ControllerProps {
    roomId: string;
    playerId: string;
    username: string;
}

export default function Controller({ roomId, playerId, username }: ControllerProps) {
    const controller = useQuizController(roomId, playerId, username);

    // Use computed signals - these automatically track controller.prompt and update
    const leftOption = computed(() => {
        if (!controller?.prompt.value) return "";
        const { prompt, l_index, r_index } = controller.prompt.value;
        return prompt.slice(l_index, r_index - 4).trim();
    });

    const rightOption = computed(() => {
        if (!controller?.prompt.value) return "";
        const { prompt, r_index } = controller.prompt.value;
        return prompt.slice(r_index).trim();
    });

    // Loading state - no controller yet
    if (!controller) {
        return <InitializingView />;
    }

    // Render view based on current state
    const renderView = () => {
        switch (controller.state.value) {
            case State.lobby:
                return <LobbyView controller={controller} />;
            case State.countdown:
                return <CountdownView controller={controller} />;
            case State.intro:
                return <IntroView controller={controller} />;
            case State.start:
                return (
                    <PlayingView
                        controller={controller}
                        leftOption={leftOption}
                        rightOption={rightOption}
                    />
                );
            case State.end:
                return <RoundEndView />;
            case State.reveal:
                return <RevealView controller={controller} />;
            case State.outro:
                return <OutroView controller={controller} />;
            case State.stats:
                if (controller.results.value.length > 0) {
                    return (
                        <StatsView
                            controller={controller}
                            currentPlayerId={playerId}
                        />
                    );
                }
                return <InitializingView />;
            default:
                return <InitializingView />;
        }
    };

    return (
        <Layout controller={controller}>
            {renderView()}
        </Layout>
    );
}