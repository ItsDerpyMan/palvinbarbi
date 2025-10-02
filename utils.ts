import { createDefine } from "fresh";
import { signal } from "@preact/signals";
const DB_PATH = "./data/rooms.json";

export interface Room {
  hasStarted: boolean;
  players: string[];
  created: number;
}
// Read entire DB
export async function readDB(): Promise<Record<number, Room>> {
  const text = await Deno.readTextFile(DB_PATH);
  return JSON.parse(text) as Record<number, Room>;
}
// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  sessionId: string;
  roomId: number;
  url: string;
  patname: string;
}
export const baseUrl = signal<string>("");
export const define = createDefine<State>();
