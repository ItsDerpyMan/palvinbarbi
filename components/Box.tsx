import type { Signal } from "@preact/signals";
import {Button} from "./Button.tsx";

interface QuestionBoxProps {
    text: Signal<string>;
    callback?: () => void | Promise<void>;
    class?: string;
    id?: string;
}

export default function Box({
    text,
    callback,
    ...props
}: QuestionBoxProps) {
    return (
        <div id={props.id} class={props.class}>
            <Button onClick={callback} class="text-center text-lg font-medium px-4">
                {text.value}
            </Button>
        </div>
    );
}