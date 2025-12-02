import { App, Context, staticFiles } from "fresh";
import { database } from "./utils/database/database.ts";
import { game_app } from "./app_game/main.ts";
import type { Auth } from "./utils/auth.ts";
export const app = new App<Auth>().use(staticFiles());

// api/rooms.ts
app.get("/api/rooms", async (ctx: Context<Auth>)=> {
  const { data, error } = await database(ctx.req).from("rooms").select("*");
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
  const cookie = ctx.req.headers.get("Cookie") ?? "";

  const jwt = cookie.match(/jwt=([^;]+)/)?.[1] ?? null;
  const userId = cookie.match(/user=([^;]+)/)?.[1] ?? null;
  const sessionId = cookie.match(/session=([^;]+)/)?.[1] ?? null;
  const roomId = cookie.match(/room=([^;]+)/)?.[1] ?? null;
  // Add extracted cookies into ctx.state
  if (jwt) ctx.state.jwt = jwt;
  if (userId) ctx.state.userId = userId;
  if (sessionId) ctx.state.sessionId = sessionId;
  if (roomId) ctx.state.roomId = roomId;
  // Optionally strip existing Authorization header (prevent spoofing)
  const res = await ctx.next()
  if (jwt) res.headers.set("Authorization", `Bearer ${jwt}`);

  // 1. /api/login?session={id}&redirect=/api/signup?room={id}
  // 2. /api/signup?room={id}
  // 3. /api/signup?room={id}&session={id}

  //const url = new URL(ctx.req.url);
  //if ("/api/login" === url.pathname) {
  //  const redirect = url.searchParams.get("redirect")!;
  //  url.search = "";
  //
  //  if (sessionId) url.searchParams.set("session", ctx.state.sessionId);
  //  if (redirect) url.searchParams.set("redirect", redirect);
  //}
  //if ("/api/signup" === url.pathname) {
  //  url.search = "";
  //  if (roomId) url.searchParams.set("room", ctx.state.roomId);
  //  if (sessionId) url.searchParams.set("session", ctx.state.sessionId);
  //}
  return res;
});
app.get("/dev/ctx", (ctx: Context<Auth>) => ctx.render(
    <div>
        <h1>Debug</h1>
        key: {ctx.state.jwt},
        session id: {ctx.state.sessionId},
        room id: {ctx.state.roomId},
        user id: {ctx.state.userId},
        username: {ctx.state.username}
    </div>
))
/**
app.post(
  "/api/join",
  async () => await import("./handlers/join.ts"),
);

app.get("/api/public-keys", () => handler.getPublicKeys.GET());
app.mountApp("./rooms/", game_app);
    */
app.fsRoutes();
