import { App, Context, staticFiles } from "fresh";
import * as middlewares from "./utils/middlewares.ts";
import * as utils from "./utils/utils.ts";
import { getDatabase } from "./utils/database/database.ts";
//import type { Room } from "./utils/database/database.ts";

export const app = new App<utils.State>();
app.use(staticFiles());
// const exampleLoggerMiddleware = define.middleware((ctx) => {
//   console.log(`${ctx.req.method} ${ctx.req.url}`);
//   return ctx.next();
// });
// app.use(exampleLoggerMiddleware);
app.get("/", (ctx: Context<utils.State>) => ctx.redirect("/rooms"));
// api/rooms.ts
app.get("/api/rooms", async (_ctx: Context<utils.State>): Promise<Response> => {
  const { data, error } = await getDatabase().from("rooms").select("*");
  if (error) {
    console.warn("database error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
  return new Response(JSON.stringify({ data: data ?? [], error: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

app.post(
  "/api/rooms/:id",
  middlewares.getUser,
  middlewares.restoreSession,
  middlewares.createAnonSession,
  (ctx: Context<utils.State>) => {
    console.log("✅ Authenticated user:", ctx.state.auth);
    return ctx.redirect(`/rooms/${ctx.params.id}?signup=1`, 303);
  },
);

app.fsRoutes();
