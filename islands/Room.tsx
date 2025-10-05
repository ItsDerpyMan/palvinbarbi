import { Signal, useComputed } from "@preact/signals";
import { Room } from "../utils";
import { PlayerCount } from "../components/PlayerCount";
import { TimeStamp } from "../components/TimeStamp.tsx";

type Rooms = Record<string, Room>;

interface RoomProps {
  key?: string;
  id: string;
  rooms: Signal<Rooms>;
}

export default function RoomIsland({ id, rooms }: RoomProps) {
  console.log("Rendering RoomIsland for ID:", id);
  const room = useComputed(() => rooms.value[id]);
  if (!room) {
    return <div>{id} ID Room not found</div>;
  }
  const playerCount = useComputed(() => {
    room.value?.players.length || 0;
  });
  console.log(`Rendering PlayerCount ${room.value}`);
  function addPlayer(name: string) {
    rooms.value = {
      ...rooms.value,
      [id]: {
        ...rooms.value[id],
        players: [...rooms.value[id].players, name],
      },
    };
  }

  return (
    <div class="w-full max-w-md bg-white rounded-xl shadow-md p-4 flex flex-col space-y-2">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold truncate">Room</h2>
        <span class="text-sm text-gray-500">{id}</span>
      </div>

      <div class="flex justify-space-between items-center">
        <div class="flex items-center space-x-2">
          <button
            class={"px-2 py-1 border-gray-500 border-2 rounded-sm bg-white hover:bg-gray-200 transition-colors"}
            onClick={() => addPlayer("test")}
          >
            Join
          </button>
          <TimeStamp
            class="items-center self-start bg-gray-50 rounded"
            time={room.value.created}
          />
        </div>

        <PlayerCount count={playerCount.value} />
      </div>
    </div>
  );
}
