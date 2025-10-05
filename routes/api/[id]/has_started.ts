// api/[id]/has_started.ts
import { define } from "../../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const json = Deno.readTextFileSync(Deno.cwd() + "/data/rooms.json");
    const rooms = json.length > 0 ? JSON.parse(json) : {};
    const bool = rooms[ctx.params.id].has_started;
    return new Response(JSON.stringify(bool), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
