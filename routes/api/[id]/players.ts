// api/[id]/players.ts
import { define } from "../../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const json = Deno.readTextFileSync(Deno.cwd() + "/data/rooms.json");
    const rooms = json.length > 0 ? JSON.parse(json) : {};
    const players = rooms[ctx.params.id].players;
    return new Response(JSON.stringify(players), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
