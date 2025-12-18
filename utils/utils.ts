// ../utils/utils.ts
import { createDefine } from "fresh";

export interface Auth {
    jwt?: string;
    userId?: string;
    username?: string;
    sessionId?: string;
    roomId?: string;
}
export interface AuthResult {
    success: true;
    data: { jwt: string; sessionId: string };
}

export interface AuthError {
    success: false;
    error: string;
}
export const define = createDefine<Auth>();
