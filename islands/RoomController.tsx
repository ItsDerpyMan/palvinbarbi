import { useSignal } from "@preact/signals";
import UsernameInput from "./Username.tsx";
import RoomIsland from "./Room.tsx";
import type { Room } from "../utils/database/database.ts";

export default function RoomController({ data }: { data: Room[] }) {
  const username = useSignal("");

  return (
    <>
      <UsernameInput username={username} />
      <h1>Rooms</h1>
      <ul>
        {data.map((room: Room) => (
          <li>
            <RoomIsland key={room.id} data={room} input={username} />
          </li>
        ))}
      </ul>
    </>
  );
}
