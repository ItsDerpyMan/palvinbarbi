// api/rooms.ts
import { define } from "../../utils/utils.ts";
import { database } from "../../utils/database.ts";
import HomePage from "../index.tsx";
import RoomIsland from "../../islands/Room.tsx";
import Username from "../../islands/Username.tsx";
import MyIsland from "../../islands/my-island.tsx";
export const handler = define.handlers({
  async GET(_ctx) {
    const { data, error } = await database.from("rooms").select("*");
    if (!error) {
      return { data: data ?? [] };
    }
    console.log(error);
    return { data: data ?? [] };
  },
});

export default define.page(function RoomsPage({ data }) {
    const one = data.find((room) => room.id === "aaf13f71-fc91-4ece-a8a3-6cb6c647d338");
  return (
    <HomePage>
      <Username id="username_input" class="input-field"></Username>
      <h1>Rooms</h1>
        <MyIsland />
        <RoomIsland data={one} />
    </HomePage>
  );
});

//<ul>
//             { data.map((room) => <li><RoomIsland key={room.id} data={room}/></li>)}
//         </ul>
//
//