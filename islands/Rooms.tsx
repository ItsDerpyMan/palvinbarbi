import { useEffect, useState } from "preact/hooks";
import { computed, Signal, useSignal } from "@preact/signals";
import { baseUrl, Room } from "../utils";
import RoomIsland from "./Room";

type Rooms = Record<number, Room>;

export default function Rooms({data}: { data: Rooms}) {
  const ROOMS = useSignal<Rooms>(data);

  //useEffect(() => {
  //  const url = new URL("api/rooms", baseUrl.value);
  //  console.log("Fetching from URL:", url.toString());
  //
  //  fetch(url, { headers: { Accept: "application/json" } })
  //    .then((res) => res.json())
  //    .then((json) => ROOMS.value = json as Rooms)
  //    .catch((error) => console.error("Fetch error:", error));
  //}, []);

  // @ts-ignore
  return (
    <ul className="flex flex-col items-center justify-center space-y-4 w-full">
        {Object.keys(ROOMS.value).map((id: string) => (
            <RoomIsland key={id} id={id} ROOMS={ROOMS} />
        ))}
    </ul>
  );
}
