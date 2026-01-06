import { useEffect, useMemo } from "preact/hooks";
import { signal } from "@preact/signals";
import { State } from "../hooks/QuizController.class.ts";
import { useQuizController } from "../hooks/useQuizController.ts";
import InitializingView from "../components/quiz/InitializingView.tsx";
import LobbyView from "../components/quiz/LobbyView.tsx";
import CountdownView from "../components/quiz/CountdownView.tsx";
import IntroView from "../components/quiz/IntroView.tsx";
import PlayingView from "../components/quiz/PlayingView.tsx";
import RoundEndView from "../components/quiz/RoundEndView.tsx";
import RevealView from "../components/quiz/RevealView.tsx";
import OutroView from "../components/quiz/OutroView.tsx";
import StatsView from "../components/quiz/StatsView.tsx";

interface ControllerProps {
    roomId: string;
    playerId: string;
    username: string;
}

export default function Controller({ roomId, playerId, username }: ControllerProps) {
    const controller = useQuizController(roomId, playerId, username);
    // Compute options from prompt (only recalculates when prompt changes)
    const leftOption = useMemo(() => {
        if (!controller?.prompt.value) return signal("");
        const { text, l_index } = controller.prompt.value;
        return signal(text.slice(0, l_index).trim());
    }, [controller?.prompt.value]);

    const rightOption = useMemo(() => {
        if (!controller?.prompt.value) return signal("");
        const { text, r_index } = controller.prompt.value;
        return signal(text.slice(r_index).trim());
    }, [controller?.prompt.value]);

    useEffect(() => {
        console.log(controller?.state.value)
    }, [controller?.state.value]);

    // Handle null controller (loading state)
    if (!controller) {
        return <InitializingView />;
    }

    return (
        <div class="quiz-container flex flex-col gap-6 p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div class="text-center">
                <h1 class="text-3xl font-bold text-purple-600">Would You Rather?</h1>
                <div class="flex justify-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Round {controller.round.value}</span>
                    <span>•</span>
                    <span>{State[controller.state.value]}</span>
                </div>
            </div>

            {/* State Views */}
            {controller.state.value === State.initializing && <InitializingView />}

            {controller.state.value === State.lobby && (
                <LobbyView controller={controller} />
            )}

            {controller.state.value === State.countdown && (
                <CountdownView controller={controller} />
            )}

            {controller.state.value === State.intro && (
                <IntroView controller={controller} />
            )}

            {controller.state.value === State.start && controller.prompt.value && (
                <PlayingView
                    controller={controller}
                    leftOption={leftOption}
                    rightOption={rightOption}
                />
            )}

            {controller.state.value === State.end && <RoundEndView />}

            {controller.state.value === State.reveal && controller.results.value.length > 0 && (
                <RevealView controller={controller} />
            )}

            {controller.state.value === State.outro && (
                <OutroView controller={controller} />
            )}

            {controller.state.value === State.stats && controller.results.value.length > 0 && (
                <StatsView
                    controller={controller}
                    currentPlayerId={playerId}
                />
            )}
        </div>
    );
}