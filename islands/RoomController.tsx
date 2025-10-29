import { useSignal } from "@preact/signals"
import UsernameInput from "./Username.tsx"
import RoomIsland from "./Room.tsx"

export default function RoomController({ data }) {
  const username = useSignal("");

  return (
    <>
      <UsernameInput username={username}/>
      <h1>Rooms</h1>
      <ul>{data.map((room) => <li><RoomIsland key={room.id} data={room} input={username}/></li>)}</ul>
    </>
  )
}
