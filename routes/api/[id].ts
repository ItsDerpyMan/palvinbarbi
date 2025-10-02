// api/[id].ts
import { define, readDB, Room } from "../../utils.ts";
//JSON Database
const PATH = "../../data/rooms.json";

export const handler = define.handlers({
  async GET(ctx) {
    const result = ctx.req.headers.get("accept") ?? "";
    if (result.includes("application/json")) {
      const list_of_rooms = await readDB() as any;
      const data = list_of_rooms[ctx.params.id];
      data["numberOfPlayers"] = data.players.length;
      delete data.players;
      return new Response(data, {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  },
  async POST(ctx) {
    const newRoom: Room = await ctx.req.json();

    // read existing rooms
    const rooms: Room[] = JSON.parse(Deno.readTextFileSync(PATH));

    // add new room
    rooms.push(newRoom);

    // write back to file
    Deno.writeTextFileSync(PATH, JSON.stringify(rooms, null, 2));

    return new Response(JSON.stringify(newRoom), { status: 201 });
  },
});
