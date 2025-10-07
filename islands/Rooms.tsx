import { useSignal } from "@preact/signals";
import { Rooms } from "../utils.ts";
import RoomIsland from "./Room.tsx";

export default function Rooms({ data }: { data: Rooms}) {
  const ROOMS = useSignal<Rooms>(data);
  console.log(ROOMS.value)
  return (
    <ul class="flex flex-col items-center justify-center space-y-4 w-full">
      {Object.keys(ROOMS.value).map((id: string) => (
        <RoomIsland key={id} id={id} rooms={ROOMS} />
      ))}
    </ul>
  );
}
