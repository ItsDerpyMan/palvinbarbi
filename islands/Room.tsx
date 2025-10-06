import { Signal} from "@preact/signals";
import { Room } from "../utils";
import { PlayerCount } from "../components/PlayerCount";
import { TimeStamp } from "../components/TimeStamp.tsx";
import { Button } from "../components/Button.tsx";

type Rooms = Record<string, Room>;

interface RoomProps {
  key?: string;
  id: string;
  rooms: Signal<Rooms>;
}

export default function RoomIsland({ id, rooms }: RoomProps) {
  const room = rooms.value[id];
  if (!room) {
    return <div>{id} ID Room not found</div>;
  }
  const playerCount = room.players.length;
  const time = room.created;

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
          <Button id={"joinButton"} onClick={() => addPlayer("test")}>Join</Button>
          <TimeStamp class="items-center self-start bg-gray-50 rounded" time={time}/>
        </div>
        <PlayerCount count={playerCount} />
      </div>
    </div>
  );
}
