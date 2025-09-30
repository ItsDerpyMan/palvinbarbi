// api/rooms.ts
import { define, readDB, Room } from "../../utils.ts";
import { join } from "https://deno.land/std@0.203.0/path/mod.ts";

const FILE = join(Deno.cwd(), "db", "rooms.json");

export const handler = define.handlers({
  async GET(ctx) {
    const result = ctx.req.headers.get("accept") ?? "";
    if (result.includes("application/json")) {
      const data = await readDB();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  },
    async POST(ctx) {
      // parse JSON from request
      const body = await ctx.req.json() as Partial<Room>;

      // read existing rooms
      const rooms: Record<number, Room> = JSON.parse(Deno.readTextFileSync(FILE));

      // find the next available id (max existing key + 1)
      const nextId = Math.max(...Object.keys(rooms).map(Number), 0) + 1;

      // create full room object
      const newRoom: Room = {
        hasStarted: body.hasStarted ?? false,
        players: body.players ?? [],
        created: body.created ?? Date.now(),
      };

      // add new room
      rooms[nextId] = newRoom;

      // write back to JSON
      Deno.writeTextFileSync(FILE, JSON.stringify(rooms, null, 2));

      return new Response(JSON.stringify(newRoom), { status: 201 });
    },
});
