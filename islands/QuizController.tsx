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

    const leftOption = useMemo(() => {
        if (!controller?.prompt.value) return signal("");
        const { prompt, l_index } = controller.prompt.value;
        return signal(prompt.slice(0, l_index).trim());
    }, [controller?.prompt.value]);

    const rightOption = useMemo(() => {
        if (!controller?.prompt.value) return signal("");
        const { prompt, r_index } = controller.prompt.value;
        return signal(prompt.slice(r_index).trim());
    }, [controller?.prompt.value]);

    useEffect(() => {
        console.log(controller?.state.value)
    }, [controller?.state.value]);

    if (!controller) {
        return (
            <InitializingView></InitializingView>
        )
    }

    // Handle null controller (loading state)
    if (controller.state.value === State.start) {
       return (
           <PlayingView
               controller={controller}
               leftOption={leftOption}
               rightOption={rightOption}
           />
       )
    }

    if (controller.state.value === State.lobby) {
        return (
            <LobbyView controller={controller} />
        )
    }
    if (controller.state.value === State.countdown) {
        return (
            <CountdownView controller={controller} />
        )
    }
    if (controller.state.value === State.intro) {
        return (
            <IntroView controller={controller} />
        )
    }

    if (controller.state.value === State.end) {
        return (
            <RoundEndView />
        )
    }

    if(controller.state.value === State.reveal) {
        return (
            <RevealView controller={controller} />
        )
    }
    if(controller.state.value === State.outro) {
        return (
            <OutroView controller={controller} />
        )
    }
    if(controller.state.value === State.stats && controller.results.value.length > 0) {
        return (
            <StatsView
                controller={controller}
                currentPlayerId={playerId}
            />
        )
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
            <InitializingView></InitializingView>
        </div>
    );
}