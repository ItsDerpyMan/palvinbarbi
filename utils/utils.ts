// ../utils/utils.ts
import { createDefine } from "fresh";

export interface Auth {
    jwt?: string;
    userId?: string;
    username?: string;
    sessionId?: string;
    roomId?: string;
}
export const define = createDefine<Auth>();
