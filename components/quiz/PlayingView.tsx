import type { FunctionComponent } from "preact";
import type { Signal } from "@preact/signals";
import type { QuizControllerLogic } from "../../hooks/QuizController.class.ts";
import Box from "../Box.tsx";

export interface PlayingViewProps {
    controller: QuizControllerLogic;
    leftOption: Signal<string>;
    rightOption: Signal<string>;
}

const PlayingView: FunctionComponent<PlayingViewProps> = ({ controller, leftOption, rightOption }) => {
    return (
        <>
            {/* Question */}
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl shadow-lg">
                <p class="text-2xl font-bold text-center">
                    {controller.prompt.value?.text}
                </p>
            </div>

            {/* Option Boxes */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Box
                    text={leftOption}
                    callback={() => controller.submit(true)}
                    class={`
                        h-[200px] transition-all
                        ${controller.hasAnswered.value ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                    `}
                />
                <Box
                    text={rightOption}
                    callback={() => controller.submit(false)}
                    class={`
                        h-[200px] transition-all
                        ${controller.hasAnswered.value ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                    `}
                />
            </div>

            {/* Timer & Progress */}
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600">Time Remaining</span>
                    <span class="text-3xl font-bold text-blue-600">
                        {controller.timeleft.value}s
                    </span>
                </div>

                {/* Progress bar */}
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                        class="bg-blue-600 h-2 rounded-full transition-all duration-100"
                        style={{ width: `${(controller.timeleft.value / 30) * 100}%` }}
                    />
                </div>

                {/* Answer status */}
                <div class="mt-4 text-center">
                    {controller.hasAnswered.value ? (
                        <p class="text-green-600 font-medium">
                            ✓ Answer submitted! Waiting for others...
                        </p>
                    ) : (
                        <p class="text-orange-600 font-medium">
                            Choose your answer!
                        </p>
                    )}

                    <p class="text-sm text-gray-500 mt-2">
                        {controller.count.value} / {controller.totalplayers.value} players answered
                    </p>
                </div>
            </div>
        </>
    );
};

export default PlayingView;