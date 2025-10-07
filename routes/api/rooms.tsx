// api/rooms.ts
import Rooms from "../../islands/Rooms.tsx";
import { define } from "../../utils.ts";
import HomePage from "../index.tsx";

export const handler = define.handlers({
  async GET(_ctx) {
    const json = Deno.readTextFileSync(Deno.cwd() + "/data/rooms.json");
    const rooms = json.length > 0 ? JSON.parse(json) : {};
    return { data: rooms };
  },
});

export default define.page(function RoomsPage({ data }) {
  return (
    <HomePage>
      <h1>Rooms</h1>
      <Rooms data={data} />
    </HomePage>
  );
})
