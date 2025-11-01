// ../utils/utils.ts
import { createDefine } from "fresh";
import type { Auth } from "./auth.ts";

export interface State {
  auth?: Auth;
}

export const define = createDefine<State>();
