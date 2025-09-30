import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Head } from "fresh/runtime";
import RoomIsland from "../islands/room.tsx";
import { Room } from "../utils.ts";

export default function Home() {
  const roomsSignal = useSignal<Record<number, Room>>({});

  // fetch rooms once on mount
  useEffect(() => {
    fetch("/api/rooms")
      .then((res) => res.json())
      .then((json) => {
        roomsSignal.value = json; // json is the Record
        console.log("wow")
      })
      .catch(console.error);
  }, []);

  return (
    <div class="px-4 py-8 mx-auto fresh-gradient min-h-screen">
      <Head>
        <title>Fresh Rooms</title>
      </Head>

      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <h1 class="text-4xl font-bold mb-6">Room List</h1>

        <div class="flex flex-col items-center justify-center space-y-4 w-full">
          {Object.values(roomsSignal.value).map((room) => (
            <RoomIsland key={room.id} id={room.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

