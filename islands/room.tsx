import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { Button} from "../components/Button.tsx";
//import { HasStarted } from "../components/HasStarted.tsx";
import { PlayerCount } from "../components/PlayerCount.tsx";

export interface Room {
    id: number;
    name: string;
    hasStarted: boolean;
    numberOfPlayers: number;
    created: number;
}
interface RoomProps {
  id: number; // or string, depending on your data
}

export default function RoomIsland({ id }: RoomProps) {
  const [data, setData] = useState<Room | null>(null);

  useEffect(() => {
    fetch(`api/rooms/${id}`)
        .then((res) => res.json())
        .then((json) => {
            setData({...json, id, name: "Room"})
        })
        .catch(console.error);
    }, [id]);
  if (!data) return <p>No room {id}..</p>;

 return (
    <div
      class="w-full max-w-md bg-white rounded-xl shadow-md p-4 flex flex-col space-y-2">
      {/* Top row: name + id */}
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold truncate">{data.name}</h2>
        <span class="text-sm text-gray-500">#{id}</span>
      </div>

      {/* hasStarted */}
      <div class="flex items-center">
          {/*<HasStarted started={data.hasStarted} /> */}
      </div>

      {/* bottom row: button + numOfPlayers */}
      <div class="flex justify-between items-center">
        <Button >Join</Button>
        <PlayerCount id={id} num={data.numberOfPlayers}/>
      </div>
    </div>
  );
}
