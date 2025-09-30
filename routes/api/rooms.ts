// api/rooms.ts
import { define, readDB, Room } from "../../utils.ts";
import { join } from "jsr:@std/path@0.203.0";

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
    // Parse JSON from request
    const body = await ctx.req.json() as Partial<Room>;

    // Read existing rooms
    const rooms: Record<number, Room> = JSON.parse(Deno.readTextFileSync(FILE));

    // Find the next available id (max existing key + 1)
    const nextId = Math.max(...Object.keys(rooms).map(Number), 0) + 1;

    // Create full room object
    const newRoom: Room = {
      hasStarted: body.hasStarted ?? false,
      players: body.players ?? [],
      created: body.created ?? Date.now(),
    };

    // Add new room
    rooms[nextId] = newRoom;

    // Write back to JSON
    Deno.writeTextFileSync(FILE, JSON.stringify(rooms, null, 2));

    return new Response(JSON.stringify(newRoom), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  },
});