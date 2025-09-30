
import {useEffect, useState} from "preact/hooks";
import {useSignal} from "@preact/signals";
import { Room} from "../utils";

export default function Test() {
    const [room, setRoom] = useState<Record<number, Room>>({});
    const newRoomData: Record<number, Room> = {
        101: {
            hasStarted: false,
            players: [],
            created: 1700000000000,
        },
        102: {
            hasStarted: true,
            players: [],
            created: 1700000100000,
        },
        103: {
            hasStarted: false,
            players: [],
            created: 1700000200000,
        },
    };
    useEffect(() => {
        setRoom(newRoomData)
    }, []);

    // Log state changes when room updates
    useEffect(() => {
        console.log("Room state updated:", room);
    }, [room]);
    return (
        <p></p>
    )
}