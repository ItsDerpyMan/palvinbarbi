import { App, staticFiles } from "fresh";
import {
  checkSession,
  createSession,
  define,
  ensureUser,
  setSessionCookie,
  type State,
} from "./utils/utils.ts";

export const app = new App<State>();
app.use(staticFiles());
// const exampleLoggerMiddleware = define.middleware((ctx) => {
//   console.log(`${ctx.req.method} ${ctx.req.url}`);
//   return ctx.next();
// });
// app.use(exampleLoggerMiddleware);
app.get("/", (ctx) => ctx.redirect("/api/rooms"));
app.post(
  "/api/rooms/:id",
  checkSession,
  ensureUser,
  createSession,
  setSessionCookie,
  async (ctx) => {
    return ctx.redirect(`/api/rooms/${ctx.params.id}`);
  },
);
app.fsRoutes();
