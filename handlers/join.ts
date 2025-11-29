import { define } from "../utils/utils.ts";

export const handleJoin = define.handlers({
  POST(ctx) {
    const room = ctx.state.roomId;
    const session = ctx.state.sessionId;
    const jwt = ctx.state.jwt;
    console.log(`handleJoin: room ${room}, session ${session}\n, jwt ${jwt}`);
    return new Response(
      JSON.stringify(
        `handleJoin: room ${room}, session ${session}\n, jwt ${jwt}`,
      ),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  },
});
