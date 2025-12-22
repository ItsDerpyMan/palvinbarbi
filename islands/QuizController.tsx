import { ComponentChildren, toChildArray } from "preact";

interface ControllerProps {
    children?: ComponentChildren
}
export default function Controller({ children }: ControllerProps) {
    const [ box1, box2 ] = toChildArray(children);

    return (
        <div>
            <div>{box1}</div>
            <div>{box2}</div>
        </div>
    )
}