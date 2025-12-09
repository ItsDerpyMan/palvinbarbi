import { useSignal } from "@preact/signals";
import UsernameInput from "./Username.tsx";
import RoomIsland from "./Room.tsx";
import type { Room } from "../utils/database/database.ts";
import { useEffect } from "preact/hooks";
import { createClient } from "@supabase/supabase-js";
import {Database} from "../utils/database/database.types.ts";
export default function RoomController() {
  const username = useSignal("");
  const rooms = useSignal<Room[]>([]);

   useEffect(() => {
     void fetchApiKeys()
         .then(({ url, key }) => {
             return createClient<Database>(url, key).from("rooms").select("*");
         })
         .then((res) => {
             rooms.value = res.data ?? [];
         })
         .catch((err) => {
             console.error(err);
             rooms.value = [];
         });
   }, []);
  //   const subscription = database
  //     .channel("public:rooms")
  //     .on("postgres_changes", {
  //       event: "*",
  //       schema: "public",
  //       table: "rooms",
  //     }, (payload) => {
  //       console.log("public.rooms updated", payload);
  //
  //       if (payload.eventType === "INSERT" && payload.new) {
  //         rooms.value = [payload.new, ...rooms.value];
  //       }
  //       if (payload.eventType === "UPDATE" && payload.new) {
  //         rooms.value = rooms.value.map((r) =>
  //           r.id === payload.new.id ? payload.new : r
  //         );
  //       }
  //       if (payload.eventType === "DELETE" && payload.old) {
  //         rooms.value = rooms.value.filter((r) => r.id !== payload.old.id);
  //       }
  //     })
  //     .subscribe();
  //
  //   return () => {
  //     database.removeChannel(subscription);
  //   };
  // }, []);
  return (
    <>
      <UsernameInput username={username} />
      <h1>Rooms</h1>
      <ul>
        {rooms.value.map((room: Room) => (
          <li>
            <RoomIsland key={room.id} data={room} input={username} />
          </li>
        ))}
      </ul>
    </>
  );
}

async function fetchApiKeys() {
  const res = await fetch("/api/public-keys", {
    method: "POST",
    headers: { "Content-Type": "Application/json" },
  });
  const body: { url: string, key: string } = JSON.parse(await res.text());
  return body;
}
