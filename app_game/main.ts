import { App, staticFiles } from "fresh";
// mount?
export const game_app = new App().use(staticFiles());
