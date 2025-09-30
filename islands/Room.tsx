import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { Button} from "../components/Button.tsx";
//import { HasStarted } from "../components/HasStarted.tsx";
import { PlayerCount } from "../components/PlayerCount.tsx";
import {baseUrl} from "../utils";
export interface Room {
    id: number;
    name: string;
    hasStarted: boolean;
    numberOfPlayers: number;
    created: number;
}
interface RoomProps extends Room{}

export default function RoomIsland({ id, hasStarted, numberOfPlayers, created}: RoomProps) {
  const [data, setData] = useState<Room | null>(null);

  useEffect(() => {
    const url = new URL(`/api/rooms/${id}`, baseUrl.value);
    fetch(url)
        .then((res) => res.json())
        .then((json) => {
            setData({...json, id, name: "Room"})
        })
        .catch(console.error);
    }, [id]);

  useEffect(() => {
      console.log(data);
  })


 return (
    <div
      class="w-full max-w-md bg-white rounded-xl shadow-md p-4 flex flex-col space-y-2">
      {/* Top row: name + id */}
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold truncate">{data.name}Noel</h2>
        <span class="text-sm text-gray-500">#{id}</span>
      </div>

      {/* hasStarted */}
      <div class="flex items-center">
          {/*<HasStarted bool={hasStarted} /> */}
      </div>

      {/* bottom row: button + numOfPlayers */}
      <div class="flex justify-between items-center">
        <Button >Join</Button>
        <PlayerCount id={id} num={numberOfPlayers}/>
      </div>
    </div>
  );
}
