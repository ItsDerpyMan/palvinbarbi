import { createDefine } from "fresh";
import { Signal } from "@preact/signals";

export type Rooms = Record<number, Room>;
export interface Room {
  hasStarted: boolean;
  players: string[];
  created: number;
}

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  rooms: Signal<Rooms>;
}
export const define = createDefine<State>();
