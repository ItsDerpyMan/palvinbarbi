import { useSignal } from "@preact/signals";
import { Room } from "../utils";
import RoomIsland from "./Room";

type Rooms = Record<number, Room>;

export default function Rooms({ data }: { data: Rooms }) {
  const ROOMS = useSignal<Rooms>(data);
  return (
    <ul class="flex flex-col items-center justify-center space-y-4 w-full">
      {Object.keys(ROOMS.value).map((id: string) => (
        <RoomIsland key={id} id={id} rooms={ROOMS} />
      ))}
    </ul>
  );
}
