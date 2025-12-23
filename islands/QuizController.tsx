import { ComponentChildren, toChildArray } from "preact";
import { useSignal } from "preact/hooks";

interface ControllerProps {
    children?: ComponentChildren
}
export default function Controller({ children }: ControllerProps) {
    const [ box1, box2 ] = toChildArray(children);

    //
    return (
        <div>
            {box1}
            {box2}
        </div>
    )
}