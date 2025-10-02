import { Signal, useSignal, ReadonlySignal, computed } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { Room } from "../utils";
import { Button } from "../components/Button";
import { PlayerCount } from "../components/PlayerCount";

type Rooms = Record<string, Room>;

export interface RoomProps {
  key?: string;
  id: string;
  ROOMS: Signal<Rooms>;
}

export default function RoomIsland({ id, ROOMS }: RoomProps) {
  const room = ROOMS.value[id];
  if (!room) {
    return <div>{ id } ID Room not found</div>;
  }
  export const playerCount: ReadonlySignal<number> = computed(() => {
    return room.players.length;
  })
  function addPlayer(name: string) {
    ROOMS.value = {
      ...ROOMS.value,
      [id]: {
        ...ROOMS.value[id],
        players: [...ROOMS.value[id].players, name],
      },
    };
  }

  return (
    <div class="w-full max-w-md bg-white rounded-xl shadow-md p-4 flex flex-col space-y-2">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold truncate">Room</h2>
        <span class="text-sm text-gray-500">{id}</span>
      </div>

      <div class="flex justify-between items-center">
        <Button
          onClick={() => {
            addPlayer("test");
          }}
        >
          Add Player
        </Button>
        <PlayerCount count={playerCount}/>
      </div>
    </div>
  );
}
