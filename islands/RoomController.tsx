import { useSignal } from "@preact/signals";
import UsernameInput from "./Username.tsx";
import RoomIsland from "./Room.tsx";
import type { Room } from "../utils/database/database.ts";
import { useEffect } from "preact/hooks";
import { getAnonDatabase } from "../utils/database/database.client.ts";
import { createClient } from "@supabase/supabase-js";
export default function RoomController() {
  const username = useSignal("");
  const rooms = useSignal<any[]>([]);

  // const url = Deno.env.get("PUBLIC_SUPABASE_URL");
  // const url = process.env.PUBLIC_SUPABASE_URL;
  // const key = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY");
  // const key = process.env.PUBLIC_SUPABASE_ANON_KEY;
  // console.log(`${url}, ${key}`);
  // const db = createClient(
  //   url!,
  //   key!,
  // );
  console.log("db instated");
  useEffect(() => {
    console.log("Running");
    getAnonDatabase()
      .from("rooms")
      .select("*")
      .then((res) => {
        rooms.value = res.data ?? [];
      });
  });
  // useEffect(() => {
  //   database
  //     .from("rooms")
  //     .select("*")
  //     .then((res) => {
  //       rooms.value = res.data ?? [];
  //     });
  //
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
