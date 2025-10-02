import ReadonlySignal from "@preact/signals";
interface PlayerCountProps {
    count: ReadonlySignal<number>;

}

export function PlayerCount() {
    return (
        <div class="inline-flex items-center justify-center px-3 py-1
             rounded-full border border-gray-400 bg-white
             text-sm font-medium text-gray-700">
            {playerCount.value} / {20}
        </div>
    );
}
