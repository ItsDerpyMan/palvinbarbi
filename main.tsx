import { App, Context, staticFiles } from "fresh";
import { game_app } from "./app_game/main.tsx";
import type { Auth } from "./utils/utils.ts";

export const app = new App<Auth>().use(staticFiles());

app.use(async (ctx) => {
  const cookie = ctx.req.headers.get("Cookie") ?? "";

  const jwt = cookie.match(/jwt=([^;]+)/)?.[1] ?? null;
  const userId = cookie.match(/user=([^;]+)/)?.[1] ?? null;
  const sessionId = cookie.match(/session=([^;]+)/)?.[1] ?? null;
  const roomId = cookie.match(/room=([^;]+)/)?.[1] ?? null;
  const username = cookie.match(/username=([^;]+)/)?.[1] ?? null;
  // Add extracted cookies into ctx.state
  if (jwt) ctx.state.jwt = jwt;
  if (userId) ctx.state.userId = userId;
  if (username) ctx.state.username = username;
  if (sessionId) ctx.state.sessionId = sessionId;
  if (roomId) ctx.state.roomId = roomId;
  // Optionally strip existing Authorization header (prevent spoofing)
  return await ctx.next();
});
// api/rooms.ts
app.get(
    "/api/rooms",
    async () => {
      const handler = await import("./handlers/rooms.ts");
      return handler.handleRooms.GET;
    }
);

app.get(
    "/api/join",
    async () => {
      const handler = await import("./handlers/join.ts");
      return handler.handleJoin.GET;
    },
);

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

app.post("/debug/ctx", (ctx: Context<Auth>) => {
  const body = JSON.stringify({
    jwt: ctx.state.jwt,
    sessionId: ctx.state.sessionId,
    roomId: ctx.state.roomId,
    userId: ctx.state.userId,
    username: ctx.state.username,
  });
  return new Response(body, {
    headers: { "Content-Type": "application/json" },
  });
});
app.post("/api/public-keys", async () => {
  console.log("POST /api/public-keys");
  const handler = await import("./handlers/publicKeys.ts");
  return handler.getPublicKeys.POST();
});

app.mountApp("/room/", game_app);
app.fsRoutes();
