import { Room } from "../utils";
import { Signal, ReadonlySignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface PlayerCountProps {
    count: number;

}

export function PlayerCount({ count }: PlayerCountProps) {
  return (
    <div class="inline-flex items-center justify-center px-3 py-1
             rounded-full border border-gray-400 bg-white
             text-sm font-medium text-gray-700">
      {count} / {20}
    </div>
  );
}
