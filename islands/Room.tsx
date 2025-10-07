import { Signal} from "@preact/signals";
import { Room, Rooms } from "../utils.ts";
import { PlayerCount } from "../components/PlayerCount.tsx";
import { TimeStamp } from "../components/TimeStamp.tsx";
import { Button } from "../components/Button.tsx";

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
      <div class="card">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold truncate">Room</h2>
          <span class="text-sm text-gray-500">{id}</span>
        </div>

        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <Button id="joinButton" class="join-button" onClick={() => addPlayer("test")}>
              Join
            </Button>
            <TimeStamp id="buttonTimestamp" class="timestamp" time={time} />
          </div>
          <PlayerCount count={playerCount} class="player-count" />
        </div>
      </div>
  );
}
