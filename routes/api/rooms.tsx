// api/rooms.ts
import Rooms from "../../islands/Rooms";
import { define } from "../../utils";
import HomePage from "../index";

export const handler = define.handlers({
  async GET(ctx) {
    const json = Deno.readTextFileSync(Deno.cwd() + "/data/rooms.json");
    const rooms = json.length > 0 ? JSON.parse(json) : {};
    return { data: (rooms) };
  },
});

export default function RoomsPage({ data }) {
  return (
    <HomePage>
      <h1>Rooms</h1>
      <Rooms data={data} />
    </HomePage>
  );
}
