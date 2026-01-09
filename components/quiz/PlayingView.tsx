import type { FunctionComponent } from "preact";
import type { ReadonlySignal } from "@preact/signals";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";
import Box from "../Box.tsx";

export interface PlayingViewProps {
    controller: QuizControllerLogic;
    leftOption: ReadonlySignal<string>;
    rightOption: ReadonlySignal<string>;
}

const PlayingView: FunctionComponent<PlayingViewProps> = ({ controller, leftOption, rightOption }) => {
    return (
        <>
            {/* Question */}
            <div class="card bg-gradient-to-r from-primary to-secondary text-primary-content p-6 shadow-xl">
                <p class="text-2xl font-bold text-center">
                    {controller.prompt.value?.prompt}
                </p>
            </div>

            {/* Option Boxes */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Box
                    text={leftOption}
                    callback={() => controller.submit(true)}
                    disabled={controller.hasAnswered.value}
                    class="h-[200px]"
                />
                <Box
                    text={rightOption}
                    callback={() => controller.submit(false)}
                    disabled={controller.hasAnswered.value}
                    class="h-[200px]"
                />
            </div>

            {/* Timer & Progress */}
            <div class="quiz-card mt-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-base-content/70">Time Remaining</span>
                    <span class="countdown font-mono text-3xl text-primary">
                        <span style={{ "--value": controller.timeleft.value } as any}></span>
                    </span>
                </div>

                {/* Progress bar */}
                <progress
                    class="progress progress-primary w-full"
                    value={(controller.timeleft.value / 30) * 100}
                    max="100"
                ></progress>

                {/* Answer status */}
                <div class="mt-4 text-center">
                    {controller.hasAnswered.value ? (
                        <div class="alert alert-success">
                            <span>Answer submitted! Waiting for others...</span>
                        </div>
                    ) : (
                        <div class="alert alert-warning">
                            <span>Choose your answer!</span>
                        </div>
                    )}

                    <p class="text-sm text-base-content/50 mt-2">
                        {controller.count.value} / {controller.totalplayers.value} players answered
                    </p>
                </div>
            </div>
        </>
    );
};

export default PlayingView;