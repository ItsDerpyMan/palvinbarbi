// ../utils/utils.ts
import { createDefine } from "fresh";

export interface State {
  auth?: Auth;
}

export const define = createDefine<State>();
