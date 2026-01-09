import type { ReadonlySignal } from "@preact/signals";

interface QuestionBoxProps {
    text: ReadonlySignal<string>;
    callback?: () => void | Promise<void>;
    class?: string;
    id?: string;
    disabled?: boolean;
}

export default function Box({
    text,
    callback,
    disabled = false,
    ...props
}: QuestionBoxProps) {
    return (
        <button
            id={props.id}
            onClick={callback}
            disabled={disabled}
            class={`quiz-option-box ${props.class ?? ""}`}
        >
            {text.value}
        </button>
    );
}