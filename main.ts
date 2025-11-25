import { App, Context, staticFiles } from "fresh";
import * as middlewares from "./utils/middlewares.ts";
import * as utils from "./utils/utils.ts";
import * as handler from "./utils/handlers.ts";
import { getDatabase } from "./utils/database/database.ts";
import { game_app } from "./app_game/main.ts";

export const app = new App().use(staticFiles());

// api/rooms.ts
app.get("/api/rooms", async (_ctx): Promise<Response> => {
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
app.get("/api/public-keys", () => handler.getPublicKeys.GET());
app.mountApp("./rooms/", game_app);
app.fsRoutes();
