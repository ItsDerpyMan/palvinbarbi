import { useSignal } from "@preact/signals";
import { Room, Rooms } from "../utils";
import RoomIsland from "./Room";

export default function Rooms({ initial_data }: { data: Rooms}) {
  const ROOMS = useSignal<Rooms>(initial_data);
  return (
    <ul class="flex flex-col items-center justify-center space-y-4 w-full">
      {Object.keys(ROOMS.value).map((id: string) => (
        <RoomIsland key={id} id={id} rooms={ROOMS} />
      ))}
    </ul>
  );
}
