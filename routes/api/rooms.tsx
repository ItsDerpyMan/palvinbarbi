// api/rooms.ts
import { define } from "../../utils/utils.ts";
import { database } from "../../utils/database.ts";
import HomePage from "../index.tsx";
import RoomController from "../../islands/RoomController.tsx"

export const handler = define.handlers({
  async GET(_ctx) {
    const { data, error } = await database.from("rooms").select("*");
    if (!error) return { data: data ?? [] };
    return console.warn("database error:", error)
  },
});

export default define.page(function RoomsPage({ data }) {
  return (
    <HomePage>
      <RoomController data={data}/>
    </HomePage>
  );
});
