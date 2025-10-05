// api/[id].ts
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const json = Deno.readTextFileSync(Deno.cwd() + "/data/rooms.json");
    const rooms = json.length > 0 ? JSON.parse(json) : {};
    const room = rooms[ctx.params.id];
    return new Response(JSON.stringify(room), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
