// api/[id]/has_started.ts
import { define, readDB } from "../../../utils.ts";
//JSON Database

export const handler = define.handlers({
  async GET(ctx) {
    const result = ctx.req.headers.get("accept") ?? "";
    if (result.includes("application/json")) {
      const list_of_rooms = await readDB();
      const data = list_of_rooms[ctx.params.id]["hasStarted"];
      return new Response(data, {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  },
});
