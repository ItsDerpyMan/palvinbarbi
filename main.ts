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
/**
 * /api/login?session={id}
 * /api/login?session={id}&redirect=/api/join?room={id}
 * /api/login?session={id}&redirect=/api/signup?room={id}
 */

app.post(
  "/api/login",
  async () => {
    const handler = await import("./handlers/login.ts");
    return handler.handleLogin.POST;
  },
);

app.post(
  "/api/signup",
  async () => {
    const handler = await import("./handlers/signup.ts");
    return handler.handleSignup.POST;
  },
);

app.use(async (ctx) => {
  const cookie = ctx.request.headers.get("Cookie") ?? "";

  const jwt = cookie.match(/jwt=([^;]+)/)?.[1] ?? null;
  const sessionId = cookie.match(/session=([^;]+)/)?.[1] ?? null;
  const roomId = cookie.match(/room=([^;]+)/)?.[1] ?? null;
  // Add extracted cookies into ctx.state
  ctx.state.jwt = jwt;
  ctx.state.sessionId = sessionId;
  ctx.state.roomId = roomId;
  // Optionally strip existing Authorization header (prevent spoofing)
  const newHeaders = new Headers(req.headers);
  newHeaders.delete("Authorization");

  if (jwt) newHeaders.set("Authorization", `Bearer ${jwt}`);

  // 1. /api/login?session={id}&redirect=/api/signup?room={id}
  // 2. /api/signup?room={id}
  // 3. /api/signup?room={id}&session={id}

  // 1.
  const url = new URL(req.url);
  if ("/api/login" === url.pathname) {
    const redirect = url.searchParams.get("redirect");
    url.search = "";

    url.searchParams.set("session", sessionId);
    if (redirect) {
      url.searchParams.set("redirect", redirect);
    }
  }
  if ("/api/signup" === url.pathname) {
    url.search = "";

    url.searchParams.set("room", roomId);
    url.searchParams.set("session", sessionId);
  }

  // Create a new request with corrected headers
  const newReq = new Request(url, {
    method: req.method,
    headers: newHeaders,
    body: req.body,
  });

  return await ctx.next(newReq);
});
/**
app.post(
  "/api/join",
  async () => await import("./handlers/join.ts"),
);

app.get("/api/public-keys", () => handler.getPublicKeys.GET());
app.mountApp("./rooms/", game_app);
    */
app.fsRoutes();
