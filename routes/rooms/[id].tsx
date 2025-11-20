import type { Context } from "fresh";
import * as middlewares from "../../utils/middlewares.ts";
import { define, State } from "../../utils/utils.ts";

export const handler = define.handlers({
  async GET(ctx: Context<State>) {
    const url = new URL(ctx.url);
    const signup = url.searchParams.get("signup") === "1";

    if (signup) {
      console.log("▶ Signup step for room", ctx.params.id);

      // Run signup middlewares
      await middlewares.Validation(ctx);
      await middlewares.authDebug(ctx);
      await middlewares.validateSession(ctx);
      await middlewares.signupForMembership(ctx);

      // Prevent infinite loop -> redirect without ?signup=1
      return Response.redirect(`/rooms/${ctx.params.id}`, 303);
    }
    console.log("running")
    // Normal GET → render page
    return { data: { roomId: ctx.params.id } };
  }
});

export default define.page(function RoomPage(props) {
  console.log("Hello")
  return (
      <div>
        <h1>Room {props.data.roomId}</h1>
      </div>
  );
});

