import { useSignal } from "@preact/signals";

export default function MyIsland() {
    const count = useSignal(0);

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => (count.value += 1)}>+</button>
        </div>
    );
}