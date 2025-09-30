import {useEffect, useState} from "preact/hooks";
import {useSignal} from "@preact/signals";
import RoomIsland from "./Room.tsx";
import {Room, baseUrl} from "../utils.ts";

export interface Props {
    url: string
}
export default function RoomList({url}: Props) {
    useEffect(() => {
        baseUrl.value = url
        console.log("Set global baserUrl:", baseUrl.value);
    }, []);

    const [room, setRoom] = useState<Record<number | null, Room | null>>({});

    useEffect(() => {
        const url = new URL("api/rooms", baseUrl.value)
        console.log("Fetching from URL:", url.toString());

        fetch(url, {
            headers: { Accept: "application/json" },
        })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                return res.json();
            })
            .then((json) => {
                console.log("Fetched rooms:", json);
                setRoom(json);
                console.log("Updated rooms:", room);
            })
            .catch((error) => {
                console.error("Fetch error:", error);
            });
    }, []);

    return (
            <p>room</p>
    )
}
//         <div className="flex flex-col items-center justify-center space-y-4 w-full">
//             {Object.values(room).length > 0 ? (
//                 Object.entries(room).map(([id, room]: [number, any]) => (
//                     <RoomIsland key={id} id={id} {...room} />
//                 ))
//             ) : (
//                 <p>Loading rooms...</p>
//             )}
//          </div>