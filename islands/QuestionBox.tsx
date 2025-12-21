import type { Signal } from "@preact/signals";

interface QuestionBoxProps {
    position?: string;
    width?: string;
    height?: string;
    text: Signal<string>;
}

export default function QuestionBox({
    position = "center",
    width = "200px",
    height = "150px",
    text,
}: QuestionBoxProps) {
    return (
        <div
            class={`flex items-center justify-center rounded-lg border-2 border-gray-300 bg-white shadow-md ${position}`}
            style={{ width, height }}
        >
            <p class="text-center text-lg font-medium px-4">
                {text.value}
            </p>
        </div>
    );
}