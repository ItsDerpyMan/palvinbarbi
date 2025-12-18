import { App, staticFiles } from "fresh";
import { Auth } from "../utils/utils.ts";

/**
 * Game App Instance
 * Mounted at /room/ in main.tsx
 * Uses file-system routing from ./routes/
 */
export const game_app = new App<Auth>()
    .use(staticFiles())
    .get("/", (ctx) =>
        ctx.render(
            <div>
                <h1>App2</h1>
                <p>This app is loaded from JSR</p>
            </div>,
         ))
   .fsRoutes();