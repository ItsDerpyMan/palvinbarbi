import { Signal, useSignal } from "@preact/signals";
import { Button } from "../components/Button.tsx";
import { TimeStamp } from "../components/TimeStamp.tsx";
import { PlayerCount } from "../components/PlayerCount.tsx";
import type { Room } from "../utils/database/database.ts";

interface RoomProps {
  key?: string;
  id?: string;
  data: Room;
  input: Signal<string>;
}
export default function RoomIsland({ data, input }: RoomProps) {
  const room = useSignal(data);
  const count = useSignal<number>(0);

  const handleJoin = async () => {
    if (!input.value.trim()) {
      alert("Please enter a username!");
      return;
    }

    const formData = new FormData();
    formData.append("username", input.value);

    console.log(`POST req: /api/rooms/${data.id}`);
    const res = await fetch(`/api/rooms/${data.id}`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error("Failed:", await res.text());
      return;
    }
  };

  return (
    <div class="card">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold truncate">{room.value.name}</h2>
        <span class="text-sm text-gray-500">{room.value.id}</span>
      </div>

      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <Button id="joinButton" class="join-button" onClick={handleJoin}>
            Join
          </Button>
        </div>

        <TimeStamp time={Date.parse(room.value.created_at)} />
        <PlayerCount count={count.value} class="player-count" />
      </div>
    </div>
  );
}
