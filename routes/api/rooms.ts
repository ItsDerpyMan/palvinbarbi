// api/rooms.ts
import { define } from "../../utils.ts";

const rooms = [
  { id: 0, string: "hi" },
  { id: 1, string: "hello" },
];
export const handler = define.handlers({
  GET(ctx) {
    const result = ctx.req.headers.get("accept") ?? "";
    if (result.includes("application/json")) {
      const data = Array.from(rooms.values());
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  },
});
