import { App, Context, staticFiles } from "fresh";
import * as middlewares from "./utils/middlewares.ts"
import * as utils from "./utils/utils.ts";

export const app = new App<utils.State>();
app.use(staticFiles());
// const exampleLoggerMiddleware = define.middleware((ctx) => {
//   console.log(`${ctx.req.method} ${ctx.req.url}`);
//   return ctx.next();
// });
// app.use(exampleLoggerMiddleware);
app.get("/", (ctx: Context<utils.State>) => ctx.redirect("/api/rooms"));
app.post(
  "/api/rooms/:id",
  middlewares.getUser,
  middlewares.restoreSession,
  middlewares.createAnonSession,
  (ctx: Context<utils.State>) => {
    console.log("✅ Authenticated user:", ctx.state.auth);

    return ctx.redirect(`/api/rooms/${ctx.params.id}`);
  },
);
app.get(
  "/api/rooms/:id",
  middlewares.roomValidation,
  middlewares.validateSession,
  middlewares.signupForRoomMembership,
  (ctx: Context<utils.State>) => {
    console.log("✅ signed up for the room.")
    return ctx.redirect(`/rooms/${ctx.params.id}`)
  }
)
app.fsRoutes();
